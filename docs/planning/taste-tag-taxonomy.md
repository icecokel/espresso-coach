# Taste Tag Taxonomy

## Purpose

맛 자연어 태그 체계는 사용자의 자유로운 맛 설명을 추천 로직이 사용할 수 있는 구조화된 신호로 바꾸기 위한 내부 분류다. MVP는 규칙 기반 매핑을 우선 사용하고, 애매하거나 복합적인 문장만 LLM 보정 후보로 둔다.

## Tag Shape

```ts
interface TasteTag {
  id: TasteTagId;
  label: string;
  polarity: "under_extraction" | "over_extraction" | "weak_extraction" | "prep_issue" | "balanced" | "unknown";
  intensity: 1 | 2 | 3;
  position?: "start" | "middle" | "finish" | "overall";
  confidence: "low" | "medium" | "high";
  sourceText: string;
}

interface TastePattern {
  id:
    | "conflicting_extraction_signals"
    | "weak_and_sour"
    | "balanced_with_negative_signal"
    | "unknown_description";
  sourceTagIds: TasteTagId[];
  confidence: "low" | "medium" | "high";
}
```

## Intensity Scale

| Value | Meaning | Example |
| --- | --- | --- |
| `1` | 약함 | `살짝 시다` |
| `2` | 보통 | `시다` |
| `3` | 강함 | `너무 시다`, `엄청 쓰다` |

## Core Taste Tags

| Tag ID | Label | Polarity | Example Expressions |
| --- | --- | --- | --- |
| `sour` | 신맛 | `under_extraction` | `시다`, `신맛`, `레몬 같다`, `날카롭다` |
| `bitter` | 쓴맛 | `over_extraction` | `쓰다`, `탄맛`, `약맛`, `끝맛이 쓰다` |
| `watery` | 밍밍함 | `weak_extraction` | `밍밍하다`, `연하다`, `물 같다`, `바디가 없다` |
| `astringent` | 떫고 텁텁함 | `over_extraction` | `텁텁하다`, `떫다`, `입이 마른다` |
| `harsh` | 거친 맛 | `prep_issue` | `거칠다`, `날뛴다`, `맛이 지저분하다` |
| `hollow` | 빈 느낌 | `weak_extraction` | `비어 있다`, `향은 있는데 맛이 없다` |
| `balanced` | 균형 잡힘 | `balanced` | `괜찮다`, `밸런스 좋다`, `맛있다` |

`mixed`는 저장 태그로 사용하지 않는다. 복합 표현은 여러 `TasteTag`와 파생 `TastePattern`으로 표현한다.

## Keyword Mapping Rules

| Keyword Pattern | Tag | Intensity Hint | Position Hint |
| --- | --- | --- | --- |
| `살짝`, `조금` + taste word | matched tag | `1` | `overall` |
| taste word only | matched tag | `2` | `overall` |
| `너무`, `엄청`, `강하게` + taste word | matched tag | `3` | `overall` |
| `처음`, `초반` + taste word | matched tag | inferred | `start` |
| `끝`, `후반`, `끝맛` + taste word | matched tag | inferred | `finish` |

## Compound Expression Handling

복합 표현은 하나의 태그로 뭉개지 않고 여러 태그로 저장한다.

Example:

```text
처음엔 시고 끝은 쓰다
```

Output:

```json
{
  "tasteTags": [
    {
      "id": "sour",
      "label": "신맛",
      "polarity": "under_extraction",
      "intensity": 2,
      "position": "start",
      "confidence": "high",
      "sourceText": "처음엔 시고"
    },
    {
      "id": "bitter",
      "label": "쓴맛",
      "polarity": "over_extraction",
      "intensity": 2,
      "position": "finish",
      "confidence": "high",
      "sourceText": "끝은 쓰다"
    }
  ],
  "tastePatterns": [
    {
      "id": "conflicting_extraction_signals",
      "sourceTagIds": ["sour", "bitter"],
      "confidence": "high"
    }
  ]
}
```

## Taste Patterns

| Pattern ID | Condition | Recommendation Meaning |
| --- | --- | --- |
| `conflicting_extraction_signals` | `sour` and `bitter` both present | 균일 추출 문제, 채널링, 분배 문제 가능성을 올린다. |
| `weak_and_sour` | `watery` or `hollow` with `sour` | 과소추출 또는 추출량 과다 가능성을 함께 본다. |
| `balanced_with_negative_signal` | `balanced` plus any negative tag | 균형 태그를 primary 판단에서 제외하고 부정 태그를 우선한다. |
| `unknown_description` | no mapped taste tag | 추천보다 추가 입력 요청과 불확실성 표시를 우선한다. |

## LLM Correction Candidates

아래 경우는 규칙 기반 태깅 후 LLM 보정 후보로 표시한다.

- 서로 반대되는 polarity가 함께 나온다.
- 키워드가 없지만 맛 묘사가 길다.
- `맛이 이상하다`, `별로다`처럼 내부 태그로 매핑하기 어렵다.
- 채널링 또는 준비 문제처럼 보이는 감각 표현이 있으나 관찰값이 없다.

LLM 보정이 없어도 MVP는 동작해야 한다. 이 경우 `unknown_description` pattern과 불확실성 문구를 사용한다.

## MVP Decisions

- 강도는 MVP에서 3단계로 둔다.
- 복합 표현은 여러 태그 배열과 파생 pattern으로 저장한다.
- 최종 추천 결정은 LLM이 아니라 고정 추천 로직이 담당한다.
- LLM은 태그 보정과 설명 보조에만 사용한다.
