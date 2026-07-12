# Verification Status

Last updated: 2026-07-12

## Scope

이 문서는 현재 Espresso Coach MVP의 검증 상태를 정리한다.

검증은 세 범위로 나눈다.

- Headless verification: 로컬에서 UI 조작 없이 자동 실행 가능한 설치, 정적 검사, 단위 테스트, Expo 설정 검사, dependency audit
- Automated local web E2E: Expo web bundle을 생성하고 로컬 정적 서버에서 Playwright로 자동 확인
- Historical local web runtime smoke test: 2026-07-04에 수동으로 기록한 Playwright 주요 사용자 흐름 확인
- Device/build verification: Expo Go, simulator/emulator, EAS preview build, production build에서만 확인 가능한 실제 앱 동작

## Current Result

2026-07-12 기준 headless 검증과 자동 local web E2E가 통과했다. 검증 환경은 Node.js `v26.5.0` / npm `11.17.0`이다. `npm ci`는 `EBADENGINE` 경고 없이 성공했다. npm 11.17.0은 `allow-scripts` pending 안내를 출력했지만 설치와 audit은 성공했으며, 이는 install script 승인 상태를 안내하는 메시지로만 기록한다.

2026-07-04의 수동 local web runtime smoke test 기록은 보존한다. 이 기록은 최신 자동 E2E의 대체가 아니며, 서로 다른 범위를 확인한다.

| Check | Command | Result | Last confirmed |
| --- | --- | --- | --- |
| Clean dependency install | `npm ci` | Pass; no `EBADENGINE` warning. npm 11.17.0 `allow-scripts` pending notice emitted. | 2026-07-12 |
| TypeScript compile | `npm run lint` | Pass | 2026-07-12 |
| Unit tests and E2E runner contract | `npm test` | Pass; 10 unit test files / 57 unit tests, then E2E runner cleanup contract | 2026-07-12 |
| Automated local web E2E | `npm run test:e2e` | Pass; Chromium preinstall, Expo web export, Playwright 7 scenarios | 2026-07-12 |
| Expo project health | `npm exec expo-doctor` | Pass, 21/21 checks | 2026-07-12 |
| Dependency audit | `npm audit` | Pass, 0 vulnerabilities | 2026-07-12 |
| Working tree whitespace check | `git diff --check` | Pass | 2026-07-12 |
| Historical local web runtime smoke test | `npx --yes serve@latest -s dist -l 4173` + Playwright | Pass; manual record retained below | 2026-07-04 |

`npm run test:e2e`는 lifecycle에서 Chromium을 설치한 뒤 Expo web export와 Playwright를 실행한다. runner는 성공 시 `dist/`와 `output/playwright/`를 정리하고, 실패 시 `dist/`만 정리해 Playwright failure artifact를 보존한다.

`package.json`에는 Node 범위 `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0`가 선언되어 있지만, 코드와 CI/tooling에서 특정 runtime version을 고정하는 정책은 아직 없다.

## Verified Areas

Headless 및 자동 local web E2E로 확인된 영역:

- clean install과 dependency audit
- TypeScript 타입 계약
- domain parser/recommendation/repository 단위 테스트
- native formatter 단위 테스트
- shot detail next-shot route helper 단위 테스트
- native SQLite repository DDL/insert/update/transaction behavior mock 단위 테스트
- 빠른 진단 저장 경로가 repository의 `createShotWithNextNumber` boundary를 사용하는지 여부
- `getFontLoadState` pure state의 loading/error/ready 3개 상태
- Expo SDK dependency 호환성
- dependency audit vulnerability 0건
- app config 기본 유효성
- `eas.json` JSON syntax
- web target production bundle 생성 가능 여부
- 입력값 warning이 첫 제출에서 저장을 막고 명시적 확인을 요구하는지 여부
- 확인 버튼 double-click이 결과 history entry를 하나만 만드는지 여부
- dose, yield, brew time 변경 후 warning 확인을 다시 요구하는지 여부
- 직전 샷의 유효한 dose/yield 변경 자동 기록, 수동 same-variable override, 결과 기반 역방향 추천 여부
- 세션 보관/복원, 보관된 세션의 진단 제외와 stale route 저장 차단 여부
- native SQLite의 archived session shot write 차단과 direct/next-shot transaction 경계 mock 검증
- E2E runner가 Chromium 사전 설치와 성공/실패별 artifact cleanup contract를 지키는지 여부
- app이 font loading state를 표시하고, font error state에서 retry UI를 제공하는지 여부

폰트 error UI는 pure state test와 app fallback 구현으로만 확인했다. 브라우저에서 font error를 직접 주입해 UI를 검증하는 E2E는 현재 범위에 포함하지 않았다.

## Automated Local Web E2E

2026-07-12에 `npm run test:e2e`를 실행해 Expo web export 기반 Playwright 7 scenarios를 통과했다.

1. 비정상 입력의 첫 제출은 form에 남고 명시적 확인을 요구한다.
2. `이 값으로 계속 저장` 버튼의 double-click은 결과 route history entry 하나만 만든다.
3. warning 뒤 dose를 변경하면 다시 확인을 요구한다.
4. warning 뒤 yield를 변경하면 다시 확인을 요구한다.
5. warning 뒤 brew time을 변경하면 다시 확인을 요구한다.
6. 두 번째 샷에서 수동 `finer` + `worse` 결과를 기록하면 역방향인 coarser 추천을 표시한다.
7. 세션 보관 후 진단에서 제외하고, stale 세션 저장을 차단하며, detail에서 복원하면 다시 active 목록에 표시한다.

이 자동 E2E는 input warning 5개, previous-shot feedback 1개, archive/restore와 stale route 보호 1개를 확인한다. 세션 편집, mobile viewport, SPA fallback 등의 넓은 사용자 흐름은 아래의 2026-07-04 수동 smoke record 범위로 보존한다.

## Historical Local Web Runtime Smoke Test

2026-07-04에 아래 흐름을 Playwright로 수동 확인했다. 이 기록은 삭제하지 않으며, 2026-07-12 자동 E2E와 별도 범위다.

상세 실행 기록은 [E2E Test Record 2026-07-04](e2e-test-record-2026-07-04.md)에 남겼다.

1. `npx expo export --platform web`로 production web bundle 생성
2. `npx --yes serve@latest -s dist -l 4173`로 SPA fallback을 지원하는 로컬 정적 서버 실행
3. 빠른 진단 화면에서 새 세션 `테스트 세션` 생성
4. 원두명, 로스터, 맛 설명, 도징량, 추출량, 추출 시간 입력
5. 배전 범위 `중배전` 선택
6. `추천 받기` 실행 후 추천 상세 화면 진입 확인
7. 홈으로 돌아와 현재 세션, 최근 기록 1건, 최근 샷 링크 확인
8. 두 번째 샷 기록 후 shot number가 `03`으로 증가하는지 확인
9. 세션 목록에서 `테스트 세션` 카드 확인
10. 세션 카드의 `수정` 버튼이 상세 화면으로 이동하지 않고 편집 모드로 남는지 확인
11. 세션명과 로스터 수정 후 `진단에 사용`이 `/?sessionId=...`로 돌아오는지 확인
12. 세션 상세에서 샷 수, 평균 비율, 최근 추천, 샷 이력 확인
13. mobile viewport `390x844`에서 빠른 진단, 추천 상세, 세션 목록 direct route가 가로 overflow 없이 동작하는지 확인
14. `/shot/not-real-shot`, `/session/not-real-session`이 각각 not-found 상태를 표시하는지 확인
15. keyboard/focus 방식으로 빠른 진단 입력과 추천 생성이 가능한지 확인
16. browser `fetch`로 root/deep route/asset response contract 확인
17. `320x640`, `390x844`, `768x1024`, `1440x900` viewport에서 layout metric 확인
18. 서비스 개선 follow-up으로 맛 설명 입력 후 `맛 해석` preview 표시 확인
19. 추천 상세의 `다음 샷 기록` link가 `/?sessionId=...`를 유지하는지 확인
20. 다음 샷 입력에서 직전 샷 변경을 선택했을 때 `개선됨`, `나빠짐` 옵션이 표시되는지 확인

확인된 추천 상세:

- 입력값: `18g`, `36g`, `28s`, ratio `1:2.0`
- 추천 유형: `채널링`
- 추천 문구: `다음 샷에서는 채널링이 있는지 먼저 확인하세요.`

이 smoke test는 web target의 런타임 라우팅과 화면 상태 전환을 확인한다. web target은 현재 production web app이 아니라 smoke test와 bundle 검증용 target이다. `createMemoryRepository`를 사용하므로 새로고침 또는 앱 재시작 후 persistence 검증으로 보지 않는다.

주의: `python3 -m http.server --directory dist`는 Expo Router deep route를 `index.html`로 fallback하지 않아 `/session/...` 같은 직접 URL에서 404를 낸다. web runtime E2E는 SPA fallback을 지원하는 서버로 실행한다.

## Not Covered By Headless Verification

아래 항목은 headless 검증만으로 완료 처리하지 않는다.

- iOS/Android 실제 설치 앱 실행
- Expo Go에서 native runtime 동작
- simulator/emulator의 safe area, status bar, keyboard behavior
- 실제 기기에서 한글 폰트 렌더링
- font error를 직접 주입한 browser E2E와 retry 동작
- OS 다크모드 연동
- SQLite persistence의 실제 기기 재시작 후 유지
- 앱 아이콘 표시 상태
- Android back behavior
- iOS/Android별 터치 타깃과 스크롤 감각
- EAS preview build 산출물 설치 및 실행
- production build/signing/store submission
- 제품 피드백 loop의 실제 사용자 데이터 수집 및 평가
- 세션 삭제 정책과 실제 사용자 피드백 기반 추천 품질 평가
- 코드와 CI/tooling에서 Node runtime version을 고정하는 정책

## Runtime Verification Availability

2026-07-04 로컬 확인:

| Check | Command | Result |
| --- | --- | --- |
| EAS CLI availability | `npx eas-cli --version` | Pass, `eas-cli/20.5.1 darwin-arm64 node-v24.1.0` |
| EAS login state | `npx eas-cli whoami` | Fail, `Not logged in` |
| iOS simulator tooling | `xcrun simctl list devices booted` | Fail, `simctl` unavailable with current developer tools |
| Xcode developer directory | `xcode-select -p` | `/Library/Developer/CommandLineTools` |
| Android device connection | `adb devices` | No connected devices |

따라서 Expo Go, simulator/emulator, EAS preview artifact 생성/설치 검증은 이 로컬 세션에서 완료하지 못했다. iOS simulator 검증은 full Xcode `simctl` 접근 또는 booted simulator가 필요하고, EAS build 검증은 EAS login 또는 project token이 필요하다. 이 범위는 다음 페이즈에서 진행한다.

## Recommended Next Verification Order

1. Expo Go 실기기 smoke test
2. iOS simulator 또는 Android emulator smoke test
3. EAS login 또는 project token 준비
4. Android preview build 설치 테스트
5. iOS preview/TestFlight build 테스트
6. EAS preview build 결과 문서화
7. Production build dry run

## Expo Go Smoke Test Checklist

Expo Go에서 먼저 아래 시나리오를 확인한다.

- 앱 첫 실행
- 빠른 진단 화면 진입
- 필수값 누락 validation
- 맛 설명 입력
- 도징량, 추출량, 추출 시간 입력
- `추천 받기` 실행
- 추천 결과 표시
- 세션/샷 저장
- 앱 재실행 후 저장된 shot history 유지
- 라이트/다크 모드 전환
- 키보드가 입력 필드와 CTA를 가리지 않는지 확인

## EAS Preview Build Checklist

다음 페이즈에서 EAS preview build를 실행할 때 아래 항목을 확인한다.

- 설치 가능한 Android artifact 생성
- 설치 가능한 iOS artifact 또는 TestFlight build 생성
- 설치 앱 첫 실행
- 앱 아이콘 표시
- splash/loading 상태
- SQLite 저장 및 앱 재시작 후 유지
- OS theme에 따른 color scheme 적용
- release-like 환경에서 console/runtime error가 없는지 확인

## Build Configuration Status

현재 repository에는 `eas.json`이 있으며 preview/production build profile이 정의되어 있다. 다만 EAS build 자체는 아직 실행하지 않았다.

현재 build profile:

- `development`: dev client가 필요한 native module 추가 시 사용
- `preview`: 내부 배포 및 설치 테스트
- `production`: store 제출 전 최종 build

현재 앱은 커스텀 native code가 없으므로 첫 실기기 검증은 Expo Go로 시작해도 된다. 다만 설치 앱의 아이콘, 저장소, OS integration까지 보려면 EAS preview build가 필요하다.
