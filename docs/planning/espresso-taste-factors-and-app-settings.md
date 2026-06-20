# Espresso Taste Factors and App Settings Research

## Purpose

에스프레소 맛에 영향을 주는 조건과, 시장의 기존 앱들이 기록하거나 조정 대상으로 삼는 설정값을 정리한다.

조사 기준일: 2026-06-20

## Summary

- 시장 앱들은 대부분 `dose`, `yield`, `brew ratio`, `time`, `grind setting`, `temperature`, `tasting notes`를 기본값으로 다룬다.
- 고급 앱이나 장비 연동 앱은 `pressure`, `flow rate`, `pre-infusion`, `TDS`, `extraction yield`, `water`, `basket`, `sensor graph`까지 기록한다.
- 입문자용 빠른 진단에서는 `맛 설명`, `dose`, `yield`, `time`, `grind note`, `channeling/puck prep observation` 정도가 현실적인 상한이다.
- 앱들이 공통적으로 기록하는 값은 많지만, 맛 표현을 구조화해 “다음 샷에서 하나만 바꿀 변수”로 설명하는 경험은 여전히 차별화 여지가 있다.

## Espresso Taste Factor Map

| Factor | User-facing Field | Role | Taste Impact | MVP Treatment |
| --- | --- | --- | --- | --- |
| Bean / coffee identity | bean name, roaster, origin, process, variety | context | 향, 산미, 단맛, 바디의 기본 범위를 만든다. | 세션 선택/메모 |
| Roast range | roast range, roast date, days after roast | context | 밝은 산미/과일감, 쓴맛/초콜릿감, 추출 난이도 해석을 바꾼다. | optional context |
| Degassing / freshness | roast date, opened date, age | context/signal | 가스, crema, flow 안정성, 향 강도에 영향. | optional context |
| Dose | coffee in, dry dose | primary control | 농도, puck depth, basket fit, 추출 난이도에 영향. | quick diagnosis required |
| Yield | beverage out, liquid weight | primary control | strength, dilution, extraction level, aftertaste에 직접 영향. | quick diagnosis required |
| Brew ratio | yield / dose | derived control | ristretto/espresso/lungo 성격과 농도-추출 균형을 요약. | derived |
| Grind setting | grinder, grind size, grind note | primary control | flow, contact time, extraction, channeling risk에 영향. | optional basic |
| Brew time | extraction time, shot time | diagnostic signal | flow resistance와 grind/dose/prep 상태를 읽는 지표. | quick diagnosis required |
| Water temperature | brew temp | advanced control | 산미, 쓴맛, 향미 성분 추출 균형에 영향. | advanced mode |
| Pressure | brew pressure, max pressure | advanced control | puck resistance, flow, channeling, body에 영향. | advanced mode |
| Flow rate | flow, max flow, average flow | advanced signal/control | 추출 속도, 용해량, 압력-저항 변화를 반영. | advanced/device mode |
| Pre-infusion | pre-infusion time/pressure/weight trigger | advanced control | puck saturation, channeling risk, 초기 flow 안정성에 영향. | advanced mode |
| Distribution / leveling | WDT, distribution issue, leveling issue | prep control | sour+bitter 동시 발생, uneven extraction의 핵심 원인. | optional basic |
| Tamping | tamp pressure, tamp evenness | prep control | puck resistance, 반복성, channeling risk에 영향. | optional basic |
| Basket / portafilter | basket size, basket type, bottomless/spouted | setup context | dose range, flow, puck depth, 관찰 가능성에 영향. | deferred/advanced |
| Water composition | hardness, mineral content, water recipe | advanced context | 추출량, 산미 perception, body, scale risk에 영향. | deferred/advanced |
| TDS / extraction yield | TDS, EY% | measured output | 실제 용해 고형분과 추출 수율 판단. | advanced/refractometer |
| Sensory rating | acidity, sweetness, bitterness, body, crema, color | output | 추천 근거가 아니라 사용자의 목표/만족도 신호. | optional |
| Milk/additives | milk type, milk amount, sweetener | drink context | 에스프레소 단독 맛 판단을 흐릴 수 있음. | MVP 제외 또는 메모 |

## Practical Baseline Ranges

| Variable | Common Range / Example | Notes |
| --- | --- | --- |
| Dose | 18-20 g for many modern double shots | SCA/BGA survey found many baristas in this range. |
| Yield | around 36-40 g for 1:2 examples | Yield is better measured by weight than volume. |
| Brew ratio | 1:1.5-1:2.5 common survey range; 1:2 common baseline | Shorter ratio tends stronger/less extracted; longer ratio tends weaker/more extracted. |
| Time | 25-30 s common average; standards often cite 20-30 s | Treat as signal, not absolute target. |
| Pressure | around 9 bar common baseline | Advanced profiles may vary pressure dynamically. |
| Temperature | 195-205 F / 90.5-96.1 C common standard range | Roast and desired flavor matter. |
| Pre-infusion | used by many baristas; values vary by machine/profile | Should be advanced because definitions and timing differ. |
| Flow rate | Decent D-Flow example: max flow 1.7-2.2 ml/s | Device-dependent advanced parameter. |

## Market App Settings

| Product | Category | Settings / Values Exposed | Notes for Espresso Coach |
| --- | --- | --- | --- |
| Dial In Espresso | simple espresso journal | grind, grinder, dose, yield, extraction time, temperature, rating, tasting notes, photos; later updates include grinder, machine, basket, roast level, processing method, pre-infusion time, bean age | Strong signal that simple logs still need optional field customization. |
| Puck Yeah! | espresso tracker | dose, yield, brew ratio, shot time, grind size adjustments, water temperature, tasting notes | Overlaps with our quick diagnosis basics, but remains tracker-first. |
| BrewMate | recipe/journal | dose in, yield out, grind setting, total brew time, calculated ratio, bean roaster/origin/roast date | Shows common minimal field set for home baristas. |
| Doppio | barista notebook | bean type, grind dose, degree of grinding, tamping pressure, espresso type, grind size/time/dose, extraction time, taste/crema ratings, notes, stopwatch | Includes tamping pressure, but the experience is still record/recreate oriented. |
| EspressoPal | detailed brew journal | dose, grind size, water temperature, brew time, pressure, yield, roast level/date, bean brand/origin, milk/additives, ratings for taste/bitterness/sweetness/body/acidity/creaminess/crema/color | Good reference for advanced sensory dimensions, too dense for default mode. |
| Filtru | guide + espresso tools | espresso shot recording, taste profile, extraction calculator, pre-infusion, Bluetooth scale blueprint, flow rate, refractometer journal; suggests dose/grind adjustments after flavor rating | Closest pattern to coaching, but recommendation appears centered on dose/grind and rating. |
| Beanconqueror | broad coffee ecosystem | 30+ customizable brew parameters, grind size, brew time, water amount, temperature, water quality, smart scales, pressure devices, refractometer, pressure profiling | Powerful reference for extensibility; too broad for beginner-first MVP. |
| Smart Espresso Profiler | telemetry/profiling | dose, time, weight, brew ratio, flow rate, real-time pressure, max pressure, pressure/flow graphs, tasting notes, reference profiles | Advanced mode/device-integration reference only. |
| Decent Espresso / D-Flow | machine profile system | dose, temperature, infuse pressure, infuse weight trigger, max pressure, max flow rate, profile phases | Good future reference for advanced profiles, not MVP default. |
| Extract - Espresso Log | detailed espresso log | dose, yield, ratio, temperature, time, pressure, pre-infusion, TDS, extraction yield, rating, tasting notes, photos | Confirms TDS/EY are advanced enthusiast fields. |

## Field Frequency Synthesis

### Near-universal in espresso apps

- Bean / coffee identity
- Dose
- Yield
- Brew ratio, usually derived
- Extraction or shot time
- Grind setting
- Tasting notes or rating

### Common but not always default

- Water temperature
- Roast level / roast date / bean age
- Grinder and machine
- Photos
- Favorite/best shot marker
- Export/sync
- Pre-infusion time

### Advanced / device-dependent

- Pressure
- Flow rate
- Pressure/flow graph
- TDS
- Extraction yield
- Water hardness/mineral recipe
- Basket type/size
- Sensor integration
- Profile phase controls

## Product Implications

### Quick Diagnosis Fields

Keep the current MVP required fields:

- 자연어 맛 설명
- dose
- yield
- extraction time

Recommended optional fields:

- roast range
- grind setting or grind memo
- channeling observed
- puck prep / distribution / tamping issue
- previous shot change

### Advanced Mode Fields

Move these behind advanced mode or later integrations:

- water temperature
- pressure
- flow rate
- pre-infusion time/pressure/trigger
- TDS
- extraction yield
- basket
- water recipe
- machine profile

### Recommendation Rule Design

- Taste correction should not rely only on time. Time should support interpretation of grind, dose, yield, and flow resistance.
- If both sour and bitter/astringent signals appear, check channeling and puck prep before recommending finer/coarser grind.
- Yield and brew ratio deserve first-class treatment because they strongly affect strength and extraction together.
- App recommendations should be relative: `grind slightly finer`, `increase yield`, `keep dose fixed`, not absolute grinder numbers.
- The result should show unchanged variables, because market apps mostly log what changed but do not explicitly protect constants.

## Source Notes

- SCA / 25 Magazine survey lists espresso variables investigated by BGA/SCA: dose, output weight, brew ratio, extraction time, pressure, temperature, pre-infusion, basket size. It also reports common averages such as 18-20 g dose, 25-30 s time, 36.5 g output, 1:2 ratio, 9 bar, 200 F, and 18 g basket.
- Barista Hustle Espresso Compass frames flavor movement through extraction, strength, yield, grind setting, and extraction evenness. It is especially useful for the rule that finer grind does not endlessly improve extraction because unevenness/channeling can reverse the benefit.
- A 2023 Foods paper on flow rate, particle size, and temperature found flow rate had the strongest effect among studied parameters, but total extracted espresso mass/brew ratio created larger changes than those individual process variables.
- Market app pages confirm that existing products commonly track dose, yield, ratio, time, grind, temperature, notes, ratings, and, in advanced tools, pressure, flow, pre-infusion, TDS, extraction yield, and device graphs.

## Sources

- Specialty Coffee Association, [Defining the Ever-Changing Espresso](https://sca.coffee/sca-news/25-magazine/issue-3/defining-ever-changing-espresso-25-magazine-issue-3)
- Barista Hustle, [The Espresso Compass](https://www.baristahustle.com/the-espresso-compass/)
- Schmieder et al., [Influence of Flow Rate, Particle Size, and Temperature on Espresso Extraction Kinetics](https://www.mdpi.com/2304-8158/12/15/2871)
- Beanconqueror, [official site](https://beanconqueror.com/)
- Filtru, [official site](https://getfiltru.com/)
- Decent Espresso, [How to dial in D-Flow](https://decentespresso.com/docs/how_to_dial_in_dflow)
- Smart Espresso Profiler, [official site](https://www.naked-portafilter.com/smart-espresso-profiler/)
- Apple App Store, [Dial In Espresso](https://apps.apple.com/us/app/dial-in-espresso/id6752831404)
- Apple App Store, [Puck Yeah! Espresso Tracker](https://apps.apple.com/us/app/puck-yeah-espresso-tracker/id6758027038)
- Apple App Store, [BrewMate](https://apps.apple.com/au/app/brewmate/id6749694291)
- Apple App Store, [Doppio](https://apps.apple.com/us/app/doppio-baristas-book/id1209190124)
- Apple App Store, [EspressoPal](https://apps.apple.com/lt/app/espressopal-perfect-your-shot/id6756808797)
- Apple App Store, [Smart Espresso Profiler](https://apps.apple.com/us/app/smart-espresso-profiler/id1391707089)
- Apple App Store, [Extract - Espresso Log](https://apps.apple.com/us/app/extract-espresso-log/id6762642654)
