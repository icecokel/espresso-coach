# MVP Pre-Implementation Roadmap

## Purpose

MVP 구현 전에 끝낸 기획 산출물과 다음 구현 순서를 정리한다. 목표는 코딩 단계에서 제품 판단, 데이터 구조, 추천 로직, 화면 문구를 새로 고민하지 않게 만드는 것이다.

제품/데이터/로직/화면/문구 계약은 구현을 시작할 수 있을 만큼 확정되었고, 첫 구현 스택은 [MVP Implementation Stack](mvp-implementation-stack.md)에 정리되어 있다.

## Current Goal

에스프레소 코치의 MVP는 원두별 다이얼링 세션 안에서 샷을 기록하고, 맛 표현과 기본 추출값을 바탕으로 다음 샷에서 하나의 변수만 바꾸도록 안내하는 코치다.

사용자는 아래 값을 중심으로 기록한다.

- 맛 설명
- 도징량
- 추출량
- 추출 시간
- 선택값: 배전 범위, 분쇄도 메모, 퍽/채널링 관찰, 직전 샷 대비 변경값

앱은 아래 결과를 제공한다.

- 다음 샷에서 먼저 할 일 1개
- 추천 근거
- 유지할 변수
- 불확실성
- 대안 후보

## Pre-Implementation Principles

- 데이터 타입을 먼저 고정한다.
- 화면 필드는 데이터 타입과 1:1로 연결한다.
- 맛 태그와 추천 rule은 UI, 저장소, LLM 호출과 분리한다.
- 추천은 절대값보다 상대적 next step으로 표현한다.
- 사용자가 한 번에 여러 변수를 바꾸도록 유도하지 않는다.
- 선택 관찰값이 없으면 추천을 막지 않고 불확실성에 반영한다.
- 첫 구현은 로그인 없는 local-first React/TypeScript web app으로 시작한다.

## Roadmap Summary

| Order | Workstream | Output | Status |
| --- | --- | --- | --- |
| 1 | Data Contract | 구현 가능한 타입 명세 | 완료 |
| 2 | Quick Diagnosis Contract | 입력 필드/validation/default 확정 | 완료 |
| 3 | Taste Parsing Contract | 맛 태그 사전과 파싱 규칙 | 완료 |
| 4 | Recommendation Contract | rule table, scoring, action shape | 완료 |
| 5 | Result Copy Contract | 결과 화면 문구 템플릿 | 완료 |
| 6 | Screen Flow Contract | MVP 화면 단위와 상태 흐름 | 완료 |
| 7 | Stack Decision | 첫 구현 스택 결정 | 완료 |

## 1. Data Contract

### Objective

기획 문서를 실제 TypeScript 타입이나 DB schema로 옮기기 쉬운 수준까지 정리한다.

### Primary Documents

- [Data Structure](data-model.md)
- [Session Data](data-session.md)
- [Shot Data](data-shot.md)
- [Derived Output Data](data-derived-output.md)
- [Data Examples and Scope](data-examples-and-scope.md)

### Types to Finalize

| Type | Purpose |
| --- | --- |
| `BeanSession` | 원두별 다이얼링 단위 |
| `RoastProfile` | 배전 범위, 확신도, 출처 |
| `ShotRecord` | 한 샷의 입력, 관찰, 파생값, 추천 결과 |
| `Extraction` | 맛 설명, 도징량, 추출량, 추출 시간, 파생 ratio/time band |
| `BasicObservation` | 분쇄도 메모, 퍽/채널링 관찰 요약 |
| `PrepObservation` | 사용자가 체크한 퍽 준비/흐름 관찰 원본값 |
| `AdvancedObservation` | 온도, 압력, 물, 장비, 프리인퓨전 등 고급 입력 |
| `ShotChange` | 직전 샷 대비 사용자가 바꾼 변수 |
| `TasteTag` | 자연어에서 추출한 개별 맛 신호 |
| `TastePattern` | 복합 맛 패턴 |
| `RecommendationResult` | 추천 결과 전체 |
| `RecommendationAction` | 다음 샷에서 실행할 조정안 |

### Decisions

- 사용자 화면 이름은 `프로젝트`로 둘 수 있지만, 내부 타입은 `BeanSession`으로 유지한다.
- `BeanSession.roastProfile`은 required이며, 모르면 `unknown` default로 저장한다.
- `BasicObservation`에는 사용자가 체크한 원본 `prepObservations`와 추천 로직용 요약값을 함께 저장한다.
- `advancedObservation`은 required field이며, 고급 입력이 없으면 `null`로 저장한다.
- 추천 결과는 샷 생성 시점의 판단을 재현할 수 있게 `ShotRecord.recommendation`에 저장한다.
- 저장된 샷은 항상 `recommendation` snapshot을 가진다.
- 추출 시간은 추천 action이 아니라 진단 신호로만 사용한다.
- 직전 샷 변경 없음 또는 모름은 `changesFromPrevious = []`로 표현한다.

### Completion Criteria

- 각 타입의 필드, 타입, required 여부, enum 값이 문서에 존재한다.
- 완성된 `ShotRecord` 예시가 모든 핵심 타입을 포함한다.
- 같은 개념에 대해 문서마다 다른 필드명이 남아 있지 않다.
- nullable, optional, empty array, `unknown`의 사용 기준이 명확하다.

## 2. Quick Diagnosis Contract

### Objective

빠른 진단 폼을 구현자가 그대로 만들 수 있게 필드, label, validation, default, 저장 위치를 확정한다.

### Primary Document

- [Quick Diagnosis Form](quick-diagnosis-form.md)

### Field Groups

Required:

- `tasteDescription`
- `doseGrams`
- `yieldGrams`
- `brewSeconds`

Optional basic:

- `roastProfile` 또는 세션의 배전 범위 선택
- `grindNote`
- `prepObservations`
- `changesFromPrevious`

Advanced:

- `pressureBars`
- `temperatureCelsius`
- `daysOffRoast`
- `waterNote`
- `equipmentNote`
- `preinfusionNote`

### Decisions Captured

- 첫 샷에서 세션이 없으면 제출 시 자동 세션을 만든다.
- 배전 범위는 빠른 진단 화면에서 받을 수 있고, 세션의 `roastProfile`로 저장한다.
- `prepObservations`는 체크리스트로 받고, `channelingObserved`, `puckCondition`, `prepIssue`, `prepIssueTypes`는 저장 시 파생한다.

### Completion Criteria

- 모든 필드가 저장 타입과 연결되어 있다.
- blocking validation과 warning validation이 분리되어 있다.
- 필수값 4개만으로 추천을 받을 수 있다.
- 선택값이 비어 있을 때의 default가 정해져 있다.

## 3. Taste Parsing Contract

### Objective

사용자 자연어 맛 설명을 안정적으로 `TasteTag`와 `TastePattern`으로 바꾸는 규칙을 정한다.

### Primary Document

- [Taste Tag Taxonomy](taste-tag-taxonomy.md)

### Tag Set

MVP 기본 태그:

- `sour`
- `bitter`
- `watery`
- `astringent`
- `harsh`
- `hollow`
- `balanced`

MVP 기본 패턴:

- `conflicting_extraction_signals`
- `weak_and_sour`
- `balanced_with_negative_signal`
- `unknown_description`

### Decisions Captured

- 한국어 표현 사전과 태그 매핑을 표로 확정했다.
- 강도 표현은 `1`, `2`, `3`으로 매핑한다.
- 위치 표현은 `start`, `middle`, `finish`, `overall`로 매핑한다.
- 모호하거나 복합적인 표현은 rule-based 결과를 먼저 만들고, MVP에서는 실제 LLM API를 붙이지 않는다.

### Completion Criteria

- 각 맛 태그마다 한국어 예문이 있다.
- 한 문장에서 여러 태그가 나오는 경우의 저장 예시가 있다.
- 알 수 없는 맛 설명이 들어와도 추천이 중단되지 않는다.
- LLM 없이도 최소 추천이 가능한 규칙 기반 태깅이 정의되어 있다.

## 4. Recommendation Contract

### Objective

추천 로직을 순수 함수로 구현할 수 있게 입력, rule, scoring, output shape을 확정한다.

### Primary Document

- [Recommendation Rule Table](recommendation-rule-table.md)

### Recommendation Inputs

- `BeanSession.roastProfile`
- `ShotRecord.extraction`
- `ShotRecord.basicObservation`
- `ShotRecord.changesFromPrevious`
- `TasteTag[]`
- `TastePattern[]`

### Recommendation Outputs

- `primary`
- `alternatives`
- `rationale`
- `uncertainty`
- `matchedRules`
- `keepVariables`

### Decisions Captured

- `brewTimeBand`와 `brewRatioBand`의 MVP 기준은 고정한다.
- observation override가 recipe variable보다 우선하는 조건을 확정했다.
- 동점일 때의 tie break 순서를 확정했다.
- `brew_time`은 추천 action에서 제외하고 진단 신호로만 둔다.

### Completion Criteria

- 주요 맛 문제별 rule이 존재한다.
- 각 rule에 primary action, alternative, rationale이 있다.
- 추천 action은 항상 1개 primary만 가진다.
- 추천은 절대 grinder number나 정확한 g 증감량을 강제하지 않는다.
- 채널링/퍽 준비 문제가 있을 때 분쇄도 문제로 단정하지 않는다.

## 5. Result Copy Contract

### Objective

추천 결과를 초보자가 바로 실행 가능한 문구로 보여준다.

### Primary Document

- [Recommendation Result Copy](recommendation-result-copy.md)

### Required Sections

- Primary action template
- Rationale template
- Keep variables template
- Uncertainty template
- Alternative actions template
- Balanced shot template
- Unknown/low-confidence template

### Completion Criteria

- 각 `RecommendationAction.variable`별 사용자 문구가 있다.
- 같은 결과 화면에서 여러 변수를 동시에 바꾸라고 말하지 않는다.
- 불확실성 문구가 겁주지 않고 다음 관찰을 유도한다.
- 초보자에게 어려운 용어는 쉬운 표현을 먼저 쓰고, 필요하면 보조 설명으로 둔다.

## 6. Screen Flow Contract

### Objective

MVP 화면 단위와 상태 흐름을 확정한다.

### Primary Document

- [User Journey and Screen Flow](user-journey-and-screen-flow.md)

### Minimum MVP Screens

- Session list
- Session create/edit
- Session detail with shot history
- Quick diagnosis input
- Recommendation result
- Shot detail

### Decisions Captured

- 첫 화면은 빠른 진단 시작 중심으로 둔다.
- 추천 결과 저장 후 사용자는 같은 세션의 다음 샷을 바로 기록할 수 있다.
- 세션 없이 빠른 진단을 시작하면 제출 시 자동 세션을 만든다.
- 고급 모드는 `Quick Diagnosis Input` 안의 opt-in toggle로 둔다.

### Completion Criteria

- 각 화면의 목적, 주요 액션, 필요한 데이터가 정의되어 있다.
- 샷 생성 후 추천 결과까지의 흐름이 끊기지 않는다.
- 사용자가 결과에서 다음 샷 입력으로 돌아갈 수 있다.
- 고급 입력은 기본 흐름을 막지 않는다.

## 7. Stack Decision

### Objective

제품/데이터/로직 계약이 끝난 뒤 첫 구현 스택을 결정한다.

### Primary Document

- [MVP Implementation Stack](mvp-implementation-stack.md)

### Status

아래 항목이 끝난 뒤 첫 구현 스택을 결정했고, 현재 결정은 [MVP Implementation Stack](mvp-implementation-stack.md)에 정리되어 있다.

- Data Contract
- Quick Diagnosis Contract
- Taste Parsing Contract
- Recommendation Contract
- Result Copy Contract
- Screen Flow Contract

### Stack Decisions

- 첫 구현 대상은 web app이다.
- MVP는 로그인 없이 local-first 저장으로 시작한다.
- 저장소는 IndexedDB를 기본으로 하되 adapter/repository layer 뒤에 둔다.
- 프론트엔드는 React SPA + TypeScript + Vite-based scaffold로 시작한다.
- 추천 로직은 앱 내부 pure TypeScript function으로 둔다.
- MVP에서는 실제 LLM API를 붙이지 않고 rule-based parser를 먼저 구현한다.
- rule table은 typed TypeScript constants로 둔다.

## Recommended Next Work

기획 계약 이슈 #1-#7은 구현을 시작할 수 있을 만큼 완료되었다. 다음 작업은 구현 이슈 #8부터 시작하고, 이후 #9-#16을 번호순으로 진행한다.

Recommended order:

1. Implementation issue #8
2. Implementation issue #9
3. Implementation issue #10
4. Implementation issue #11
5. Implementation issue #12
6. Implementation issue #13
7. Implementation issue #14
8. Implementation issue #15
9. Implementation issue #16

## MVP Planning Done Definition

아래 조건을 모두 만족했으므로 구현으로 넘어갈 수 있다.

- 모든 핵심 타입의 필드와 enum이 확정되어 있다.
- 빠른 진단 필드와 validation이 확정되어 있다.
- 맛 태그 사전과 복합 패턴 규칙이 확정되어 있다.
- 추천 rule table이 primary action을 만들 수 있다.
- 결과 화면 문구 템플릿이 있다.
- MVP 화면 흐름이 확정되어 있다.
- 첫 구현 기술 스택이 확정되어 있다.

## Out of Scope Before MVP Implementation

- 커뮤니티
- 사용자 간 레시피 공유
- 장기 통계 대시보드
- 쇼핑몰/원두 추천
- Bluetooth scale integration
- pressure/flow sensor integration
- 실제 LLM API 의존 추천
- 계정/팀/공유 로그
- 원두 이미지 자동 분석
