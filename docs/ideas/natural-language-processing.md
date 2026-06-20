# Natural Language Processing

## Idea

사용자가 `시다`, `쓰다`, `밍밍하다`, `처음엔 시고 끝은 쓰다`, `맛이 지저분하다`처럼 자연어로 적은 맛 표현을 내부 진단 데이터로 바꾼다.

## Why It Matters

입문자는 추출 변수를 전문적으로 말하기보다 감각 표현으로 말한다. 자연어 처리는 사용자의 언어와 추천 로직 사이를 연결하는 핵심 계층이다.

## Possible Flow

1. 사용자가 맛 설명을 입력한다.
2. 규칙 기반 키워드 매핑으로 1차 태그를 만든다.
3. 복합 표현이면 여러 `TasteTag`와 `TastePattern`으로 분리한다.
4. 애매한 표현은 LLM 보정 후보로 표시한다.
5. 최종 추천은 LLM이 아니라 rule table이 결정한다.

## Example Inputs

| User Input | Parsed Tags | Pattern |
| --- | --- | --- |
| `시다` | `sour` | none |
| `끝맛이 쓰다` | `bitter` with `finish` | none |
| `밍밍하고 비어 있다` | `watery`, `hollow` | possible `weak_and_sour` if sour also present |
| `처음엔 시고 끝은 쓰다` | `sour`, `bitter` | `conflicting_extraction_signals` |
| `맛이 지저분하다` | `harsh` or unknown | possible prep issue |

## MVP Boundary

MVP에서는 rule-based classifier를 먼저 정의한다.

LLM은 아래 경우에만 보정 후보로 둔다.
- 키워드가 없는 긴 문장
- 서로 반대되는 맛 태그가 함께 나온 문장
- `맛이 이상하다`, `별로다`처럼 명확한 태그가 없는 표현
- 채널링/준비 문제처럼 보이지만 관찰값이 부족한 표현

## Open Questions

- 자연어 입력에서 강도 표현을 3단계로만 둘지, confidence와 분리할지
- LLM 보정 결과를 사용자에게 보여줄지, 내부 데이터로만 쓸지
- 한국어 표현 사전을 먼저 만들지, 영어 표현도 MVP에 포함할지
- `고소하다`, `달다`, `산뜻하다` 같은 긍정 표현을 추천 로직에 어느 정도 반영할지

## Promotion Criteria

이 아이디어를 planning 문서로 승격하려면 아래가 필요하다.

- 한국어 맛 표현 사전 초안
- `TasteTag`와 `TastePattern` 매핑 표
- ambiguous input 처리 규칙
- LLM 보정이 없는 fallback 동작

