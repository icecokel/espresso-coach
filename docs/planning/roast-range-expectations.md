# Roast Range Expectations

## Purpose

배전 범위별 기본 맛 기대값과 해석 bias를 정의한다.

## Roast Range First

| Roast Range | Baseline Taste | Interpretation Bias |
| --- | --- | --- |
| `unknown` | 모름 | 배전 보정 없이 기본 추출값과 맛 태그 중심으로 판단 |
| `light_range` | 산미, 향, 선명함 | 신맛을 바로 과소추출로 단정하지 않음 |
| `medium_light_range` | 산미, 단맛, 향 | 산미와 단맛의 균형을 기대하되 날카로운 신맛은 과소추출 후보 |
| `medium_range` | 균형, 단맛, 바디 | 기본 추천 기준의 중심값 |
| `medium_dark_range` | 바디, 고소함, 쓴맛 | 쓴맛을 바로 과다추출로 단정하지 않음 |
| `dark_range` | 쓴맛, 로스티, 묵직함 | 로스티/쓴맛은 원두 특성일 수 있으나 떫음과 텁텁함은 과다추출 후보 |

## Cross-Roast Interpretation

| Taste Signal | Light / Medium Light | Medium | Medium Dark / Dark |
| --- | --- | --- | --- |
| 신맛 | 원두 특성 가능성 + 과소추출 여부 확인 | 과소추출 후보 | 채널링 또는 추출 부족 후보 |
| 쓴맛 | 과다추출 후보 | 과다추출 후보 | 원두 특성 가능성 + 과다추출 여부 확인 |
| 밍밍함 | 추출 부족 또는 추출량 과다 | 추출량 과다 또는 농도 부족 | 굵은 분쇄, 낮은 도징, 과한 희석 후보 |
| 텁텁함/떫음 | 과다추출 또는 미분/채널링 | 과다추출 후보 | 과다추출 후보 강함 |
| 신맛+쓴맛 동시 | 채널링/분배 문제 우선 | 채널링/분배 문제 우선 | 채널링/분배 문제 우선 |

## Decisions

- 배전은 직접 바꾸는 추출 변수라기보다 맛 해석의 기준선이다.
- 배전 범위만으로 추천을 결정하지 않는다.
- 배전 범위와 확신도는 추천 근거와 불확실성 문구에 반영한다.

