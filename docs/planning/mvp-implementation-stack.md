# MVP Implementation Stack

## Status

MVP 첫 구현 스택은 결정한다.

추천 스택은 **로그인 없는 local-first web app**이다. 구현 목표는 제품/데이터/추천 계약을 가장 빠르게 검증하는 것이며, 서버, 계정, 실제 LLM API, 네이티브 앱 배포는 MVP 이후로 미룬다.

## Recommended Stack

| Decision | Choice |
| --- | --- |
| First implementation target | Web app |
| Account/login | No login for MVP |
| Storage | Browser local-first storage |
| Frontend framework | React SPA |
| Language | TypeScript |
| App tooling | Vite-based app scaffold |
| Styling | CSS Modules with CSS custom properties |
| Recommendation logic | App-internal pure TypeScript functions |
| Taste parser | Rule-based parser first |
| Rule table location | Typed TypeScript constants |
| Minimal tests | Domain logic unit tests |

## Rationale

### Web App First

첫 구현은 모바일 앱이 아니라 web app으로 시작한다.

Reasons:
- 현재 MVP는 카메라, Bluetooth scale, sensor, push notification 같은 native-only 기능이 없다.
- 화면 계약은 빠른 진단, 세션 목록, 세션 상세, 결과, 샷 상세 중심이라 browser UI로 검증할 수 있다.
- 사용자는 휴대폰 browser에서도 바로 접근할 수 있고, 앱스토어 배포 없이 테스트할 수 있다.
- 문서화된 계약을 먼저 코드로 옮겨 검증하는 단계에서는 web app이 가장 낮은 인프라 비용을 가진다.

Mobile app, native wrapper, app-store distribution은 MVP 이후에 재검토한다.

### No Login for MVP

MVP는 로그인 없이 시작한다.

Reasons:
- `BeanSession`과 `ShotRecord`는 개인 기기 안에서 먼저 검증해도 제품 가치 확인이 가능하다.
- 계정, auth, password reset, user deletion, sync conflict는 현재 MVP 코칭 품질 검증에 직접 필요하지 않다.
- 초보자 첫 진입 흐름은 `빠른 진단 시작`이며, 계정 생성은 이 흐름을 느리게 만든다.

MVP 화면에는 계정 생성, 로그인, 로그아웃, 팀/공유 기능을 넣지 않는다.

### Local-First Storage

저장 전략은 browser local-first storage로 둔다.

Recommended physical storage:
- `IndexedDB`를 기본 저장소로 사용한다.
- 앱 내부에는 storage adapter 또는 repository layer를 둔다.
- domain type은 storage API에 종속시키지 않는다.

Stored data:
- `BeanSession`
- `ShotRecord`
- `TasteTag[]`
- `TastePattern[]`
- `RecommendationResult` snapshot
- input warnings and timestamps

Reasons:
- 샷 생성 완료 조건은 저장된 `ShotRecord.recommendation` snapshot이 있는 상태다.
- 이전 샷 추천 결과는 화면에서 재계산하지 않고 저장된 snapshot을 읽어야 한다.
- IndexedDB는 세션/샷 배열, timestamp 정렬, 향후 export/import에 localStorage보다 안정적이다.
- 서버 DB 없이도 세션 history와 다음 샷 흐름을 구현할 수 있다.

MVP에서는 cloud sync, backup, multi-device merge, server DB migration을 구현하지 않는다. 다만 repository boundary는 이후 서버 저장소로 바꿀 수 있게 둔다.

## Frontend Implementation Direction

### Framework and Language

첫 구현은 React + TypeScript SPA로 한다.

Reasons:
- 데이터 계약의 union type, enum-like value, required/null convention을 TypeScript 타입으로 직접 옮기기 쉽다.
- 추천 로직, 맛 파서, 파생값 계산을 UI와 분리한 pure function으로 작성하기 쉽다.
- 화면 흐름은 client-side navigation으로 충분하다.
- SSR, server action, API route가 MVP 필수 조건이 아니다.

Vite-based scaffold를 사용하되, 특정 버전은 지금 문서에서 고정하지 않는다.

### Styling

스타일링은 CSS Modules와 CSS custom properties를 사용한다.

Reasons:
- 현재 MVP는 form, list, detail, result 중심의 제품 UI라 대형 UI framework가 필요하지 않다.
- CSS Modules는 component-level style을 빠르게 만들면서 runtime dependency를 늘리지 않는다.
- CSS custom properties로 색상, spacing, radius, typography token을 최소한으로 공유할 수 있다.

MVP에서는 디자인 시스템 패키지, theming engine, animation library를 도입하지 않는다.

## Domain Logic Strategy

### Recommendation Logic

추천 로직은 server/API가 아니라 app-internal pure TypeScript functions로 구현한다.

Expected shape:

```ts
function buildRecommendation(input: RecommendationInput): RecommendationResult;
```

Rules:
- 입력은 `BeanSession`, current `ShotRecord` draft values, derived extraction values, `TasteTag[]`, `TastePattern[]`를 구조화해서 받는다.
- 함수는 storage, UI state, network, clock에 직접 접근하지 않는다.
- 결과는 저장 전에 `ShotRecord.recommendation` snapshot으로 붙인다.
- 저장된 result/shot detail screen은 snapshot을 읽고, 화면에서 추천을 다시 만들지 않는다.

### Taste Parser

맛 파서는 rule-based implementation을 먼저 만든다.

Rules:
- `taste-tag-taxonomy.md`의 한국어 표현 사전, 강도, 위치, 복합 패턴을 deterministic parser로 구현한다.
- parser output은 항상 `TasteTag[]`와 `TastePattern[]`다.
- 매핑 실패 시 `tasteTags = []`, `unknown_description` pattern을 만든다.
- LLM이 없어도 추천 생성은 계속되어야 한다.

LLM은 MVP 구현에서 network dependency로 붙이지 않는다. 필요하면 parser confidence가 낮은 case를 표시하는 mock 또는 optional interface만 남기고, 실제 API 호출은 deferred로 둔다.

### Rule Table Physical Location

추천 rule table과 action catalog는 TypeScript constants로 둔다.

Recommended files:

```text
src/domain/recommendation/actions.ts
src/domain/recommendation/rules.ts
src/domain/recommendation/recommendation.ts
src/domain/taste/tasteDictionary.ts
src/domain/taste/parseTaste.ts
```

Reasons:
- `RecommendationAction.variable`, `direction`, `amountLabel`, rule ID 같은 값이 TypeScript union과 함께 검증된다.
- rule table은 MVP 중 자주 바뀔 수 있으므로 DB나 remote config보다 코드 리뷰 가능한 constants가 안전하다.
- JSON config는 type safety가 약하고 parser/recommendation helper 함수와 분리되어 초기 구현 속도를 떨어뜨린다.

향후 운영자가 rule을 앱 배포 없이 수정해야 하는 요구가 생기면 JSON/config 또는 server-managed rules를 다시 검토한다.

## Minimal Test Strategy

도메인 로직은 최소 unit test를 먼저 둔다. 권장 test runner는 Vite stack과 맞는 Vitest다.

Required test groups:
- extraction derived values: `brewRatio`, `brewTimeBand`, `brewRatioBand`, `inputWarnings`
- basic observation summary: `prepObservations` to `channelingObserved`, `puckCondition`, `prepIssue`, `prepIssueTypes`
- taste parser: direct expressions, intensity, position, negation, duplicate merge, `unknown_description`
- taste patterns: `conflicting_extraction_signals`, `weak_and_sour`, `balanced_with_negative_signal`
- recommendation rules: base rules, observation override order, roast context modifiers, previous-shot comparison, tie break order
- snapshot behavior: saved shot contains exactly one `recommendation.primary`

Test fixtures should come from the examples in:
- `quick-diagnosis-form.md`
- `taste-tag-taxonomy.md`
- `recommendation-rule-table.md`
- `recommendation-result-copy.md`

UI tests are not required before the domain logic is stable. A small smoke test for the shot creation flow can be added after the first screens exist.

## Implementation Prerequisites

Implementation may start because the required product/data/rule/screen contracts now exist.

Prerequisites to carry into code:
- TypeScript types must mirror `data-model.md` and split data documents.
- Quick diagnosis form fields and validation must follow `quick-diagnosis-form.md`.
- Taste parser must follow `taste-tag-taxonomy.md`.
- Recommendation logic must follow `recommendation-rule-table.md`.
- Result copy must follow `recommendation-result-copy.md`.
- Navigation and saved snapshot behavior must follow `user-journey-and-screen-flow.md`.
- Storage must preserve saved recommendation snapshots and must not recalculate old shots on read.

## First Implementation Order

1. Create the React + TypeScript web app scaffold.
2. Define domain types for sessions, shots, extraction, observations, taste tags, patterns, and recommendations.
3. Implement derived extraction helpers and quick diagnosis validation.
4. Implement basic observation summary helpers.
5. Implement rule-based taste parser and pattern derivation.
6. Implement recommendation action catalog, rule constants, scoring, overrides, and tie breaks.
7. Add domain unit tests using the documented examples.
8. Implement local repository/storage adapter with IndexedDB.
9. Build the first screen flow: quick diagnosis entry, input, save pipeline, result screen.
10. Add session list/detail and shot detail from saved local data.

## Deferred

The following are explicitly deferred from the first MVP implementation:

- Login, account creation, auth, password reset
- Server DB, API backend, cloud sync, multi-device merge
- Actual LLM API calls for taste parsing or recommendation
- LLM as final recommendation decision maker
- Native mobile app, app-store distribution, native push notification
- Bluetooth scale, pressure/flow sensor, camera/image analysis
- User-defined target recipes, target ratio, target time
- Long-term statistics dashboard
- Community, sharing, team logs, public recipes
- Remote rule management or admin rule editor
- Paid plan, billing, shopping, bean recommendation marketplace

## Non-Goals for the First Stack

- Do not introduce a server only to store single-device MVP data.
- Do not require login before the user can record a first shot.
- Do not make recommendation depend on network availability.
- Do not store rule decisions only in prose; encode the MVP rule table as typed constants.
- Do not recalculate historical recommendation results when viewing saved shots.
