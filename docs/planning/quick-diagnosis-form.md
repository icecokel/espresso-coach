# Quick Diagnosis Form

## Purpose

빠른 진단 폼은 입문자와 초보 홈바리스타가 한 샷을 최소 입력으로 기록하고 다음 샷 추천을 받을 수 있게 한다. 필수값은 맛 설명, 도징량, 추출량, 추출 시간이다.

## Field Groups

### Required Fields

| Field | Label | Type | Required | Default | Storage |
| --- | --- | --- | --- | --- | --- |
| `tasteDescription` | 맛이 어땠나요? | multiline text | yes | 없음. 사용자 입력 필요 | `ShotRecord.extraction.tasteDescription` |
| `doseGrams` | 도징량 | number | yes | 없음. 사용자 입력 필요 | `ShotRecord.extraction.doseGrams` |
| `yieldGrams` | 추출량 | number | yes | 없음. 사용자 입력 필요 | `ShotRecord.extraction.yieldGrams` |
| `brewSeconds` | 추출 시간 | number | yes | 없음. 사용자 입력 필요 | `ShotRecord.extraction.brewSeconds` |

### Optional Basic Fields

| Field | Label | Type | Required | Default | Storage |
| --- | --- | --- | --- | --- | --- |
| `roastProfile.range` | 배전 정도 | single-select | no | `unknown` | `BeanSession.roastProfile.range` |
| `roastProfile.label` | 배전 표기 메모 | text | no | omitted | `BeanSession.roastProfile.label` |
| `grindNote` | 분쇄도 메모 | text | no | omitted | `ShotRecord.basicObservation.grindNote` |
| `prepObservations` | 추출 중/추출 후 이상한 점이 있었나요? | multi-select | no | `[]` | `ShotRecord.basicObservation.prepObservations` |

`roastProfile` quick input:

| UI Value | Stored `range` | Stored `confidence` | Stored `source` |
| --- | --- | --- | --- |
| 모름 | `unknown` | `unknown` | `unknown` |
| 라이트 쪽 | `light_range` | `medium` | `user_selected` |
| 미디엄 라이트 쪽 | `medium_light_range` | `medium` | `user_selected` |
| 미디엄 쪽 | `medium_range` | `medium` | `user_selected` |
| 미디엄 다크 쪽 | `medium_dark_range` | `medium` | `user_selected` |
| 다크 쪽 | `dark_range` | `medium` | `user_selected` |

`prepObservations` options:

| Value | Label | Internal Use |
| --- | --- | --- |
| `no_issue_observed` | 이상한 점은 없었다 | 관찰상 문제 없음 |
| `one_sided_flow` | 한쪽으로만 흘렀다 | 채널링/분배 문제 후보 |
| `spurting_or_spraying` | 포터필터에서 튀거나 샜다 | 채널링 후보 |
| `sudden_flow_acceleration` | 추출 흐름이 갑자기 빨라졌다 | flow 불안정/채널링 후보 |
| `cracked_puck` | 퍽이 갈라졌다 | 퍽 표면 문제 후보 |
| `uneven_puck_surface` | 퍽 표면이 한쪽으로 파였거나 고르지 않았다 | 퍽 표면/분배 문제 후보 |
| `soupy_puck` | 퍽에 물이 고인 듯 질척했다 | 퍽 상태 참고 신호 |
| `tilted_tamp` | 탬핑이 기울어진 것 같다 | 탬핑 문제 후보 |
| `uneven_distribution` | 분배/레벨링이 고르지 않았던 것 같다 | 분배 문제 후보 |
| `not_sure` | 잘 모르겠다 | 관찰값 없음 또는 낮은 확신 |

`prepObservations`에서 저장 시 파생하는 요약값:

| Derived Field | Default | Values | Storage |
| --- | --- | --- | --- |
| `channelingObserved` | `unknown` | `unknown`, `yes`, `no` | `ShotRecord.basicObservation.channelingObserved` |
| `puckCondition` | `unknown` | `unknown`, `clean`, `wet`, `soupy`, `cracked`, `uneven` | `ShotRecord.basicObservation.puckCondition` |
| `prepIssue` | `unknown` | `unknown`, `none`, `suspected`, `confirmed` | `ShotRecord.basicObservation.prepIssue` |
| `prepIssueTypes` | `[]` | `distribution`, `tamping`, `puck_surface`, `flow` | `ShotRecord.basicObservation.prepIssueTypes` |

### Advanced Fields

고급 모드는 사용자가 켤 때만 노출한다.

| Field | Label | Type | Required | Default | Storage |
| --- | --- | --- | --- | --- | --- |
| `pressureBars` | 머신 압력 | number | no | omitted | `ShotRecord.advancedObservation.pressureBars` |
| `temperatureCelsius` | 추출 온도 | number | no | omitted | `ShotRecord.advancedObservation.temperatureCelsius` |
| `daysOffRoast` | 로스팅 후 경과일 | number | no | omitted | `ShotRecord.advancedObservation.daysOffRoast` |
| `waterNote` | 물 조성 메모 | text | no | omitted | `ShotRecord.advancedObservation.waterNote` |
| `equipmentNote` | 장비 메모 | text | no | omitted | `ShotRecord.advancedObservation.equipmentNote` |
| `preinfusionNote` | 프리인퓨전 메모 | text | no | omitted | `ShotRecord.advancedObservation.preinfusionNote` |

Advanced storage rule:
- 고급 모드를 끄거나 모든 고급 필드가 비어 있으면 `ShotRecord.advancedObservation = null`로 저장한다.
- 고급 필드가 하나라도 입력되면 `advancedObservation` object를 저장하고, 비어 있는 내부 필드는 생략한다.

## Validation Rules

### Required Input

- `tasteDescription`은 빈 문자열일 수 없다.
- `doseGrams`, `yieldGrams`, `brewSeconds`는 숫자여야 하며 0보다 커야 한다.
- 단위는 화면에서 고정 표시한다. 사용자는 숫자만 입력한다.

### Blocking Validation

아래 조건은 제출을 막는다.

| Field | Blocking Rule |
| --- | --- |
| `tasteDescription` | trim 후 1자 이상 |
| `doseGrams` | `> 0` |
| `yieldGrams` | `> 0` |
| `brewSeconds` | `> 0` |
| `pressureBars` | 입력된 경우 `> 0` |
| `temperatureCelsius` | 입력된 경우 `> 0` |
| `daysOffRoast` | 입력된 경우 `>= 0` |
| all number fields | 숫자, 소수점 1자리까지 허용 |

### Warning Validation

아래 조건은 제출을 막지 않는다. 대신 결과의 불확실성 또는 입력 경고로 표시한다.

| Field | Warning Rule | Stored Warning Code | Warning Copy |
| --- | --- | --- | --- |
| `doseGrams` | `< 5` or `> 30` | `dose_out_of_common_range` | `도징량이 일반적인 에스프레소 범위를 벗어났을 수 있습니다.` |
| `yieldGrams` | `< 5` or `> 80` | `yield_out_of_common_range` | `추출량이 일반적인 에스프레소 범위를 벗어났을 수 있습니다.` |
| `brewSeconds` | `< 10` or `> 60` | `time_out_of_common_range` | `추출 시간이 일반적인 진단 범위를 벗어났을 수 있습니다.` |
| `brewRatio` | `< 1.0` or `> 4.0` | `ratio_out_of_common_range` | `도징량 대비 추출량이 커서 추천의 불확실성이 높아집니다.` |

Warning은 추천을 금지하지 않는다. MVP는 입문자 이탈을 줄이기 위해 비정상 가능성이 있는 값도 기록할 수 있게 한다.

### Beginner-Friendly Errors

| Condition | Error Copy |
| --- | --- |
| 맛 설명 없음 | `맛을 한마디로 적어주세요. 예: 시다, 쓰다, 밍밍하다` |
| 도징량 없음 | `원두를 몇 g 사용했는지 입력해주세요.` |
| 추출량 없음 | `컵에 나온 에스프레소가 몇 g인지 입력해주세요.` |
| 추출 시간 없음 | `추출이 시작된 뒤 멈출 때까지 걸린 시간을 입력해주세요.` |
| 숫자 아님 | `숫자만 입력해주세요.` |
| 0 이하 | `0보다 큰 값을 입력해주세요.` |

## Derived Values

폼 제출 시 아래 값을 계산해 추천 로직에 전달한다.

| Derived Field | Formula | Storage | Example |
| --- | --- | --- | --- |
| `brewRatio` | `yieldGrams / doseGrams` | `ShotRecord.extraction.brewRatio` | `36 / 18 = 2.0` |
| `brewTimeBand` | `<25 short`, `25-32 normal`, `>32 long` | `ShotRecord.extraction.brewTimeBand` | `22 = short` |
| `brewRatioBand` | `<1.7 low`, `1.7-2.3 target`, `>2.3 high` | `ShotRecord.extraction.brewRatioBand` | `2.0 = target` |
| `inputWarnings` | warning validation 결과의 code 배열 | `ShotRecord.extraction.inputWarnings` | `[]` |
| `shotNumber` | 세션 내 기존 샷 수 + 1 | `ShotRecord.shotNumber` | `3` |
| `hasPreviousShot` | 세션 내 직전 샷 존재 여부 | 저장하지 않음. UI 표시와 `changesFromPrevious` 노출 판단에만 사용 | `true` |
| `tasteTags` | `tasteDescription` 규칙 기반 파싱 결과 | `ShotRecord.tasteTags` | `[{ "id": "sour", ... }]` |
| `tastePatterns` | `tasteTags` 조합에서 파생 | `ShotRecord.tastePatterns` | `[{ "id": "weak_and_sour", ... }]` |
| `recommendation` | 저장 직전 추천 로직 결과 | `ShotRecord.recommendation` | `primary` 1개 포함 |

## Input Defaults

| Input or Storage Field | Default |
| --- | --- |
| `BeanSession.name` | 세션 이름 없이 빠른 진단을 시작하면 `새 원두 세션 YYYY-MM-DD` |
| `BeanSession.roastProfile` | `{ "range": "unknown", "confidence": "unknown", "source": "unknown" }` |
| `ShotRecord.basicObservation.prepObservations` | `[]` |
| `ShotRecord.basicObservation.channelingObserved` | `unknown` |
| `ShotRecord.basicObservation.puckCondition` | `unknown` |
| `ShotRecord.basicObservation.prepIssue` | `unknown` |
| `ShotRecord.basicObservation.prepIssueTypes` | `[]` |
| `ShotRecord.advancedObservation` | `null` when no advanced field is entered |
| `ShotRecord.changesFromPrevious` | `[]` for first shot, no change, or unknown change |
| `ShotRecord.extraction.inputWarnings` | `[]` when no warning rule matches |

## Submission Behavior

1. 필수값 validation을 통과한다.
2. 연결된 세션이 없으면 자동으로 `BeanSession`을 만들고, `roastProfile` 입력이 없으면 unknown default를 저장한다.
3. 맛 설명을 규칙 기반 맛 태그로 변환한다.
4. `brewRatio`, `brewTimeBand`, `brewRatioBand`, `inputWarnings`를 계산한다.
5. `prepObservations`에서 `BasicObservation` 요약값을 파생한다.
6. 고급 입력이 없으면 `advancedObservation = null`로 둔다.
7. 애매하거나 복합적인 문장은 LLM 보정 후보로 표시할 수 있다.
8. 추천 로직에는 구조화된 입력값, 맛 태그, 맛 패턴, 선택 관찰값, 직전 샷 변경값을 전달한다.
9. 추천 결과는 한 번에 하나의 변수만 우선 조정하도록 표시하고 `ShotRecord.recommendation`에 저장한다.

## Storage Mapping Summary

| Form / Derived Source | Stored Field | Required in Stored Record |
| --- | --- | --- |
| active or auto-created session | `ShotRecord.sessionId` | yes |
| session shot count | `ShotRecord.shotNumber` | yes |
| required form fields | `ShotRecord.extraction.tasteDescription`, `doseGrams`, `yieldGrams`, `brewSeconds` | yes |
| derived extraction values | `ShotRecord.extraction.brewRatio`, `brewTimeBand`, `brewRatioBand`, `inputWarnings` | yes |
| optional roast input | `BeanSession.roastProfile` | yes on session |
| optional `grindNote` | `ShotRecord.basicObservation.grindNote` | no |
| optional `prepObservations` and derived summaries | `ShotRecord.basicObservation` | yes |
| optional advanced fields | `ShotRecord.advancedObservation` object or `null` | yes |
| previous shot change input | `ShotRecord.changesFromPrevious` | yes |
| taste parser output | `ShotRecord.tasteTags`, `ShotRecord.tastePatterns` | yes |
| recommendation engine output | `ShotRecord.recommendation` | yes |
| submit time defaults | `ShotRecord.pulledAt`, `createdAt`, `updatedAt` | yes |

## Previous Shot Change Input

두 번째 샷부터는 사용자가 직전 샷 대비 무엇을 바꿨는지 선택할 수 있다. 이 입력은 선택값이지만, 입력되면 직전 샷 비교 추천에 사용한다.

| Field | Label | Type | Options |
| --- | --- | --- | --- |
| `changedVariable` | 직전 샷에서 무엇을 바꿨나요? | enum | `none`, `unknown`, `grind_size`, `dose`, `yield`, `tamping_consistency`, `distribution`, `puck_prep`, `advanced_condition` |
| `changeDirection` | 어느 방향으로 바꿨나요? | enum | `finer`, `coarser`, `increase`, `decrease`, `improved`, `worse`, `changed`, `unknown` |
| `changeAmountLabel` | 어느 정도 바꿨나요? | enum | `one_small_step`, `small`, `next_shot_observation`, `none` |
| `changeNote` | 변경 메모 | text | optional |

Default:
- 첫 샷: 변경 입력을 숨기고 `changesFromPrevious = []`
- 두 번째 샷 이후: 접힌 선택 영역으로 제공
- 사용자가 `none` 또는 `unknown`을 선택하거나 모르면 별도 `ShotChange`를 만들지 않고 `changesFromPrevious = []`로 저장
- `changedVariable`이 실제 변수이면 `ShotChange.variable`로 저장한다.
- `changeDirection`은 `ShotChange.direction`으로 저장한다.
- `changeAmountLabel`이 비어 있으면 생략하고, 입력되면 `ShotChange.amountLabel`로 저장한다.
- `changeNote`가 비어 있으면 생략하고, 입력되면 `ShotChange.note`로 저장한다.
- `brew_time` 또는 추출 시간 변경은 선택지로 제공하지 않는다. 시간은 `brewSeconds`와 `brewTimeBand`를 통한 진단 신호로만 사용한다.

## MVP Decisions

- 빠른 진단은 필수값 4개만으로 완료된다.
- 선택 관찰값은 추천 불확실성을 줄이는 용도다.
- 고급 입력은 기본 validation을 막지 않는다.
- 단위 입력은 자유 텍스트가 아니라 숫자 입력 + 고정 단위 표시로 처리한다.
- 현실 범위 밖 숫자는 차단하지 않고 경고로 처리한다.
- 직전 샷 비교는 사용자가 선택한 구조화된 변경 입력이 있을 때만 사용한다.
- 추출 시간은 직접 변경 변수로 받지 않는다. 시간은 `brewSeconds`, `brewTimeBand`를 통해 진단 신호로만 사용한다.
