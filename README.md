# Espresso Coach

**에스프레소 코치**는 홈 카페 입문자와 초보 홈바리스타가 집에서 에스프레소를 더 맛있게 추출하도록 돕는 MVP 프로젝트입니다.

> 현재 이름은 가제입니다. 직관성을 우선해 `에스프레소 코치`로 정하고, 추후 브랜드명은 별도로 검토합니다.

## Product Direction

MVP는 **원두별 에스프레소 다이얼링 코치**입니다.

사용자는 원두 세션을 만들고, 매 샷마다 맛 설명과 기본 추출값을 입력합니다. 앱은 자연어 맛 표현을 구조화된 맛 태그로 바꾸고, 직전 샷과 비교해 다음 샷에서 먼저 조절할 세팅을 우선순위로 제안합니다.

## Core MVP

- 원두별 다이얼링 세션
- 자연어 맛 입력
- 도징량, 추출량, 추출 시간 입력
- 배전 범위를 원두 세션의 선택 컨텍스트로 기록
- 분쇄도, 채널링, 퍽 상태, 탬핑/레벨링 관찰 기록
- 배전 범위별 추출 변수와 맛 기대값 해석
- 하이브리드 자연어 처리: 규칙 기반 태깅 + 애매한 문장에 대한 LLM 보정
- 우선순위형 추천: 여러 후보를 보여주되 실제 조정은 한 번에 하나만 권장
- 기본 모드와 고급 모드 분리

## Planning Documents

- [Agent Handoff Prompt](docs/agent-handoff-prompt.md): 다른 에이전트가 이 프로젝트를 이어받기 위한 프롬프트
- [Agent Work Prompt](docs/agent-work-prompt.md): 다른 에이전트가 바로 기획/구현 작업을 시작하기 위한 실행 프롬프트
- [Product Brief](docs/planning/product-brief.md): 현재까지 합의된 제품 정의
- [MVP Scope](docs/planning/mvp-scope.md): MVP 포함/제외 범위
- [MVP Pre-Implementation Roadmap](docs/planning/mvp-pre-implementation-roadmap.md): 구현 전 완료해야 할 기획 산출물과 순서
- [Open Questions](docs/planning/open-questions.md): 다음 기획 단계에서 풀어야 할 질문
- [Competitive Research](docs/planning/competitive-research.md): 유사 앱/서비스 조사와 차별화 방향
- [Competitive Feature and Feedback Research](docs/planning/competitive-feature-feedback.md): 경쟁 앱 기능, 평가, 유저 불편 포인트
- [User Journey and Screen Flow](docs/planning/user-journey-and-screen-flow.md): 사용자 여정과 화면 흐름
- [Quick Diagnosis Form](docs/planning/quick-diagnosis-form.md): 빠른 진단 입력 필드와 validation
- [Taste Tag Taxonomy](docs/planning/taste-tag-taxonomy.md): 맛 자연어 태그 체계
- [Extraction Variable Expectations](docs/planning/extraction-variable-expectations.md): 추출 변수/기대값 문서 인덱스
- [Extraction Research Notes](docs/planning/extraction-research-notes.md): 조사 출처와 핵심 근거
- [Extraction Variable Grades](docs/planning/extraction-variable-grades.md): 추출 변수 grade와 우선순위 map
- [Espresso Taste Factors and App Settings Research](docs/planning/espresso-taste-factors-and-app-settings.md): 맛 영향 조건과 시장 앱 설정값 조사
- [Roast Range Expectations](docs/planning/roast-range-expectations.md): 배전 범위별 맛 기대값
- [Extraction Control Expectations](docs/planning/extraction-control-expectations.md): 변수별 조정 방향과 맛 기대값
- [Extraction MVP Priority](docs/planning/extraction-mvp-priority.md): MVP 추천 변수 우선순위
- [Recommendation Rule Table](docs/planning/recommendation-rule-table.md): 추천 rule table 초안
- [Data Structure](docs/planning/data-model.md): 데이터 구조 문서 인덱스
- [Session Data](docs/planning/data-session.md): 세션과 배전 범위 데이터
- [Shot Data](docs/planning/data-shot.md): 샷 입력, 관찰값, 변경값 데이터
- [Derived Output Data](docs/planning/data-derived-output.md): 맛 태그, 맛 패턴, 추천 결과 데이터
- [Data Examples and Scope](docs/planning/data-examples-and-scope.md): 데이터 예시와 저장 범위
- [MVP Implementation Stack](docs/planning/mvp-implementation-stack.md): 기술 스택 보류 상태와 구현 전제 조건
- [Ideas](docs/ideas/README.md): 검토 중인 제품 아이디어와 실험 후보

## Current Stage

현재는 앱 구현 전 **제품 기획 및 MVP 검증 단계**입니다.
