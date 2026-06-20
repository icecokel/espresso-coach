# Quick Diagnosis Form

## Purpose

빠른 진단 폼은 입문자와 초보 홈바리스타가 한 샷을 최소 입력으로 기록하고 다음 샷 추천을 받을 수 있게 한다. 필수값은 맛 설명, 도징량, 추출량, 추출 시간이다.

## Field Groups

### Required Fields

| Field | Label | Type | Example | Validation |
| --- | --- | --- | --- | --- |
| `tasteDescription` | 맛이 어땠나요? | multiline text | `시고 끝맛이 쓰다` | 1자 이상 |
| `doseGrams` | 도징량 | number | `18` | 0보다 큰 g 단위 숫자 |
| `yieldGrams` | 추출량 | number | `36` | 0보다 큰 g 단위 숫자 |
| `brewSeconds` | 추출 시간 | number | `22` | 0보다 큰 초 단위 숫자 |

### Optional Basic Fields

| Field | Label | Type | Example | Validation |
| --- | --- | --- | --- | --- |
| `grindNote` | 분쇄도 메모 | text | `전보다 한 칸 곱게` | optional |
| `prepObservations` | 추출 중/추출 후 이상한 점이 있었나요? | multi-select | `one_sided_flow` | optional, 아래 옵션 중 복수 선택 |

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

| Derived Field | Values |
| --- | --- |
| `channelingObserved` | `unknown`, `yes`, `no` |
| `puckCondition` | `unknown`, `clean`, `wet`, `soupy`, `cracked`, `uneven` |
| `prepIssue` | `unknown`, `none`, `suspected`, `confirmed` |
| `prepIssueTypes` | `distribution`, `tamping`, `puck_surface`, `flow` |

### Advanced Fields

고급 모드는 사용자가 켤 때만 노출한다.

| Field | Label | Type | Example | Validation |
| --- | --- | --- | --- | --- |
| `pressureBars` | 머신 압력 | number | `9` | optional, 0보다 큰 bar 단위 숫자 |
| `temperatureCelsius` | 추출 온도 | number | `93` | optional, 0보다 큰 섭씨 숫자 |
| `daysOffRoast` | 로스팅 후 경과일 | number | `10` | optional, 0 이상의 일수 |
| `waterNote` | 물 조성 메모 | text | `필터 물 사용` | optional |
| `equipmentNote` | 장비 메모 | text | `IMS 바스켓` | optional |
| `preinfusionNote` | 프리인퓨전 메모 | text | `5초` | optional |

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
| all number fields | 숫자, 소수점 1자리까지 허용 |

### Warning Validation

아래 조건은 제출을 막지 않는다. 대신 결과의 불확실성 또는 입력 경고로 표시한다.

| Field | Warning Rule | Warning Copy |
| --- | --- | --- |
| `doseGrams` | `< 5` or `> 30` | `도징량이 일반적인 에스프레소 범위를 벗어났을 수 있습니다.` |
| `yieldGrams` | `< 5` or `> 80` | `추출량이 일반적인 에스프레소 범위를 벗어났을 수 있습니다.` |
| `brewSeconds` | `< 10` or `> 60` | `추출 시간이 일반적인 진단 범위를 벗어났을 수 있습니다.` |
| `brewRatio` | `< 1.0` or `> 4.0` | `도징량 대비 추출량이 커서 추천의 불확실성이 높아집니다.` |

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

| Derived Field | Formula | Example |
| --- | --- | --- |
| `brewRatio` | `yieldGrams / doseGrams` | `36 / 18 = 2.0` |
| `brewTimeBand` | `<25 short`, `25-32 normal`, `>32 long` | `22 = short` |
| `brewRatioBand` | `<1.7 low`, `1.7-2.3 target`, `>2.3 high` | `2.0 = target` |
| `shotNumber` | 세션 내 기존 샷 수 + 1 | `3` |
| `hasPreviousShot` | 세션 내 직전 샷 존재 여부 | `true` |

## Input Defaults

- `prepObservations`: `[]`
- Derived basic observation values:
  - `channelingObserved`: `unknown`
  - `puckCondition`: `unknown`
  - `prepIssue`: `unknown`
  - `prepIssueTypes`: `[]`
- Advanced fields: empty

## Submission Behavior

1. 필수값 validation을 통과한다.
2. 맛 설명을 규칙 기반 맛 태그로 변환한다.
3. `brewRatio`, `brewTimeBand`, `brewRatioBand`를 계산한다.
4. 애매하거나 복합적인 문장은 LLM 보정 후보로 표시할 수 있다.
5. 추천 로직에는 구조화된 입력값, 맛 태그, 맛 패턴, 선택 관찰값, 직전 샷 변경값을 전달한다.
6. 추천 결과는 한 번에 하나의 변수만 우선 조정하도록 표시한다.

## Previous Shot Change Input

두 번째 샷부터는 사용자가 직전 샷 대비 무엇을 바꿨는지 선택할 수 있다. 이 입력은 선택값이지만, 입력되면 직전 샷 비교 추천에 사용한다.

| Field | Label | Type | Options |
| --- | --- | --- | --- |
| `changedVariable` | 직전 샷에서 무엇을 바꿨나요? | enum | `none`, `grind_size`, `dose`, `yield`, `brew_time`, `tamping_consistency`, `distribution`, `puck_prep`, `advanced_condition` |
| `changeDirection` | 어느 방향으로 바꿨나요? | enum | `finer`, `coarser`, `increase`, `decrease`, `improved`, `worse`, `changed`, `unknown` |
| `changeNote` | 변경 메모 | text | optional |

Default:
- 첫 샷: 변경 입력을 숨기고 `changesFromPrevious = []`
- 두 번째 샷 이후: 접힌 선택 영역으로 제공
- 사용자가 모르면 `none` 또는 `unknown`을 허용

## MVP Decisions

- 빠른 진단은 필수값 4개만으로 완료된다.
- 선택 관찰값은 추천 불확실성을 줄이는 용도다.
- 고급 입력은 기본 validation을 막지 않는다.
- 단위 입력은 자유 텍스트가 아니라 숫자 입력 + 고정 단위 표시로 처리한다.
- 현실 범위 밖 숫자는 차단하지 않고 경고로 처리한다.
- 직전 샷 비교는 사용자가 선택한 구조화된 변경 입력이 있을 때만 사용한다.
