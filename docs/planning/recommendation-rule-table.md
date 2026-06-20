# Recommendation Rule Table

## Purpose

추천 로직은 배전 범위를 먼저 해석 컨텍스트로 보고, 그 다음 맛 태그, 기본 추출값, 선택 관찰값, 직전 샷과의 변화를 바탕으로 다음 샷에서 먼저 바꿀 변수 1개를 우선순위로 제안한다. LLM은 최종 추천 결정을 하지 않는다.

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

## Default Thresholds

MVP는 사용자가 별도 레시피 목표를 입력하지 않는 한 아래 기준으로 진단한다. 이 기준은 정답이 아니라 입문자용 기본 판단선이다.

### Brew Time Bands

| Band | Condition | Meaning |
| --- | --- | --- |
| `short` | `< 25s` | 과소추출 가능성이 커지는 구간 |
| `normal` | `25s - 32s` | 기본 판단 구간 |
| `long` | `> 32s` | 과다추출 가능성이 커지는 구간 |

### Brew Ratio Bands

`brewRatio = yieldGrams / doseGrams`

| Band | Condition | Example with 18g dose | Meaning |
| --- | --- | --- | --- |
| `low` | `< 1.7` | `< 30.6g` | 짧거나 진한 추출 가능성 |
| `target` | `1.7 - 2.3` | `30.6g - 41.4g` | 기본 판단 구간 |
| `high` | `> 2.3` | `> 41.4g` | 희석 또는 과다추출 가능성 |

### Change Amount Defaults

| Variable | Direction | `amountLabel` | Beginner Copy |
| --- | --- | --- | --- |
| `grind_size` | `finer` | `one_small_step` | `분쇄도를 한 단계만 곱게` |
| `grind_size` | `coarser` | `one_small_step` | `분쇄도를 한 단계만 굵게` |
| `yield` | `increase` | `small` | `추출량을 소폭 늘리기` |
| `yield` | `decrease` | `small` | `추출량을 소폭 줄이기` |
| `dose` | `increase` | `small` | `도징량을 소폭 늘리기` |
| `dose` | `decrease` | `small` | `도징량을 소폭 줄이기` |
| `no_change` | `keep` | `none` | `현재 설정 유지` |
| `channeling_check` | `check` | `next_shot_observation` | `다음 샷에서 채널링 먼저 확인` |
| `distribution` | `check` | `next_shot_observation` | `레벨링/분배를 먼저 점검` |
| `puck_prep` | `check` | `next_shot_observation` | `퍽 준비 과정을 먼저 점검` |

MVP 문구는 정확한 mm, 클릭 수, g 증감량을 강제하지 않는다. 그라인더와 장비마다 단위가 다르기 때문에 기본 화면에서는 `한 단계`, `소폭`, `먼저 확인`처럼 실행 가능한 상대 표현을 사용한다.

## Base Rule Table

| Rule ID | Condition | Primary Recommendation | Alternative Priority | Rationale |
| --- | --- | --- | --- | --- |
| `R-UNDER-FAST` | `sour` tag + `brewTimeBand = short` | 분쇄도를 한 단계 곱게 | 추출량 소폭 증가 | 신맛과 짧은 시간은 과소추출 가능성을 높인다. |
| `R-UNDER-NORMAL` | `sour` tag + `brewTimeBand = normal or long` | 채널링 확인 | 레벨링/분배 확인, 분쇄도 조정 보류 | 시간이 충분한데 시면 균일 추출 문제가 섞였을 수 있다. |
| `R-OVER-SLOW` | `bitter` tag + `brewTimeBand = long` | 분쇄도를 한 단계 굵게 | 추출량 소폭 감소 | 쓴맛과 긴 시간은 과다추출 가능성을 높인다. |
| `R-OVER-HIGH-RATIO` | `bitter` tag + `brewRatioBand = high` | 추출량 소폭 감소 | 분쇄도 조정 보류, 채널링 확인 | 시간이 길지 않아도 추출량이 많으면 끝맛이 과하게 나올 수 있다. |
| `R-WEAK-HIGH-RATIO` | `watery` or `hollow` + `brewRatioBand = high` | 추출량 소폭 감소 | 분쇄도 한 단계 곱게 | 추출량이 많아 맛이 희석됐을 가능성이 있다. |
| `R-WEAK-FAST` | `watery` or `hollow` + `brewTimeBand = short` | 분쇄도를 한 단계 곱게 | 추출량 소폭 증가 | 충분히 추출되지 않아 연하게 느껴질 수 있다. |
| `R-ASTRINGENT-SLOW` | `astringent` + `brewTimeBand = long` | 분쇄도를 한 단계 굵게 | 추출량 소폭 감소 | 떫고 텁텁한 맛은 과다추출 신호일 수 있다. |
| `R-PREP-CHANNELING` | `channelingObserved = yes` | 채널링 확인 | 레벨링/분배 확인, 탬핑 일관성 확인 | 채널링이 보이면 레시피 변수보다 준비 문제를 먼저 본다. |
| `R-PREP-CONFLICT` | `sour` and `bitter` tags both present | 채널링 확인 | 레벨링/분배 확인, 퍽 준비 확인 | 신맛과 쓴맛이 함께 있으면 균일하지 않은 추출 가능성이 있다. |
| `R-BALANCED` | `balanced` tag and no negative tag | 현재 설정 유지 | 없음 | 맛이 만족스럽다면 변수를 바꾸지 않는다. |

## Roast Context Rules

배전 범위는 rule을 대체하지 않고 해석 가중치와 불확실성 문구를 조정한다.

| Rule ID | Roast Range | Taste Signal | Effect |
| --- | --- | --- | --- |
| `ROAST-LIGHT-SOUR` | `light_range`, `medium_light_range` | `sour` | 신맛을 원두 특성 가능성으로도 표시한다. `brewTimeBand = short`일 때만 과소추출 판단을 강화한다. |
| `ROAST-LIGHT-BITTER` | `light_range`, `medium_light_range` | `bitter`, `astringent` | 쓴맛/떫음은 과다추출 후보로 비교적 강하게 본다. |
| `ROAST-DARK-BITTER` | `medium_dark_range`, `dark_range` | `bitter` | 쓴맛을 원두 특성 가능성으로도 표시한다. `brewTimeBand = long` 또는 `brewRatioBand = high`일 때만 과다추출 판단을 강화한다. |
| `ROAST-DARK-SOUR` | `medium_dark_range`, `dark_range` | `sour` | 다크 계열에서 신맛이 두드러지면 채널링, 분배 문제, 추출 부족 가능성을 올린다. |
| `ROAST-UNKNOWN` | `unknown` | any | 배전 보정 없이 기본 rule을 적용하고 불확실성에 배전 정보 부재를 표시할 수 있다. |

Roast tie break:
1. 배전 범위는 primary action을 단독으로 만들지 않는다.
2. 배전 범위는 `rationale`과 `uncertainty`에 원두 특성 가능성을 추가한다.
3. 배전 범위와 추출값이 같은 방향을 가리킬 때만 추천 점수를 보강한다.
4. 배전 범위의 `confidence`가 `low` 또는 `unknown`이면 보정 강도를 낮춘다.

## Observation Override Rules

| Observation | Effect |
| --- | --- |
| `prepObservations` includes `one_sided_flow`, `spurting_or_spraying`, or `sudden_flow_acceleration` | `channelingObserved = yes`로 요약하고 `channeling_check`를 우선 후보에 올린다. |
| `prepObservations` includes `tilted_tamp` or `uneven_distribution` | `prepIssue = suspected`로 요약하고 탬핑/분배 확인을 우선 후보에 올린다. |
| `prepObservations` includes `cracked_puck` or `uneven_puck_surface` | `puckCondition = cracked` or `uneven`으로 요약하고 `puck_prep`를 우선 후보에 올린다. |
| `channelingObserved = yes` | `channeling_check`, `distribution`, `puck_prep`를 레시피 변수보다 우선한다. |
| `prepIssue = confirmed` | 탬핑/레벨링 관련 추천을 우선한다. |
| `puckCondition = cracked` or `uneven` | 퍽 준비 문제를 우선 후보에 올린다. |
| 관찰값이 모두 `unknown` | 레시피 변수 추천은 가능하지만 불확실성 문구를 추가한다. |

## Previous Shot Comparison

직전 샷이 있으면 변화 방향을 반영한다.

| Rule ID | Previous Change | Current Result | Recommendation Behavior |
| --- | --- | --- | --- |
| `C-GRIND-FINER-BITTER` | 분쇄도를 곱게 했음 | 쓴맛 또는 떫은맛 증가 | 분쇄도 되돌림 또는 한 단계 굵게 |
| `C-GRIND-COARSER-SOUR` | 분쇄도를 굵게 했음 | 신맛 증가 | 분쇄도 되돌림 또는 한 단계 곱게 |
| `C-YIELD-UP-WATERY` | 추출량을 늘렸음 | 밍밍함 증가 | 추출량 소폭 감소 |

직전 샷 비교는 `ShotRecord.changesFromPrevious`가 있을 때만 계산한다. 변경 추적 정보가 없으면 자유 텍스트 메모를 해석하지 않고, 현재 샷 기준 추천만 만든다.

## Scoring and Tie Break

각 rule은 후보 action에 점수를 더한다.

| Evidence | Score |
| --- | --- |
| 명시적 관찰값, 예: `channelingObserved = yes` | `+4` |
| 맛 태그와 시간/비율이 같은 방향으로 일치 | `+3` |
| 복합 맛 태그 충돌, 예: `sour` + `bitter` | `+3` |
| 직전 샷 변경 후 문제가 악화 | `+2` |
| 선택 관찰값이 `unknown` | `-1` uncertainty 추가 |

Tie break:
1. 채널링/준비 문제 관찰이 있으면 준비 문제 action을 우선한다.
2. 같은 점수면 사용자가 실제로 한 번에 바꾸기 쉬운 변수, `grind_size`, `yield`, `dose` 순으로 둔다.
3. 고급 변수는 primary가 될 수 없고 alternatives 또는 uncertainty에만 표시한다.
4. `balanced`와 부정 태그가 같이 있으면 `balanced`는 primary 판단에서 제외한다.

## Priority Rules

1. 배전 범위를 해석 컨텍스트로 먼저 확인한다.
2. 명시적 채널링 또는 준비 문제 관찰이 있으면 준비 문제를 먼저 본다.
3. 복합 맛 태그가 있으면 단순 분쇄도 조정보다 균일 추출 문제를 먼저 본다.
4. 단일 맛 태그와 시간/비율이 같은 방향을 가리키면 레시피 변수를 추천한다.
5. 고급 변수는 기본 변수로 설명하기 어려울 때만 조건부 대안으로 둔다.
6. 실제 실행 문구는 항상 한 번에 하나의 변수만 바꾸도록 안내한다.

## Example Result Copy

```text
다음 샷에서는 분쇄도를 조금 더 곱게 해보세요.
신맛이 있고 추출 시간이 짧아 과소추출 가능성이 있습니다.
다만 채널링 관찰값이 없어 퍽 준비 문제 가능성은 남아 있습니다.
이번에는 분쇄도만 바꾸고 도징량과 추출량은 유지해보세요.
```

## MVP Decisions

- 추천 rule table의 물리적 저장 위치는 아직 정하지 않는다.
- 최종 추천은 순수 함수로 계산한다.
- 한 번에 하나의 변수만 primary recommendation으로 둔다.
- alternatives는 보여주되 동시에 실행하라고 권하지 않는다.
- 맛이 만족스럽다면 `no_change` action으로 현재 설정 유지를 안내한다.
- 추출 시간은 추천 action이 아니라 진단 신호로만 사용한다.
- 시간과 비율 기준은 입문자용 기본값이며, 사용자별 레시피 목표 입력은 MVP 이후로 미룬다.
- 배전 범위는 상위 해석 컨텍스트이며 단독 추천 근거로 쓰지 않는다.
