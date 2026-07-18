# Android Emulator E2E 2026-07-19

## Scope

2026-07-19에 Android Emulator의 Expo Go에서 Espresso Coach 네이티브 런타임 E2E를 수행했다. web export가 아닌 `expo-sqlite`, Android keyboard, system back, safe area, OS theme이 동작하는 경로를 대상으로 했다.

## Environment

| Item | Value |
| --- | --- |
| AVD | `NamelessDay_API_36` |
| Android | Android 16 / API 36 |
| ABI | `arm64-v8a` |
| Display | `1080x2400`, density `420` |
| Runtime | Expo Go, Expo SDK `56.0.0` |
| Metro | `npx expo start --android --clear` |
| Host | Node.js `v26.5.0`, npm `11.17.0` |

검증은 ADB 입력, `uiautomator dump` 접근성 tree assertion, 단계별 screenshot, 프로세스 강제 종료와 deep link 재실행, Android system setting 전환, PID 범위 logcat 확인을 조합했다. ADB 기본 입력기의 제약 때문에 맛 문구는 `sour`, `bitter`, `sweet`을 사용했고 한글 키보드 입력 자체는 확인하지 않았다.

## Scenarios

| # | Scenario | Result |
| --- | --- | --- |
| 1 | Expo Go 콜드 실행과 project bundle 로드 | Pass |
| 2 | 빠른 진단 상단 status bar와 하단 gesture 영역 | Fail 발견 후 수정·재검증 Pass |
| 3 | 맛 입력 시 Android keyboard 표시, CTA 노출·직접 실행, back으로 닫기 | Fail 발견 후 수정·재검증 Pass |
| 4 | 숫자 미입력 제출 시 도징량·추출량·시간 validation | Pass |
| 5 | 첫 샷 `18g / 36g / 28s` 저장과 추천 상세 이동 | Pass |
| 6 | `다음 샷 기록`이 같은 세션의 `샷 02`로 연결 | Pass |
| 7 | 관찰 checkbox `한쪽 흐름`, 변경 radio `분쇄도 / 더 곱게 / 개선됨` 상태 갱신 | Pass |
| 8 | 두 번째 샷 `18g / 36g / 30s` 저장과 관찰·직전 결과 근거 반영 | Pass |
| 9 | Android system back으로 빠른 진단 복귀, `샷 03 / 최근 기록 2` 표시 | Pass |
| 10 | 최근 샷 2건과 세션 목록·세션 상세 navigation | Pass |
| 11 | Expo Go force-stop 후 cold relaunch에서 SQLite 세션 1건·샷 2건 복원 | Pass |
| 12 | Android OS dark mode 자동 연동과 핵심 텍스트·CTA 대비 | Pass |
| 13 | landscape 회전 요청에도 app config의 portrait 고정 유지 | Pass |
| 14 | system font scale 130%에서 입력 카드와 CTA 조작 가능, 잘림·겹침 없음 | Pass, 상단 설명의 한 글자 단위 줄바꿈은 후속 polish 후보 |
| 15 | `200s` 범위 경고가 저장을 막고 `29s` 수정 시 경고가 해제됨 | Pass |
| 16 | 수정된 세 번째 샷 저장 후 최신 샷 2단계 삭제 | Fail 발견 후 수정·재검증 Pass |
| 17 | 최신 샷 삭제 후 세션이 2건으로 복귀하고 과거 샷에는 삭제 action 미노출 | Pass |
| 18 | 세션 보관 시 다음 샷 action 제거, 복원 시 active action 복귀 | Pass |
| 19 | app PID logcat의 fatal crash와 SQLite exception 확인 | Pass, 해당 오류 없음 |

## Issues Found And Fixed

### 1. Quick Diagnosis Top Safe Area

API 36 edge-to-edge 화면에서 상태바 시간·아이콘이 `빠른 진단` 제목과 `샷` 배지를 덮었다.

- root에 `SafeAreaProvider`를 추가했다.
- 헤더가 없는 빠른 진단 화면을 top/bottom `SafeAreaView`로 감쌌다.
- 재검증에서 콘텐츠 시작점이 display cutout inset 아래로 이동하고 하단 CTA가 gesture 영역 위에 유지됐다.

### 2. Detail And List Bottom Safe Area

샷 상세의 최신 샷 삭제 확인 버튼 위로 Android gesture bar가 지나갔다. 기존 고정 `scrollBottomPadding: 40`만으로 API 36의 63px bottom inset을 처리할 수 없었다.

- 샷 상세, 세션 상세, 세션 목록의 ScrollView bottom padding에 `useSafeAreaInsets().bottom`을 더했다.
- 재검증에서 삭제 확인 버튼의 하단이 gesture 영역 위로 이동했고 삭제·navigation이 정상 완료됐다.

### 3. Keyboard And Fixed CTA

맛 입력 중 Android IME가 열려도 `추천 받기` 버튼 좌표가 화면 하단에 남아 keyboard 뒤에 가려졌다.

- 빠른 진단의 safe-area content를 `KeyboardAvoidingView`로 감싸고 Android에서는 `height` behavior를 적용했다.
- ScrollView에 `keyboardShouldPersistTaps="handled"`를 추가했다.
- 재검증에서 CTA 하단 `1407px`, keyboard 상단 `1517px`로 110px 간격을 확보했다.
- keyboard가 열린 상태에서 CTA를 눌러 validation이 실행되고, keyboard를 닫으면 CTA가 원래 위치로 복귀하는 것을 확인했다.

## Runtime Notes

- 첫 force-stop 뒤 Expo Go 개발 번들의 cold load는 약 18초, 최종 cached cold load는 약 8초가 걸렸다. Metro 개발 환경 수치이므로 production 성능 기준으로 사용하지 않는다.
- Expo Go의 floating developer tools 버튼이 화면 우측 상단을 덮는다. Expo Go 전용 overlay이며 설치형 preview build에서 다시 확인해야 한다.
- 프로세스 초기화 중 Expo Go host의 `ReactNoCrashSoftException: Cannot get UIManager because the instance hasn't been initialized yet`가 logcat에 남았지만 앱 crash, fatal exception, SQLite exception은 없었다.
- AVD의 timezone 때문에 자동 생성 세션명은 `2026-07-18`로 표시됐다. host 검증일은 2026-07-19이다.

## Remaining Device Coverage

- Android EAS preview artifact 생성·설치와 release-like cold start
- 실제 Android 기기의 한글 입력, 터치 감각, IME 종류별 동작
- iOS simulator와 실제 iOS 기기의 safe area, keyboard, persistence, dark mode
- font loading error를 직접 주입한 runtime recovery
- 130% 글자 크기에서 상단 설명 문구 줄바꿈 polish
