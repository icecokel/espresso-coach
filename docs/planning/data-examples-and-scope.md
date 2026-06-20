# Data Examples and Scope

## Purpose

데이터 구조의 완성 예시와 MVP 저장 범위, deferred data, 데이터 결정사항을 정리한다.

## Complete Shot Example

```json
{
  "id": "shot_002",
  "sessionId": "session_001",
  "shotNumber": 2,
  "extraction": {
    "tasteDescription": "처음엔 시고 끝맛이 좀 쓰다",
    "doseGrams": 18,
    "yieldGrams": 36,
    "brewSeconds": 27,
    "brewRatio": 2,
    "brewTimeBand": "normal",
    "brewRatioBand": "target",
    "inputWarnings": []
  },
  "basicObservation": {
    "grindNote": "직전보다 한 칸 곱게",
    "prepObservations": ["one_sided_flow", "uneven_puck_surface"],
    "channelingObserved": "yes",
    "puckCondition": "uneven",
    "prepIssue": "suspected",
    "prepIssueTypes": ["flow", "distribution", "puck_surface"]
  },
  "advancedObservation": null,
  "changesFromPrevious": [
    {
      "variable": "grind_size",
      "direction": "finer",
      "amountLabel": "one_small_step",
      "note": "그라인더 한 칸 곱게"
    }
  ],
  "tasteTags": [
    {
      "id": "sour",
      "label": "신맛",
      "polarity": "under_extraction",
      "intensity": 2,
      "position": "start",
      "confidence": "high",
      "sourceText": "처음엔 시고"
    },
    {
      "id": "bitter",
      "label": "쓴맛",
      "polarity": "over_extraction",
      "intensity": 1,
      "position": "finish",
      "confidence": "medium",
      "sourceText": "끝맛이 좀 쓰다"
    }
  ],
  "tastePatterns": [
    {
      "id": "conflicting_extraction_signals",
      "sourceTagIds": ["sour", "bitter"],
      "confidence": "high"
    }
  ],
  "recommendation": {
    "primary": {
      "id": "action_channeling_check_001",
      "variable": "channeling_check",
      "direction": "check",
      "amountLabel": "next_shot_observation",
      "priority": 1,
      "message": "다음 샷에서는 채널링이 있는지 먼저 확인해보세요."
    },
    "alternatives": [
      {
        "id": "action_distribution_001",
        "variable": "distribution",
        "direction": "check",
        "amountLabel": "next_shot_observation",
        "priority": 2,
        "message": "레벨링과 분배가 고르게 되었는지도 함께 확인하세요."
      }
    ],
    "rationale": [
      "신맛과 쓴맛이 함께 있어 균일하지 않은 추출 가능성이 있습니다."
    ],
    "uncertainty": [
      "채널링 관찰값이 없어 분쇄도 문제와 퍽 준비 문제를 완전히 구분하기 어렵습니다."
    ],
    "matchedRules": ["R-PREP-CONFLICT"],
    "keepVariables": ["dose", "yield", "brew_time"]
  },
  "pulledAt": "2026-06-04T09:18:00+09:00",
  "createdAt": "2026-06-04T09:20:00+09:00",
  "updatedAt": "2026-06-04T09:20:00+09:00"
}
```

## Stored in MVP

- 원두 세션 기본 정보
- 배전 범위와 확신도
- 샷별 빠른 진단 입력값
- 실제 샷 추출 시각
- 계산된 추출 비율과 band
- 기본 관찰값
- 고급 모드 입력값
- 직전 샷 대비 변경값
- 맛 태그와 맛 패턴
- 추천 결과와 적용 rule ID

## Deferred Data

- 사용자 계정 프로필
- 사용자 간 공유 데이터
- 쇼핑몰/원두 추천 데이터
- 장기 통계 대시보드용 aggregate 데이터
- 자동 장비 연동 데이터
- 저장소별 인덱스, migration, sync metadata

## MVP Decisions

- 세션과 샷 기록은 분리한다.
- 배전 정도는 `BeanSession.roastProfile`에 범위형 데이터로 저장한다.
- 빠른 진단 필수 입력은 `extraction`에 모은다.
- 실제 추출 시각인 `pulledAt`과 기록 생성 시각인 `createdAt`을 분리한다.
- 고급 모드 데이터는 `advancedObservation`으로 분리한다.
- 직전 샷 비교는 `changesFromPrevious`의 구조화된 변경값만 사용한다.
- 복합 맛은 `mixed` 태그가 아니라 `TastePattern`으로 표현한다.
- 샷 기록에는 당시의 맛 태그, 맛 패턴, 추천 결과를 저장한다.
- 기술 스택과 저장소 선택은 이 문서에서 정하지 않는다.
