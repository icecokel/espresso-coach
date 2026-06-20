# Stop Changing Guidance

## Idea

사용자가 계속 변수를 바꾸며 샷을 망치고 있을 때, 앱이 더 이상의 변수 변경보다 관찰 또는 준비 안정화를 권한다.

예:

- 같은 방향 조정이 3번 연속 실패
- 추천 변수 외 여러 변수를 계속 바꿈
- 시고 쓰다는 충돌 신호가 반복됨
- 채널링 의심이 반복되는데 분쇄도만 바꿈

## Why It Matters

에스프레소 입문자는 문제를 빨리 해결하려고 여러 변수를 계속 바꾼다. 하지만 어느 순간에는 더 조정하는 것보다 분배, 탬핑, 흐름 관찰을 확인하는 것이 낫다. 이 기능은 코치가 "멈추는 판단"도 하게 만든다.

## Possible Flow

1. 세션 내 최근 샷 3-5개를 확인한다.
2. 추천 변수 외 변경이 반복되는지 본다.
3. 맛 신호가 개선되지 않거나 충돌 신호가 반복되면 stop condition을 만든다.
4. 다음 추천 대신 "준비 과정 확인" 또는 "변수 고정 후 재시도"를 안내한다.

## Stop Conditions

| Condition | Suggested Message |
| --- | --- |
| repeated channeling signal | 분쇄도 조정보다 분배와 탬핑 안정화가 먼저입니다 |
| too many changed variables | 이번 결과는 해석하기 어렵습니다. 다음 샷은 변수 하나만 바꿔보세요 |
| no improvement after repeated same change | 같은 방향 조정은 잠시 멈추고 이전 기준점으로 돌아가세요 |
| conflicting taste signals repeated | 흐름 불균일 또는 준비 문제를 먼저 확인하세요 |

## MVP Boundary

Allowed:
- 최근 샷 기반 stop condition
- 다음 변수 변경 대신 준비 확인 추천
- "해석 어려움" 상태 표시

Not allowed:
- 사용자가 기록을 못 하게 막기
- 부정적이거나 훈계하는 문구
- 고급 장비가 있어야만 확인 가능한 안내

## Promotion Criteria

이 아이디어를 planning 문서로 승격하려면 아래가 필요하다.

- stop condition 정의
- 최근 샷 개수 기준
- 일반 추천과 stop guidance의 우선순위
- 사용자에게 부담 없는 문구 가이드
