# Recommendation Result Copy

## Purpose

추천 결과 화면에서 초보자가 다음 샷에 바로 적용할 수 있는 문구 템플릿을 정의한다. 이 문서는 추천 rule을 새로 만들지 않고, `RecommendationResult`와 `RecommendationAction`에 담긴 값을 사용자에게 어떻게 보여줄지만 정한다.

## Copy Principles

- 한 화면의 primary action은 항상 1개만 말한다.
- 같은 문장 안에서 여러 변수를 동시에 바꾸라고 말하지 않는다.
- 수치는 장비마다 다르므로 `한 단계`, `소폭`, `먼저 확인`처럼 상대 표현을 쓴다.
- 이유는 단정하지 않고 가능성으로 설명한다.
- 불확실성은 겁주지 않고 다음 샷에서 볼 관찰 포인트로 안내한다.
- keep variables는 무엇을 그대로 둘지 명시한다.
- 추출 시간은 조정 변수로 말하지 않고 근거 또는 불확실성에서만 설명한다.

## Result Layout Template

```text
다음 샷: {primary_action_message}

왜 이렇게 보나요?
{rationale_sentence_1}
{rationale_sentence_2_optional}

이번에는 그대로 둘 것
{keep_variables_sentence}

확인하면 좋은 점
{uncertainty_sentence_optional}

다른 후보
{alternative_sentence_optional}
```

Rules:
- `다음 샷` 영역에는 `primary.message`만 표시한다.
- `다른 후보`는 동시에 실행하라는 의미가 아니어야 한다.
- `다른 후보`가 없으면 섹션을 숨기거나 `없음`으로 표시할 수 있다.

## Primary Action Template

| `variable` | `direction` | `amountLabel` | User-facing copy |
| --- | --- | --- | --- |
| `no_change` | `keep` | `none` | `현재 설정을 그대로 유지해보세요.` |
| `grind_size` | `finer` | `one_small_step` | `분쇄도를 한 단계만 곱게 해보세요.` |
| `grind_size` | `coarser` | `one_small_step` | `분쇄도를 한 단계만 굵게 해보세요.` |
| `dose` | `increase` | `small` | `도징량을 소폭 늘려보세요.` |
| `dose` | `decrease` | `small` | `도징량을 소폭 줄여보세요.` |
| `yield` | `increase` | `small` | `추출량을 소폭 늘려보세요.` |
| `yield` | `decrease` | `small` | `추출량을 소폭 줄여보세요.` |
| `tamping_consistency` | `check` | `next_shot_observation` | `탬핑이 매번 비슷한 힘과 각도로 되는지 먼저 확인해보세요.` |
| `distribution` | `check` | `next_shot_observation` | `레벨링과 분배가 고르게 되었는지 먼저 확인해보세요.` |
| `channeling_check` | `check` | `next_shot_observation` | `다음 샷에서는 채널링이 보이는지 먼저 확인해보세요.` |
| `puck_prep` | `check` | `next_shot_observation` | `퍽 표면과 준비 과정을 먼저 확인해보세요.` |
| `advanced_condition` | `check` | `next_shot_observation` | `기본 변수는 유지하고 온도, 압력, 원두 상태 같은 고급 조건을 기록해보세요.` |

Copy rules:
- `grind_size`, `dose`, `yield`는 primary로 쓰일 수 있는 레시피 변수다.
- `tamping_consistency`, `distribution`, `channeling_check`, `puck_prep`는 준비 과정 또는 관찰을 먼저 보라는 action이다.
- `advanced_condition`은 기본 변수로 설명하기 어려운 경우에만 조건 확인 문구로 쓴다. 기본 화면에서 여러 고급 조건을 동시에 바꾸라고 말하지 않는다.

## Rationale Template

근거 문구는 `맛 신호 + 추출값/관찰값 + 가능성` 순서로 쓴다.

| Signal | Template |
| --- | --- |
| 신맛 + 짧은 시간 | `신맛이 있고 추출 시간이 짧아 과소추출 가능성이 있습니다.` |
| 신맛 + 충분한 시간 | `시간은 충분했는데 신맛이 남아 균일하게 추출되지 않았을 가능성이 있습니다.` |
| 쓴맛 + 긴 시간 | `쓴맛이 있고 추출 시간이 길어 과다추출 가능성이 있습니다.` |
| 쓴맛 + 높은 비율 | `추출량이 많은 편이라 끝맛이 과하게 느껴졌을 가능성이 있습니다.` |
| 밍밍함/빈 맛 + 높은 비율 | `도징량에 비해 추출량이 많아 맛이 희석됐을 가능성이 있습니다.` |
| 밍밍함/빈 맛 + 짧은 시간 | `추출 시간이 짧아 맛이 충분히 나오지 않았을 가능성이 있습니다.` |
| 떫음/텁텁함 + 긴 시간 | `떫거나 텁텁한 느낌과 긴 시간은 과다추출 신호일 수 있습니다.` |
| 채널링 관찰 | `흐름이 한쪽으로 치우치거나 튀었다면 레시피보다 균일 추출을 먼저 보는 것이 좋습니다.` |
| 신맛 + 쓴맛 동시 | `신맛과 쓴맛이 함께 있으면 부분적으로 덜 추출되고 부분적으로 과하게 추출됐을 수 있습니다.` |
| 균형 잡힘 | `맛이 만족스럽다면 지금은 변수를 바꾸지 않는 것이 좋습니다.` |
| 배전 정보 없음 | `배전 정도를 모르면 원두 특성 보정 없이 기본 추출값과 맛 표현으로 판단합니다.` |

Copy rules:
- `입니다`보다 `가능성이 있습니다`, `수 있습니다`를 우선한다.
- `망쳤다`, `문제다`, `실패` 같은 표현은 쓰지 않는다.
- 배전 범위는 단독 근거로 쓰지 않는다.

## Keep Variables Template

기본 문장:

```text
이번에는 {changed_variable_label}만 바꾸고 {keep_variable_labels}은 그대로 두세요.
```

`no_change` 문장:

```text
이번에는 분쇄도, 도징량, 추출량, 퍽 준비 과정을 모두 그대로 두세요.
```

관찰 action 문장:

```text
이번에는 레시피를 바꾸지 말고 {observation_target}만 확인해보세요. 분쇄도, 도징량, 추출량은 그대로 두세요.
```

Keep variable labels:

| Variable | Label in keep copy |
| --- | --- |
| `grind_size` | `분쇄도` |
| `dose` | `도징량` |
| `yield` | `추출량` |
| `tamping_consistency` | `탬핑 방식` |
| `distribution` | `레벨링/분배` |
| `puck_prep` | `퍽 준비 과정` |
| `advanced_condition` | `온도, 압력 같은 고급 조건` |

Examples:
- Primary `grind_size`: `이번에는 분쇄도만 바꾸고 도징량과 추출량은 그대로 두세요.`
- Primary `yield`: `이번에는 추출량만 바꾸고 분쇄도와 도징량은 그대로 두세요.`
- Primary `distribution`: `이번에는 레시피를 바꾸지 말고 레벨링/분배만 확인해보세요. 분쇄도, 도징량, 추출량은 그대로 두세요.`

## Uncertainty Template

불확실성 문구는 추천을 약하게 만들기보다 다음 샷의 관찰 포인트를 알려준다.

| Condition | User-facing copy |
| --- | --- |
| 관찰값 없음 | `채널링이나 퍽 상태를 보지 못했다면, 다음 샷에서 흐름이 한쪽으로 치우치는지도 함께 봐주세요.` |
| 배전 정보 없음 | `배전 정도를 모르면 원두 특성 영향은 분리해서 보기 어렵습니다. 다음에 알게 되면 함께 기록해보세요.` |
| 맛 설명 낮은 확신 | `맛 표현이 애매하면 추천 확신이 낮아집니다. 다음 샷에서는 신맛, 쓴맛, 밍밍함 중 무엇이 가장 큰지 하나만 골라보세요.` |
| 입력값 일반 범위 밖 | `입력값이 일반적인 진단 범위를 벗어났을 수 있습니다. 숫자가 맞는지만 한 번 확인해주세요.` |
| 신맛과 쓴맛 동시 | `맛 신호가 섞여 있어 분쇄도보다 추출 흐름 관찰이 더 중요할 수 있습니다.` |
| 고급 조건 가능성 | `기본 변수를 유지해도 비슷하다면 온도, 압력, 원두 보관 상태를 기록해보세요.` |

Copy rules:
- `위험`, `심각`, `불량` 같은 표현은 쓰지 않는다.
- 사용자가 할 일은 관찰 1개 또는 확인 1개로 제한한다.

## Alternative Actions Template

대안은 primary action 다음에 고려할 후보일 뿐이다.

```text
다른 후보로는 {alternative_action_message}가 있습니다. 이번 샷에서는 먼저 위 추천 하나만 적용해보세요.
```

Examples:
- `다른 후보로는 추출량을 소폭 늘리는 방법이 있습니다. 이번 샷에서는 먼저 위 추천 하나만 적용해보세요.`
- `다른 후보로는 레벨링/분배를 확인하는 방법이 있습니다. 이번 샷에서는 먼저 위 추천 하나만 적용해보세요.`

Rules:
- `그리고`, `동시에`, `함께 바꾸세요`를 쓰지 않는다.
- alternatives가 여러 개여도 화면에서는 우선순위가 가장 높은 후보 1개만 보여줄 수 있다.

## Balanced Shot Template

Use when `primary.variable = no_change`.

```text
다음 샷: 현재 설정을 그대로 유지해보세요.

왜 이렇게 보나요?
맛이 만족스럽다면 지금은 변수를 바꾸지 않는 것이 좋습니다.

이번에는 그대로 둘 것
이번에는 분쇄도, 도징량, 추출량, 퍽 준비 과정을 모두 그대로 두세요.
```

Rules:
- 균형 잡힌 샷에서는 개선을 위해 새 변수를 제안하지 않는다.
- 부정 태그가 함께 있으면 balanced copy를 primary로 쓰지 않는다.

## Unknown or Low-Confidence Template

Use when taste parsing is unknown or confidence is low.

```text
다음 샷: 기본 레시피는 그대로 두고 맛과 추출 흐름을 한 번 더 관찰해보세요.

왜 이렇게 보나요?
맛 설명만으로는 어떤 변수를 먼저 바꿀지 확신하기 어렵습니다.

이번에는 그대로 둘 것
분쇄도, 도징량, 추출량은 그대로 두세요.

확인하면 좋은 점
다음 샷에서는 신맛, 쓴맛, 밍밍함 중 가장 크게 느껴지는 것 하나를 골라보세요.
```

Mapping:
- `primary.variable`: `channeling_check`
- `primary.direction`: `check`
- `primary.amountLabel`: `next_shot_observation`
- `uncertainty`: low-confidence reason and one observation prompt

Rules:
- 모르는 맛이어도 추천 결과를 막지 않는다.
- 알 수 없다는 문구는 짧게 말하고, 다음 관찰을 구체적으로 제안한다.
- `no_change`는 만족스러운 balanced shot에만 사용한다.

## Example Result Copy

### Under-extraction

Input signals:
- `sour`
- `brewTimeBand = short`

```text
다음 샷: 분쇄도를 한 단계만 곱게 해보세요.

왜 이렇게 보나요?
신맛이 있고 추출 시간이 짧아 과소추출 가능성이 있습니다.

이번에는 그대로 둘 것
이번에는 분쇄도만 바꾸고 도징량과 추출량은 그대로 두세요.

확인하면 좋은 점
채널링이나 퍽 상태를 보지 못했다면, 다음 샷에서 흐름이 한쪽으로 치우치는지도 함께 봐주세요.

다른 후보
다른 후보로는 추출량을 소폭 늘리는 방법이 있습니다. 이번 샷에서는 먼저 위 추천 하나만 적용해보세요.
```

### Over-extraction

Input signals:
- `bitter`
- `brewTimeBand = long`

```text
다음 샷: 분쇄도를 한 단계만 굵게 해보세요.

왜 이렇게 보나요?
쓴맛이 있고 추출 시간이 길어 과다추출 가능성이 있습니다.

이번에는 그대로 둘 것
이번에는 분쇄도만 바꾸고 도징량과 추출량은 그대로 두세요.

다른 후보
다른 후보로는 추출량을 소폭 줄이는 방법이 있습니다. 이번 샷에서는 먼저 위 추천 하나만 적용해보세요.
```

### Watery or High Ratio

Input signals:
- `watery` or `hollow`
- `brewRatioBand = high`

```text
다음 샷: 추출량을 소폭 줄여보세요.

왜 이렇게 보나요?
도징량에 비해 추출량이 많아 맛이 희석됐을 가능성이 있습니다.

이번에는 그대로 둘 것
이번에는 추출량만 바꾸고 분쇄도와 도징량은 그대로 두세요.

다른 후보
다른 후보로는 분쇄도를 한 단계만 곱게 하는 방법이 있습니다. 이번 샷에서는 먼저 위 추천 하나만 적용해보세요.
```

### Channeling or Prep

Input signals:
- `channelingObserved = yes` or conflicting taste signals

```text
다음 샷: 다음 샷에서는 채널링이 보이는지 먼저 확인해보세요.

왜 이렇게 보나요?
흐름이 한쪽으로 치우치거나 튀었다면 레시피보다 균일 추출을 먼저 보는 것이 좋습니다.

이번에는 그대로 둘 것
이번에는 레시피를 바꾸지 말고 채널링만 확인해보세요. 분쇄도, 도징량, 추출량은 그대로 두세요.

다른 후보
다른 후보로는 레벨링/분배를 확인하는 방법이 있습니다. 이번 샷에서는 먼저 위 추천 하나만 적용해보세요.
```

### Balanced

Input signals:
- `balanced`
- no negative taste tag

```text
다음 샷: 현재 설정을 그대로 유지해보세요.

왜 이렇게 보나요?
맛이 만족스럽다면 지금은 변수를 바꾸지 않는 것이 좋습니다.

이번에는 그대로 둘 것
이번에는 분쇄도, 도징량, 추출량, 퍽 준비 과정을 모두 그대로 두세요.
```

### Unknown Taste

Input signals:
- `unknown_description`
- low confidence

```text
다음 샷: 기본 레시피는 그대로 두고 맛과 추출 흐름을 한 번 더 관찰해보세요.

왜 이렇게 보나요?
맛 설명만으로는 어떤 변수를 먼저 바꿀지 확신하기 어렵습니다.

이번에는 그대로 둘 것
분쇄도, 도징량, 추출량은 그대로 두세요.

확인하면 좋은 점
다음 샷에서는 신맛, 쓴맛, 밍밍함 중 가장 크게 느껴지는 것 하나를 골라보세요.
```

## MVP Decisions

- 결과 문구는 추천 데이터의 `primary`, `rationale`, `keepVariables`, `uncertainty`, `alternatives`를 화면용 문장으로 바꾸는 계약이다.
- 추천 결과 화면은 한 번에 하나의 primary action만 실행하도록 안내한다.
- keep variables copy는 사용자가 바꾸지 말아야 할 변수를 명시한다.
- alternatives는 다음 후보를 알려주는 용도이며 동시에 실행하라고 안내하지 않는다.
- unknown 또는 low-confidence case에서도 기록과 추천 결과는 제공한다.
