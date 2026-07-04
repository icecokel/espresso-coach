# Project Improvement Priority

Last reviewed: 2026-07-04

## Purpose

현재 Expo/React Native MVP 구현을 기준으로 프로젝트 자체에서 먼저 개선하면 좋은 항목을 3단계 우선순위로 정리한다.

목표는 새 기능을 무작정 늘리기보다, 현재 앱이 안정적으로 검증되고 제품 방향에 맞게 다음 구현 순서를 잡을 수 있게 만드는 것이다.

## Current Baseline

최근 점검 기준:

| Check | Result | Note |
| --- | --- | --- |
| `npm run lint` | Pass | TypeScript compile 통과 |
| `npm test` | Pass | 8 test files / 36 tests |
| `npx expo export --platform web` | Pass | web bundle 생성 가능 |
| Local web runtime smoke test | Pass | Playwright로 validation, 빠른 진단, 다중 샷, 세션 편집/선택, 모바일 viewport, not-found route 확인 |
| `npm exec expo-doctor` | Pass | SDK 56 patch dependency 정합성 복구 |
| `npm audit` | Pass | `uuid`, `esbuild` advisory는 npm overrides와 lockfile update로 해소 |

현재 앱의 강점:

- `src/domain`의 맛 파싱, 추천, 빠른 진단 로직이 UI와 분리되어 있다.
- 추천 결과가 `ShotRecord.recommendation` snapshot으로 저장된다.
- MVP guardrail인 "다음 샷에서 하나만 조정" 원칙이 도메인 로직과 화면 copy에 반영되어 있다.
- 빠른 진단에서 맛 해석 preview를 보여줘 사용자가 parser 결과를 확인할 수 있다.
- 추천 상세의 `다음 샷 기록`은 같은 세션을 `sessionId`로 이어간다.
- Expo/React Native 화면, SQLite 저장소, web export target이 기본 형태로 존재한다.

현재 남은 검증 gap:

- web target은 smoke test와 bundle 검증용으로 둔다. 현재 `createMemoryRepository`를 사용하므로 새로고침 후 persistence는 제품 요구사항으로 보지 않는다.
- 현재 로컬 Node.js `v24.1.0`은 React Native 0.85 계열이 요구하는 `^24.3.0`보다 낮아 install 시 `EBADENGINE` warning이 난다.
- Expo Go, simulator, EAS preview build에서의 실기기 동작은 아직 실행하지 않았다. 현재 세션에서는 EAS login이 없고 연결된 Android 기기가 없으며, iOS simulator tooling도 현재 CommandLineTools 상태에서 `simctl`을 사용할 수 없다.
- persistent web product가 필요해지면 별도 IndexedDB adapter 또는 backend 저장소를 설계한다.
- 빠른 진단 저장 경로는 `createShotWithNextNumber`를 사용해 shot number 할당과 저장을 repository boundary로 묶는다. native runtime의 실제 transaction 동작은 아직 Expo Go 또는 설치 앱에서 확인하지 못했다.

## Priority Model

| Stage | Name | Goal | When to start |
| --- | --- | --- | --- |
| 1 | 안정화와 검증 정합성 | 현재 구현이 검증 기준을 다시 통과하게 만든다. | 즉시 |
| 2 | MVP 제품 완성도 | 문서상 핵심 MVP와 실제 앱 흐름의 차이를 줄인다. | Stage 1 완료 후 |
| 3 | 확장성과 운영 준비 | 저장소, 테스트, build, 장기 유지보수 기반을 강화한다. | MVP smoke test 후 |

## Stage 1. 안정화와 검증 정합성

### Objective

기능을 늘리기 전에 현재 프로젝트가 문서화된 headless 검증 기준을 다시 통과하게 만든다.

### Work Items

| Priority | Work | Why | Output |
| --- | --- | --- | --- |
| P0 | Expo package patch version 정합성 유지 | SDK patch mismatch는 `expo-doctor` 실패와 런타임 drift로 이어진다. | `expo`, `expo-constants`, `expo-linking`, `expo-router`를 SDK 56 기대 patch version으로 유지 |
| P0 | 검증 문서 갱신 | headless, local web smoke, device/build 검증 범위를 분리해야 한다. | 최신 검증 결과, 실패 원인, 재검증 일자 기록 |
| P1 | README의 current stage 문구 갱신 | README가 현재 통과 범위와 미검증 범위를 정확히 말해야 한다. | README가 headless/local web 통과와 device/EAS 미검증 상태를 구분 |
| P1 | `npm audit` 결과 triage | 강제 fix가 Expo major downgrade를 유도하므로 무작정 적용하면 안 된다. | advisory 영향 범위, Expo update로 해결 가능한지, 잔여 리스크 기록 |
| P1 | web export 산출물 정리 정책 확인 | `dist/`는 임시 산출물이며 git에 남기지 않는다. | 검증 후 삭제 기준 유지 |

### Completion Criteria

- `npm run lint` 통과
- `npm test` 통과
- `npm exec expo-doctor` 18/18 통과
- `npx expo export --platform web` 통과
- local web runtime smoke test 통과
- `docs/planning/verification-status.md`가 실제 검증 결과와 일치
- `npm audit` 결과를 처리하거나 잔여 리스크로 명시

### Notes

- `npm audit fix --force`는 Expo 버전을 낮추는 경로를 제안할 수 있으므로 사용하지 않는다.
- Expo SDK 범위 안의 patch update는 `npx expo install --check` 결과를 우선 기준으로 삼는다.

## Stage 2. MVP 제품 완성도

### Objective

문서에 정의된 "원두별 에스프레소 다이얼링 코치"와 실제 앱 흐름 사이의 기능 gap을 줄인다.

### Work Items

| Priority | Work | Why | Output |
| --- | --- | --- | --- |
| P0 | 원두 세션 생성/선택 흐름 추가 | 현재 빠른 진단은 활성 세션이 없으면 자동 세션만 만든다. | 세션 생성, 선택, 현재 세션 표시, 이름 수정 |
| P0 | 배전 범위 입력 UI 연결 | MVP core에 배전 범위 기록이 포함되어 있다. | `RoastProfile.range`, `confidence`, `source`를 세션에 저장하는 기본 UI |
| P1 | 빠른 진단 화면의 optional field 정리 | 분쇄도, 퍽/흐름, 직전 변경값은 MVP 추천 품질에 직접 영향을 준다. | 필드 label, default, 저장 mapping 재확인 |
| P1 | detail 화면 loading/empty/error 상태 분리 | 현재 로딩 전에도 "기록을 찾을 수 없음"으로 보일 수 있다. | 샷 상세, 세션 상세의 loading, not found, load error UI |
| P1 | keyboard/safe area/CTA 동작 점검 | 모바일 입력 중심 앱이라 실기기 사용성이 중요하다. | Expo Go smoke test에서 입력 필드와 하단 CTA 확인 |
| P2 | action/variable label formatter 공통화 | 같은 label map이 여러 화면에 반복된다. | `src/native/formatters.ts` 같은 shared formatter |
| P2 | web persistence 방향 유지 | 현재 web target은 제품용 저장소가 아니라 smoke test와 bundle 검증용이다. | web product 전환 시 IndexedDB adapter 또는 backend 저장소를 별도 설계 |

### Completion Criteria

- 사용자가 원두 세션을 명시적으로 만들거나 선택할 수 있다.
- 빠른 진단으로 생성된 샷이 올바른 세션에 저장된다.
- 배전 범위가 추천 input의 `session.roastProfile`로 연결된다.
- 샷 상세와 세션 상세에서 loading, empty, error가 구분된다.
- Expo Go에서 필수 입력, 추천 생성, 저장, 재실행 후 기록 확인이 smoke test로 확인된다.

### Notes

- 고급 모드는 Stage 2의 핵심 범위가 아니다.
- 세션 편집은 이름, 원두명, 로스터, 배전 범위 정도까지가 먼저다.
- 추천 로직은 이미 순수 함수로 분리되어 있으므로 UI 개선 중 도메인 rule을 섞지 않는다.

## Stage 3. 확장성과 운영 준비

### Objective

MVP를 반복 개발하고 preview build로 검증할 수 있도록 저장소, 테스트, build 기반을 강화한다.

### Work Items

| Priority | Work | Why | Output |
| --- | --- | --- | --- |
| P0 | SQLite schema 무결성 보강 | 현재 schema는 foreign key와 shot number unique constraint가 없다. | `session_id` FK, `(session_id, shot_number)` unique, 필요한 index |
| P0 | shot 생성 transaction 적용 | shot number 계산과 저장이 분리되면 race나 중복 여지가 있다. | `createShotWithNextNumber` repository API와 native exclusive transaction 경계 유지 |
| P1 | native repository 검증 보강 | memory repository 테스트만으로 SQLite behavior를 보장하기 어렵다. | native adapter 테스트 또는 Expo runtime smoke test checklist |
| P1 | EAS preview build 설정 | 설치 앱 기준의 persistence, icon, OS theme 검증이 필요하다. | `eas.json`, preview profile, Android/iOS preview checklist |
| P1 | 실기기 검증 결과 문서화 | headless 검증으로는 safe area, font, keyboard, SQLite 재실행 유지가 보이지 않는다. | Expo Go / simulator / EAS preview 검증 기록 |
| P2 | docs 정리: web-era 문서와 RN 문서 구분 | 일부 planning 문서는 초기 web app 기준을 유지한다. | web-era decision과 current RN implementation을 구분하는 문서 상태 |
| P2 | 추천 품질 regression case 확대 | 실제 사용자 표현이 늘면 rule-based parser 회귀 위험이 커진다. | taste parser와 recommendation 테스트 케이스 추가 |

### Completion Criteria

- SQLite 저장소가 세션-샷 관계와 shot number 중복을 DB 레벨에서 방어한다.
- EAS preview build로 설치 가능한 artifact를 생성한다.
- 앱 재실행 후 저장된 shot history 유지가 실제 기기 또는 simulator에서 확인된다.
- verification 문서가 headless, Expo Go, EAS preview 결과를 분리해서 기록한다.
- web app 기준 planning 문서와 current React Native 기준 문서가 충돌하지 않는다.

### Notes

- Stage 3은 Stage 2의 MVP 흐름이 정리된 뒤 진행한다.
- production build와 store submission은 preview build 검증 이후 별도 범위로 둔다.

## Recommended Execution Order

1. Expo patch dependency 정합성 수정
2. 최신 검증 결과 문서 갱신
3. 원두 세션 생성/선택/편집 흐름 구현
4. 배전 범위 입력을 세션 데이터와 추천 input에 연결
5. detail 화면 loading/empty/error 상태 분리
6. Expo Go smoke test 수행
7. SQLite schema와 transaction 경계 보강
8. EAS preview build 설정
9. 실기기/EAS 검증 결과 문서화

## Related Documents

- [Product Brief](product-brief.md)
- [MVP Scope](mvp-scope.md)
- [Quick Diagnosis Form](quick-diagnosis-form.md)
- [React Native Migration Plan](react-native-migration-plan.md)
- [Verification Status](verification-status.md)
