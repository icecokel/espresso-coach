# Beginner Advanced Mode Split

## Idea

입문자용 기본 모드와 고급 모드를 분리한다.

기본 모드는 빠른 진단에 필요한 핵심 입력만 보여준다. 고급 모드는 온도, 프리인퓨전, 압력, 물, 바스켓, 분배 방식 같은 세부 변수를 접힘 영역 또는 별도 모드로 제공한다.

## Why It Matters

경쟁 앱은 강력한 변수를 많이 제공하지만, 초보자에게는 입력 부담과 판단 피로가 된다. 에스프레소 코치는 초보자가 지금 당장 다음 샷을 개선하는 경험을 기본값으로 둬야 한다.

## Mode Comparison

| Mode | Fields |
| --- | --- |
| Beginner | taste description, dose, yield, brew time, roast range optional |
| Advanced | temperature, preinfusion, pressure/flow, water, basket, puck screen, paper filter, detailed prep notes |

## Possible Flow

1. 앱 기본값은 beginner mode다.
2. 고급 항목은 "추가 변수" 영역에 접어둔다.
3. 사용자가 고급 모드를 켜면 세션 단위로 기억한다.
4. 추천 로직은 고급 입력이 없으면 기본 변수만으로 동작한다.

## MVP Boundary

Allowed:
- 기본 모드 우선
- 고급 필드는 선택 입력
- 추천 결과에서 고급 변수를 기본 추천으로 남발하지 않기

Not allowed:
- 첫 진단에서 고급 변수 입력 요구
- 고급 모드가 없으면 진단 불가능하게 만들기
- 모든 고급 변수를 MVP 화면에 한 번에 노출

## Promotion Criteria

이 아이디어를 planning 문서로 승격하려면 아래가 필요하다.

- 기본/고급 필드 분류
- 고급 모드 상태 저장 위치
- 고급 변수가 추천 우선순위에 들어오는 조건
- 화면에서 접힘 영역과 필수 입력의 구분
