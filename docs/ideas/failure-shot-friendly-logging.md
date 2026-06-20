# Failure Shot Friendly Logging

## Idea

맛없는 샷도 부담 없이 남길 수 있도록 "실패 기록"이 아니라 "실험 과정"으로 표현한다.

예:

- 실험 1
- 실험 2
- 개선됨
- 악화됨
- 애매함
- 중단하고 준비 과정 확인

## Why It Matters

사용자는 실패한 샷을 기록하기 싫어할 수 있다. 하지만 에스프레소 코칭에서는 실패한 샷이 다음 추천의 가장 중요한 데이터다. 실패를 부정적 평가가 아니라 다이얼링 과정의 데이터로 바꾸면 기록 지속성이 좋아진다.

## Possible Flow

1. 샷 저장 시 별점 입력을 요구하지 않는다.
2. 사용자는 이전 샷 대비 결과만 간단히 고른다.
3. 앱은 세션 타임라인을 "실험 흐름"으로 표시한다.
4. 실패 샷도 다음 추천 근거로 정상 사용한다.

## Status Labels

| Label | Meaning |
| --- | --- |
| `improved` | 이전 샷보다 좋아짐 |
| `worse` | 이전 샷보다 나빠짐 |
| `unclear` | 차이가 애매함 |
| `not_tasted` | 맛보지 않았거나 버림 |
| `prep_issue` | 추출보다 준비 문제가 먼저 의심됨 |

## MVP Boundary

Allowed:
- rating 없이 샷 저장
- 이전 샷 대비 상태 저장
- 실패/버림 샷도 타임라인에 표시

Not allowed:
- 별점 입력을 필수화
- 낮은 점수 샷을 숨기기
- 실패 원인을 사용자가 직접 길게 분류하게 만들기

## Promotion Criteria

이 아이디어를 planning 문서로 승격하려면 아래가 필요하다.

- 샷 결과 상태 enum
- rating과 result status의 분리
- 타임라인 표시 규칙
- `not_tasted` 샷을 추천 로직에 반영할지 여부
