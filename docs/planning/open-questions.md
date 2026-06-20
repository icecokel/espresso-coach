# Open Questions

현재 MVP 구현 시작을 막는 open question은 없다. 아래 항목은 기존 open question의 확정 상태를 기록한다.

## Product

- 첫 MVP는 웹앱, 모바일앱, 또는 둘 다 중 무엇으로 시작할 것인가?  
  - 확정: 첫 MVP는 web app으로 시작한다. 모바일 앱, 네이티브 wrapper, 앱스토어 배포는 MVP 이후 재검토한다.
- 사용자는 로그인 없이 로컬 저장만으로 시작할 수 있는가?  
  - 확정: MVP는 로그인 없이 시작하고, 계정 생성/로그인/로그아웃/공유 기능은 넣지 않는다.
- 원두 세션은 어떤 필드까지 필수로 받을 것인가?  
  - 확정: 세션 이름만 필수. 이름 없이 빠른 진단을 시작하면 `새 원두 세션 YYYY-MM-DD`로 자동 생성하고 나중에 수정 가능.
- 결과 화면에서 추천의 불확실성을 어떤 문구와 UI로 표현할 것인가?  
  - 확정: 다음 조정안, 근거, 대안 우선순위, 유지할 값, 불확실성 안내를 함께 표시하고 `recommendation-result-copy.md` 템플릿을 따른다.

## Taste Tags

- 기본 맛 태그는 어디까지 둘 것인가?  
  - 확정: `sour`, `bitter`, `watery`, `astringent`, `harsh`, `hollow`, `balanced`.
- 복합 표현, 예: "처음엔 시고 끝은 쓰다"를 어떤 구조로 저장할 것인가?  
  - 확정: 여러 `TasteTag` 배열과 파생 `TastePattern`으로 저장. `mixed`는 저장 태그로 쓰지 않음.
- 강도는 3단계, 5단계, 또는 자연어 confidence로 둘 것인가?  
  - 확정: 강도 3단계 + confidence 3단계.

## Recommendation Logic

- 배전 범위를 추천 로직에서 어느 정도 가중치로 반영할 것인가?  
  - 확정: 배전 범위를 먼저 해석 컨텍스트로 보고, 그 다음 추출 변수와 맛 태그를 판단한다. 배전 범위만으로 추천을 결정하지는 않음.
- 과소추출, 과다추출, 채널링, 퍽 준비 문제를 어떤 우선순위로 판단할 것인가?  
  - 확정: 명시적 채널링/준비 문제, 복합 맛 태그, 단일 맛 태그와 시간/비율 일치, 고급 변수 순. 동점이면 준비 문제, 쉬운 조정 변수, 고급 변수 후순위 순.
- 입력값이 부족할 때 어떤 기본 가정을 사용할 것인가?  
  - 확정: 선택 관찰값은 `unknown`으로 두고 불확실성 문구에 반영한다.
- 직전 샷 대비 변화가 있을 때 추천 우선순위를 어떻게 갱신할 것인가?  
  - 확정: `changesFromPrevious` 구조화 입력이 있을 때만 비교. 이전 변경이 문제를 키웠으면 같은 방향 조정을 반복하지 않음.

## Data

- 배전 정도는 어떤 구조로 저장할 것인가?  
  - 확정: `BeanSession.roastProfile` required. 범위, 라벨, 확신도, 출처로 저장하고 모르면 `unknown` default를 사용.
- 실제 샷 추출 시각과 기록 생성 시각을 분리할 것인가?  
  - 확정: `pulledAt`과 `createdAt`을 분리한다.
- 샷 기록은 로컬 스토리지부터 시작할 것인가, 서버 DB부터 시작할 것인가?  
  - 확정: 브라우저 local-first 저장으로 시작한다. 물리 저장소는 IndexedDB를 기본으로 사용하고, 앱 내부에는 storage adapter 또는 repository layer를 둔다.
- 원두별 세션과 샷 기록을 어떤 스키마로 나눌 것인가?  
  - 확정: `BeanSession`과 `ShotRecord`로 분리. 직전 샷 비교용 `ShotChange`를 샷 기록에 포함.
- 고급 모드 데이터는 기본 스키마에 nullable 필드로 둘 것인가, 별도 advanced object로 둘 것인가?  
  - 확정: 별도 `advancedObservation` object로 두고, 고급 입력이 없으면 `null`로 저장.

## Implementation

- 프론트엔드 스택은 무엇으로 할 것인가?  
  - 확정: React SPA + TypeScript + Vite-based scaffold로 시작한다.
- LLM 호출은 MVP에서 실제 API로 붙일 것인가, mock classifier로 시작할 것인가?  
  - 확정: MVP에서는 실제 LLM API를 붙이지 않는다. 규칙 기반 parser를 먼저 구현하고, 필요하면 낮은 confidence case를 표시하는 mock 또는 optional interface만 남긴다.
- 추천 rule table의 물리적 저장 위치는 어디에 둘 것인가?  
  - 확정: 추천 rule table과 action catalog는 typed TypeScript constants로 둔다.
