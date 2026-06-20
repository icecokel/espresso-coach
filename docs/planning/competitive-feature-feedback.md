# Competitive Feature and Feedback Research

## Purpose

경쟁 앱의 기능, 공개 평점/리뷰 신호, 사용자가 불편해하는 포인트를 정리한다. 이 문서는 제품 차별화와 MVP 우선순위 판단에 사용한다.

## Source Policy

- App Store와 공식 웹사이트는 기능, 평점, 공개 리뷰 확인에 사용한다.
- Reddit과 외부 리뷰 페이지는 사용자 불편 신호를 보조적으로 확인하는 데 사용한다.
- 공개 자료에서 직접 확인되지 않은 내용은 `inferred risk`로 구분한다.

## Feature Comparison

| Product | Rating Signal | Main Features | Guidance Level | Key Gap vs Espresso Coach |
| --- | --- | --- | --- | --- |
| Dial In Espresso | App Store 4.8, 24 ratings | bean/shot journal, grind, grinder, dose, yield, time, temperature, rating, notes, photos, export, iCloud sync | low/medium | 기록 중심. 맛 표현을 구조화해 다음 실험으로 바꾸는 코칭은 약함 |
| Lumo Coffee | Website claims 4.9 user rating, 230+ users | bag scanner, equipment-matched recipes, taste-based micro-adjustments, recipe vault, milk drink mode | high | 추천형 직접 경쟁. 다만 closed “smart” engine 성격이 강함 |
| BeanDial | Public site positioning | espresso shot as data point, next step, freshness tracking, saved settings | high | 직접 경쟁. 구체적인 rule transparency 확인 필요 |
| Puck Yeah! | App Store 4.8, 9 ratings | shot tracker, dose/yield/ratio/time, grind, water temp, tasting notes, charts, cost, roast slider, predictive dial-in | medium/high | 기능이 넓음. 입문자용 빠른 진단이 복잡해질 수 있음 |
| Beanconqueror | App Store 4.9, 135 ratings | multi-method brew tracking, beans, roasts, water, grinders, scales, pressure/flow profiling, graphs, Apple Health | low/medium | 강력하지만 복잡. 초보의 맛 표현 기반 코칭은 중심이 아님 |
| Doppio | App Store 4.7, 33 ratings | coffee management, espresso log, grind/dose/time, taste/crema rating, stopwatch, CSV export, custom criteria | low | 기록/재현 중심. 추천보다는 노트북 역할 |
| Dialed In | App Store 5.0, 1 rating | shot time, dose, yield, grind size, notes, timer, optional rating/notes | low | 초기/소규모 신호. 코칭보다 logging companion |
| Beanwise | Website positioning | brew log, bean library, equipment, roasters, recipes, ratings, tasting notes | low | coffee journal 중심 |
| Brewio | Website positioning | multi-method journal, timer, ratio calculator, bean stash, EY%, taste profile | low | espresso-only coach가 아님 |
| HomeBarista | Website positioning | many parameters, inventory, AI bag scanning, sensory scoring, espresso dial-in tools | medium | 고기능 tracker. 입문자에게 과밀할 수 있음 |
| iopa | Website positioning | high-frequency yield/flow/time/pre-infusion capture, pressure inference, archive | medium | 고급 telemetry 도구. MVP 타깃보다 상급자 지향 |

## Confirmed User Pain Points

### 1. Logging apps can still have UX friction

Evidence:
- A Reddit user evaluating Dial In Espresso said the add-new-beans button placement made the experience poor.

Source:
- Reddit, [I wanted a better espresso app so I built one](https://www.reddit.com/r/iosdev/comments/1t6iye5/i_wanted_a_better_espresso_app/)

Product implication:
- 빠른 진단 진입은 첫 화면의 가장 큰 action이어야 한다.
- 원두/세션 생성은 필수 진입 장벽이 아니라 자동 생성 가능해야 한다.
- 빠른 기록은 필수값 4개와 선택값 접힘 구조를 유지한다.

### 2. Device connectivity adds power and pain

Evidence:
- Beanconqueror App Store review에서 journal은 좋지만 scale pairing/connectivity가 불편하다는 리뷰가 확인된다.
- Beanconqueror 리뷰/설명에는 Bluetooth scales, pressure profile devices, flow/pressure profiling 같은 강력한 연동 기능이 강조된다.

Sources:
- App Store reviews, [Beanconqueror ratings and reviews](https://apps.apple.com/us/app/beanconqueror/id1445297158?platform=iphone&see-all=reviews)
- App Store, [Beanconqueror](https://apps.apple.com/us/app/beanconqueror/id1445297158)

Product implication:
- MVP에서 Bluetooth scale, pressure sensor, machine integration은 제외한다.
- 수동 입력만으로 완결되는 진단 경험을 먼저 만든다.
- 고급 장비 연동은 나중에 붙이더라도 기본 진단 흐름을 깨면 안 된다.

### 3. Users want sync, export, and data ownership

Evidence:
- Beanconqueror 리뷰에서 iCloud sync 요청이 확인된다.
- Dial In Espresso는 CSV/PDF export와 iCloud sync를 기능으로 내세운다.
- Doppio는 CSV export를 기능으로 제공한다.

Sources:
- App Store reviews, [Beanconqueror ratings and reviews](https://apps.apple.com/us/app/1445297158?platform=ipad&see-all=reviews)
- App Store, [Dial In Espresso](https://apps.apple.com/us/app/dial-in-espresso/id6752831404)
- App Store, [Doppio](https://apps.apple.com/us/app/doppio-baristas-book/id1209190124)

Product implication:
- 데이터 구조는 저장소 독립이어야 한다.
- export/sync는 MVP 첫 구현 범위는 아니어도 deferred requirement로 남긴다.
- 추천 결과와 matched rule ID를 저장해 나중에 export해도 의미가 유지되게 한다.

### 4. Required ratings can break record visibility

Evidence:
- Doppio App Store review에서 espresso shot을 rating하지 않으면 coffee tab에 표시되지 않는 문제가 언급된다.

Source:
- App Store, [Doppio](https://apps.apple.com/us/app/doppio-baristas-book/id1209190124)

Product implication:
- 맛 점수/rating은 필수로 두지 않는다.
- 자연어 맛 설명은 빠른 진단 필수값이지만, 점수화는 선택 또는 자동 파생으로 둔다.
- 기록 목록은 rating 유무와 무관하게 표시되어야 한다.

### 5. Date/time editing matters for backfilled logs

Evidence:
- Puck Yeah App Store reviews snippet에서 shot 추가 시 date/time을 수정할 수 없는 점이 deal breaker로 언급된다.

Source:
- App Store reviews, [Puck Yeah ratings and reviews](https://apps.apple.com/us/app/6758027038?platform=iphone&see-all=reviews)

Product implication:
- `createdAt`과 사용자가 수정 가능한 `pulledAt`을 분리할 필요가 있다.
- 데이터 구조에 현재는 `createdAt/updatedAt`만 있으므로, 샷 실제 추출 시각을 별도 필드로 추가 검토한다.

### 6. Generic crowd-sourced grind settings are unreliable

Evidence:
- Reddit discussion에서 grinder, basket, machine, bean age, barista, taste 등 조건이 달라 grind setting 공유가 유용하지 않을 수 있다는 의견이 확인된다.

Source:
- Reddit, [Would you use an app that helps you dial in beans based on other user's setups?](https://www.reddit.com/r/espresso/comments/s3htpj)

Product implication:
- 커뮤니티 기반 “정답 레시피”는 MVP 범위에서 제외한다.
- 같은 원두라도 사용자의 장비와 이전 샷 맥락을 우선한다.
- 추천은 absolute grind setting이 아니라 상대적 next step으로 제안한다.

### 7. Users struggle because espresso dial-in feels wasteful and hard

Evidence:
- Reddit thread에서 dial-in이 어렵고, 여러 샷을 버리며 반복해야 빨리 배운다는 현실적인 조언이 확인된다.
- Lumo도 마케팅에서 wasted shots and guessing을 핵심 pain으로 잡는다.

Sources:
- Reddit, [My newbie coffee station, damn it's hard to dial in espresso](https://www.reddit.com/r/espresso/comments/rb8tkz)
- Lumo Coffee, [official site](https://lumo.coffee/)

Product implication:
- 우리 제품은 “콩 낭비를 줄인다”보다 “한 번에 하나씩 원인을 좁힌다”를 중심 메시지로 둔다.
- 결과 화면은 다음 실험 하나, 유지할 변수, 불확실성을 반드시 보여준다.

## Inferred Risks From Competitor Landscape

### Risk: Feature creep

Competitors like Beanconqueror, HomeBarista, Puck Yeah, and iopa show many useful features: telemetry, maps, cost, inventory, roaster directories, charts, devices, community, photos, caffeine tracking.

MVP response:
- 기능 수로 경쟁하지 않는다.
- 빠른 진단, 맛 태그, 배전 컨텍스트, next-step coach에 집중한다.

### Risk: Black-box recommendations

Lumo and similar smart recipe tools emphasize smart or physics-based recommendations. Users may get fast answers but not always understand why.

MVP response:
- 추천 rule ID, rationale, uncertainty를 저장한다.
- 사용자에게 “왜 이 변수를 먼저 바꾸는지”를 설명한다.

### Risk: Beginner overwhelm

Many coffee tools are built for highly engaged users who enjoy variables. Espresso Coach targets beginners first.

MVP response:
- first screen = quick diagnosis.
- advanced mode is opt-in.
- roast range is optional, not required.
- no sensor/device dependency.

## Opportunity Map

| User Pain | Competitor Pattern | Espresso Coach Response |
| --- | --- | --- |
| 기록은 되지만 다음에 뭘 바꿀지 모르겠음 | Journals/loggers | taste-to-next-shot recommendation |
| 변수와 장비가 너무 많음 | Power tools/telemetry | beginner quick diagnosis |
| 추천이 블랙박스처럼 느껴짐 | Smart recipe apps | rule rationale + uncertainty |
| 커뮤니티 레시피가 내 장비에 안 맞음 | shared settings | session-local relative changes |
| 날짜/평점/필드 요구가 불편함 | rigid logging forms | minimal required fields + optional details |
| 장비 연결이 불안정함 | device integrations | manual-first MVP |

## MVP Requirements Added From Feedback

- Shot record should support an editable actual pull time, separate from creation/update timestamps.
- Rating must not be required for a shot to appear in session history.
- Primary recommendation must be relative, not an absolute grinder setting.
- Export/sync should remain deferred but data structure must not block it.
- The app must work fully without Bluetooth scales, sensors, machine integrations, or account login.

