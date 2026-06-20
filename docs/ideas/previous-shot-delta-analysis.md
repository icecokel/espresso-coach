# Previous Shot Delta Analysis

## Idea

현재 샷을 절대값만으로 판단하지 않고, 이전 샷과 비교해 어떤 변수가 바뀌었고 맛이 어떻게 달라졌는지 분석한다.

예:

| Change | Taste Result | Interpretation |
| --- | --- | --- |
| yield +5g | 신맛 감소, 쓴맛 증가 | 다음에는 추출량을 일부 되돌릴 수 있음 |
| grind finer | 시간 증가, 바디 증가 | 방향은 맞지만 과하면 쓴맛 위험 |
| dose +1g | 흐름 느려짐, 맛 진해짐 | 바스켓 용량과 비율 재확인 필요 |

## Why It Matters

에스프레소 다이얼링에서 중요한 것은 현재 샷의 단독 평가보다 "무엇을 바꿨더니 어떻게 변했는지"다. 이 기능은 추천을 단발성 조언이 아니라 학습 가능한 실험 흐름으로 만든다.

## Possible Flow

1. 같은 세션의 이전 샷을 찾는다.
2. 도징량, 추출량, 비율, 시간, 추천 변수, 사용자가 바꾼 값을 비교한다.
3. 맛 태그 변화와 수치 변화를 함께 평가한다.
4. 결과에 "이전 실험 방향이 맞았는지"를 표시한다.
5. 다음 추천은 delta 결과를 반영한다.

## Delta Fields

| Field | Example |
| --- | --- |
| `doseDeltaGrams` | `+0.5` |
| `yieldDeltaGrams` | `-4` |
| `ratioDelta` | `-0.2` |
| `brewTimeDeltaSeconds` | `+5` |
| `changedVariables` | `["yield"]` |
| `tasteShift` | `sour_down_bitter_up` |
| `experimentInterpretation` | `directionally_good_but_overshot` |

## MVP Boundary

Allowed:
- 같은 세션의 직전 샷과 비교
- 추천 변수 외 변경이 많으면 해석 낮은 확신도 표시
- 수치 delta와 맛 delta를 별도 저장

Not allowed:
- 여러 세션을 섞어 비교
- 장기 통계/차트까지 MVP에 포함
- delta만으로 배전 특성을 단정

## Promotion Criteria

이 아이디어를 planning 문서로 승격하려면 아래가 필요하다.

- 이전 샷 선택 규칙
- 변수별 delta 계산 기준
- 맛 태그 변화 표현 방식
- 추천 로직에서 delta를 반영하는 우선순위
