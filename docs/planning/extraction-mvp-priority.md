# Extraction MVP Priority

## Purpose

MVP 추천 로직에서 어떤 변수를 primary recommendation 후보로 둘지 정리한다.

## Primary Recommendation Candidates

1. `channeling_check`
2. `distribution`
3. `puck_prep`
4. `grind_size`
5. `yield`
6. `dose`

Rules:
- 복합 맛, 예: 신맛+쓴맛이 있으면 준비 문제 후보를 우선한다.
- 채널링 관찰이 있으면 레시피 변수보다 준비 문제를 먼저 본다.
- 실제 실행은 한 번에 하나의 변수만 바꾸도록 안내한다.

## Secondary or Uncertainty Candidates

1. `roast_profile`
2. `temperature`
3. `preinfusion`
4. `pressure`
5. `days_off_roast`
6. `water`

Rules:
- `brew_time`은 추천 후보가 아니라 진단 신호로만 쓴다.
- `roast_profile`은 상위 해석 컨텍스트이며 단독 추천 근거로 쓰지 않는다.
- 고급 변수는 기본 흐름에서 primary가 되지 않는다.

## Deferred Variables

1. basket
2. shower screen
3. burr type
4. puck screen
5. paper filter
6. cup temperature
7. humidity

Rules:
- MVP primary 추천에서 제외한다.
- 필요하면 고급 모드 메모 또는 deferred data로 둔다.
