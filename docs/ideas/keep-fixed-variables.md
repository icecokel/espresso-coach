# Keep Fixed Variables

## Idea

추천 결과에서 "이번 샷에서 바꾸지 말아야 할 변수"를 명시한다.

예:

- 바꿀 것: 분쇄도를 한 단계 더 곱게
- 유지할 것: 도징량 18g, 추출량 36g, 탬핑 방식
- 관찰할 것: 시간 증가, 산미 감소, 바디 증가

## Why It Matters

입문자는 한 번에 여러 변수를 바꾸기 쉽다. 그러면 어떤 변화가 맛을 바꿨는지 알 수 없다. 유지 변수 표시는 앱이 단순한 조언을 넘어 controlled experiment를 돕는 핵심 장치다.

## Possible Flow

1. 추천 로직이 다음에 바꿀 변수 1개를 선택한다.
2. 나머지 주요 변수는 `keepFixed` 목록에 들어간다.
3. 사용자가 다음 샷을 입력할 때 변경된 값이 많으면 앱이 "이번 실험 결과를 해석하기 어렵다"고 표시한다.
4. 변경이 추천 변수와 일치하면 실험 결과 비교에 사용한다.

## Fixed Variable Candidates

| Recommended Change | Keep Fixed |
| --- | --- |
| `grind_size` | dose, yield, puck prep, tamping |
| `yield` | dose, grind, puck prep, tamping |
| `dose` | grind, target ratio, puck prep |
| `distribution` | dose, yield, grind |
| `puck_prep` | dose, yield, grind |

## MVP Boundary

Allowed:
- 결과 카드에 유지 변수 표시
- 다음 샷 비교 시 추천 외 변경값 감지
- "해석 어려움" 상태 저장

Not allowed:
- 사용자가 다른 변수를 바꾸는 것을 막기
- 모든 변수 고정 여부를 강제 입력하게 만들기
- 고급 변수까지 기본 화면에 모두 노출하기

## Promotion Criteria

이 아이디어를 planning 문서로 승격하려면 아래가 필요하다.

- `keepFixed` 데이터 구조
- 추천 변수별 유지 변수 매핑
- 다음 샷에서 변경 감지 기준
- 실험 결과 해석 불가 상태 정의
