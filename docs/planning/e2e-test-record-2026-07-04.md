# E2E Test Record 2026-07-04

## Scope

2026-07-04에 Espresso Coach web export 산출물을 대상으로 Playwright E2E를 수행했다.

이 기록은 현재 web target 기준의 로컬 런타임 검증 결과다. web target은 production web app이 아니라 smoke test와 bundle 검증용 target이며, `createMemoryRepository`를 사용하므로 reload 또는 앱 재시작 후 persistence 검증으로 보지 않는다.

## Environment

| Item | Value |
| --- | --- |
| Repo | `/Users/smlee/espresso-coach` |
| Date | 2026-07-04 |
| Runtime target | Expo web export |
| Browser automation | Playwright CLI wrapper |
| Browser server | `npx --yes serve@latest -s dist -l 4173` |
| Viewports | Desktop `1280x900`, mobile `390x844` |

## Commands

```bash
npx expo export --platform web
npx --yes serve@latest -s dist -l 4173
```

정적 서버는 SPA fallback이 필요하다. `python3 -m http.server --directory dist`는 `/session/...`, `/shot/...` deep route에서 `index.html`로 fallback하지 않아 404를 반환하므로 E2E 서버로 사용하지 않는다.

## Desktop Scenario

| Case | Steps | Expected | Result |
| --- | --- | --- | --- |
| Empty submit validation | 첫 화면에서 값 없이 `추천 받기` 클릭 | 맛 입력 오류와 숫자 오류 3개 표시, root URL 유지 | Pass |
| First shot recommendation | 세션명, 원두명, 로스터, `중배전`, 맛 `시고 끝맛이 떫다`, `18g`, `36g`, `28s` 입력 후 추천 생성 | `/shot/...` 이동, 추천 상세 표시 | Pass |
| Recommendation detail content | 추천 상세 확인 | `채널링 · 확인`, `1:2.0`, `18g`, `36g`, `28s`, 맛 기록 표시 | Pass |
| Home state after first shot | 뒤로 가기 | 현재 세션 `테스트 세션`, 최근 기록 1건, `샷 02`, 최근 샷 `01` 표시 | Pass |
| Second shot number | 같은 세션에 `밍밍하고 흐리다`, `18g`, `45g`, `22s` 입력 후 추천 생성 | 두 번째 샷 저장, 홈 복귀 후 최근 기록 2건, `샷 03`, 최근 샷 `02` 표시 | Pass |
| Session list | `전체 세션 보기` 클릭 | `/sessions`, `진행 중`, `테스트 세션`, `Guatemala Test · 중배전` 표시 | Pass |
| Session edit action | 세션 카드의 `수정` 클릭 | 세션 상세로 이동하지 않고 `/sessions`에서 `세션 수정` 편집 모드 유지 | Pass after fix |
| Session edit save | 세션명 `테스트 세션 수정`, 로스터 `Updated Roaster` 저장 | 수정된 세션명이 목록에 표시 | Pass |
| Use session | `진단에 사용` 클릭 | `/?sessionId=...`로 이동, 수정된 세션과 최근 기록 2건 표시 | Pass |

## Mobile And Route Edge Scenarios

| Case | Steps | Expected | Result |
| --- | --- | --- | --- |
| Mobile root layout | viewport `390x844`, root 진입 | 빠른 진단과 CTA 표시, horizontal overflow 없음 | Pass |
| Mobile quick diagnosis | 모바일에서 `모바일 세션`, `Mobile Bean`, `약중배전`, `쓰고 오래 남는다`, `18g`, `32g`, `35s` 입력 후 추천 생성 | `/shot/...` 이동, 추천 상세와 `32g`, `35s` 표시 | Pass |
| Mobile sessions direct route | `/sessions` 직접 진입 | 세션 목록 화면 표시, horizontal overflow 없음 | Pass |
| Missing shot route | `/shot/not-real-shot` 직접 진입 | `샷 기록을 찾을 수 없습니다.` 표시 | Pass |
| Missing session route | `/session/not-real-session` 직접 진입 | `세션 기록을 찾을 수 없습니다.` 표시 | Pass |

## Additional E2E Methods

기존 visible text / role 기반 happy path 외에 아래 3가지 방식으로 추가 검증했다.

### Method 1. Keyboard And Focus E2E

마우스 click/fill 중심 검증과 별도로, focus와 keyboard input 중심으로 빠른 진단을 수행했다.

| Case | Steps | Expected | Result |
| --- | --- | --- | --- |
| Keyboard form entry | placeholder로 필드를 focus한 뒤 keyboard typing으로 세션명, 원두명, 로스터, 맛, 도징량, 추출량, 시간 입력 | 입력값이 화면 상태에 반영됨 | Pass |
| Keyboard button activation | `중배전`, `추천 받기` 버튼에 focus 후 `Enter` 입력 | 배전 선택 및 추천 생성 실행 | Pass |
| Keyboard-created shot detail | `키보드 세션`, `Keyboard Bean`, `Keyboard Roaster`, `시고 날카롭다`, `18g`, `30g`, `24s` 입력 | `/shot/...` 이동, 추천 상세와 입력값 표시 | Pass |
| Back navigation after keyboard flow | 추천 상세에서 browser back | root로 복귀, `키보드 세션`, 최근 기록 1건 표시 | Pass |

### Method 2. HTTP And SPA Fallback Contract

UI 렌더링 대신 browser `fetch`로 static server 응답 계약을 확인했다.

| Path | Expected | Result |
| --- | --- | --- |
| `/` | HTTP 200, `text/html`, Expo root html 포함 | Pass |
| `/sessions` | HTTP 200, `text/html`, Expo root html 포함 | Pass |
| `/shot/not-real-shot` | HTTP 200, `text/html`, Expo root html 포함 | Pass |
| `/session/not-real-session` | HTTP 200, `text/html`, Expo root html 포함 | Pass |
| `/metadata.json` | HTTP 200, `application/json` | Pass |
| `/favicon.ico` | HTTP 200, image content-type, html fallback 아님 | Pass |

### Method 3. Viewport And Layout Metric E2E

DOM metric 기반으로 viewport별 horizontal overflow, offscreen button, 너무 작은 button hit target을 검사했다.

| Viewport | Routes | Expected | Result |
| --- | --- | --- | --- |
| `320x640` small phone | `/`, `/sessions`, `/shot/not-real-shot`, `/session/not-real-session` | expected text 표시, document/body scroll width가 viewport 이하, offscreen button 없음, 30px 미만 button 없음 | Pass |
| `390x844` phone | `/`, `/sessions`, `/shot/not-real-shot`, `/session/not-real-session` | expected text 표시, document/body scroll width가 viewport 이하, offscreen button 없음, 30px 미만 button 없음 | Pass |
| `768x1024` tablet | `/`, `/sessions`, `/shot/not-real-shot`, `/session/not-real-session` | expected text 표시, document/body scroll width가 viewport 이하, offscreen button 없음, 30px 미만 button 없음 | Pass |
| `1440x900` desktop | `/`, `/sessions`, `/shot/not-real-shot`, `/session/not-real-session` | expected text 표시, document/body scroll width가 viewport 이하, offscreen button 없음, 30px 미만 button 없음 | Pass |

## Bug Found During E2E

세션 카드 내부의 `수정` 버튼 클릭 시 부모 `Link` navigation이 같이 실행되어 `/session/...` 상세 화면으로 이동하는 문제가 발견됐다.

Root cause:

- 세션 카드 전체가 `Link asChild`로 감싸져 있었다.
- 내부 `수정`/`진단에 사용` 버튼의 `event.stopPropagation()`만으로 web anchor navigation을 막지 못했다.

Fix:

- 세션 카드 이동을 outer `Pressable`의 `router.push`로 변경했다.
- 내부 버튼은 `stopPropagation()`과 `preventDefault()`를 모두 호출한다.

Touched file:

- `src/native/screens/sessions-screen.tsx`

## Verification After Fix

| Check | Result |
| --- | --- |
| Desktop E2E scenario | Pass |
| Mobile/route edge E2E scenario | Pass |
| Keyboard/focus E2E method | Pass |
| HTTP/SPA fallback contract E2E method | Pass |
| Viewport/layout metric E2E method | Pass |
| Browser console errors | 0 errors, 0 warnings |
| `npm run lint` | Pass |
| `npm test` | Pass, 8 test files / 36 tests |
| `npm audit` | Pass, 0 vulnerabilities |
| `npm exec expo-doctor` | Pass, 18/18 checks |
| `npx expo export --platform web` | Pass |
| `git diff --check` | Pass |

## Service Improvement Follow-Up E2E

서비스 관점 개선 작업 후 같은 web export 산출물을 대상으로 추가 smoke를 수행했다.

| Case | Steps | Expected | Result |
| --- | --- | --- | --- |
| Taste parse preview | 맛 입력에 `시고 끝맛이 떫다` 입력 | `맛 해석` preview에 `신맛 · 높음`, `떫고 텁텁함 · 높음` 표시 | Pass |
| Same-session next shot | 추천 상세에서 `다음 샷 기록` 클릭 | root로 돌아가되 URL이 `/?sessionId=...`를 유지하고 같은 세션의 `샷 02`, 최근 기록 1건 표시 | Pass |
| Previous-shot feedback options | 다음 샷 화면에서 직전 샷 변경값으로 `분쇄도` 선택 | `변경 방향/결과` 영역에 `개선됨`, `나빠짐` 표시 | Pass |
| Browser console errors | 추가 smoke 후 console error 확인 | errors 0, warnings 0 | Pass |

## Cleanup

검증 후 임시 산출물과 프로세스를 정리했다.

- `dist/` 삭제
- `.playwright-cli/` 삭제
- Playwright browser session 종료
- local static server 종료

## Limits

아래는 이 E2E에서 검증하지 못했다.

- Expo Go 실기기 runtime
- iOS simulator 또는 Android emulator runtime
- SQLite persistence의 앱 재시작 후 유지
- EAS preview build artifact 설치
- native safe area, keyboard, status bar, Android back behavior
