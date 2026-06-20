# React Native Migration Plan

## Purpose

이 문서는 현재 React/Vite 웹앱으로 구현된 Espresso Coach MVP를 **React Native 앱**으로 전환하기 위한 작업 계획서다.

전환 목표는 화면 런타임을 모바일 앱으로 바꾸되, 이미 구현된 도메인 계약과 추천 로직을 버리지 않는 것이다. 현재 코드의 핵심 자산은 `src/domain`의 순수 TypeScript 로직이다. 이 로직은 React Native에서도 그대로 재사용한다.

## Current State

현재 구현 상태:

- React + TypeScript + Vite 웹앱
- 빠른 진단 입력 화면
- rule-based taste parser
- recommendation engine
- repository interface
- browser `IndexedDB` 저장소
- domain/storage 단위 테스트

현재 모바일 전환 시 재사용 가능한 영역:

- `src/domain/types.ts`
- `src/domain/defaults.ts`
- `src/domain/quickDiagnosis.ts`
- `src/domain/taste/*`
- `src/domain/recommendation/*`
- domain test fixtures and unit tests

모바일 전환 시 교체해야 하는 영역:

- `src/main.tsx`
- `src/ui/*`
- Vite config and browser entrypoint
- browser `IndexedDB` adapter
- CSS Modules styling

## Migration Decision

권장 전환 방식은 **Expo 기반 React Native 앱으로 root app을 전환**하는 것이다.

| Decision | Choice |
| --- | --- |
| Native framework | React Native with Expo |
| Navigation | Expo Router |
| Language | TypeScript |
| Domain logic | Keep current pure TypeScript modules |
| Storage | Replace IndexedDB adapter with native local repository |
| Styling | React Native `StyleSheet` first |
| Web support | Deferred unless explicitly needed |
| Auth/server | Still out of scope for MVP |

## Alternatives Considered

### Option A: Root App을 Expo로 전환

현재 repo의 앱 런타임을 Vite에서 Expo로 바꾼다. `src/domain`은 유지하고, `src/ui`와 `src/storage`의 platform-specific 부분을 React Native 기준으로 교체한다.

Pros:
- 가장 빠르게 “진짜 모바일 앱”으로 전환할 수 있다.
- 현재 웹 UI가 아직 크지 않아 버리는 비용이 낮다.
- repo 구조가 단순하다.

Cons:
- 웹앱 실행 흐름은 사라진다.
- 기존 Vite dev/build 스크립트는 Expo 스크립트로 바뀐다.

Recommendation: **채택**. 지금은 웹과 모바일을 동시에 유지할 단계가 아니다.

### Option B: Monorepo로 `apps/web`, `apps/mobile`, `packages/core` 분리

domain 로직을 package로 빼고 웹과 모바일 앱을 모두 유지한다.

Pros:
- 장기적으로 web/mobile 동시 운영에 좋다.
- core package 경계가 명확하다.

Cons:
- 현재 MVP 단계에는 구조 비용이 크다.
- package/build/test 설정이 늘어나 구현 속도가 느려진다.

Recommendation: MVP 이후 web을 계속 유지하기로 결정되면 재검토한다.

### Option C: Expo Web까지 포함한 universal app

Expo Router로 native와 web을 한 코드베이스에서 동시에 지원한다.

Pros:
- 하나의 UI 코드로 mobile/web을 모두 시도할 수 있다.

Cons:
- 모바일 UX와 웹 UX가 섞일 가능성이 높다.
- storage, layout, navigation 분기가 빨리 늘어난다.

Recommendation: 첫 React Native MVP에서는 피한다.

## Target Architecture

```text
app/
  _layout.tsx
  index.tsx
  shot/new.tsx
  shot/[shotId].tsx
  session/[sessionId].tsx

src/
  domain/
    types.ts
    defaults.ts
    quickDiagnosis.ts
    taste/
    recommendation/
  storage/
    repository.ts
    nativeRepository.ts
  native/
    components/
    screens/
    theme.ts
```

Rules:

- `src/domain`은 React, React Native, storage, navigation에 의존하지 않는다.
- screen components는 domain helper를 호출하고, repository를 통해 저장한다.
- 저장된 `ShotRecord.recommendation` snapshot은 재계산하지 않는다.
- `brew_time`은 계속 action이 아니라 diagnostic signal로만 유지한다.

## Storage Strategy

MVP React Native 저장소는 native local-first repository로 둔다.

권장 구현:

- repository interface는 유지한다.
- browser `IndexedDbRepository`는 제거하거나 platform-specific 파일로 분리한다.
- native adapter는 Expo에서 사용 가능한 local persistence로 구현한다.

초기 선택지는 둘이다.

| Option | When to use |
| --- | --- |
| AsyncStorage | 구현 속도 우선, 데이터량 작음, 단순 JSON 저장 |
| SQLite | 세션/샷 조회, 정렬, export/import 확장성 우선 |

권장: **SQLite**. `BeanSession`과 `ShotRecord`는 시간이 지날수록 누적되고, 세션별 shot list 조회가 핵심이라 key-value storage보다 SQLite가 이후 확장에 유리하다.

MVP schema:

```text
bean_sessions
  id text primary key
  data text not null
  status text not null
  updated_at text not null

shot_records
  id text primary key
  session_id text not null
  shot_number integer not null
  data text not null
  pulled_at text not null
  created_at text not null
```

`data` column은 MVP에서는 JSON snapshot으로 저장한다. 세부 필드 query가 필요해질 때 정규화한다.

## Screen Migration Scope

### MVP Native Screens

1. Quick Diagnosis
2. Recommendation Result
3. Session List
4. Session Detail with Shot History
5. Shot Detail

### First Screen

첫 화면은 마케팅/랜딩이 아니라 빠른 진단 진입 화면이다.

Required fields:

- 맛 설명
- 도징량
- 추출량
- 추출 시간

Optional fields:

- 분쇄도 메모
- 퍽/흐름 관찰
- 직전 샷 변경값

Advanced fields는 첫 native migration에서 UI에 넣지 않는다. domain type은 유지한다.

## Implementation Phases

### Phase 0: Migration Branch and Baseline

Goal: 전환 전 기준 상태를 고정한다.

Tasks:

- 현재 브랜치에서 `npm run lint`, `npm test`, `npm run build` 결과를 기록한다.
- `codex/react-native-migration` 브랜치를 만든다.
- 기존 웹 implementation commit을 기준점으로 둔다.

Exit criteria:

- domain tests are green before migration starts.
- working tree is clean.

### Phase 1: Expo Scaffold

Goal: Vite app runtime을 Expo runtime으로 바꾼다.

Tasks:

- Expo TypeScript 앱 구조를 추가한다.
- `package.json` scripts를 Expo 중심으로 바꾼다.
- Vite-only files를 제거하거나 deferred web reference로 이동한다.
- `app/_layout.tsx`와 `app/index.tsx`를 만든다.

Expected scripts:

```json
{
  "start": "expo start",
  "ios": "expo start --ios",
  "android": "expo start --android",
  "test": "vitest run",
  "lint": "tsc --noEmit"
}
```

Exit criteria:

- Expo dev server starts.
- TypeScript compile passes.
- Existing domain tests still pass.

### Phase 2: Core Domain Preservation

Goal: 기존 추천 품질을 유지한다.

Tasks:

- `src/domain` imports를 platform-neutral 상태로 유지한다.
- `quickDiagnosis`, `taste parser`, `recommendation` tests를 그대로 통과시킨다.
- web UI에서만 쓰던 타입이나 helper가 domain으로 새어 들어오지 않았는지 확인한다.

Exit criteria:

- `src/domain` has no React Native dependency.
- parser/recommendation behavior remains unchanged.

### Phase 3: Native Storage Adapter

Goal: IndexedDB 의존을 native local persistence로 대체한다.

Tasks:

- `EspressoCoachRepository` interface를 유지한다.
- `nativeRepository.ts`를 만든다.
- session CRUD를 구현한다.
- shot create/list/get을 구현한다.
- saved shot에 `recommendation` snapshot이 없으면 reject한다.

Tests:

- current repository contract tests를 platform-neutral contract test로 유지한다.
- native adapter는 adapter-specific smoke test를 추가한다.

Exit criteria:

- 세션 생성/수정/보관 가능.
- 샷 생성/조회 가능.
- recommendation snapshot required rule 유지.

### Phase 4: Quick Diagnosis Native Screen

Goal: 모바일에서 필수 입력 4개만으로 추천까지 받을 수 있게 한다.

Tasks:

- `QuickDiagnosisScreen`을 만든다.
- numeric input은 `TextInput` + parser로 처리한다.
- validation error를 field 아래에 표시한다.
- warning은 결과 화면에 표시한다.
- submit pipeline을 연결한다:

```text
form input
  -> validateQuickDiagnosisInput
  -> buildExtraction
  -> deriveBasicObservation
  -> parseTasteDescription
  -> buildRecommendation
  -> repository.createShot
  -> result screen
```

Exit criteria:

- 맛 설명, 도징량, 추출량, 추출 시간만으로 저장과 추천이 된다.
- 퍽 관찰 선택 시 observation override가 recommendation에 반영된다.

### Phase 5: Recommendation Result Native Screen

Goal: 사용자가 다음 샷에서 무엇을 하나만 바꿔야 하는지 명확히 본다.

Tasks:

- `RecommendationResultScreen`을 만든다.
- `primary.message`를 가장 크게 보여준다.
- rationale, keep variables, uncertainty를 구분해서 보여준다.
- alternatives는 동시에 실행하라는 느낌이 들지 않게 보조 영역에 둔다.

Exit criteria:

- `no_change` result가 balanced shot copy로 보인다.
- channeling/prep action은 recipe variable 변경처럼 보이지 않는다.

### Phase 6: Session and Shot History

Goal: local-first 앱으로서 누적 기록을 다시 볼 수 있게 한다.

Tasks:

- session list screen을 만든다.
- session detail screen에서 shot history를 보여준다.
- shot detail screen은 저장된 recommendation snapshot을 읽는다.
- historical shot detail에서는 recommendation을 재계산하지 않는다.

Exit criteria:

- 앱 재시작 후에도 session/shot history가 유지된다.
- old shot detail은 저장 당시 recommendation을 보여준다.

### Phase 7: Native QA

Goal: MVP 핵심 시나리오를 모바일 디바이스 기준으로 검증한다.

Scenarios:

1. 첫 실행 후 빠른 진단 입력
2. 필수값 누락 validation
3. sour + short shot 추천
4. channeling 관찰 override 추천
5. balanced shot `no_change`
6. 앱 재실행 후 shot history 유지

Exit criteria:

- iOS simulator 또는 Android emulator에서 핵심 시나리오가 통과한다.
- unit tests pass.
- TypeScript compile pass.

## Issue Mapping

기존 구현 이슈와 연결하면 아래처럼 재분류한다.

| Existing Issue | React Native Migration Handling |
| --- | --- |
| `#8` 앱 스캐폴딩 | Expo scaffold로 재수행 |
| `#9` Domain type과 fixture | 유지 |
| `#10` Rule-based taste parser | 유지 |
| `#11` Recommendation engine | 유지 |
| `#12` 세션/샷 저장소 | native adapter로 재구현 |
| `#13` 빠른 진단 입력 화면 | native screen으로 재구현 |
| `#14` 추천 결과 화면 | native screen으로 구현 |
| `#15` 세션 상세/샷 히스토리 | native navigation으로 구현 |
| `#16` MVP 핵심 시나리오 검증 | simulator/device 기준으로 수행 |

## Recommended New Issues

React Native 전환은 기존 이슈를 그대로 진행하기보다 migration 이슈를 새로 나누는 것이 좋다.

1. `[Migration] Expo 앱 스캐폴딩으로 런타임 전환`
2. `[Migration] Domain 로직 보존 및 테스트 정리`
3. `[Migration] Native local repository 구현`
4. `[Migration] Quick Diagnosis native screen 구현`
5. `[Migration] Recommendation Result native screen 구현`
6. `[Migration] Session/Shot navigation 구현`
7. `[Verification] React Native MVP 시나리오 검증`

## Risks

| Risk | Mitigation |
| --- | --- |
| Web UI 구현분 폐기 비용 | 현재 UI는 초기 화면 수준이라 과감히 교체한다. |
| Storage adapter 변경 중 snapshot 규칙 누락 | repository contract test를 먼저 유지한다. |
| Expo native dependency 설정 지연 | SQLite adapter를 별도 phase로 분리한다. |
| UI에서 domain rule 재구현 | screen은 domain helper만 호출하고 rule을 갖지 않는다. |
| 모바일 입력 UX 복잡도 증가 | advanced fields는 native migration 1차에서 제외한다. |

## Done Definition

React Native migration은 아래 조건을 만족하면 완료로 본다.

- Expo 앱이 실행된다.
- 빠른 진단 입력에서 추천 결과까지 native flow로 동작한다.
- 세션과 샷이 native local storage에 저장된다.
- 앱 재시작 후 저장된 shot history를 볼 수 있다.
- 기존 domain unit tests가 통과한다.
- recommendation snapshot 저장 규칙이 유지된다.
- `brew_time`은 recommendation action으로 추가되지 않는다.

## Recommendation

지금 단계에서는 **웹앱을 계속 확장하지 말고 Expo migration 브랜치를 새로 시작**하는 것이 맞다.

이유:

- 사용자가 기대하는 앱은 모바일 앱이다.
- 현재 웹 UI는 아직 크지 않아 교체 비용이 낮다.
- domain/parser/recommendation/storage contract는 이미 분리되어 있어 모바일 이전 가치가 높다.
- Expo로 전환해도 MVP의 no-login, local-first, rule-based recommendation 원칙은 유지된다.
