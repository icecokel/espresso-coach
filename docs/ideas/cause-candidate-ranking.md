# Cause Candidate Ranking

## Idea

진단 결과를 하나의 정답처럼 보여주지 않고, 가능성이 높은 원인 후보를 순서대로 보여준다.

예:

| Rank | Cause Candidate | Reason |
| --- | --- | --- |
| 1 | `yield_too_high` | 추출 비율이 높고 맛 설명에 묽음이 있음 |
| 2 | `grind_too_coarse` | 추출 시간이 짧고 산미가 강함 |
| 3 | `possible_channeling` | 시고 쓰다는 충돌 신호가 함께 있음 |

## Why It Matters

입문자는 추출 문제를 한 가지 원인으로 단정하기 쉽다. 하지만 에스프레소는 맛, 시간, 추출량, 배전 범위, 준비 상태가 함께 작동한다. 원인 후보 랭킹은 앱이 불확실성을 숨기지 않고, 다음 실험의 우선순위를 설명하게 해준다.

## Possible Flow

1. 사용자가 빠른 진단 값을 입력한다.
2. 앱이 맛 태그, 추출 비율, 시간 구간, 배전 범위, 채널링 관찰값을 함께 평가한다.
3. rule table이 가능한 원인 후보에 점수와 근거를 부여한다.
4. 상위 2-3개 후보를 표시하되, 실제 추천은 1개 변수만 선택한다.
5. 추천 카드에는 "왜 1순위 후보를 먼저 실험하는지"를 설명한다.

## Candidate Causes

| Cause | Typical Signals |
| --- | --- |
| `yield_too_low` | 진함, 답답함, 강한 산미, 짧은 비율 |
| `yield_too_high` | 묽음, 건조함, 쓴맛, 긴 비율 |
| `grind_too_coarse` | 짧은 시간, 빠른 흐름, 약한 바디, 산미 |
| `grind_too_fine` | 긴 시간, 막힘, 쓴맛, 텁텁함 |
| `dose_mismatch` | 목표 비율을 유지하기 어려움, 바스켓 여유 부족 |
| `prep_inconsistent` | 샷마다 결과가 크게 흔들림 |
| `possible_channeling` | 시고 쓰다, 흐름 불균일, 튐, 빠른 일부 구간 |
| `roast_context_mismatch` | 배전 기대값과 맛 판단이 충돌함 |

## MVP Boundary

MVP에서는 원인 후보를 너무 많이 보여주지 않는다.

Allowed:
- 상위 3개 후보까지 표시
- 각 후보에 짧은 근거 표시
- 실제 다음 행동은 1개만 추천

Not allowed:
- 모든 변수를 동시 조정하라고 안내
- 확신도가 낮은 후보를 정답처럼 표현
- 장비별 절대 분쇄도 값을 추천

## Promotion Criteria

이 아이디어를 planning 문서로 승격하려면 아래가 필요하다.

- 원인 후보 enum 정의
- 후보별 점수 계산 규칙
- 후보 간 우선순위 충돌 처리
- 추천 변수 선택 로직과의 연결 방식
