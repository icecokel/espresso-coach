# Extraction Variable Expectations

## Purpose

에스프레소 추출 변수와 맛 기대값 문서의 상위 개요다. 배전 범위를 먼저 보고, 그 다음 추출 변수와 맛 태그를 해석한다.

배전 정도는 정확한 고정값이 아니라 범위다. MVP에서는 배전 범위를 상위 해석 컨텍스트로 잡고, 변수 grade에 따라 추천 우선순위를 정한다.

## Split Documents

- [Extraction Research Notes](extraction-research-notes.md): 조사 출처와 핵심 근거
- [Extraction Variable Grades](extraction-variable-grades.md): 변수 grade와 우선순위 map
- [Roast Range Expectations](roast-range-expectations.md): 배전 범위별 맛 기대값과 해석 bias
- [Extraction Control Expectations](extraction-control-expectations.md): G1/G2/G3/G4/G5 변수별 맛 기대값
- [Extraction MVP Priority](extraction-mvp-priority.md): MVP primary, secondary, deferred 변수 결정

## Core Decisions

- 배전 정도는 빠른 진단 필수값이 아니다.
- 배전 정도는 세션의 선택 데이터로 저장한다.
- 배전 정도는 단일 고정값이 아니라 범위와 확신도로 저장한다.
- 추천 로직은 배전 범위를 먼저 보고, 그 다음 추출 변수와 맛 태그를 해석한다.
- 추출 시간은 primary 조정 변수보다 진단 신호로 취급한다.
- channeling, distribution, puck prep은 복합 맛이 있을 때 분쇄도보다 우선할 수 있다.
- 장비/물/필터류 변수는 MVP primary 추천에서 제외하고 고급 모드 또는 메모로 둔다.

