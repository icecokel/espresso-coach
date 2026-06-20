# Recommendation Rule Table

## Purpose

추천 로직은 배전 범위를 해석 컨텍스트로 보고, 그 다음 맛 태그, 기본 추출값, 선택 관찰값, 직전 샷과의 변화를 바탕으로 다음 샷에서 먼저 바꿀 변수 1개를 제안한다.

LLM은 최종 추천 결정을 하지 않는다. 추천은 `BeanSession`, `ShotRecord`, `TasteTag[]`, `TastePattern[]`를 입력으로 받는 순수 함수로 계산한다.

## Output Shape

```ts
interface RecommendationResult {
  primary: RecommendationAction;
  alternatives: RecommendationAction[];
  rationale: string[];
  uncertainty: string[];
  matchedRules: string[];
  keepVariables: RecommendationVariable[];
}

interface RecommendationAction {
  id: string;
  variable:
    | "no_change"
    | "grind_size"
    | "dose"
    | "yield"
    | "tamping_consistency"
    | "distribution"
    | "channeling_check"
    | "puck_prep"
    | "advanced_condition";
  direction: "finer" | "coarser" | "increase" | "decrease" | "check" | "keep";
  amountLabel: AmountLabel;
  priority: 1 | 2 | 3;
  message: string;
}

type RecommendationVariable =
  | "grind_size"
  | "dose"
  | "yield"
  | "tamping_consistency"
  | "distribution"
  | "puck_prep"
  | "advanced_condition";

type AmountLabel =
  | "one_small_step"
  | "small"
  | "next_shot_observation"
  | "none";
```

Rules:
- `primary`는 항상 1개다.
- `primary.priority`는 항상 `1`이다.
- `alternatives`는 후보일 뿐 동시에 실행하라고 안내하지 않는다.
- `matchedRules`는 적용된 base rule, override rule, context rule ID를 모두 담는다.
- `keepVariables`는 이번 샷에서 바꾸지 말라고 안내할 변수다.
- `brew_time`은 action이 아니다. `brewSeconds`와 `brewTimeBand`는 `rationale` 또는 `uncertainty`에 쓰는 진단 신호다.
- 만족스러운 샷은 `primary.variable = "no_change"`, `direction = "keep"`, `amountLabel = "none"`으로 표현한다.

## MVP Threshold Stance

MVP는 사용자별 목표 레시피를 받지 않는다. 따라서 `Extraction`의 기본 band 기준을 그대로 사용한다.

### Brew Time Bands

| Band | Condition | MVP Meaning |
| --- | --- | --- |
| `short` | `< 25s` | 빠른 흐름, 과소추출 또는 puck prep 문제 가능성 |
| `normal` | `25s - 32s` | 기본 판단 구간. 맛 태그와 관찰값을 우선한다. |
| `long` | `> 32s` | 느린 흐름, 과다추출 또는 막힘 가능성 |

Implementation decisions:
- 이 기준은 MVP에서 고정한다.
- 시간은 직접 바꾸는 값이 아니라 결과 신호다.
- `normal` 시간이어도 sour, bitter, watery 같은 맛 문제는 rule에 따라 추천을 만든다.
- 사용자가 목표 시간이 다른 레시피를 입력하는 기능은 MVP 이후로 미룬다.

### Brew Ratio Bands

`brewRatio = yieldGrams / doseGrams`

| Band | Condition | Example with 18g dose | MVP Meaning |
| --- | --- | --- | --- |
| `low` | `< 1.7` | `< 30.6g` | 짧거나 진한 추출 가능성 |
| `target` | `1.7 - 2.3` | `30.6g - 41.4g` | 기본 판단 구간 |
| `high` | `> 2.3` | `> 41.4g` | 희석, 긴 추출, 쓴 끝맛 가능성 |

Implementation decisions:
- 이 기준은 MVP에서 고정한다.
- 비율은 action 후보 `yield`를 고르는 강한 신호다.
- 절대 g 증감량은 추천하지 않는다. `small` 또는 `one_small_step` 같은 상대 단위만 쓴다.
- 사용자가 목표 ratio를 저장하는 기능은 MVP 이후로 미룬다.

## Action Catalog

| Action ID | `variable` | `direction` | `amountLabel` | Message |
| --- | --- | --- | --- | --- |
| `A-GRIND-FINER` | `grind_size` | `finer` | `one_small_step` | `분쇄도를 한 단계만 곱게 조정하세요.` |
| `A-GRIND-COARSER` | `grind_size` | `coarser` | `one_small_step` | `분쇄도를 한 단계만 굵게 조정하세요.` |
| `A-YIELD-INCREASE` | `yield` | `increase` | `small` | `추출량을 소폭 늘려보세요.` |
| `A-YIELD-DECREASE` | `yield` | `decrease` | `small` | `추출량을 소폭 줄여보세요.` |
| `A-DOSE-INCREASE` | `dose` | `increase` | `small` | `도징량을 소폭 늘려보세요.` |
| `A-DOSE-DECREASE` | `dose` | `decrease` | `small` | `도징량을 소폭 줄여보세요.` |
| `A-CHANNELING-CHECK` | `channeling_check` | `check` | `next_shot_observation` | `다음 샷에서는 채널링이 있는지 먼저 확인하세요.` |
| `A-DISTRIBUTION-CHECK` | `distribution` | `check` | `next_shot_observation` | `다음 샷에서는 분배와 레벨링을 먼저 점검하세요.` |
| `A-TAMPING-CHECK` | `tamping_consistency` | `check` | `next_shot_observation` | `다음 샷에서는 탬핑 수평과 일관성을 먼저 점검하세요.` |
| `A-PUCK-PREP-CHECK` | `puck_prep` | `check` | `next_shot_observation` | `다음 샷에서는 퍽 표면과 준비 과정을 먼저 점검하세요.` |
| `A-NO-CHANGE` | `no_change` | `keep` | `none` | `현재 설정을 유지하세요.` |

MVP 문구는 정확한 grinder number, 클릭 수, mm, g 증감량을 요구하지 않는다.

## Implementation Flow

1. `brewTimeBand`, `brewRatioBand`, taste tags, taste patterns, basic observation summary를 준비한다.
2. Observation override rule을 먼저 평가한다.
3. Base rule을 모두 평가하고 후보 action에 점수를 더한다.
4. Roast context rule은 단독 action을 만들지 않고 점수, `rationale`, `uncertainty`만 보정한다.
5. Previous shot comparison rule은 직전 변경값이 있을 때만 점수와 대안을 보정한다.
6. 점수가 가장 높은 후보를 `primary`로 선택한다.
7. 동점이면 tie-break order를 적용한다.
8. 선택되지 않은 후보 중 점수가 있는 항목을 `alternatives`에 `priority = 2` 또는 `3`으로 넣는다.
9. 어떤 rule도 충분히 매칭되지 않으면 `R-UNKNOWN`을 사용한다.

## Observation Override

관찰 override는 채널링과 puck prep 문제를 단순 분쇄도 문제로 접지 않기 위한 규칙이다.

| Rule ID | Input Condition | Primary Action | Alternatives | Rationale | Uncertainty | `matchedRules` | `keepVariables` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `O-CHANNELING-OBSERVED` | `channelingObserved = yes`, or `prepObservations` includes `one_sided_flow`, `spurting_or_spraying`, or `sudden_flow_acceleration` | `A-CHANNELING-CHECK` | `A-DISTRIBUTION-CHECK`, `A-PUCK-PREP-CHECK` | `채널링 관찰값이 있어 레시피 변수보다 흐름 문제를 먼저 확인한다.` | `채널링 원인은 분쇄도, 분배, 탬핑, puck prep이 함께 만들 수 있다.` | `["O-CHANNELING-OBSERVED"]` | `["grind_size", "dose", "yield"]` |
| `O-DISTRIBUTION-OBSERVED` | `prepObservations` includes `uneven_distribution`, or `prepIssueTypes` includes `distribution` without flow observation | `A-DISTRIBUTION-CHECK` | `A-CHANNELING-CHECK`, `A-TAMPING-CHECK` | `분배가 고르지 않으면 같은 레시피에서도 신맛과 쓴맛이 같이 날 수 있다.` | `분배 관찰은 사용자의 주관 입력이므로 다음 샷에서 다시 확인한다.` | `["O-DISTRIBUTION-OBSERVED"]` | `["grind_size", "dose", "yield"]` |
| `O-TAMPING-OBSERVED` | `prepObservations` includes `tilted_tamp`, or `prepIssueTypes` includes `tamping` without stronger flow observation | `A-TAMPING-CHECK` | `A-DISTRIBUTION-CHECK`, `A-PUCK-PREP-CHECK` | `기울어진 탬핑은 한쪽 과다추출과 한쪽 과소추출을 함께 만들 수 있다.` | `탬핑만의 문제인지 분배 문제와 함께 생긴 문제인지는 다음 샷 관찰이 필요하다.` | `["O-TAMPING-OBSERVED"]` | `["grind_size", "dose", "yield"]` |
| `O-PUCK-SURFACE-OBSERVED` | `prepObservations` includes `cracked_puck` or `uneven_puck_surface`, or `puckCondition = cracked` or `uneven` | `A-PUCK-PREP-CHECK` | `A-DISTRIBUTION-CHECK`, `A-CHANNELING-CHECK` | `갈라지거나 고르지 않은 puck 표면은 균일 추출 문제를 의심하게 한다.` | `puck 표면은 추출 후 상태라 원인을 단정하지 않는다.` | `["O-PUCK-SURFACE-OBSERVED"]` | `["grind_size", "dose", "yield"]` |
| `O-NO-ISSUE-OBSERVED` | `prepObservations = ["no_issue_observed"]`, `channelingObserved = no`, and `prepIssue = none` | selected base rule primary | selected base rule alternatives | `명시적으로 이상 관찰이 없으면 base rule의 레시피 변수 판단 신뢰도를 올린다.` | `육안 관찰이 없어도 미세한 channeling 가능성은 남는다.` | add `["O-NO-ISSUE-OBSERVED"]` to selected base rule | selected base rule decides |

Override order:
1. `O-CHANNELING-OBSERVED`
2. `O-DISTRIBUTION-OBSERVED`
3. `O-TAMPING-OBSERVED`
4. `O-PUCK-SURFACE-OBSERVED`
5. Base rule

If an override primary is selected, recipe variables stay in `keepVariables`. The result may mention taste and time in `rationale`, but it must not say the cause is definitely grind size.

## Base Rule Table

Each row can map directly to a `RecommendationResult`. If an observation override wins, the base rule may still appear in `matchedRules` and `rationale`, but its action becomes an alternative.

| Rule ID | Input Condition | Primary Action | Alternatives | Rationale | Uncertainty | `matchedRules` | `keepVariables` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `R-SOUR-SHORT` | `sour` tag present, no stronger observation override, `brewTimeBand = short` | `A-GRIND-FINER` | `A-YIELD-INCREASE`, `A-CHANNELING-CHECK` | `신맛과 짧은 추출 시간은 과소추출 가능성을 높인다.` | `관찰값이 unknown이면 channeling 가능성을 배제하지 않는다.` | `["R-SOUR-SHORT"]` | `["dose", "yield", "distribution", "puck_prep"]` |
| `R-SOUR-NORMAL-LONG` | `sour` tag present, no stronger observation override, `brewTimeBand = normal` or `long`, and no `bitter` or `astringent` tag | `A-CHANNELING-CHECK` | `A-DISTRIBUTION-CHECK`, `A-YIELD-INCREASE` | `시간이 짧지 않은데 신맛이 두드러지면 균일 추출 문제나 원두 특성 가능성을 먼저 본다.` | `밝은 배전에서는 산미가 원두 특성일 수 있다.` | `["R-SOUR-NORMAL-LONG"]` | `["grind_size", "dose", "yield"]` |
| `R-BITTER-LONG` | `bitter` tag present, no stronger observation override, `brewTimeBand = long` | `A-GRIND-COARSER` | `A-YIELD-DECREASE`, `A-CHANNELING-CHECK` | `쓴맛과 긴 추출 시간은 과다추출 가능성을 높인다.` | `다크 배전에서는 쓴맛 일부가 원두 특성일 수 있다.` | `["R-BITTER-LONG"]` | `["dose", "yield", "distribution", "puck_prep"]` |
| `R-BITTER-HIGH-RATIO` | `bitter` tag present, no stronger observation override, `brewRatioBand = high`, and `brewTimeBand != long` | `A-YIELD-DECREASE` | `A-GRIND-COARSER`, `A-CHANNELING-CHECK` | `추출 비율이 높으면 끝맛이 길어지고 쓴맛이 커질 수 있다.` | `쓴맛이 다크 배전 특성인지 과한 추출량 때문인지는 분리해서 봐야 한다.` | `["R-BITTER-HIGH-RATIO"]` | `["grind_size", "dose", "distribution", "puck_prep"]` |
| `R-WATERY-HOLLOW-HIGH-RATIO` | `watery` or `hollow` tag present, no stronger observation override, `brewRatioBand = high` | `A-YIELD-DECREASE` | `A-GRIND-FINER`, `A-DOSE-INCREASE` | `높은 추출 비율은 희석감, 빈 느낌, 얇은 바디를 만들 수 있다.` | `밍밍함은 원두 노화, 물, 장비 영향도 받을 수 있으나 MVP에서는 대안으로만 둔다.` | `["R-WATERY-HOLLOW-HIGH-RATIO"]` | `["grind_size", "dose", "distribution", "puck_prep"]` |
| `R-WATERY-HOLLOW-SHORT` | `watery` or `hollow` tag present, no stronger observation override, `brewTimeBand = short`, and `brewRatioBand != high` | `A-GRIND-FINER` | `A-YIELD-INCREASE`, `A-CHANNELING-CHECK` | `짧은 추출과 약한 맛은 충분히 추출되지 않았다는 신호일 수 있다.` | `빠른 흐름이 puck prep 문제에서 왔을 수도 있다.` | `["R-WATERY-HOLLOW-SHORT"]` | `["dose", "yield", "distribution", "puck_prep"]` |
| `R-SOUR-BITTER-CONFLICT` | `TastePattern.id = conflicting_extraction_signals`, or `sour` plus `bitter` or `astringent` tags present | `A-CHANNELING-CHECK` | `A-DISTRIBUTION-CHECK`, `A-PUCK-PREP-CHECK` | `신맛과 쓴맛 또는 떫음이 함께 있으면 균일하지 않은 추출 가능성을 먼저 본다.` | `복합 맛은 단일 레시피 변수만으로 설명하기 어렵다.` | `["R-SOUR-BITTER-CONFLICT"]` | `["grind_size", "dose", "yield"]` |
| `R-ASTRINGENT-LONG` | `astringent` tag present, no stronger observation override, `brewTimeBand = long` | `A-GRIND-COARSER` | `A-YIELD-DECREASE`, `A-CHANNELING-CHECK` | `떫고 텁텁한 맛과 긴 추출 시간은 과다추출 가능성을 높인다.` | `떫음은 미분이나 channeling에서도 생길 수 있다.` | `["R-ASTRINGENT-LONG"]` | `["dose", "yield", "distribution", "puck_prep"]` |
| `R-HARSH-PREP` | `harsh` tag present, no stronger observation override | `A-DISTRIBUTION-CHECK` | `A-CHANNELING-CHECK`, `A-PUCK-PREP-CHECK` | `거칠고 정리되지 않은 맛은 준비나 흐름의 균일성 문제일 수 있다.` | `harsh 단독 표현은 맛 원인이 넓어 불확실성이 높다.` | `["R-HARSH-PREP"]` | `["grind_size", "dose", "yield"]` |
| `R-BALANCED` | `balanced` tag present, no negative taste tag, no prep issue, no `unknown_description` only pattern | `A-NO-CHANGE` | none | `맛이 만족스럽다면 다음 샷에서 변수를 바꾸지 않는다.` | `[]` | `["R-BALANCED"]` | `["grind_size", "dose", "yield", "tamping_consistency", "distribution", "puck_prep"]` |
| `R-UNKNOWN` | `TastePattern.id = unknown_description`, or no taste tags map to a base rule, and no stronger observation override matches | `A-CHANNELING-CHECK` | `A-DISTRIBUTION-CHECK` | `맛 표현이 내부 태그로 충분히 매핑되지 않아 관찰과 기본 추출값으로 최소 판단한다.` | `맛 설명을 구조화하지 못해 추천 신뢰도가 낮다.` | `["R-UNKNOWN"]` | `["grind_size", "dose", "yield"]` |

Pattern modifier:
- `balanced_with_negative_signal` is not a standalone result rule.
- When `balanced` appears with any negative taste tag, select the matching negative rule and add `R-BALANCED-WITH-NEGATIVE` to `matchedRules`.
- The selected negative rule still provides exactly one primary action.
- Add uncertainty: `만족 신호가 함께 있어 조정 강도는 작은 단계로 제한한다.`

## Roast Context Rules

배전 범위는 rule을 대체하지 않고 해석 가중치와 문구를 조정한다.

| Rule ID | Input Condition | Effect |
| --- | --- | --- |
| `ROAST-LIGHT-SOUR` | `roastProfile.range = light_range` or `medium_light_range`, and `sour` tag present | `rationale`에 산미가 원두 특성일 수 있음을 추가한다. `brewTimeBand = short`일 때만 과소추출 점수를 보강한다. |
| `ROAST-LIGHT-BITTER` | `roastProfile.range = light_range` or `medium_light_range`, and `bitter` or `astringent` tag present | 쓴맛/떫음의 과다추출 해석 점수를 보강한다. |
| `ROAST-DARK-BITTER` | `roastProfile.range = medium_dark_range` or `dark_range`, and `bitter` tag present | `rationale`에 쓴맛이 원두 특성일 수 있음을 추가한다. `brewTimeBand = long` or `brewRatioBand = high`일 때만 과다추출 점수를 보강한다. |
| `ROAST-DARK-SOUR` | `roastProfile.range = medium_dark_range` or `dark_range`, and `sour` tag present | 다크 계열의 신맛은 channeling, 분배 문제, 추출 부족 가능성을 보강한다. |
| `ROAST-UNKNOWN` | `roastProfile.range = unknown` | 배전 보정 없이 기본 rule을 적용하고 `uncertainty`에 배전 정보 부재를 추가할 수 있다. |

Roast decisions:
- 배전 범위는 primary action을 단독으로 만들지 않는다.
- 배전 범위는 `rationale`, `uncertainty`, score modifier만 만든다.
- `roastProfile.confidence = low` 또는 `unknown`이면 보정 강도를 낮춘다.

## Previous Shot Comparison

직전 샷 비교는 `changesFromPrevious`가 있을 때만 계산한다. 변경 추적 정보가 없으면 자유 텍스트 메모를 해석하지 않는다.

| Rule ID | Input Condition | Effect |
| --- | --- | --- |
| `C-GRIND-FINER-BITTER` | previous change includes `grind_size/finer`, current shot has `bitter` or `astringent` | `A-GRIND-COARSER` 점수를 보강하고 `rationale`에 직전 조정 후 쓴맛/떫음이 늘었을 수 있음을 추가한다. |
| `C-GRIND-COARSER-SOUR` | previous change includes `grind_size/coarser`, current shot has `sour` | `A-GRIND-FINER` 점수를 보강하고 `rationale`에 직전 조정 후 신맛이 늘었을 수 있음을 추가한다. |
| `C-YIELD-UP-WATERY` | previous change includes `yield/increase`, current shot has `watery` or `hollow` | `A-YIELD-DECREASE` 점수를 보강하고 `rationale`에 직전 추출량 증가 후 희석감이 커졌을 수 있음을 추가한다. |

## Scoring

Each matched rule adds score to action candidates.

| Evidence | Score |
| --- | --- |
| Explicit flow observation: `channelingObserved = yes` | `+5` to `A-CHANNELING-CHECK` |
| Explicit prep observation: distribution, tamping, puck surface | `+4` to matching prep action |
| `conflicting_extraction_signals` pattern | `+4` to `A-CHANNELING-CHECK`, `+3` to `A-DISTRIBUTION-CHECK` |
| Taste tag and time/ratio band point in same direction | `+3` to matching recipe action |
| High ratio with weak or bitter taste | `+3` to `A-YIELD-DECREASE` |
| Previous shot change plausibly worsened current taste | `+2` to corrective action |
| Roast context supports the same direction | `+1` |
| Observation values are all `unknown` | no score change, add uncertainty |

Score decisions:
- Scores select the candidate action; they do not determine amount size.
- All recipe changes still use `one_small_step` or `small`.
- `advanced_condition` cannot win primary in MVP.

## Tie Break Order

1. `O-CHANNELING-OBSERVED` wins over every recipe action.
2. Other explicit prep observations win over recipe actions.
3. `R-SOUR-BITTER-CONFLICT` wins over single-taste recipe rules.
4. If a recipe action tie remains, use this order: `grind_size`, `yield`, `dose`.
5. If a prep action tie remains, use this order: `channeling_check`, `distribution`, `tamping_consistency`, `puck_prep`.
6. If `balanced` and any negative tag are both present, ignore `balanced` for primary action and apply the negative rule.
7. `R-BALANCED` can win only when there are no negative tags, no prep issue, and no unknown-only taste pattern.
8. `R-UNKNOWN` is the fallback when no stronger rule matches.

## Expected Recommendation Examples

Examples show the expected routing. `message` is populated from the Action Catalog by `id`; `rationale` and `uncertainty` use the matched rule text above.

### Example 1: Sour and short

Input:
- tags: `sour`
- `brewTimeBand = short`
- `brewRatioBand = target`
- observation summary: unknown

Expected result:

```json
{
  "primary": { "id": "A-GRIND-FINER", "variable": "grind_size", "direction": "finer", "amountLabel": "one_small_step", "priority": 1 },
  "alternatives": [
    { "id": "A-YIELD-INCREASE", "variable": "yield", "direction": "increase", "amountLabel": "small", "priority": 2 },
    { "id": "A-CHANNELING-CHECK", "variable": "channeling_check", "direction": "check", "amountLabel": "next_shot_observation", "priority": 3 }
  ],
  "rationale": ["신맛과 짧은 추출 시간은 과소추출 가능성을 높인다."],
  "uncertainty": ["관찰값이 없어 channeling 가능성은 남아 있다."],
  "matchedRules": ["R-SOUR-SHORT"],
  "keepVariables": ["dose", "yield", "distribution", "puck_prep"]
}
```

### Example 2: Sour with normal time

Input:
- tags: `sour`
- `brewTimeBand = normal`
- `brewRatioBand = target`
- observation summary: unknown

Expected result:

```json
{
  "primary": { "id": "A-CHANNELING-CHECK", "variable": "channeling_check", "direction": "check", "amountLabel": "next_shot_observation", "priority": 1 },
  "alternatives": [
    { "id": "A-DISTRIBUTION-CHECK", "variable": "distribution", "direction": "check", "amountLabel": "next_shot_observation", "priority": 2 },
    { "id": "A-YIELD-INCREASE", "variable": "yield", "direction": "increase", "amountLabel": "small", "priority": 3 }
  ],
  "rationale": ["시간이 짧지 않은데 신맛이 두드러져 균일 추출 문제를 먼저 확인한다."],
  "uncertainty": ["밝은 배전에서는 산미가 원두 특성일 수 있다."],
  "matchedRules": ["R-SOUR-NORMAL-LONG"],
  "keepVariables": ["grind_size", "dose", "yield"]
}
```

### Example 3: Bitter and long

Input:
- tags: `bitter`
- `brewTimeBand = long`
- `brewRatioBand = target`
- observation summary: no issue observed

Expected result:

```json
{
  "primary": { "id": "A-GRIND-COARSER", "variable": "grind_size", "direction": "coarser", "amountLabel": "one_small_step", "priority": 1 },
  "alternatives": [
    { "id": "A-YIELD-DECREASE", "variable": "yield", "direction": "decrease", "amountLabel": "small", "priority": 2 }
  ],
  "rationale": ["쓴맛과 긴 추출 시간은 과다추출 가능성을 높인다."],
  "uncertainty": ["육안 관찰이 없어도 미세한 channeling 가능성은 남는다."],
  "matchedRules": ["O-NO-ISSUE-OBSERVED", "R-BITTER-LONG"],
  "keepVariables": ["dose", "yield", "distribution", "puck_prep"]
}
```

### Example 4: Bitter with high ratio

Input:
- tags: `bitter`
- `brewTimeBand = normal`
- `brewRatioBand = high`
- observation summary: unknown

Expected result:

```json
{
  "primary": { "id": "A-YIELD-DECREASE", "variable": "yield", "direction": "decrease", "amountLabel": "small", "priority": 1 },
  "alternatives": [
    { "id": "A-GRIND-COARSER", "variable": "grind_size", "direction": "coarser", "amountLabel": "one_small_step", "priority": 2 },
    { "id": "A-CHANNELING-CHECK", "variable": "channeling_check", "direction": "check", "amountLabel": "next_shot_observation", "priority": 3 }
  ],
  "rationale": ["추출 비율이 높으면 끝맛이 길어지고 쓴맛이 커질 수 있다."],
  "uncertainty": ["쓴맛이 원두 특성인지 과한 추출량 때문인지는 분리해서 봐야 한다."],
  "matchedRules": ["R-BITTER-HIGH-RATIO"],
  "keepVariables": ["grind_size", "dose", "distribution", "puck_prep"]
}
```

### Example 5: Watery or hollow with high ratio

Input:
- tags: `watery`, `hollow`
- `brewTimeBand = normal`
- `brewRatioBand = high`
- observation summary: no issue observed

Expected result:

```json
{
  "primary": { "id": "A-YIELD-DECREASE", "variable": "yield", "direction": "decrease", "amountLabel": "small", "priority": 1 },
  "alternatives": [
    { "id": "A-GRIND-FINER", "variable": "grind_size", "direction": "finer", "amountLabel": "one_small_step", "priority": 2 },
    { "id": "A-DOSE-INCREASE", "variable": "dose", "direction": "increase", "amountLabel": "small", "priority": 3 }
  ],
  "rationale": ["높은 추출 비율은 희석감, 빈 느낌, 얇은 바디를 만들 수 있다."],
  "uncertainty": ["밍밍함은 원두 상태, 물, 장비 영향도 받을 수 있다."],
  "matchedRules": ["O-NO-ISSUE-OBSERVED", "R-WATERY-HOLLOW-HIGH-RATIO"],
  "keepVariables": ["grind_size", "dose", "distribution", "puck_prep"]
}
```

### Example 6: Sour and bitter together

Input:
- tags: `sour`, `bitter`
- patterns: `conflicting_extraction_signals`
- `brewTimeBand = normal`
- `brewRatioBand = target`
- observation summary: unknown

Expected result:

```json
{
  "primary": { "id": "A-CHANNELING-CHECK", "variable": "channeling_check", "direction": "check", "amountLabel": "next_shot_observation", "priority": 1 },
  "alternatives": [
    { "id": "A-DISTRIBUTION-CHECK", "variable": "distribution", "direction": "check", "amountLabel": "next_shot_observation", "priority": 2 },
    { "id": "A-PUCK-PREP-CHECK", "variable": "puck_prep", "direction": "check", "amountLabel": "next_shot_observation", "priority": 3 }
  ],
  "rationale": ["신맛과 쓴맛이 함께 있어 균일하지 않은 추출 가능성을 먼저 본다."],
  "uncertainty": ["복합 맛은 단일 레시피 변수만으로 설명하기 어렵다."],
  "matchedRules": ["R-SOUR-BITTER-CONFLICT"],
  "keepVariables": ["grind_size", "dose", "yield"]
}
```

### Example 7: Channeling observed

Input:
- tags: `sour`, `watery`
- patterns: `weak_and_sour`
- `brewTimeBand = short`
- `prepObservations` includes `spurting_or_spraying`

Expected result:

```json
{
  "primary": { "id": "A-CHANNELING-CHECK", "variable": "channeling_check", "direction": "check", "amountLabel": "next_shot_observation", "priority": 1 },
  "alternatives": [
    { "id": "A-DISTRIBUTION-CHECK", "variable": "distribution", "direction": "check", "amountLabel": "next_shot_observation", "priority": 2 },
    { "id": "A-GRIND-FINER", "variable": "grind_size", "direction": "finer", "amountLabel": "one_small_step", "priority": 3 }
  ],
  "rationale": ["채널링 관찰값이 있어 레시피 변수보다 흐름 문제를 먼저 확인한다."],
  "uncertainty": ["채널링 원인은 분쇄도, 분배, 탬핑, puck prep이 함께 만들 수 있다."],
  "matchedRules": ["O-CHANNELING-OBSERVED", "R-SOUR-SHORT"],
  "keepVariables": ["grind_size", "dose", "yield"]
}
```

### Example 8: Prep observation without flow channeling

Input:
- tags: `harsh`
- `brewTimeBand = normal`
- `prepObservations` includes `tilted_tamp`

Expected result:

```json
{
  "primary": { "id": "A-TAMPING-CHECK", "variable": "tamping_consistency", "direction": "check", "amountLabel": "next_shot_observation", "priority": 1 },
  "alternatives": [
    { "id": "A-DISTRIBUTION-CHECK", "variable": "distribution", "direction": "check", "amountLabel": "next_shot_observation", "priority": 2 },
    { "id": "A-PUCK-PREP-CHECK", "variable": "puck_prep", "direction": "check", "amountLabel": "next_shot_observation", "priority": 3 }
  ],
  "rationale": ["기울어진 탬핑은 한쪽 과다추출과 한쪽 과소추출을 함께 만들 수 있다."],
  "uncertainty": ["탬핑만의 문제인지 분배 문제와 함께 생긴 문제인지는 다음 샷 관찰이 필요하다."],
  "matchedRules": ["O-TAMPING-OBSERVED", "R-HARSH-PREP"],
  "keepVariables": ["grind_size", "dose", "yield"]
}
```

### Example 9: Balanced

Input:
- tags: `balanced`
- no negative tags
- `brewTimeBand = normal`
- `brewRatioBand = target`
- observation summary: no issue observed

Expected result:

```json
{
  "primary": { "id": "A-NO-CHANGE", "variable": "no_change", "direction": "keep", "amountLabel": "none", "priority": 1 },
  "alternatives": [],
  "rationale": ["맛이 만족스럽다면 다음 샷에서 변수를 바꾸지 않는다."],
  "uncertainty": [],
  "matchedRules": ["O-NO-ISSUE-OBSERVED", "R-BALANCED"],
  "keepVariables": ["grind_size", "dose", "yield", "tamping_consistency", "distribution", "puck_prep"]
}
```

### Example 10: Unknown taste

Input:
- tags: none
- patterns: `unknown_description`
- `brewTimeBand = normal`
- `brewRatioBand = target`
- observation summary: unknown

Expected result:

```json
{
  "primary": { "id": "A-CHANNELING-CHECK", "variable": "channeling_check", "direction": "check", "amountLabel": "next_shot_observation", "priority": 1 },
  "alternatives": [
    { "id": "A-DISTRIBUTION-CHECK", "variable": "distribution", "direction": "check", "amountLabel": "next_shot_observation", "priority": 2 }
  ],
  "rationale": ["맛 표현이 내부 태그로 충분히 매핑되지 않아 관찰과 기본 추출값으로 최소 판단한다."],
  "uncertainty": ["맛 설명을 구조화하지 못해 추천 신뢰도가 낮다."],
  "matchedRules": ["R-UNKNOWN"],
  "keepVariables": ["grind_size", "dose", "yield"]
}
```

## MVP Decisions

- 추천 rule table의 물리적 저장 위치는 아직 정하지 않는다.
- 최종 추천은 순수 함수로 계산한다.
- 한 번에 하나의 변수만 primary recommendation으로 둔다.
- alternatives는 보여주되 동시에 실행하라고 권하지 않는다.
- 맛이 만족스럽다면 `no_change` action으로 현재 설정 유지를 안내한다.
- 추출 시간은 추천 action이 아니라 진단 신호로만 사용한다.
- `brewTimeBand`와 `brewRatioBand` 기준은 `Shot Data` 문서의 값을 MVP 기본값으로 유지한다.
- 사용자별 목표 시간과 목표 ratio 입력은 MVP 이후로 미룬다.
- 배전 범위는 상위 해석 컨텍스트이며 단독 추천 근거로 쓰지 않는다.
- 채널링 또는 prep observation은 분쇄도 진단으로 collapse하지 않고 별도 action으로 유지한다.
