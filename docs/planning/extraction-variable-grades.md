# Extraction Variable Grades

## Purpose

추출 변수를 “맛에 미치는 영향”과 “입문자가 바로 조정할 수 있는가”를 함께 보고 grade로 나눈다.

## Grade Definitions

| Grade | Role | MVP Treatment |
| --- | --- | --- |
| `G0 Context` | 맛 해석의 전제 조건 | 추천 결정 전에 먼저 읽는다. 단독 추천 변수로 쓰지 않는다. |
| `G1 Primary Control` | 맛을 가장 직접적으로 바꾸는 기본 조정 변수 | 빠른 진단 결과의 primary 후보가 될 수 있다. |
| `G2 Prep Control` | 레시피 이전에 균일성을 좌우하는 준비 변수 | 채널링/복합 맛이 있으면 G1보다 우선할 수 있다. |
| `G3 Advanced Control` | 장비나 지식이 있어야 조정 가능한 변수 | 기본 흐름에서는 조건부 대안 또는 불확실성에 반영한다. |
| `G4 Diagnostic Signal` | 직접 조정값이라기보다 결과를 읽는 지표 | 추천 근거, warning, 비교 판단에 사용한다. |
| `G5 Deferred / Long Tail` | MVP에서는 저장하거나 메모만 할 변수 | 추천 primary로 쓰지 않는다. |

## Variable Priority Map

| Priority | Variable | Grade | Directly Adjustable | Why It Matters |
| --- | --- | --- | --- | --- |
| 1 | 배전 범위 | `G0 Context` | no | 신맛/쓴맛의 기본 기대값을 바꾼다. |
| 2 | 추출량 / beverage ratio | `G1 Primary Control` | yes | 농도, 희석감, 끝맛, 추출 정도를 크게 바꾼다. |
| 3 | 분쇄도 | `G1 Primary Control` | yes | flow, contact time, extraction, channeling risk에 직접 영향. |
| 4 | 도징량 | `G1 Primary Control` | yes | 농도, puck depth, basket fit, 추출 안정성에 영향. |
| 5 | 분배/레벨링 | `G2 Prep Control` | yes | 불균일 추출, 신맛+쓴맛 동시 발생과 관련. |
| 6 | 탬핑 수평/일관성 | `G2 Prep Control` | yes | 반복성, puck resistance, channeling risk에 영향. |
| 7 | 채널링 관찰 | `G4 Diagnostic Signal` | no | 분쇄도 문제와 준비 문제를 구분하는 핵심 신호. |
| 8 | 추출 시간 | `G4 Diagnostic Signal` | indirect | 직접 목표라기보다 분쇄도/유량/저항의 결과값. |
| 9 | 추출 온도 | `G3 Advanced Control` | depends | 배전 범위별 산미/쓴맛 해석에 영향. |
| 10 | 프리인퓨전 / bloom | `G3 Advanced Control` | depends | puck saturation, channeling risk, flow 안정성에 영향. |
| 11 | 압력 / flow profile | `G3 Advanced Control` | depends | flow, puck stress, channeling risk에 영향. |
| 12 | 디개싱 / 로스팅 후 경과일 | `G0 Context` | no | 가스, crema, 흐름 안정성, 향 강도에 영향. |
| 13 | 물 조성 | `G3 Advanced Control` | depends | 산미 perception, body, extraction, scale risk에 영향. |
| 14 | 바스켓 크기/형상 | `G5 Deferred / Long Tail` | yes, but not frequent | dose range, flow, puck depth에 영향. |
| 15 | 그라인더 burr / 미분 특성 | `G5 Deferred / Long Tail` | no/rare | fines, clarity, body, channeling tendency에 영향. |
| 16 | puck screen / paper filter | `G5 Deferred / Long Tail` | yes | flow, cleanliness, body, fines migration에 영향 가능. |
| 17 | 컵 예열 / 음용 온도 | `G5 Deferred / Long Tail` | yes | 실제 체감 산미/쓴맛/향에 영향. |

