# Data Structure

## Purpose

에스프레소 코치 MVP에서 저장하고 계산해야 하는 데이터 구조의 상위 개요다. 세부 필드 정의는 역할별 문서로 분리한다.

기술 스택, DB, 언어, 저장소는 이 문서에서 정하지 않는다.

## Type Relationship

```text
BeanSession
  └─ ShotRecord[]
       ├─ Extraction
       ├─ BasicObservation
       ├─ AdvancedObservation
       ├─ ShotChange[]
       ├─ TasteTag[]
       ├─ TastePattern[]
       └─ RecommendationResult
```

## Type Index

| Type | Owner Doc | Role | Required / Null / Default Convention | Key Enums |
| --- | --- | --- | --- | --- |
| `BeanSession` | [Session Data](data-session.md) | 원두별 다이얼링 단위. 사용자 화면에서는 프로젝트처럼 보일 수 있지만 내부 타입명은 `BeanSession`으로 유지한다. | 저장 시 `id`, `name`, `roastProfile`, `status`, timestamps required. 원두 상세 필드는 optional. `roastProfile`은 required이며 모르면 unknown default object를 저장한다. | `status`: `active`, `archived` |
| `RoastProfile` | [Session Data](data-session.md) | 배전 범위, 확신도, 출처를 저장하는 세션 컨텍스트. | `range`, `confidence`, `source` required. `label` optional. unknown default는 `range`, `confidence`, `source`를 모두 `unknown`으로 둔다. | `range`: `unknown`, `light_range`, `medium_light_range`, `medium_range`, `medium_dark_range`, `dark_range`; `confidence`: `unknown`, `low`, `medium`, `high`; `source`: `unknown`, `user_selected`, `roaster_label`, `inferred` |
| `ShotRecord` | [Shot Data](data-shot.md) | 한 샷의 원시 입력, 관찰값, 파생값, 맛 태그, 추천 snapshot을 묶는 저장 단위. | 저장된 샷은 `extraction`, `basicObservation`, `advancedObservation`, `changesFromPrevious`, `tasteTags`, `tastePatterns`, `recommendation`, timestamps required. `advancedObservation`은 required field이나 고급 입력이 없으면 `null`. `recommendation`은 saved record에서 required. | 없음 |
| `Extraction` | [Shot Data](data-shot.md) | 빠른 진단 필수 입력과 추출 비율/time band 파생값. | `tasteDescription`, `doseGrams`, `yieldGrams`, `brewSeconds` required input. `brewRatio`, `brewTimeBand`, `brewRatioBand`, `inputWarnings` required derived fields. `inputWarnings`는 없으면 `[]`. | `brewTimeBand`: `short`, `normal`, `long`; `brewRatioBand`: `low`, `target`, `high`; warning codes: `dose_out_of_common_range`, `yield_out_of_common_range`, `time_out_of_common_range`, `ratio_out_of_common_range` |
| `BasicObservation` | [Shot Data](data-shot.md) | 기본 모드에서 받은 관찰 원본과 추천 로직용 요약값. | `prepObservations`, `channelingObserved`, `puckCondition`, `prepIssue`, `prepIssueTypes` required. `grindNote` optional. 관찰 입력이 없으면 `prepObservations = []`, 요약값은 unknown/empty defaults. | `channelingObserved`: `unknown`, `yes`, `no`; `puckCondition`: `unknown`, `clean`, `wet`, `soupy`, `cracked`, `uneven`; `prepIssue`: `unknown`, `none`, `suspected`, `confirmed`; `prepIssueTypes`: `distribution`, `tamping`, `puck_surface`, `flow` |
| `PrepObservation` | [Shot Data](data-shot.md) | 빠른 진단에서 사용자가 체크하는 퍽 준비/흐름 관찰 원본값. | `BasicObservation.prepObservations`에 ID 배열로 저장한다. 선택값이 없거나 모르면 `[]`; `not_sure`만 선택된 경우 요약값은 unknown defaults. | `no_issue_observed`, `one_sided_flow`, `spurting_or_spraying`, `sudden_flow_acceleration`, `cracked_puck`, `uneven_puck_surface`, `soupy_puck`, `tilted_tamp`, `uneven_distribution`, `not_sure` |
| `AdvancedObservation` | [Shot Data](data-shot.md) | 고급 모드 입력. 기본 추천 흐름을 막지 않는 보조 관찰값. | `ShotRecord.advancedObservation`은 required field. 고급 입력이 하나도 없으면 `null`; 하나라도 있으면 object로 저장하고 각 내부 필드는 optional. | 없음 |
| `ShotChange` | [Shot Data](data-shot.md) | 직전 샷 대비 사용자가 실제로 바꾼 변수. | `changesFromPrevious`는 required array. 첫 샷, 변경 없음, 모름은 모두 `[]`. 저장되는 항목은 `variable`, `direction` required, `amountLabel`, `note` optional. `brew_time`은 저장하지 않는다. | `variable`: `grind_size`, `dose`, `yield`, `tamping_consistency`, `distribution`, `puck_prep`, `advanced_condition`; `direction`: `finer`, `coarser`, `increase`, `decrease`, `improved`, `worse`, `changed`, `unknown`; `amountLabel`: `one_small_step`, `small`, `next_shot_observation`, `none` |
| `TasteTag` | [Derived Output Data](data-derived-output.md) | 자연어 맛 설명에서 추출한 개별 맛 신호. | `id`, `label`, `polarity`, `intensity`, `confidence`, `sourceText` required. `position` optional. 저장된 샷은 `tasteTags` required array이며 매핑된 태그가 없으면 `[]`와 `unknown_description` pattern으로 표현한다. | `id`: `sour`, `bitter`, `watery`, `astringent`, `harsh`, `hollow`, `balanced`; `polarity`: `under_extraction`, `over_extraction`, `weak_extraction`, `prep_issue`, `balanced`, `unknown`; `intensity`: `1`, `2`, `3`; `position`: `start`, `middle`, `finish`, `overall`; `confidence`: `low`, `medium`, `high` |
| `TastePattern` | [Derived Output Data](data-derived-output.md) | 여러 맛 태그에서 파생한 복합 맛 패턴. | `id`, `sourceTagIds`, `confidence` required. 저장된 샷은 `tastePatterns` required array이며 패턴이 없으면 `[]`. 알 수 없는 설명은 `unknown_description` pattern으로 저장한다. | `id`: `conflicting_extraction_signals`, `weak_and_sour`, `balanced_with_negative_signal`, `unknown_description`; `confidence`: `low`, `medium`, `high` |
| `RecommendationResult` | [Derived Output Data](data-derived-output.md) | 다음 샷에서 먼저 시도할 1개 조정안과 근거/불확실성/대안 snapshot. | 저장된 `ShotRecord.recommendation`에 required. `primary`, `alternatives`, `rationale`, `uncertainty`, `matchedRules`, `keepVariables` required. 비어 있는 목록은 `[]`. | `keepVariables`: `grind_size`, `dose`, `yield`, `tamping_consistency`, `distribution`, `puck_prep`, `advanced_condition` |
| `RecommendationAction` | [Derived Output Data](data-derived-output.md) | 추천 결과의 실행 가능한 조정안. | `id`, `variable`, `direction`, `amountLabel`, `priority`, `message` required. `primary`는 항상 1개이며 `priority = 1`. 만족스러운 샷은 `variable = no_change`, `direction = keep`, `amountLabel = none`. `brew_time`은 action이 아니다. | `variable`: `no_change`, `grind_size`, `dose`, `yield`, `tamping_consistency`, `distribution`, `channeling_check`, `puck_prep`, `advanced_condition`; `direction`: `finer`, `coarser`, `increase`, `decrease`, `check`, `keep`; `amountLabel`: `one_small_step`, `small`, `next_shot_observation`, `none`; `priority`: `1`, `2`, `3` |

## Split Documents

- [Session Data](data-session.md): `BeanSession`, `RoastProfile`
- [Shot Data](data-shot.md): `ShotRecord`, `Extraction`, `BasicObservation`, `AdvancedObservation`, `ShotChange`
- [Derived Output Data](data-derived-output.md): `TasteTag`, `TastePattern`, `RecommendationResult`, `RecommendationAction`
- [Data Examples and Scope](data-examples-and-scope.md): 완성 샷 예시, MVP 저장 데이터, deferred data, 데이터 결정사항

## Core Decisions

- 원두 세션과 샷 기록은 분리한다.
- 배전 정도는 세션의 required `roastProfile`에 범위형 데이터로 저장한다. 모르면 `unknown` default를 쓴다.
- 빠른 진단 필수 입력은 샷의 `extraction`에 모은다.
- 고급 입력은 `advancedObservation`에 분리하고, 입력이 없으면 `null`로 저장한다.
- 직전 샷 비교는 구조화된 `changesFromPrevious`만 사용한다.
- 직전 샷 대비 변경 없음 또는 모름은 `changesFromPrevious = []`로 표현한다.
- 복합 맛은 `mixed` 태그가 아니라 `TastePattern`으로 표현한다.
- 저장된 샷은 샷 생성 시점의 판단을 재현할 수 있도록 `recommendation` snapshot을 항상 가진다.
- 추출 시간은 직접 조정 action이 아니라 진단 신호로만 사용한다.
- 만족스러운 샷처럼 바꿀 변수가 없을 때만 `RecommendationAction.variable = no_change`를 사용한다.
