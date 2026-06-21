# Verification Status

Last updated: 2026-06-21

## Scope

이 문서는 현재 Espresso Coach MVP의 검증 상태를 정리한다.

검증은 두 범위로 나눈다.

- Headless verification: 로컬에서 UI 조작 없이 자동 실행 가능한 정적 검사, 단위 테스트, Expo 설정 검사, 웹 번들 생성
- Device/build verification: Expo Go, simulator/emulator, EAS preview build, production build에서만 확인 가능한 실제 앱 동작

## Current Result

2026-06-21 기준 headless 검증은 통과했다.

| Check | Command | Result |
| --- | --- | --- |
| TypeScript compile | `npm run lint` | Pass |
| Unit tests | `npm test` | Pass, 5 test files / 24 tests |
| Expo project health | `npm exec expo-doctor` | Pass, 18/18 checks |
| Web production bundle | `npx expo export --platform web` | Pass |

`expo export` 실행 중 `NO_COLOR`와 `FORCE_COLOR` 환경변수 관련 warning이 출력되었지만, export 자체는 exit code 0으로 완료되었다.

검증 중 생성된 `dist/` 산출물은 임시 결과로 확인 후 삭제했다.

## Verified Areas

Headless 검증으로 확인된 영역:

- TypeScript 타입 계약
- domain parser/recommendation/repository 단위 테스트
- Expo SDK dependency 호환성
- app config 기본 유효성
- web target production bundle 생성 가능 여부
- 로고 asset이 web export asset으로 포함되는지 여부

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

## Recommended Next Verification Order

1. Expo Go 실기기 smoke test
2. iOS simulator 또는 Android emulator smoke test
3. EAS preview build 설정
4. Android preview build 설치 테스트
5. iOS preview/TestFlight build 테스트
6. Production build dry run

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

EAS 설정이 추가되면 preview build에서 아래 항목을 확인한다.

- 설치 가능한 Android artifact 생성
- 설치 가능한 iOS artifact 또는 TestFlight build 생성
- 설치 앱 첫 실행
- 앱 아이콘 표시
- splash/loading 상태
- SQLite 저장 및 앱 재시작 후 유지
- OS theme에 따른 color scheme 적용
- release-like 환경에서 console/runtime error가 없는지 확인

## Build Configuration Gap

현재 repository에는 `eas.json`이 없다. preview/production build 검증을 시작하려면 EAS 초기 설정이 필요하다.

권장 build profile:

- `development`: dev client가 필요한 native module 추가 시 사용
- `preview`: 내부 배포 및 설치 테스트
- `production`: store 제출 전 최종 build

현재 앱은 커스텀 native code가 없으므로 첫 실기기 검증은 Expo Go로 시작해도 된다. 다만 설치 앱의 아이콘, 저장소, OS integration까지 보려면 EAS preview build가 필요하다.
