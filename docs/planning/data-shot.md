# Shot Data

## Purpose

한 번의 추출 기록에 저장되는 원시 입력, 파생값, 관찰값, 직전 샷 대비 변경값을 정의한다.

## ShotRecord

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | 샷 고유 ID |
| `sessionId` | string | yes | 소속 세션 ID |
| `shotNumber` | number | yes | 세션 안의 샷 순서, 1부터 시작 |
| `extraction` | object | yes | 추출 입력값과 파생값 |
| `basicObservation` | object | yes | 기본 관찰값 |
| `advancedObservation` | object or null | yes | 고급 모드 관찰값. 고급 입력이 없으면 `null` |
| `changesFromPrevious` | array | yes | 직전 샷 대비 변경값. 첫 샷은 빈 배열 |
| `tasteTags` | array | yes | 자연어 맛 설명에서 추출한 개별 맛 태그 |
| `tastePatterns` | array | yes | 여러 태그에서 파생한 복합 패턴 |
| `recommendation` | object | yes | 다음 샷 추천 결과. 저장된 샷은 항상 추천 snapshot을 가진다 |
| `pulledAt` | datetime string | yes | 실제 샷을 추출한 시각. 사용자가 수정 가능 |
| `createdAt` | datetime string | yes | 생성 시각 |
| `updatedAt` | datetime string | yes | 마지막 수정 시각 |

Rules:
- 첫 샷은 직전 샷이 없으므로 `changesFromPrevious`를 빈 배열로 저장한다.
- 두 번째 샷부터 사용자가 직전 샷 대비 변경값을 선택할 수 있다.
- 변경 없음 또는 모름은 별도 `none` 객체를 저장하지 않고 `changesFromPrevious = []`로 표현한다.
- 저장된 샷은 추천 결과를 함께 저장한다. 추천 계산에 실패한 임시 상태는 MVP 저장 데이터가 아니다.
- 자유 텍스트 메모는 보여줄 수 있지만 추천 계산에는 구조화된 변경값만 사용한다.
- `pulledAt`은 실제 추출 시각이고, `createdAt`은 기록 생성 시각이다. 과거 샷을 나중에 입력할 수 있으므로 둘을 분리한다.

## Extraction

빠른 진단 필수 입력값과 계산값이다.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `tasteDescription` | string | yes | 사용자의 자연어 맛 설명 |
| `doseGrams` | number | yes | 도징량, g |
| `yieldGrams` | number | yes | 추출량, g |
| `brewSeconds` | number | yes | 추출 시간, 초 |
| `brewRatio` | number | yes | `yieldGrams / doseGrams` |
| `brewTimeBand` | enum | yes | `short`, `normal`, `long` |
| `brewRatioBand` | enum | yes | `low`, `target`, `high` |
| `inputWarnings` | array | yes | 비정상 가능성 경고 |

Band rules:

| Derived Field | Value | Condition |
| --- | --- | --- |
| `brewTimeBand` | `short` | `< 25s` |
| `brewTimeBand` | `normal` | `25s - 32s` |
| `brewTimeBand` | `long` | `> 32s` |
| `brewRatioBand` | `low` | `< 1.7` |
| `brewRatioBand` | `target` | `1.7 - 2.3` |
| `brewRatioBand` | `high` | `> 2.3` |

Validation:
- `tasteDescription`: trim 후 1자 이상이어야 한다.
- `doseGrams`, `yieldGrams`, `brewSeconds`: 0보다 큰 숫자여야 한다.
- 현실 범위 밖 값은 제출을 막지 않고 `inputWarnings`에 저장한다.

Warning rules:

| Field | Warning Condition | Warning Code |
| --- | --- | --- |
| `doseGrams` | `< 5` or `> 30` | `dose_out_of_common_range` |
| `yieldGrams` | `< 5` or `> 80` | `yield_out_of_common_range` |
| `brewSeconds` | `< 10` or `> 60` | `time_out_of_common_range` |
| `brewRatio` | `< 1.0` or `> 4.0` | `ratio_out_of_common_range` |

## BasicObservation

입문자 흐름에서 선택적으로 입력하는 관찰값이다. 비어 있으면 `unknown`으로 저장한다.

| Field | Type | Required | Values |
| --- | --- | --- | --- |
| `grindNote` | string | no | 자유 텍스트 |
| `prepObservations` | array | yes | `PrepObservation.id` 목록. 없으면 빈 배열 |
| `channelingObserved` | enum | yes | `unknown`, `yes`, `no` |
| `puckCondition` | enum | yes | `unknown`, `clean`, `wet`, `soupy`, `cracked`, `uneven` |
| `prepIssue` | enum | yes | `unknown`, `none`, `suspected`, `confirmed` |
| `prepIssueTypes` | array | yes | `distribution`, `tamping`, `puck_surface`, `flow` |

Rules:
- 화면에서는 `puckCondition`이나 `prepIssue`를 직접 묻지 않고, 사용자가 본 현상을 `prepObservations` 체크리스트로 받는다.
- `channelingObserved`, `puckCondition`, `prepIssue`, `prepIssueTypes`는 `prepObservations`에서 파생되는 추천 로직용 요약값이다.
- 사용자가 고급 모드에서 직접 관찰값을 수정할 수 있더라도, 기본 모드에서는 원본 체크값을 우선 저장한다.
- `prepObservations`가 비어 있으면 `channelingObserved`, `puckCondition`, `prepIssue`는 `unknown`, `prepIssueTypes`는 빈 배열로 저장한다.
- `channelingObserved = yes`이면 추천 로직에서 준비 문제 후보를 우선한다.
- `puckCondition = cracked` 또는 `uneven`이면 퍽 준비 문제 후보를 올린다.
- 관찰값이 `unknown`이면 추천 결과의 불확실성에 반영한다.

## PrepObservation

사용자가 빠른 진단에서 체크하는 퍽 준비/추출 흐름 관찰값이다. 문구는 초보자가 실제로 본 현상을 기준으로 둔다.

| ID | User-facing Meaning | Derived Summary |
| --- | --- | --- |
| `no_issue_observed` | 이상한 점은 없었다 | `channelingObserved = no`, `puckCondition = clean`, `prepIssue = none` |
| `one_sided_flow` | 한쪽으로만 흘렀다 | `channelingObserved = yes`, `prepIssue = suspected`, `prepIssueTypes += flow, distribution` |
| `spurting_or_spraying` | 포터필터에서 튀거나 샜다 | `channelingObserved = yes`, `prepIssue = suspected`, `prepIssueTypes += flow` |
| `sudden_flow_acceleration` | 추출 흐름이 갑자기 빨라졌다 | `channelingObserved = yes`, `prepIssue = suspected`, `prepIssueTypes += flow` |
| `cracked_puck` | 퍽이 갈라졌다 | `puckCondition = cracked`, `prepIssue = suspected`, `prepIssueTypes += puck_surface` |
| `uneven_puck_surface` | 퍽 표면이 한쪽으로 파였거나 고르지 않았다 | `puckCondition = uneven`, `prepIssue = suspected`, `prepIssueTypes += puck_surface, distribution` |
| `soupy_puck` | 퍽에 물이 고인 듯 질척했다 | `puckCondition = soupy`, `prepIssueTypes += puck_surface` |
| `tilted_tamp` | 탬핑이 기울어진 것 같다 | `prepIssue = suspected`, `prepIssueTypes += tamping` |
| `uneven_distribution` | 분배/레벨링이 고르지 않았던 것 같다 | `prepIssue = suspected`, `prepIssueTypes += distribution` |
| `not_sure` | 잘 모르겠다 | 요약값을 `unknown`으로 유지 |

Derivation rules:
- `no_issue_observed`만 선택된 경우에는 명시적으로 문제가 없었다는 관찰값으로 본다.
- `no_issue_observed`와 문제 관찰값이 함께 있으면 문제 관찰값을 우선하고 `no_issue_observed`는 무시한다.
- `not_sure`만 선택된 경우에는 다른 관찰 근거가 없는 것으로 본다.
- `not_sure`와 다른 관찰값이 함께 있으면 다른 관찰값을 우선하고, 결과 불확실성에 사용자가 확신하지 못했다는 문구를 추가할 수 있다.
- 여러 관찰값이 선택되면 `prepIssueTypes`는 중복 제거한 배열로 저장한다.
- `soupy_puck`은 단독으로 채널링 근거가 아니다. 다른 flow 관찰값이 없으면 `channelingObserved`를 `unknown`으로 둔다.
- `puckCondition`이 여러 값으로 파생될 수 있으면 `cracked`, `uneven`, `soupy`, `wet` 순서로 더 진단적인 값을 우선한다.

## AdvancedObservation

고급 모드는 사용자가 켤 때만 입력한다. 기본 흐름과 추천 계산을 막지 않는다.

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `pressureBars` | number | no | 머신 압력 |
| `temperatureCelsius` | number | no | 추출 온도 |
| `daysOffRoast` | number | no | 로스팅 후 경과일 |
| `waterNote` | string | no | 물 조성 메모 |
| `equipmentNote` | string | no | 바스켓, 샤워스크린, 그라인더 버 메모 |
| `preinfusionNote` | string | no | 프리인퓨전 메모 |

Rules:
- 고급 입력이 없으면 `advancedObservation`은 `null`로 저장한다.
- 고급 관찰값은 기본 추천 변수보다 후순위 또는 조건부 대안으로만 사용한다.
- 비어 있어도 빠른 진단과 추천은 진행된다.

## ShotChange

직전 샷 대비 사용자가 실제로 바꾼 변수다.

| Field | Type | Required | Values |
| --- | --- | --- | --- |
| `variable` | enum | yes | `grind_size`, `dose`, `yield`, `tamping_consistency`, `distribution`, `puck_prep`, `advanced_condition` |
| `direction` | enum | yes | `finer`, `coarser`, `increase`, `decrease`, `improved`, `worse`, `changed`, `unknown` |
| `amountLabel` | enum | no | `one_small_step`, `small`, `next_shot_observation`, `none` |
| `note` | string | no | 변경 메모 |

Rules:
- 추천 로직은 `ShotChange`가 있을 때만 직전 샷 비교를 계산한다.
- 추출 시간은 직접 조정 변수로 저장하지 않는다. 시간 변화는 `brewSeconds`와 파생 band에서 진단 신호로만 사용한다.
- `note`는 사람이 읽는 메모이며 추천 계산 입력이 아니다.
- 한 샷에서 여러 변경값을 기록할 수 있지만, 결과 화면은 다음 샷에서 한 변수만 바꾸도록 안내한다.
