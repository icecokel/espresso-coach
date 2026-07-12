# Project Improvement Priority

Last reviewed: 2026-07-12

## Purpose

현재 Expo/React Native MVP 구현을 기준으로 프로젝트 자체에서 먼저 개선하면 좋은 항목을 3단계 우선순위로 정리한다.

목표는 새 기능을 무작정 늘리기보다, 현재 앱이 안정적으로 검증되고 제품 방향에 맞게 다음 구현 순서를 잡을 수 있게 만드는 것이다.

## Current Baseline

최근 점검 기준:

| Check | Result | Note |
| --- | --- | --- |
| `npm ci` | Pass | Node.js `v26.5.0` / npm `11.17.0`; `EBADENGINE` warning 없음. npm의 `allow-scripts` pending 안내는 출력됐지만 설치와 audit은 성공. |
| `npm run lint` | Pass | TypeScript compile 통과 |
| `npm test` | Pass | 9 test files / 43 tests와 E2E runner contract |
| `npm run test:e2e` | Pass | Chromium preinstall, Expo web export, Playwright 5 input-safety scenarios; 성공 시 `dist/`, `output/playwright/` 정리, 실패 artifact 보존 |
| Historical local web runtime smoke test | Pass | 2026-07-04 수동 Playwright 기록: validation, 빠른 진단, 다중 샷, 세션 편집/선택, 모바일 viewport, not-found route |
| `npm exec expo-doctor` | Pass, 21/21 checks | Expo SDK dependency 정합성 확인 |
| `npm audit` | Pass | 0 vulnerabilities |

현재 앱의 강점:

- `src/domain`의 맛 파싱, 추천, 빠른 진단 로직이 UI와 분리되어 있다.
- 추천 결과가 `ShotRecord.recommendation` snapshot으로 저장된다.
- MVP guardrail인 "다음 샷에서 하나만 조정" 원칙이 도메인 로직과 화면 copy에 반영되어 있다.
- 빠른 진단에서 맛 해석 preview를 보여줘 사용자가 parser 결과를 확인할 수 있다.
- 추천 상세의 `다음 샷 기록`은 같은 세션을 `sessionId`로 이어간다.
- Expo/React Native 화면, SQLite 저장소, web export target이 기본 형태로 존재한다.
- 폰트 loading/error/ready 상태는 pure state test 3개와 app fallback UI로 분리되어 있고, error state는 retry UI를 제공한다.

현재 남은 검증 gap:

- web target은 smoke test와 bundle 검증용으로 둔다. 현재 `createMemoryRepository`를 사용하므로 새로고침 후 persistence는 제품 요구사항으로 보지 않는다.
- Expo Go, simulator, EAS preview build에서의 실기기 동작은 아직 실행하지 않았다. 현재 세션에서는 EAS login이 없고 연결된 Android 기기가 없으며, iOS simulator tooling도 현재 CommandLineTools 상태에서 `simctl`을 사용할 수 없다.
- persistent web product가 필요해지면 별도 IndexedDB adapter 또는 backend 저장소를 설계한다.
- 빠른 진단 저장 경로는 `createShotWithNextNumber`를 사용해 shot number 할당과 저장을 repository boundary로 묶는다. native runtime의 실제 transaction 동작은 아직 Expo Go 또는 설치 앱에서 확인하지 못했다.
- font error state를 browser E2E에서 직접 주입하는 검증은 아직 없다.
- 제품 피드백 loop와 session archive UX는 아직 제품 흐름으로 구현하거나 검증하지 않았다.
- `package.json` engine 범위는 선언됐지만, 코드와 CI/tooling에서 Node runtime version을 고정하는 정책은 아직 없다.

## Current Phase Boundary

이번 Stage 1에서 완료로 보는 범위:

- Expo SDK 정합성, clean install, lint, unit test, expo-doctor, dependency audit
- 검증 문서와 README의 current stage 정합성
- web export E2E runner의 Chromium preinstall, 성공 cleanup, 실패 artifact 보존 contract
- input safety의 warning confirmation과 duplicate navigation 방지 Playwright E2E
- font loading/error/ready pure state test와 loading/error/retry fallback UI
- Expo/React Native MVP 기본 구현, 세션 생성/선택/편집, 배전 범위 입력 연결
- 빠른 진단 맛 해석 preview, 같은 세션 다음 샷 기록, action/variable label formatter 공통화
- SQLite FK/unique/index/transaction boundary와 native repository mock 단위 검증

다음 페이즈로 이관하는 범위:

- Expo Go, simulator/emulator, EAS preview build 실기기 검증
- 고급 모드 UI, 제품 피드백 loop, 실험 결과 모델
- session archive UX
- persistent web product 저장소, export/sync
- 코드와 CI/tooling에서 Node runtime version을 고정하는 정책

## Priority Model

| Stage | Name | Goal | When to start |
| --- | --- | --- | --- |
| 1 | 안정화와 검증 정합성 | 현재 구현이 검증 기준을 다시 통과하게 만든다. | 즉시 |
| 2 | MVP 제품 완성도 | 문서상 핵심 MVP와 실제 앱 흐름의 차이를 줄인다. | 이번 페이즈 코드 반영 완료, 실기기 확인은 다음 페이즈 |
| 3 | 확장성과 운영 준비 | 저장소, 테스트, build, 장기 유지보수 기반을 강화한다. | 저장소 기반 보강 완료, preview build 운영은 다음 페이즈 |

## Stage 1. 안정화와 검증 정합성

### Objective

기능을 늘리기 전에 현재 프로젝트가 문서화된 headless 검증 기준을 다시 통과하게 만든다.

### Work Items

| Priority | Work | Why | Output |
| --- | --- | --- | --- |
| P0 | Expo package patch version 정합성 유지 | SDK patch mismatch는 `expo-doctor` 실패와 런타임 drift로 이어진다. | Done: `npm exec expo-doctor` 21/21 checks |
| P0 | 검증 문서 갱신 | headless, 자동 web E2E, historical manual smoke, device/build 검증 범위를 분리해야 한다. | Done: 최신 검증 결과와 미검증 범위 기록 |
| P1 | README의 current stage 문구 갱신 | README가 현재 통과 범위와 미검증 범위를 정확히 말해야 한다. | Done: Stage 1 완료와 다음 RN MVP phase 구분 |
| P1 | `npm audit` 결과 triage | dependency vulnerability 결과를 현재 lockfile 기준으로 확인한다. | Done: `npm audit` 0 vulnerabilities |
| P1 | web export 산출물 정리 정책 확인 | `dist/`는 임시 산출물이며 git에 남기지 않는다. | Done: 성공 시 `dist/`, `output/playwright/` 정리; 실패 artifact 보존 |
| P1 | 입력 안전성 E2E | 범위 밖 입력은 저장 전 명시적 확인이 필요하고 중복 navigation을 만들면 안 된다. | Done: Playwright 5 scenarios |
| P1 | font fallback | 폰트 loading/error가 앱 shell을 막지 않고 recovery path를 제공해야 한다. | Done: pure state 3 tests와 loading/error/retry UI; browser error injection E2E는 미포함 |

### Completion Criteria

- `npm run lint` 통과
- `npm test` 통과
- `npm run test:e2e` 통과: Chromium preinstall, Expo web export, Playwright 5 scenarios
- `npm exec expo-doctor` 21/21 통과
- `docs/planning/verification-status.md`가 실제 검증 결과와 일치
- `npm audit` 0 vulnerabilities

### Notes

- `npm audit fix --force`는 Expo 버전을 낮추는 경로를 제안할 수 있으므로 사용하지 않는다.
- Expo SDK 범위 안의 patch update는 `npx expo install --check` 결과를 우선 기준으로 삼는다.

## Stage 2. MVP 제품 완성도

### Objective

문서에 정의된 "원두별 에스프레소 다이얼링 코치"와 실제 앱 흐름 사이의 기능 gap을 줄인다.

### Work Items

| Priority | Work | Status | Output |
| --- | --- | --- | --- |
| P0 | 원두 세션 생성/선택 흐름 추가 | Done | 세션 생성, 선택, 현재 세션 표시, 이름/원두 정보 수정 |
| P0 | 배전 범위 입력 UI 연결 | Done | `RoastProfile.range`, `confidence`, `source`를 세션에 저장하는 기본 UI |
| P1 | 빠른 진단 화면의 optional field 정리 | Done | 분쇄도, 퍽/흐름, 직전 변경값의 label, default, 저장 mapping 정리 |
| P1 | detail 화면 loading/empty/error 상태 분리 | Done | 샷 상세, 세션 상세의 loading, not found, load error UI |
| P1 | keyboard/safe area/CTA 동작 점검 | Next phase | Expo Go smoke test에서 입력 필드와 하단 CTA 확인 |
| P1 | 제품 피드백 loop | Next phase | 실제 사용자 feedback 수집, 추천 품질 평가, 후속 action 연결 |
| P2 | session archive UX | Next phase | 장기 보관 세션의 탐색, 복원, 삭제 정책 |
| P2 | action/variable label formatter 공통화 | Done | `src/native/formatters.ts` shared formatter |
| P2 | web persistence 방향 유지 | Next phase | web product 전환 시 IndexedDB adapter 또는 backend 저장소를 별도 설계 |

### Completion Criteria

- 사용자가 원두 세션을 명시적으로 만들거나 선택할 수 있다.
- 빠른 진단으로 생성된 샷이 올바른 세션에 저장된다.
- 배전 범위가 추천 input의 `session.roastProfile`로 연결된다.
- 샷 상세와 세션 상세에서 loading, empty, error가 구분된다.
- Expo Go에서 필수 입력, 추천 생성, 저장, 재실행 후 기록 확인은 다음 페이즈 smoke test에서 확인한다.

### Notes

- 고급 모드는 Stage 2의 핵심 범위가 아니다.
- 세션 편집은 이름, 원두명, 로스터, 배전 범위 정도까지가 먼저다.
- 추천 로직은 이미 순수 함수로 분리되어 있으므로 UI 개선 중 도메인 rule을 섞지 않는다.

## Stage 3. 확장성과 운영 준비

### Objective

MVP를 반복 개발하고 preview build로 검증할 수 있도록 저장소, 테스트, build 기반을 강화한다.

### Work Items

| Priority | Work | Status | Output |
| --- | --- | --- | --- |
| P0 | SQLite schema 무결성 보강 | Done | `session_id` FK, `(session_id, shot_number)` unique/index, 호환 trigger |
| P0 | shot 생성 transaction 적용 | Done | `createShotWithNextNumber` repository API와 native exclusive transaction 경계 |
| P1 | native repository 검증 보강 | Done | native adapter mock 단위 테스트 |
| P1 | EAS preview build 실행/설치 검증 | Next phase | preview profile로 Android/iOS artifact를 만들고 설치 확인 |
| P1 | 실기기 검증 결과 문서화 | Next phase | Expo Go / simulator / EAS preview 검증 기록 |
| P1 | Node runtime version policy | Next phase | 코드와 CI/tooling에서 지원 Node runtime을 고정하고 검증 |
| P2 | docs 정리: web-era 문서와 RN 문서 구분 | Done | current RN MVP 기준과 web smoke/E2E 범위를 문서에서 분리 |
| P2 | 추천 품질 regression case 확대 | Next phase | taste parser와 recommendation 테스트 케이스 추가 |

### Completion Criteria

- SQLite 저장소가 세션-샷 관계와 shot number 중복을 DB 레벨에서 방어한다.
- EAS preview build로 설치 가능한 artifact를 생성하는 작업은 다음 페이즈에서 진행한다.
- 앱 재실행 후 저장된 shot history 유지는 다음 페이즈에서 실제 기기 또는 simulator로 확인한다.
- verification 문서가 headless, Expo Go, EAS preview 결과를 분리해서 기록한다.
- web app 기준 planning 문서와 current React Native 기준 문서가 충돌하지 않는다.

### Notes

- Stage 3은 Stage 2의 MVP 흐름이 정리된 뒤 진행한다.
- production build와 store submission은 preview build 검증 이후 별도 범위로 둔다.

## Recommended Execution Order

1. Expo Go smoke test 수행
2. iOS simulator 또는 Android emulator smoke test 수행
3. EAS login 또는 project token 준비
4. EAS preview build 설정
5. Android/iOS preview artifact 설치 테스트
6. 실기기/EAS 검증 결과 문서화
7. Node runtime version policy를 코드와 CI/tooling에 적용
8. 고급 모드, 제품 피드백 loop, session archive UX, 실험 결과 모델 설계

## Related Documents

- [Product Brief](product-brief.md)
- [MVP Scope](mvp-scope.md)
- [Quick Diagnosis Form](quick-diagnosis-form.md)
- [React Native Migration Plan](react-native-migration-plan.md)
- [Verification Status](verification-status.md)
