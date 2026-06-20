# Bean Session Auto Draft

## Idea

원두 구매 링크, 포장 라벨, 사용자가 적은 원두 설명을 바탕으로 원두 세션 초안을 자동으로 만든다.

목표는 세션 생성을 자동 확정하는 것이 아니라, 사용자가 확인할 수 있는 draft를 만들어 입력 부담을 줄이는 것이다.

## Why It Matters

원두 세션은 배전 범위, 로스팅 날짜, 테이스팅 노트, 원산지, 가공 방식 같은 진단 컨텍스트를 담는다. 하지만 첫 사용자가 이 정보를 모두 직접 입력해야 하면 빠른 진단 경험이 무거워진다.

## Possible Flow

1. 사용자가 원두 세션 생성 화면에서 링크 또는 텍스트를 입력한다.
2. 앱이 원두명, 로스터, 배전 표현, 로스팅 날짜, 테이스팅 노트 후보를 추출한다.
3. 추출값을 `draft` 상태로 보여준다.
4. 사용자가 확인한 필드만 세션에 저장한다.
5. 확신도가 낮은 필드는 비워두거나 `confidence = low`로 저장한다.

## Draft Fields

| Draft Field | Target |
| --- | --- |
| bean name | `BeanSession.beanName` |
| roaster | `BeanSession.roaster` |
| roast label | `BeanSession.roastProfile.label` |
| roast range | `BeanSession.roastProfile.range` |
| roast confidence | `BeanSession.roastProfile.confidence` |
| roast date | `BeanSession.roastDate` |
| source URL | future `beanInfoSource.sourceUrl` |
| tasting notes | future optional field |
| process | future optional field |
| origin | future optional field |

## Relationship To Bean Link Info Helper

`Bean Link Info Helper`는 구매 링크에서 정보를 가져오는 입력 방식에 초점을 둔다. 이 문서는 링크뿐 아니라 텍스트/라벨/수동 입력까지 포함해 세션 초안을 만드는 제품 흐름에 초점을 둔다.

## MVP Boundary

Allowed:
- 세션 초안 생성
- 사용자 확인 후 저장
- 확신도 낮은 값 표시
- 배전 범위는 추정값으로만 사용

Not allowed:
- 원두 세션 자동 확정
- 링크 정보만으로 레시피 확정
- 원두 추천 또는 구매 기능
- 세션 생성 전에 링크 입력을 필수화

## Promotion Criteria

이 아이디어를 planning 문서로 승격하려면 아래가 필요하다.

- draft 상태 데이터 구조
- 사용자 확인 화면 필드
- 링크/텍스트/라벨 입력별 추출 우선순위
- `BeanSession`에 저장할 필드와 future field 구분
