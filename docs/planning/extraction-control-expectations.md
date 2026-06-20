# Extraction Control Expectations

## Purpose

변수 grade별로 조정 방향과 맛 기대값을 정의한다.

## G1 Primary Controls

### 추출량 / Beverage Ratio

| Change | Expected Taste | Risk |
| --- | --- | --- |
| 추출량 증가 | 산미 감소, 단맛/추출감 증가 가능 | 과하면 밍밍함, 쓴 끝맛, 건조감 |
| 추출량 감소 | 농도와 바디 증가, 짧고 진한 인상 | 과하면 신맛, 덜 풀린 맛, 답답함 |

Roast interpretation:
- Light: 추출량을 조금 늘리면 산미가 둥글어질 수 있다.
- Medium: 균형 조절의 중심 변수다.
- Dark: 추출량 증가가 쓴 끝맛과 건조감을 빠르게 키울 수 있다.

### 분쇄도

| Change | Expected Taste | Risk |
| --- | --- | --- |
| 더 곱게 | flow 감소, 추출 증가, 단맛/바디 증가 가능 | 과하면 쓴맛, 떫음, 채널링 |
| 더 굵게 | flow 증가, 추출 감소, 산미/가벼움 증가 가능 | 과하면 밍밍함, 날카로운 신맛 |

Roast interpretation:
- Light: 더 곱게 가야 단맛과 바디가 열릴 수 있다.
- Medium: 기본 dial-in의 핵심 변수다.
- Dark: 너무 곱게 가면 쓴맛과 텁텁함이 빠르게 증가한다.

### 도징량

| Change | Expected Taste | Risk |
| --- | --- | --- |
| 증가 | 농도, 바디, puck resistance 증가 | basket overfill, 느린 flow, 불균일 추출 |
| 감소 | flow 증가, 가벼운 맛, 더 쉬운 추출 가능 | 얇음, 낮은 바디, headspace 변화 |

Roast interpretation:
- Light: 무조건 늘리기보다 분쇄도/추출량과 함께 봐야 한다.
- Medium: basket 권장 범위 안에서 recipe anchor로 사용한다.
- Dark: 과한 도징은 묵직함과 쓴맛 부담을 키울 수 있다.

## G2 Prep Controls

### 분배 / 레벨링

| Signal | Expected Taste | Recommended Interpretation |
| --- | --- | --- |
| 한쪽으로 흐름 | 신맛+쓴맛, 거친 맛 | 분쇄도보다 준비 문제 우선 |
| 같은 레시피인데 맛이 흔들림 | 반복성 낮음 | 분배/탬핑/채널링 확인 |
| 육안 채널링 | sharp sour + bitter finish | channeling_check primary 가능 |

### 탬핑 수평 / 일관성

| Signal | Expected Taste | Recommended Interpretation |
| --- | --- | --- |
| 기울어진 탬핑 | 한쪽 과다/한쪽 과소 | 분배 문제와 함께 판단 |
| 매번 다른 탬핑 | shot time과 맛이 흔들림 | recipe 변수보다 반복성 개선 |
| 너무 약한 puck resistance | 빠른 flow, 신맛/밍밍함 | 분쇄도와 함께 보되 단정하지 않음 |

## G3 Advanced Controls

### 추출 온도

| Change | Expected Taste | Roast Bias |
| --- | --- | --- |
| 높임 | 추출 증가, 산미 둥글어짐, 쓴맛/떫음 증가 가능 | Light에 유리할 수 있음 |
| 낮춤 | 추출 감소, 쓴맛 완화, 산미 선명 | Dark에 유리할 수 있음 |

MVP treatment:
- 기본 모드 primary로 쓰지 않는다.
- 온도 조절 가능 장비를 사용자가 명시했을 때만 대안으로 표시한다.

### 프리인퓨전

| Change | Expected Taste | Risk |
| --- | --- | --- |
| 길게/강하게 | puck saturation 개선, channeling 완화 가능 | 과하면 흐름 둔화, 맛 흐림 |
| 짧게/없음 | 선명하고 빠른 추출 | puck 준비가 나쁘면 channeling 증가 |

### 압력 / Flow Profile

| Change | Expected Taste | Risk |
| --- | --- | --- |
| 압력 높음 | 빠른 추출, 강한 body 가능 | puck stress, channeling, 거친 맛 |
| 압력 낮음 | 부드러운 flow, channeling 완화 가능 | under-extraction, 낮은 body |

### 물 조성

| Change | Expected Taste | Risk |
| --- | --- | --- |
| 완충력/알칼리니티 높음 | 산미 둔화, 부드러움 | flat, dull |
| 완충력 낮음 | 산미 선명 | sharp, thin |
| 경도 높음 | body, extraction 증가 가능 | 텁텁함, scale risk |

## G4 Diagnostic Signals

### 추출 시간

| Band | Meaning | Taste Expectation |
| --- | --- | --- |
| `< 25s` | 빠른 흐름 | 신맛, 얇음, under-extraction 후보 |
| `25-32s` | 기본 판단 구간 | 다른 변수와 함께 판단 |
| `> 32s` | 느린 흐름 | 쓴맛, 무거움, over-extraction 후보 |

Time is not the first target:
- 시간은 직접 조정값이라기보다 분쇄도, dose, puck prep, pressure의 결과다.
- 목표 yield를 먼저 보고, 시간이 너무 벗어나면 원인 변수를 찾는다.

### Crema / Flow Appearance

| Signal | Possible Meaning | MVP Treatment |
| --- | --- | --- |
| spurting | channeling | 선택 관찰값으로 사용 |
| very fast blonding | 빠른 추출 또는 채널링 | 불확실성 표시 |
| excessive crema | 신선한 원두/가스 | degassing context |
| little crema | 오래된 원두/다크/장비 영향 | 단독 추천 근거로 쓰지 않음 |

## G0 Context Variables

### 디개싱 / 로스팅 후 경과일

| State | Expected Behavior | Taste Expectation |
| --- | --- | --- |
| 너무 신선함 | 가스 많음, 흐름 불안정 | sharp, foamy, uneven |
| 적정 안정화 | flow와 향 안정 | 판단 신뢰도 증가 |
| 오래됨 | 향 약화, crema 감소 | flat, hollow, stale |

MVP treatment:
- 고급 모드 또는 세션 선택값으로 둔다.
- 단독 primary 추천은 하지 않는다.

## G5 Deferred / Long Tail

| Variable | Expected Impact | MVP Treatment |
| --- | --- | --- |
| basket size/shape | dose range, flow, puck depth | 메모 또는 고급 데이터 |
| shower screen | water distribution | 메모 |
| grinder burr type | fines, clarity, body | 메모 |
| puck screen | flow, fines migration, cleanliness | 메모 |
| paper filter | clarity, flow, body reduction 가능 | 메모 |
| cup preheat | perceived acidity/aroma | MVP 추천 제외 |
| grinder retention | 이전 원두/분쇄도 영향 | MVP 추천 제외 |
| humidity | grind behavior 변화 | MVP 추천 제외 |

