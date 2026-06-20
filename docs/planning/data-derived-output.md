# Derived Output Data

## Purpose

샷 입력에서 파생되는 맛 태그, 맛 패턴, 추천 결과 구조를 정의한다.

## TasteTag

사용자의 자연어 맛 설명에서 추출한 개별 맛 신호다.

| Field | Type | Required | Values |
| --- | --- | --- | --- |
| `id` | enum | yes | `sour`, `bitter`, `watery`, `astringent`, `harsh`, `hollow`, `balanced` |
| `label` | string | yes | 사용자 표시용 이름 |
| `polarity` | enum | yes | `under_extraction`, `over_extraction`, `weak_extraction`, `prep_issue`, `balanced`, `unknown` |
| `intensity` | number | yes | `1`, `2`, `3` |
| `position` | enum | no | `start`, `middle`, `finish`, `overall` |
| `confidence` | enum | yes | `low`, `medium`, `high` |
| `sourceText` | string | yes | 태그를 만든 원문 일부 |

Rules:
- `mixed`는 저장 태그로 사용하지 않는다.
- 복합 표현은 여러 `TasteTag`와 `TastePattern`으로 표현한다.
- LLM 보정이 없어도 규칙 기반 태깅 결과로 동작해야 한다.

## TastePattern

여러 맛 태그를 보고 만든 파생 패턴이다.

| Field | Type | Required | Values |
| --- | --- | --- | --- |
| `id` | enum | yes | `conflicting_extraction_signals`, `weak_and_sour`, `balanced_with_negative_signal`, `unknown_description` |
| `sourceTagIds` | array | yes | 패턴을 만든 맛 태그 ID 목록 |
| `confidence` | enum | yes | `low`, `medium`, `high` |

Pattern rules:

| Pattern ID | Condition | Meaning |
| --- | --- | --- |
| `conflicting_extraction_signals` | `sour` and `bitter` both present | 채널링, 분배, 퍽 준비 문제 가능성 |
| `weak_and_sour` | `watery` or `hollow` with `sour` | 과소추출 또는 추출량 과다 가능성 |
| `balanced_with_negative_signal` | `balanced` plus any negative tag | 부정 태그 우선 판단 |
| `unknown_description` | no mapped taste tag | 추천 불확실성 증가 |

## RecommendationResult

다음 샷에서 먼저 시도할 조정안과 근거다.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `primary` | object | yes | 다음 샷에서 먼저 실행할 1개 조정안 |
| `alternatives` | array | yes | 대안 후보. 동시에 실행하라고 안내하지 않음 |
| `rationale` | array | yes | 추천 근거 문장 |
| `uncertainty` | array | yes | 불확실성 문장 |
| `matchedRules` | array | yes | 적용된 추천 rule ID |
| `keepVariables` | array | yes | 이번 샷에서 유지하라고 안내할 변수 |

Rules:
- 저장된 `ShotRecord`는 항상 `recommendation` snapshot을 가진다.
- 추천 결과는 샷 생성 시점의 판단을 재현하기 위한 데이터이므로, 나중에 rule이 바뀌어도 기존 샷의 추천 문구는 그대로 남긴다.
- `keepVariables`는 `grind_size`, `dose`, `yield`, `tamping_consistency`, `distribution`, `puck_prep`, `advanced_condition` 중에서 사용한다.
- 만족스러운 샷처럼 바꿀 변수가 없을 때는 `primary.variable = no_change`, `direction = keep`, `amountLabel = none`을 사용한다.

## RecommendationAction

| Field | Type | Required | Values |
| --- | --- | --- | --- |
| `id` | string | yes | action 고유 ID |
| `variable` | enum | yes | `no_change`, `grind_size`, `dose`, `yield`, `tamping_consistency`, `distribution`, `channeling_check`, `puck_prep`, `advanced_condition` |
| `direction` | enum | yes | `finer`, `coarser`, `increase`, `decrease`, `check`, `keep` |
| `amountLabel` | enum | yes | `one_small_step`, `small`, `next_shot_observation`, `none` |
| `priority` | number | yes | `1`, `2`, `3` |
| `message` | string | yes | 사용자에게 보여줄 추천 문구 |

Rules:
- `primary`는 항상 1개다.
- `primary.priority`는 `1`이다.
- `alternatives`는 우선순위 후보일 뿐 동시에 실행하라고 안내하지 않는다.
- `keepVariables`는 한 번에 여러 변수를 바꾸지 않게 하기 위한 표시용 데이터다.
- `no_change`는 맛이 만족스러워 다음 샷에서 변수를 바꾸지 않는 추천에만 사용한다.
- 추출 시간은 recommendation action이 아니라 진단 신호다. 시간 관련 메시지는 `rationale` 또는 `uncertainty`에서 설명한다.
