# Taste Tag Suggestions From User Language

## Idea

사용자의 자연어 맛 표현에서 내부 맛 태그를 추천하고, 사용자가 수정할 수 있게 한다.

예:

| User Input | Suggested Tags |
| --- | --- |
| 좀 시고 물 같다 | `sour`, `watery`, `weak_body` |
| 끝맛이 쓰고 텁텁하다 | `bitter`, `dry`, `astringent` |
| 맛이 지저분하다 | `harsh`, `possible_channeling` |
| 고소한데 밍밍하다 | `nutty`, `watery`, `low_intensity` |

## Why It Matters

자연어 처리가 내부에서만 일어나면 사용자는 앱이 자신을 제대로 이해했는지 알기 어렵다. 태그 추천을 보여주면 사용자가 진단 입력을 빠르게 보정할 수 있고, 추천 결과에 대한 신뢰도도 높아진다.

## Possible Flow

1. 사용자가 맛 설명을 입력한다.
2. 앱이 추천 태그를 chip 형태로 보여준다.
3. 사용자는 잘못된 태그를 제거하거나 추가할 수 있다.
4. 최종 태그와 원문을 함께 저장한다.
5. 추천 로직은 최종 태그를 기준으로 동작한다.

## MVP Boundary

Allowed:
- 태그 추천과 수동 수정
- 원문과 태그를 함께 저장
- confidence가 낮은 태그는 시각적으로 구분

Not allowed:
- 태그 선택을 필수 복잡 단계로 만들기
- LLM 결과를 사용자 확인 없이 확정하기
- 긍정 태그만으로 추출 추천을 뒤집기

## Promotion Criteria

이 아이디어를 planning 문서로 승격하려면 아래가 필요하다.

- 한국어 표현과 `TasteTag` 매핑
- 태그 confidence 구조
- 추천 태그 수정 UX
- 자연어 원문과 확정 태그의 저장 방식
