# MVP Implementation Stack

## Status

기술 스택은 아직 정하지 않는다.

현재 단계의 우선순위는 구현 기술 선택이 아니라 MVP 데이터 구조, 입력 구조, 맛 태그, 추천 규칙을 확정하는 것이다.

## Deferred Decisions

- 웹앱, 모바일앱, 또는 둘 다 중 무엇으로 시작할지
- 로그인 없이 시작할지 여부
- 저장소를 로컬, 서버 DB, 또는 다른 방식으로 둘지
- 프론트엔드 프레임워크
- UI 스타일링 방식
- LLM 실제 API 호출 시점
- 추천 rule table의 물리적 위치

## Implementation Preconditions

구현을 시작하기 전에 아래 문서가 먼저 확정되어야 한다.

- 사용자 여정과 화면 흐름
- 빠른 진단 입력 폼과 validation
- 맛 태그와 맛 패턴
- 추천 rule table
- 원두 세션과 샷 기록 데이터 구조

## Current Data-First Direction

- 데이터 구조는 특정 기술 스택에 종속되지 않게 정의한다.
- 추천 로직은 UI, 저장소, LLM 호출 여부와 분리될 수 있어야 한다.
- LLM은 최종 추천 결정자가 아니라 맛 태그 보정과 설명 보조 역할로만 다룬다.
- 저장소 선택은 데이터 구조 확정 이후 별도 결정한다.

