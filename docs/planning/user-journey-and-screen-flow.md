# User Journey and Screen Flow

## Purpose

MVP의 기본 경험은 사용자가 원두별 다이얼링 세션에서 샷을 하나씩 기록하고, 다음 샷에서 바꿀 변수 1개를 추천받는 흐름이다. 첫 화면은 빠른 진단 중심이며, 고급 입력은 사용자가 필요할 때만 연다.

## Primary User Journey

1. 사용자는 앱을 열고 빠른 진단 시작 화면을 본다.
2. 새 원두 세션을 만들거나 기존 원두 세션을 선택한다.
3. 현재 샷의 맛 설명, 도징량, 추출량, 추출 시간을 입력한다.
4. 두 번째 샷 이후라면 직전 샷 대비 바꾼 변수를 선택할 수 있다.
5. 필요하면 분쇄도 메모, 채널링 관찰, 퍽 상태, 탬핑/레벨링 문제를 추가한다.
6. 앱은 맛 설명을 내부 맛 태그와 맛 패턴으로 변환한다.
7. 앱은 현재 샷과 직전 샷을 비교한다. 첫 샷이면 현재 입력만으로 진단한다.
8. 앱은 다음 샷에서 먼저 바꿀 변수 1개와 대안 우선순위를 보여준다.
9. 사용자는 추천을 참고해 다음 샷을 추출하고 같은 세션에 기록을 추가한다.

## Main Screen Flow

```text
Home / Quick Diagnosis
  -> Session Select or Create
  -> Quick Shot Input
  -> Optional Basic Observations
  -> Diagnosis Result
  -> Add Next Shot
  -> Quick Shot Input
```

## Screens

### 1. Home / Quick Diagnosis

첫 화면은 빠른 진단 진입을 중심으로 구성한다.

Primary actions:
- 빠른 진단 시작
- 기존 세션 이어가기

Shown information:
- 최근 원두 세션 목록
- 각 세션의 마지막 샷 번호
- 각 세션의 마지막 추천 변수

Not shown by default:
- 고급 모드 입력
- 장기 통계 대시보드
- 커뮤니티, 레시피 공유, 쇼핑 기능

### 2. Session Select or Create

사용자는 원두별 세션을 선택하거나 새로 만든다.

Required for MVP:
- 세션 이름

Optional for MVP:
- 원두 이름
- 로스터
- 로스팅 날짜
- 배전 범위
- 메모

Default behavior:
- 사용자가 세션 이름을 입력하지 않고 빠른 진단을 시작하면 앱이 `새 원두 세션 YYYY-MM-DD` 형식의 이름을 자동 생성한다.
- 자동 생성된 이름은 세션 상세 화면에서 나중에 수정할 수 있다.
- 원두 상세 정보는 나중에 입력할 수 있다.
- 배전 범위는 선택값이며, 모르면 `unknown`으로 둔다.

### 3. Quick Shot Input

빠른 진단 필수 입력:
- 맛 설명
- 도징량
- 추출량
- 추출 시간

Optional basic observations:
- 분쇄도 메모
- 채널링 관찰
- 퍽 상태
- 탬핑/레벨링 문제
- 직전 샷 대비 변경값

The screen should:
- 필수값 4개를 먼저 보이게 한다.
- 선택 관찰값은 접힌 영역 또는 보조 영역으로 둔다.
- 직전 샷 대비 변경값은 두 번째 샷부터 접힌 영역에 노출한다.
- 고급 모드는 별도 토글 뒤에만 노출한다.

### 4. Optional Advanced Input

고급 모드는 기본 흐름을 막지 않는다.

Advanced fields:
- 머신 압력
- 추출 온도
- 디개싱 기간
- 물 조성 메모
- 바스켓/샤워스크린/그라인더 버 메모
- 프리인퓨전 프로파일

Default behavior:
- 꺼진 상태로 시작한다.
- 고급 필드가 비어 있어도 진단을 진행한다.
- 추천 우선순위에서는 기본 변수보다 후순위 또는 조건부로 다룬다.

### 5. Diagnosis Result

결과 화면은 정답이 아니라 다음 실험을 제안한다.

Required sections:
- 다음 샷 조정안
- 진단 근거
- 대안 우선순위
- 불확실성 안내
- 현재 샷 요약
- 직전 샷 대비 변화
- 이번 추천에서 유지해야 할 값

Primary recommendation format:

```text
다음 샷에서는 [변수]를 먼저 조정해보세요.
한 번에 하나의 변수만 바꿔야 원인을 추적하기 쉽습니다.
이번에는 [유지할 값]은 그대로 두세요.
```

Uncertainty format:

```text
현재 입력만으로는 [원인 후보] 가능성이 있습니다. [관찰값]이 추가되면 추천 정확도가 올라갑니다.
```

### 6. Session Detail

세션 상세 화면은 같은 원두의 샷 기록을 비교하기 위한 화면이다.

Shown information:
- 세션 기본 정보
- 샷 목록
- 각 샷의 맛 태그
- 각 샷의 주요 추출값
- 각 샷의 추천 변수

Not in MVP:
- 장기 통계 대시보드
- 사용자 간 비교
- 레시피 공유

## Empty and Edge States

### No Session

```text
아직 기록한 원두 세션이 없습니다.
빠른 진단으로 첫 샷을 기록하세요.
```

### First Shot in Session

직전 샷이 없으므로 현재 입력만으로 진단한다.

Result behavior:
- `직전 샷 비교` 대신 `첫 샷 기준 진단`으로 표시한다.
- 추천은 맛 태그, 추출 시간, 추출 비율, 관찰값을 기준으로 만든다.
- `직전 샷 대비 변경값` 입력은 숨긴다.

### Second or Later Shot

두 번째 샷부터는 직전 샷 대비 바꾼 변수를 선택할 수 있다.

Result behavior:
- 변경값이 있으면 `직전 샷 대비 변화`에 반영한다.
- 변경값이 없거나 `unknown`이면 현재 샷 기준 추천만 계산한다.
- 자유 텍스트 메모는 결과 화면에 보여줄 수 있지만 추천 계산에는 사용하지 않는다.

### Missing Optional Observations

선택 관찰값이 비어 있으면 추천 결과의 불확실성에 반영한다.

Example:

```text
채널링 관찰이 없어 분쇄도 문제와 퍽 준비 문제를 완전히 구분하기는 어렵습니다.
```

## MVP Decisions

- 첫 화면은 빠른 진단 중심이다.
- 원두 세션은 MVP 핵심 흐름에 포함한다.
- 빠른 진단은 필수값 4개로 완료할 수 있다.
- 고급 입력은 선택이며 기본 흐름을 막지 않는다.
- 결과 화면은 다음 조정안, 근거, 대안 우선순위, 불확실성을 함께 보여준다.
