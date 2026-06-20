# Next Shot Experiment Card

## Idea

진단 결과를 긴 설명 대신 "다음 샷에서 할 실험" 카드 하나로 보여준다.

예:

| Field | Example |
| --- | --- |
| Change | 추출량을 42g에서 36g으로 줄이기 |
| Keep Fixed | 도징량 18g, 분쇄도, 탬핑 방식 |
| Target | 18g in / 36g out / 25-32s |
| Expected Change | 묽음과 건조감이 줄고 단맛이 선명해질 가능성 |
| Confidence | medium |

## Why It Matters

경쟁 앱의 불편점은 기록은 많지만 다음에 무엇을 해야 하는지 사용자가 직접 판단해야 한다는 점이다. 실험 카드는 에스프레소 코치의 핵심 경험인 "한 번에 하나의 변수만 바꾼다"를 화면 구조로 강제한다.

## Possible Flow

1. 사용자가 샷을 입력한다.
2. 앱이 추천 변수 1개를 선택한다.
3. 결과 화면 최상단에 다음 실험 카드를 보여준다.
4. 사용자는 다음 샷 입력 시 이 실험을 이어받을 수 있다.
5. 다음 샷이 저장되면 실험 결과를 `improved`, `worse`, `unclear` 등으로 연결한다.

## Card Sections

| Section | Purpose |
| --- | --- |
| `change` | 이번에 바꿀 단 하나의 변수 |
| `keepFixed` | 유지해야 할 변수 |
| `targetRange` | 다음 샷의 기대 범위 |
| `expectedTasteShift` | 맛 기대 변화 |
| `reason` | 왜 이 변수를 먼저 바꾸는지 |
| `uncertainty` | 확신이 낮은 이유 또는 확인할 관찰값 |

## MVP Boundary

Allowed:
- 카드 1개만 표시
- 상대 조정 중심의 문구 사용
- 유지할 변수 명시
- 기대 맛 변화를 짧게 표시

Not allowed:
- 여러 카드로 사용자를 선택 피로에 빠뜨리기
- 절대 정답처럼 표현하기
- 장비별 수치 보정까지 포함하기

## Promotion Criteria

이 아이디어를 planning 문서로 승격하려면 아래가 필요하다.

- `RecommendationOutput`에 실험 카드 필드 반영
- 추천 변수별 카드 문구 템플릿
- 다음 샷과 이전 실험 연결 데이터 구조
- 확신도 낮을 때의 fallback 문구
