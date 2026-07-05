# Verification Status

Last updated: 2026-07-06

## Scope

이 문서는 현재 Espresso Coach MVP의 검증 상태를 정리한다.

검증은 세 범위로 나눈다.

- Headless verification: 로컬에서 UI 조작 없이 자동 실행 가능한 정적 검사, 단위 테스트, Expo 설정 검사, 웹 번들 생성
- Local web runtime smoke test: 웹 번들을 로컬 정적 서버로 띄운 뒤 Playwright로 주요 사용자 흐름 확인
- Device/build verification: Expo Go, simulator/emulator, EAS preview build, production build에서만 확인 가능한 실제 앱 동작

## Current Result

2026-07-06 기준 headless 검증은 통과했다. Local web runtime smoke test는 2026-07-04 Playwright 기록을 유지하며, 이번 문서/데드코드 정리에서는 재실행하지 않았다.

| Check | Command | Result | Last confirmed |
| --- | --- | --- | --- |
| TypeScript compile | `npm run lint` | Pass | 2026-07-06 |
| Unit tests | `npm test` | Pass, 8 test files / 36 tests | 2026-07-06 |
| Expo project health | `npm exec expo-doctor` | Pass, 18/18 checks | 2026-07-06 |
| Dependency audit | `npm audit` | Pass, 0 vulnerabilities | 2026-07-06 |
| Web production bundle | `npx expo export --platform web` | Pass | 2026-07-06 |
| Local web runtime smoke test | `npx --yes serve@latest -s dist -l 4173` + Playwright | Pass | 2026-07-04 |

검증 중 생성된 `dist/` 산출물은 임시 결과로 확인 후 삭제했다.

현재 로컬 Node.js `v24.1.0`에서는 `npm install` 실행 시 React Native 0.85 계열의 engine 요구 범위보다 낮다는 `EBADENGINE` warning이 출력된다. `package.json`에는 프로젝트 권장 Node 범위를 `^20.19.4 || ^22.13.0 || ^24.3.0 || >=25.0.0`로 명시했다.

## Verified Areas

Headless 검증으로 확인된 영역:

- TypeScript 타입 계약
- domain parser/recommendation/repository 단위 테스트
- native formatter 단위 테스트
- shot detail next-shot route helper 단위 테스트
- native SQLite repository DDL/insert/update/transaction behavior mock 단위 테스트
- 빠른 진단 저장 경로가 repository의 `createShotWithNextNumber` boundary를 사용하는지 여부
- Expo SDK dependency 호환성
- dependency audit vulnerability 0건
- app config 기본 유효성
- `eas.json` JSON syntax
- web target production bundle 생성 가능 여부
- 로고 asset이 web export asset으로 포함되는지 여부
- 로컬 web runtime에서 빠른 진단, 추천 생성, 최근 기록, 세션 목록, 세션 편집, 세션 선택, 세션 상세 이동이 동작하는지 여부
- 로컬 web runtime에서 mobile viewport, invalid detail route not-found state, SPA fallback deep route가 동작하는지 여부
- 로컬 web runtime에서 keyboard/focus input, HTTP/SPA fallback response contract, viewport/layout DOM metric이 통과하는지 여부
- 로컬 web runtime에서 맛 해석 preview, 추천 상세의 같은 세션 다음 샷 연결, 직전 샷 피드백 `개선됨/나빠짐` 옵션 표시 여부

## Local Web Runtime Smoke Test

2026-07-04에 아래 흐름을 Playwright로 확인했다.

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
- OS 다크모드 연동
- SQLite persistence의 실제 기기 재시작 후 유지
- 앱 아이콘 표시 상태
- Android back behavior
- iOS/Android별 터치 타깃과 스크롤 감각
- EAS preview build 산출물 설치 및 실행
- production build/signing/store submission

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
