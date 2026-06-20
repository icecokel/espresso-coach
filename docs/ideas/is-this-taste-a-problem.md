# Is This Taste A Problem

## Idea

사용자의 맛 표현이 원두의 정상적인 특성인지, 추출 문제 신호인지 구분해준다.

예:

| User Expression | Context | Interpretation |
| --- | --- | --- |
| 레몬 같은 산미 | light range, normal time | 원두 특성 가능 |
| 식초 같은 신맛 | dark range, short time | 추출 부족 가능 |
| 재 같은 쓴맛 | dark range, long time | 과추출 또는 로스트 특성 가능 |
| 시고 끝이 쓰다 | any roast, unstable flow | 채널링 가능 |

## Why It Matters

입문자는 산미, 쓴맛, 바디, 로스티함을 문제로 봐야 하는지 원두 특성으로 봐야 하는지 헷갈린다. 이 기능은 사용자의 감각 언어를 진단 언어로 바꾸는 중간 설명층이다.

## Possible Flow

1. 맛 자연어 입력을 태그와 표현 강도로 변환한다.
2. 배전 범위, 추출 시간, 추출 비율과 함께 평가한다.
3. 맛 표현을 `likely_bean_character`, `likely_extraction_issue`, `ambiguous` 중 하나로 분류한다.
4. 추천 결과에서 문제인지 특성인지 짧게 설명한다.

## MVP Boundary

Allowed:
- 대표 맛 표현에 대한 판별
- 애매하면 `ambiguous`로 표시
- 추천 근거에 보조 설명으로 사용

Not allowed:
- 원두 품질 평가로 확대
- 사용자의 취향을 옳고 그름으로 판단
- 로스터의 테이스팅 노트를 절대 기준으로 사용

## Promotion Criteria

이 아이디어를 planning 문서로 승격하려면 아래가 필요하다.

- 맛 표현별 문제/특성 판별 표
- 배전 범위와 추출 지표의 결합 규칙
- 애매한 경우의 사용자 확인 질문
- 자연어 처리 아이디어와의 연결 방식
