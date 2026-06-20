# User Journey and Screen Flow

## Purpose

MVP의 기본 경험은 입문자가 첫 화면에서 바로 빠른 진단을 시작하고, 앱이 원두별 `BeanSession` 안에 샷을 저장한 뒤 다음 샷에서 바꿀 변수 1개를 추천하는 흐름이다.

이 문서는 구현자가 화면, navigation, 상태 전이를 새로 해석하지 않도록 MVP 화면 단위와 각 화면의 데이터 계약을 고정한다.

## First Screen Decision

첫 화면은 세션 목록이 아니라 beginner-first quick diagnosis entry다.

첫 화면에서 사용자는 세션을 먼저 고르지 않아도 `빠른 진단 시작`으로 들어갈 수 있다. 기록 이력이 있는 사용자를 위해 같은 화면에 최근 세션과 `전체 세션 보기` 진입을 함께 둔다.

Decision:
- Default entry: `Home / Quick Diagnosis Entry`
- History entry: `Session List`
- 세션 없이 진단을 시작하면 제출 시 `BeanSession`을 자동 생성한다.
- 자동 생성 세션 이름은 `새 원두 세션 YYYY-MM-DD`이다.
- 자동 생성 세션의 `roastProfile`은 입력이 없으면 `{ "range": "unknown", "confidence": "unknown", "source": "unknown" }`으로 저장한다.
- 자동 생성 세션은 `Session Detail` 또는 `Session Create/Edit`에서 나중에 수정할 수 있다.

## Primary User Journey

1. 사용자는 앱을 열고 빠른 진단 진입 화면을 본다.
2. 사용자는 바로 진단을 시작하거나 기존 세션을 선택한다.
3. 현재 샷의 맛 설명, 도징량, 추출량, 추출 시간을 입력한다.
4. 필요하면 배전 범위, 분쇄도 메모, 채널링/퍽 관찰, 직전 샷 대비 변경값을 추가한다.
5. 고급 사용자는 별도 토글로 고급 입력을 열 수 있다.
6. 제출 시 앱은 세션이 없으면 `BeanSession`을 자동 생성한다.
7. 앱은 맛 설명을 `TasteTag[]`, `TastePattern[]`으로 변환한다.
8. 앱은 추출 파생값과 관찰 요약값을 계산한다.
9. 앱은 추천 순수 함수로 `RecommendationResult`를 만든다.
10. 앱은 `ShotRecord`를 추천 snapshot과 함께 저장한다.
11. 앱은 저장된 샷의 추천 결과를 보여준다.
12. 사용자는 결과에서 같은 세션의 다음 샷 입력으로 이어간다.

## Main Screen Flow

```text
Home / Quick Diagnosis Entry
  -> Quick Diagnosis Input
     -> Parser + Recommendation + Save Shot
     -> Recommendation Result
        -> Add Next Shot
        -> Quick Diagnosis Input

Home / Quick Diagnosis Entry
  -> Session List
     -> Session Detail
        -> Quick Diagnosis Input
        -> Shot Detail

Session List
  -> Session Create/Edit
  -> Session Detail
```

## Shot Creation State Transition

Shot creation is complete only after the recommendation snapshot is saved on the shot.

```text
draft input
  -> blocking validation
  -> active session lookup
  -> auto-create BeanSession if session is missing
  -> derive Extraction values
  -> derive BasicObservation summary
  -> parse tasteDescription into TasteTag[] and TastePattern[]
  -> build recommendation input
  -> calculate RecommendationResult
  -> save ShotRecord with recommendation snapshot
  -> show Recommendation Result for saved shot
```

Detailed rules:
- Blocking validation follows `quick-diagnosis-form.md`.
- Warning validation never blocks saving or recommendation.
- `ShotRecord.shotNumber` is `session.shots.length + 1` at save time.
- First shot, no change, and unknown change all store `changesFromPrevious = []`.
- If no advanced field is entered, save `ShotRecord.advancedObservation = null`.
- If taste parsing is unknown or low confidence, still save the shot and use the unknown/low-confidence recommendation path.
- The result screen reads from the saved `ShotRecord.recommendation`, not from an unsaved transient result.
- Returning from result to next shot keeps the same `BeanSession` active and opens a new blank quick diagnosis draft.

## MVP Screens

### 1. Home / Quick Diagnosis Entry

Purpose:
- Let a beginner start diagnosis immediately.
- Give returning users a short path back to recent session history.

Required data:
- Recent active `BeanSession[]`, ordered by last update.
- For each recent session: `id`, `name`, `roastProfile.range`, latest `ShotRecord.shotNumber`, latest `RecommendationResult.primary.variable` if a shot exists.

Primary actions:
- `빠른 진단 시작`: opens `Quick Diagnosis Input` without requiring a selected session.
- `기존 세션 이어가기`: opens the selected `Session Detail` or opens `Quick Diagnosis Input` with that session active.
- `전체 세션 보기`: opens `Session List`.

State transitions:
- `빠른 진단 시작` -> `Quick Diagnosis Input` with `sessionId = null`.
- Select recent session -> `Session Detail`.
- Continue recent session -> `Quick Diagnosis Input` with selected `sessionId`.

Empty state:

```text
아직 기록한 원두 세션이 없습니다.
빠른 진단으로 첫 샷을 기록하세요.
```

Loading state:
- Recent session list may show a loading placeholder.
- `빠른 진단 시작` remains available because a session can be auto-created on submit.

Error state:
- If recent sessions cannot be loaded, show the error near the history area and keep `빠른 진단 시작` available.

### 2. Session List

Purpose:
- Show all saved bean sessions and let the user resume previous dialing history.

Required data:
- `BeanSession[]` with `id`, `name`, optional bean metadata, `roastProfile`, `status`, `updatedAt`.
- Latest shot summary per session if available: latest `shotNumber`, latest primary recommendation variable, latest extraction values.

Primary actions:
- Open `Session Detail`.
- Create a new session.
- Edit an existing session.
- Start a new shot in an existing session.

State transitions:
- Open session -> `Session Detail`.
- Create -> `Session Create/Edit` in create mode.
- Edit -> `Session Create/Edit` in edit mode.
- Start shot -> `Quick Diagnosis Input` with selected `sessionId`.

Empty state:

```text
아직 기록한 원두 세션이 없습니다.
빠른 진단으로 첫 샷을 기록하세요.
```

Loading state:
- Show list loading while sessions are fetched.

Error state:
- Show retry affordance for loading sessions.
- Do not delete or overwrite local draft input because session loading failed.

### 3. Session Create/Edit

Purpose:
- Create or update the `BeanSession` context used by shot records.
- Let users rename automatically created sessions and add roast context later.

Required data:
- Create mode: draft `BeanSession` fields.
- Edit mode: existing `BeanSession`.

Fields:
- Required: `name`
- Optional: bean name, roaster, roasting date, `roastProfile.range`, `roastProfile.label`, memo

Primary actions:
- Save session.
- Cancel and return to previous screen.
- In edit mode, continue diagnosis in this session.

State transitions:
- Create save -> `Session Detail` for the created session.
- Edit save -> previous `Session Detail` or `Session List`.
- Continue diagnosis -> `Quick Diagnosis Input` with saved `sessionId`.

Default behavior:
- If `roastProfile.range` is not selected, save unknown roast default.
- The screen may be skipped in the default quick diagnosis path because auto-create handles missing session context.

Empty state:
- Not applicable in create mode.

Loading state:
- Edit mode may show loading while existing session data is fetched.

Error state:
- Missing name blocks save.
- Save failure keeps the user on the form with the draft intact.

### 4. Session Detail With Shot History

Purpose:
- Show one bean session and its shot history so the user can compare attempts and continue dialing.

Required data:
- `BeanSession` including `name`, optional bean metadata, `roastProfile`, `status`.
- `ShotRecord[]` for the session, ordered by `shotNumber` or `pulledAt`.
- For each shot row: `shotNumber`, `extraction.tasteDescription`, `doseGrams`, `yieldGrams`, `brewSeconds`, `brewRatio`, `brewTimeBand`, `brewRatioBand`, `tasteTags`, `recommendation.primary`, `createdAt` or `pulledAt`.

Primary actions:
- Add next shot.
- Open shot detail.
- Edit session.

State transitions:
- Add next shot -> `Quick Diagnosis Input` with this `sessionId`.
- Open shot -> `Shot Detail`.
- Edit session -> `Session Create/Edit` in edit mode.

Empty state:

```text
아직 이 세션에 기록된 샷이 없습니다.
첫 샷을 기록해보세요.
```

Loading state:
- Show session header and shot history loading independently when possible.

Error state:
- If session load fails, show retry.
- If shot history fails but session loads, keep session actions visible and show retry for shot history.

### 5. Quick Diagnosis Input

Purpose:
- Collect the minimum shot input needed to create a saved `ShotRecord` and recommendation.

Required data:
- Active `sessionId` or `null`.
- If active session exists: `BeanSession.roastProfile`, previous latest `ShotRecord` for `hasPreviousShot` and comparison context.
- Quick diagnosis draft fields from `quick-diagnosis-form.md`.

Required fields:
- `tasteDescription`
- `doseGrams`
- `yieldGrams`
- `brewSeconds`

Optional basic fields:
- `roastProfile.range`
- `roastProfile.label`
- `grindNote`
- `prepObservations`
- `changesFromPrevious`

Advanced opt-in fields:
- `pressureBars`
- `temperatureCelsius`
- `daysOffRoast`
- `waterNote`
- `equipmentNote`
- `preinfusionNote`

Primary actions:
- Submit diagnosis.
- Change or select session.
- Save/update session roast context if provided.
- Expand optional basic observations.
- Toggle advanced mode.

State transitions:
- Submit valid draft -> shot creation pipeline -> `Recommendation Result`.
- Select existing session -> stay on `Quick Diagnosis Input` with selected session context.
- Cancel from an existing session -> previous `Session Detail`.
- Cancel from no session -> `Home / Quick Diagnosis Entry`.

First-shot behavior:
- Hide previous-shot change input.
- Save `changesFromPrevious = []`.
- Result labels comparison as first-shot diagnosis.

Second-or-later behavior:
- Show previous-shot change input in a collapsed optional area.
- Only structured `ShotChange` entries affect comparison.
- `none`, `unknown`, or no input stores `changesFromPrevious = []`.

Advanced mode behavior:
- Advanced mode appears inside `Quick Diagnosis Input` behind an explicit toggle.
- It is off by default.
- Empty advanced fields do not block submit.
- Advanced fields use their own blocking validation only when a value is entered.
- Advanced input does not replace the required four-field quick diagnosis path.
- `advanced_condition` cannot win primary in MVP; advanced values are supporting context only.

Loading state:
- Submitting shows a pending state through validation, parsing, recommendation, and save.
- While pending, prevent duplicate submit for the same draft.

Error state:
- Blocking validation errors use the copy from `quick-diagnosis-form.md`.
- Parser unknown/low confidence is not an error.
- Recommendation fallback is not an error.
- Save failure keeps the draft and allows retry.

### 6. Recommendation Result

Purpose:
- Show the saved shot recommendation in beginner-friendly copy and let the user continue to the next shot.

Required data:
- Saved `ShotRecord` with required `recommendation`.
- Parent `BeanSession`.
- Previous shot summary when `shotNumber > 1`.

Required sections:
- Next shot primary action from `recommendation.primary`.
- Rationale from `recommendation.rationale`.
- Keep variables from `recommendation.keepVariables`.
- Uncertainty from `recommendation.uncertainty`.
- Alternatives from `recommendation.alternatives`.
- Current shot summary from `extraction`, `tasteTags`, and key observations.
- Previous-shot comparison when structured `changesFromPrevious` exists.

Primary actions:
- Add next shot.
- View saved shot detail.
- Return to session detail.

State transitions:
- Add next shot -> `Quick Diagnosis Input` with the same `sessionId` and a blank draft.
- View saved shot detail -> `Shot Detail`.
- Session detail -> `Session Detail`.

Display rules:
- Use `recommendation-result-copy.md` templates.
- Show only one primary action as the action to execute now.
- Alternatives are candidates, not simultaneous instructions.
- If `primary.variable = no_change`, show balanced shot copy.
- If taste parsing is unknown or low confidence, show unknown/low-confidence copy and still allow next shot.
- `brewSeconds` and `brewTimeBand` can appear as rationale signals, not as a variable to change.

Loading state:
- Normally skipped because the result opens only after the shot is saved.
- If opened directly by URL or deep link, load the saved `ShotRecord` and show loading until available.

Error state:
- If the shot cannot be loaded, show retry and link back to `Session Detail`.
- If a saved shot somehow lacks `recommendation`, treat it as invalid stored data and do not invent a new result in the screen layer.

### 7. Shot Detail

Purpose:
- Show the complete saved record for one shot, including the recommendation snapshot that was generated at save time.

Required data:
- `ShotRecord` with `sessionId`, `shotNumber`, `extraction`, `basicObservation`, `advancedObservation`, `changesFromPrevious`, `tasteTags`, `tastePatterns`, `recommendation`, timestamps.
- Parent `BeanSession` name and roast context.

Primary actions:
- Return to session detail.
- Add next shot in the same session.
- Open recommendation result for this shot.

State transitions:
- Back -> `Session Detail`.
- Add next shot -> `Quick Diagnosis Input` with same `sessionId`.
- View recommendation -> `Recommendation Result` for this saved shot.

Shown information:
- Required input values and derived extraction values.
- Optional basic observations and derived summaries.
- Advanced observation only if not `null`.
- Previous-shot change entries if any.
- Taste tags and taste patterns.
- Recommendation primary, rationale, uncertainty, alternatives, keep variables.

Empty state:
- Not applicable for an existing shot route.

Loading state:
- Show loading while shot data is fetched.

Error state:
- If shot load fails, show retry and link back to `Session Detail`.

## Cross-Screen State Rules

- `BeanSession.roastProfile` is required in storage even when unknown.
- Quick diagnosis can update session roast context when the user selects roast range during input.
- Session history always reads saved `ShotRecord` data; it does not recalculate recommendations for old shots.
- Result and shot detail show the saved recommendation snapshot.
- Draft input is screen state until submit succeeds.
- A failed save must not create a visible shot row.
- A successful save must create exactly one `ShotRecord` with one `RecommendationResult.primary`.
- Returning from result to next shot keeps session context but clears shot-specific draft fields.
- Navigation must never require advanced mode to complete the default flow.

## Empty and Edge States

### No Session

Use the empty copy in Home and Session List. Quick diagnosis may still start without a session and auto-create one at submit.

### First Shot in Session

Behavior:
- Diagnose from current input only.
- Hide previous-shot change input.
- Store `changesFromPrevious = []`.
- Result shows `첫 샷 기준 진단` instead of previous-shot comparison.

### Second or Later Shot

Behavior:
- Show previous-shot change input as optional collapsed input.
- Use structured `ShotChange[]` only when the user selects a real changed variable.
- If no structured change exists, recommendation still uses current shot values and saved session context.

### Missing Optional Observations

Behavior:
- Do not block diagnosis.
- Store defaults from `quick-diagnosis-form.md`.
- Reflect missing observations in `recommendation.uncertainty` when applicable.

Example:

```text
채널링이나 퍽 상태를 보지 못했다면, 다음 샷에서 흐름이 한쪽으로 치우치는지도 함께 봐주세요.
```

### Unknown Taste Description

Behavior:
- Do not block diagnosis.
- Store `tasteTags = []` and `unknown_description` pattern according to the parsing contract.
- Use the unknown/low-confidence result copy.

### Balanced Shot

Behavior:
- Store `RecommendationAction.variable = no_change`.
- Result recommends keeping current settings.
- Add next shot remains available so the user can confirm consistency.

## MVP Decisions

- 첫 화면은 빠른 진단 중심이다.
- 세션 목록과 세션 상세는 history/resume path로 유지한다.
- 세션 없이 빠른 진단을 시작할 수 있고, 제출 시 자동으로 `BeanSession`을 만든다.
- 빠른 진단은 필수값 4개만으로 완료할 수 있다.
- 추천 결과는 저장된 `ShotRecord.recommendation` snapshot에서 표시한다.
- 사용자는 결과에서 같은 세션의 다음 샷 입력으로 바로 이어갈 수 있다.
- 고급 입력은 `Quick Diagnosis Input` 안의 opt-in toggle이며 기본 흐름을 막지 않는다.
- 각 샷은 저장 시점의 parser output, recommendation output, input warnings를 함께 저장한다.
- 한 화면에서 실행하라고 말하는 primary action은 항상 1개다.
- 장기 통계 대시보드, 커뮤니티, 레시피 공유, 쇼핑, 센서 연동은 MVP 화면 흐름에 포함하지 않는다.
