# Taste Tag Taxonomy

## Purpose

맛 자연어 태그 체계는 사용자의 자유로운 맛 설명을 추천 로직이 사용할 수 있는 구조화된 신호로 바꾸기 위한 내부 분류다.

MVP는 **규칙 기반 파서가 단독으로 동작**해야 한다. LLM은 선택적 보정 후보일 뿐이며, 태그 생성 실패나 LLM 미사용이 추천 생성을 막아서는 안 된다.

## Scope

MVP에서 저장하는 맛 태그는 아래 7개로 고정한다.

- `sour`
- `bitter`
- `watery`
- `astringent`
- `harsh`
- `hollow`
- `balanced`

`mixed`, `dry`, `weak_body`, `possible_channeling`, `nutty` 등은 MVP 저장 태그로 사용하지 않는다. 복합 표현은 여러 `TasteTag`와 파생 `TastePattern`으로 표현한다.

## Tag Shape

```ts
type TasteTagId =
  | "sour"
  | "bitter"
  | "watery"
  | "astringent"
  | "harsh"
  | "hollow"
  | "balanced";

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

## Parser Contract

규칙 기반 파서는 아래 순서로 동작한다.

1. 원문을 trim하고 연속 공백을 하나로 줄인다.
2. 문장부호와 연결 표현으로 clause를 나눈다.
   - 분리 기준: `,`, `.`, `/`, `;`, `그리고`, `근데`, `그런데`, `하지만`
   - `-고`, `-하고`, `-면서`, `-인데`, `-은데`, `-는데`는 맛 표현 뒤에 붙은 연결 어미로 처리할 수 있다.
   - 단, 사전 phrase 안에 포함된 글자는 그대로 둔다.
3. 각 clause에서 position hint를 찾는다.
4. 각 clause에서 intensity hint를 찾는다.
5. 각 clause에서 맛 표현 사전을 긴 phrase 우선으로 매칭한다.
   - 구현 시 canonical form과 흔한 활용형을 같은 표현으로 본다.
   - 예: `시다`, `시고`, `신데`, `셔요` -> `sour`; `쓰다`, `쓰고`, `쓴데`, `써요` -> `bitter`; `밍밍하다`, `밍밍하고`, `밍밍한데` -> `watery`.
6. 부정 표현이 바로 앞에 있으면 해당 tag를 만들지 않는다.
   - 예: `안 쓰다`, `쓰지 않다`, `신맛은 없다`, `밍밍하지 않다`
7. 같은 clause에서 여러 tag가 매칭되면 모두 생성한다.
8. 같은 `id`와 같은 `position`의 tag가 반복되면 하나로 합치고, `intensity`는 가장 큰 값을 사용한다.
9. tag 목록을 만든 뒤 TastePattern 규칙을 적용한다.
10. tag가 0개이면 `unknown_description` pattern을 만든다.

Unknown description은 추천을 중단하지 않는다. 추천 로직은 `TastePattern.id = "unknown_description"`을 불확실성 신호로 사용하고, 추출량/시간/관찰값 등 다른 입력으로 최소 추천을 계속 생성한다.

## Intensity Mapping

기본 intensity는 `2`다. 같은 clause에 약한 표현과 강한 표현이 함께 있으면 강한 표현을 우선한다.

| Intensity | Meaning | Korean Hints | Examples |
| --- | --- | --- | --- |
| `1` | 약함 | `살짝`, `조금`, `좀`, `약간`, `은은하게`, `미세하게`, `덜`, `가볍게` | `살짝 시다`, `좀 시다`, `약간 밍밍하다`, `끝에 조금 떫다` |
| `2` | 보통 | intensity hint 없음 | `시다`, `쓰다`, `텁텁하다`, `비어 있다` |
| `3` | 강함 | `너무`, `엄청`, `많이`, `강하게`, `확`, `심하게`, `과하게`, `찌르는`, `거슬릴 정도로` | `너무 시다`, `엄청 쓰다`, `찌르는 신맛`, `심하게 텁텁하다` |

Intensity는 맛 문제의 심각도 신호이지 추천 action의 증감량을 직접 결정하지 않는다. MVP 추천은 여전히 한 번에 하나의 작은 조정만 권장한다.

## Position Mapping

기본 position은 `overall`이다. 한 clause 안에 여러 position hint가 있으면 가장 가까운 taste word에 붙인다.

| Position | Korean Hints | Examples |
| --- | --- | --- |
| `start` | `처음`, `초반`, `첫맛`, `입에 넣자마자`, `처음엔`, `앞쪽` | `처음엔 시다`, `첫맛이 날카롭다` |
| `middle` | `중간`, `중반`, `마시는 중간`, `가운데`, `중간맛` | `중간이 비어 있다`, `마시는 중간에 밍밍하다` |
| `finish` | `끝`, `끝맛`, `후반`, `마지막`, `뒤에`, `뒷맛`, `여운` | `끝맛이 쓰다`, `뒤에 텁텁하다` |
| `overall` | position hint 없음, `전체적으로`, `전반적으로`, `대체로`, `계속` | `전체적으로 밍밍하다`, `대체로 괜찮다` |

## Korean Expression Dictionary

### `sour`

| Field | Value |
| --- | --- |
| Label | 신맛 |
| Polarity | `under_extraction` |
| Direct expressions | `시다`, `신맛`, `산미가 강하다`, `새콤하다`, `레몬 같다`, `식초 같다`, `날카로운 산미`, `찌르는 신맛`, `혀를 찌른다` |
| Example sentences | `처음엔 시다`, `신맛이 너무 강하다`, `레몬처럼 새콤하다`, `첫맛이 날카롭다` |
| Ambiguous expressions | `산미가 있다`, `상큼하다`, `밝다`, `과일 같다`, `톡 쏜다` |
| Ambiguous rule | 단독이면 `sour` + `confidence: "medium"`으로 둔다. `맛있다`, `좋다`, `괜찮다`와 함께 있으면 `balanced`도 함께 만든다. |

### `bitter`

| Field | Value |
| --- | --- |
| Label | 쓴맛 |
| Polarity | `over_extraction` |
| Direct expressions | `쓰다`, `쓴맛`, `쓴 기운`, `탄맛`, `탄 것 같다`, `약맛`, `한약 같다`, `재맛`, `잿맛`, `까맣게 탄 맛` |
| Example sentences | `끝맛이 쓰다`, `너무 쓰다`, `탄맛이 난다`, `약맛처럼 남는다` |
| Ambiguous expressions | `다크하다`, `진하다`, `묵직하다`, `로스티하다`, `스모키하다` |
| Ambiguous rule | 단독이면 `bitter` + `confidence: "medium"`으로 둔다. `좋다`, `고소하다`, `초콜릿 같다`와 함께 있으면 `confidence: "low"`로 낮춘다. |

### `watery`

| Field | Value |
| --- | --- |
| Label | 밍밍함 |
| Polarity | `weak_extraction` |
| Direct expressions | `밍밍하다`, `연하다`, `물 같다`, `물 탄 것 같다`, `묽다`, `싱겁다`, `힘이 없다`, `바디가 없다`, `진하지 않다` |
| Example sentences | `전체적으로 밍밍하다`, `물 탄 것 같다`, `중간부터 연하다`, `바디가 없다` |
| Ambiguous expressions | `가볍다`, `깔끔하다`, `부드럽다`, `약하다` |
| Ambiguous rule | 단독이면 `watery` + `confidence: "medium"`으로 둔다. `좋다`, `괜찮다`, `마시기 편하다`와 함께 있으면 `confidence: "low"`로 낮춘다. |

### `astringent`

| Field | Value |
| --- | --- |
| Label | 떫고 텁텁함 |
| Polarity | `over_extraction` |
| Direct expressions | `떫다`, `텁텁하다`, `입이 마른다`, `입안이 마른다`, `마르는 느낌`, `드라이하다`, `까끌하다`, `입에 남는다`, `혀가 마른다` |
| Example sentences | `끝에 텁텁하다`, `마시고 나면 입이 마른다`, `뒷맛이 떫다`, `혀가 까끌하다` |
| Ambiguous expressions | `무겁다`, `답답하다`, `깔끔하지 않다`, `잔맛이 남는다` |
| Ambiguous rule | 단독이면 `astringent` + `confidence: "medium"`으로 둔다. `끝`, `뒷맛`, `입안` position hint와 함께 있으면 `confidence: "high"`로 둔다. |

### `harsh`

| Field | Value |
| --- | --- |
| Label | 거친 맛 |
| Polarity | `prep_issue` |
| Direct expressions | `거칠다`, `날뛴다`, `튀는 맛`, `맛이 지저분하다`, `정리가 안 된다`, `균일하지 않다`, `날카롭고 거칠다`, `잡맛`, `불쾌하다`, `자극적이다` |
| Example sentences | `맛이 지저분하다`, `전체적으로 거칠다`, `맛이 튄다`, `정리가 안 된 느낌이다` |
| Ambiguous expressions | `이상하다`, `별로다`, `복잡하다`, `산만하다`, `튀다` |
| Ambiguous rule | `지저분`, `거칠`, `잡맛`, `정리가 안`이 있으면 `harsh` + `confidence: "high"`다. `이상하다`, `별로다`만 있으면 tag를 만들지 않고 `unknown_description`으로 둔다. |

### `hollow`

| Field | Value |
| --- | --- |
| Label | 빈 느낌 |
| Polarity | `weak_extraction` |
| Direct expressions | `비어 있다`, `속이 비었다`, `빈 느낌`, `중간이 없다`, `맛이 비었다`, `향은 있는데 맛이 없다`, `앞뒤만 있고 가운데가 없다`, `깊이가 없다` |
| Example sentences | `중간이 비어 있다`, `향은 좋은데 맛이 없다`, `맛이 비어 있다`, `깊이가 없다` |
| Ambiguous expressions | `허전하다`, `짧다`, `여운이 없다`, `단조롭다`, `심심하다` |
| Ambiguous rule | 단독이면 `hollow` + `confidence: "medium"`으로 둔다. `중간`, `가운데`, `향은 있는데`와 함께 있으면 `confidence: "high"`로 둔다. |

### `balanced`

| Field | Value |
| --- | --- |
| Label | 균형 잡힘 |
| Polarity | `balanced` |
| Direct expressions | `괜찮다`, `좋다`, `맛있다`, `밸런스 좋다`, `균형 있다`, `마시기 좋다`, `무난하다`, `조화롭다`, `문제 없다`, `이 정도면 좋다` |
| Example sentences | `전체적으로 괜찮다`, `밸런스가 좋다`, `마시기 좋다`, `이 정도면 맛있다` |
| Ambiguous expressions | `나쁘지 않다`, `괜찮은데`, `좋은데`, `먹을 만하다` |
| Ambiguous rule | 부정 tag와 함께 있으면 `balanced_with_negative_signal` pattern을 만들고, 추천 판단은 부정 tag를 우선한다. 단독이면 만족 신호로 사용한다. |

## Composite Expression Rules

복합 표현은 하나의 tag로 뭉개지 않는다.

| Input Pattern | Output |
| --- | --- |
| `시고 쓰다` | `sour`, `bitter`, `conflicting_extraction_signals` |
| `처음엔 시고 끝은 쓰다` | `sour(position: start)`, `bitter(position: finish)`, `conflicting_extraction_signals` |
| `시고 물 같다` | `sour`, `watery`, `weak_and_sour` |
| `신데 비어 있다` | `sour`, `hollow`, `weak_and_sour` |
| `괜찮은데 끝맛이 쓰다` | `balanced`, `bitter(position: finish)`, `balanced_with_negative_signal` |
| `맛있는데 살짝 텁텁하다` | `balanced`, `astringent(intensity: 1)`, `balanced_with_negative_signal` |
| `맛이 이상하다` | no `TasteTag`, `unknown_description` |

## Taste Patterns

Pattern은 tag 생성이 끝난 뒤 deterministic rule로 만든다.

| Pattern ID | Condition | `sourceTagIds` | Confidence | Recommendation Meaning |
| --- | --- | --- | --- | --- |
| `conflicting_extraction_signals` | `sour` and `bitter` both present, or `sour` with `astringent` present | conflicting tag IDs | `high` when both direct, otherwise `medium` | 균일 추출 문제, 채널링, 분배 문제 가능성을 올린다. |
| `weak_and_sour` | `sour` plus `watery` or `hollow` | `["sour", "watery"]`, `["sour", "hollow"]`, or all three | `high` when `sour` and weak tag are direct, otherwise `medium` | 과소추출 또는 추출량 과다 가능성을 함께 본다. |
| `balanced_with_negative_signal` | `balanced` plus any of `sour`, `bitter`, `watery`, `astringent`, `harsh`, `hollow` | `balanced` and negative tag IDs | `high` | 균형 태그를 primary 판단에서 제외하고 부정 태그를 우선한다. |
| `unknown_description` | no mapped taste tag | `[]` | `low` | 추천을 막지 않고 불확실성을 높이며 추가 입력을 유도한다. |

Pattern은 여러 개가 동시에 나올 수 있다. 예를 들어 `괜찮은데 처음엔 시고 끝은 쓰다`는 `conflicting_extraction_signals`와 `balanced_with_negative_signal`을 모두 만든다.

## Example Outputs

### Example 1: Conflicting extraction signals

Input:

```text
처음엔 시고 끝맛은 너무 쓰다
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
      "intensity": 3,
      "position": "finish",
      "confidence": "high",
      "sourceText": "끝맛은 너무 쓰다"
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

### Example 2: Weak and sour

Input:

```text
좀 시고 물 탄 것처럼 밍밍하다
```

Output:

```json
{
  "tasteTags": [
    {
      "id": "sour",
      "label": "신맛",
      "polarity": "under_extraction",
      "intensity": 1,
      "position": "overall",
      "confidence": "high",
      "sourceText": "좀 시고"
    },
    {
      "id": "watery",
      "label": "밍밍함",
      "polarity": "weak_extraction",
      "intensity": 2,
      "position": "overall",
      "confidence": "high",
      "sourceText": "물 탄 것처럼 밍밍하다"
    }
  ],
  "tastePatterns": [
    {
      "id": "weak_and_sour",
      "sourceTagIds": ["sour", "watery"],
      "confidence": "high"
    }
  ]
}
```

### Example 3: Balanced with negative signal

Input:

```text
전체적으로 괜찮은데 뒤에 살짝 텁텁하다
```

Output:

```json
{
  "tasteTags": [
    {
      "id": "balanced",
      "label": "균형 잡힘",
      "polarity": "balanced",
      "intensity": 2,
      "position": "overall",
      "confidence": "medium",
      "sourceText": "전체적으로 괜찮은데"
    },
    {
      "id": "astringent",
      "label": "떫고 텁텁함",
      "polarity": "over_extraction",
      "intensity": 1,
      "position": "finish",
      "confidence": "high",
      "sourceText": "뒤에 살짝 텁텁하다"
    }
  ],
  "tastePatterns": [
    {
      "id": "balanced_with_negative_signal",
      "sourceTagIds": ["balanced", "astringent"],
      "confidence": "high"
    }
  ]
}
```

### Example 4: Multiple patterns

Input:

```text
맛은 괜찮은데 처음엔 시고 끝은 쓰다
```

Output:

```json
{
  "tasteTags": [
    {
      "id": "balanced",
      "label": "균형 잡힘",
      "polarity": "balanced",
      "intensity": 2,
      "position": "overall",
      "confidence": "medium",
      "sourceText": "맛은 괜찮은데"
    },
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
    },
    {
      "id": "balanced_with_negative_signal",
      "sourceTagIds": ["balanced", "sour", "bitter"],
      "confidence": "high"
    }
  ]
}
```

### Example 5: Unknown description

Input:

```text
맛이 뭔가 이상하다
```

Output:

```json
{
  "tasteTags": [],
  "tastePatterns": [
    {
      "id": "unknown_description",
      "sourceTagIds": [],
      "confidence": "low"
    }
  ]
}
```

This output still allows recommendation. The recommendation result should include uncertainty copy, but it can continue from extraction values, roast profile, and observations.

## LLM Correction Candidates

LLM은 필수가 아니다. 아래 경우만 규칙 기반 결과를 만든 뒤 선택적으로 보정 후보로 보낸다.

- 서로 반대되는 polarity가 함께 나온다.
- 키워드가 없지만 맛 묘사가 길다.
- `맛이 이상하다`, `별로다`처럼 내부 tag로 매핑하기 어렵다.
- 채널링 또는 준비 문제처럼 보이는 감각 표현이 있으나 관찰값이 없다.
- ambiguous expression만으로 tag가 만들어져 confidence가 낮다.

LLM 보정이 없어도 저장되는 값은 규칙 기반 `TasteTag[]`와 `TastePattern[]`이다. LLM은 태그 보정과 설명 보조에만 사용할 수 있으며, 최종 추천 결정은 고정 추천 로직이 담당한다.

## MVP Decisions

- 강도는 MVP에서 `1`, `2`, `3`의 3단계로 둔다.
- 위치는 `start`, `middle`, `finish`, `overall`로 둔다.
- 복합 표현은 여러 tag 배열과 파생 pattern으로 저장한다.
- 알 수 없는 설명은 `unknown_description` pattern으로 저장하고 추천을 중단하지 않는다.
- 최종 추천 결정은 LLM이 아니라 고정 추천 로직이 담당한다.
- LLM은 선택적 보정 전용이며, 규칙 기반 파서는 LLM 없이 동작해야 한다.
