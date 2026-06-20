# Data Structure

## Purpose

에스프레소 코치 MVP에서 저장하고 계산해야 하는 데이터 구조의 상위 개요다. 세부 필드 정의는 역할별 문서로 분리한다.

기술 스택, DB, 언어, 저장소는 이 문서에서 정하지 않는다.

## Entity Overview

```text
BeanSession
  └─ ShotRecord[]
       ├─ Extraction
       ├─ BasicObservation
       ├─ AdvancedObservation
       ├─ ShotChange[]
       ├─ TasteTag[]
       ├─ TastePattern[]
       └─ RecommendationResult
```

## Split Documents

- [Session Data](data-session.md): `BeanSession`, `RoastProfile`
- [Shot Data](data-shot.md): `ShotRecord`, `Extraction`, `BasicObservation`, `AdvancedObservation`, `ShotChange`
- [Derived Output Data](data-derived-output.md): `TasteTag`, `TastePattern`, `RecommendationResult`, `RecommendationAction`
- [Data Examples and Scope](data-examples-and-scope.md): 완성 샷 예시, MVP 저장 데이터, deferred data, 데이터 결정사항

## Core Decisions

- 원두 세션과 샷 기록은 분리한다.
- 배전 정도는 세션의 `roastProfile`에 범위형 데이터로 저장한다.
- 빠른 진단 필수 입력은 샷의 `extraction`에 모은다.
- 직전 샷 비교는 구조화된 `changesFromPrevious`만 사용한다.
- 복합 맛은 `mixed` 태그가 아니라 `TastePattern`으로 표현한다.
- 추천 결과는 샷 생성 시점의 판단을 재현할 수 있도록 샷 기록에 저장한다.

