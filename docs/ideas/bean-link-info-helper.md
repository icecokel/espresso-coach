# Bean Link Info Helper

## Idea

사용자가 원두 구매 링크를 붙여넣으면 앱이 원두 세션에 필요한 정보를 채우는 것을 돕는다.

목표는 원두를 추천하거나 판매하는 것이 아니라, 사용자가 직접 구매한 원두의 정보를 빠르게 세션에 입력하도록 돕는 것이다.

## Why It Matters

원두 정보는 배전 범위, 로스팅 날짜, 테이스팅 노트, 원산지, 가공 방식처럼 추출 해석에 도움이 되는 컨텍스트를 가진다. 하지만 입문자는 이런 정보를 직접 옮겨 적기 번거롭고, 어떤 정보가 중요한지도 모를 수 있다.

## Possible Flow

1. 사용자가 원두 세션 생성 또는 편집 화면에서 구매 링크를 붙여넣는다.
2. 앱이 링크 페이지에서 원두 정보를 추출한다.
3. 추출 결과를 바로 저장하지 않고 사용자에게 확인 화면을 보여준다.
4. 사용자가 필요한 항목만 선택해 세션 정보에 반영한다.
5. 확신도가 낮은 값은 `confidence = low`로 표시한다.

## Candidate Fields

| Extracted Info | Target Field | Notes |
| --- | --- | --- |
| 원두 이름 | `beanName` | 상품명에서 추출 |
| 로스터/브랜드 | `roaster` | 쇼핑몰명과 로스터명이 다를 수 있음 |
| 배전도 표현 | `roastProfile.label` | 예: light roast, medium dark, 약배전 |
| 배전 범위 | `roastProfile.range` | 원문 label에서 범위로 추론 |
| 배전 확신도 | `roastProfile.confidence` | 원문이 명확하면 high |
| 원산지 | future field | MVP 데이터 구조에는 아직 없음 |
| 가공 방식 | future field | washed, natural, honey 등 |
| 테이스팅 노트 | future field | 추천 로직보다는 참고 정보 |
| 로스팅 날짜 | `roastDate` | 상품 페이지에 없을 수 있음 |
| 권장 레시피 | idea only | 직접 적용하지 않고 참고로만 표시 |

## Example

Input:

```text
https://example-roaster.com/products/ethiopia-guji-medium-light
```

Parsed draft:

```json
{
  "beanName": "Ethiopia Guji",
  "roaster": "Example Roaster",
  "roastProfile": {
    "range": "medium_light_range",
    "label": "Medium Light",
    "confidence": "medium",
    "source": "inferred"
  },
  "sourceUrl": "https://example-roaster.com/products/ethiopia-guji-medium-light"
}
```

## MVP Boundary

This is not in the core MVP unless explicitly promoted.

Allowed as future helper:
- 사용자가 제공한 링크에서 세션 정보 입력을 보조한다.
- 배전 범위 추론은 사용자가 확인해야 한다.
- 원두 정보가 틀릴 수 있음을 표시한다.

Not allowed in MVP:
- 원두 추천
- 쇼핑몰 기능
- affiliate link
- 자동 구매
- 링크만 보고 레시피를 확정 적용
- 로스터 페이지 크롤링을 전제로 한 핵심 진단 흐름

## Risks

- 쇼핑몰마다 HTML 구조가 다르다.
- 페이지에 로스팅 날짜가 없거나 동적으로 바뀔 수 있다.
- 배전 표현이 로스터마다 다르다.
- 같은 상품 페이지라도 입고 시점에 따라 로스팅 날짜가 다를 수 있다.
- 링크 파싱 실패가 세션 생성 흐름을 막으면 안 된다.

## Product Principles

- 링크 입력은 선택 기능이다.
- 추출된 정보는 draft로만 보여준다.
- 사용자가 확인한 값만 저장한다.
- 배전도는 고정값이 아니라 범위와 확신도로 저장한다.
- 원두 구매/추천 기능과 분리한다.

## Promotion Criteria

이 아이디어를 planning 문서로 승격하려면 아래가 필요하다.

- `BeanSession`에 `sourceUrl` 또는 `beanInfoSource`를 둘지 결정
- 원산지, 가공 방식, 테이스팅 노트를 MVP 데이터 구조에 포함할지 결정
- 링크 파싱 실패 UX
- 배전 범위 추론 규칙
- 사용자 확인 화면 필드 정의

