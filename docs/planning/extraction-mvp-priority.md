# Extraction MVP Priority

## Purpose

MVP 추천 로직에서 어떤 변수를 primary recommendation 후보로 둘지 정리한다.

## Primary Recommendation Candidates

1. `channeling_check`
2. `distribution`
3. `tamping_consistency`
4. `puck_prep`
5. `grind_size`
6. `yield`
7. `dose`
8. `no_change`

Rules:
- 복합 맛, 예: 신맛+쓴맛이 있으면 준비 문제 후보를 우선한다.
- 채널링 관찰이 있으면 레시피 변수보다 준비 문제를 먼저 본다.
- 분배, 탬핑, 퍽 표면 관찰이 있으면 해당 준비 문제를 분쇄도 진단으로 접지 않는다.
- `no_change`는 `balanced` tag가 있고 부정 taste tag, prep issue, unknown-only pattern이 없을 때만 primary가 될 수 있다.
- 실제 실행은 한 번에 하나의 변수만 바꾸도록 안내한다.

## Primary Tie Break

동점이면 아래 순서를 적용한다.

1. 명시적 채널링 관찰: `channeling_check`
2. 명시적 prep 관찰: `distribution`, `tamping_consistency`, `puck_prep`
3. 복합 맛 충돌: `channeling_check`, `distribution`, `puck_prep`
4. 레시피 변수: `grind_size`, `yield`, `dose`
5. 만족스러운 샷: `no_change`

Rules:
- prep 관찰 override가 선택되면 `grind_size`, `dose`, `yield`는 유지 변수로 안내한다.
- `brewSeconds`, `brewTimeBand`, `brewRatioBand`는 primary action이 아니라 action 후보를 고르는 진단 신호다.
- `brew_time`은 `ShotChange`나 `RecommendationAction.variable`로 저장하지 않는다.

## Secondary or Uncertainty Candidates

1. `roastProfile`
2. `advanced_condition`
3. temperature context
4. preinfusion context
5. pressure context
6. days off roast context
7. water context

Rules:
- `brew_time`은 추천 후보가 아니라 진단 신호로만 쓴다.
- `roastProfile`은 상위 해석 컨텍스트이며 단독 추천 근거로 쓰지 않는다.
- 고급 변수는 기본 흐름에서 primary가 되지 않는다.
- 고급 변수는 `advanced_condition` 대안 또는 `uncertainty` 문구로만 표현한다.

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
