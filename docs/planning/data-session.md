# Session Data

## Purpose

원두별 다이얼링 세션과 배전 범위 데이터를 정의한다. 세션은 같은 원두를 맞춰가는 동안 여러 샷을 묶는 단위다.

## BeanSession

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | string | yes | 세션 고유 ID |
| `name` | string | yes | 사용자에게 보이는 세션 이름 |
| `beanName` | string | no | 원두 이름 |
| `roaster` | string | no | 로스터 또는 구매처 |
| `roastDate` | date string | no | 로스팅 날짜 |
| `roastProfile` | object | yes | 배전 범위와 사용자의 확신도. 모르면 `unknown` 값으로 저장 |
| `note` | string | no | 세션 메모 |
| `status` | enum | yes | `active`, `archived` |
| `createdAt` | datetime string | yes | 생성 시각 |
| `updatedAt` | datetime string | yes | 마지막 수정 시각 |

Rules:
- 세션 이름 없이 빠른 진단을 시작하면 `새 원두 세션 YYYY-MM-DD` 형식으로 자동 생성한다.
- 원두 상세 정보는 선택값이다.
- `roastProfile`은 항상 저장한다. 사용자가 모르면 `range`, `confidence`, `source`를 모두 `unknown`으로 둔다.
- 배전 정도는 정확한 고정값이 아니라 범위로 저장한다.
- 세션 삭제/보관 정책은 MVP 구현 전 별도 결정한다.

## RoastProfile

배전 정도는 맛 해석의 상위 카테고리다. 사용자가 정확히 알기 어렵고 로스터 표기도 일관되지 않으므로, 단일 고정값이 아니라 범위와 확신도로 저장한다.

| Field | Type | Required | Values |
| --- | --- | --- | --- |
| `range` | enum | yes | `unknown`, `light_range`, `medium_light_range`, `medium_range`, `medium_dark_range`, `dark_range` |
| `label` | string | no | 사용자 또는 로스터가 적은 표현 |
| `confidence` | enum | yes | `unknown`, `low`, `medium`, `high` |
| `source` | enum | yes | `unknown`, `user_selected`, `roaster_label`, `inferred` |

Range meaning:

| Range | Includes | Baseline Taste Expectation |
| --- | --- | --- |
| `unknown` | 모름 | 배전 보정 없이 기본 규칙 적용 |
| `light_range` | 라이트, 라이트에 가까운 미디엄 라이트 | 산미, 향, 선명함이 기본값일 수 있음 |
| `medium_light_range` | 미디엄 라이트 전후 | 산미와 단맛이 함께 나타날 수 있음 |
| `medium_range` | 미디엄 전후 | 균형, 단맛, 바디를 기본값으로 봄 |
| `medium_dark_range` | 미디엄 다크 전후 | 바디, 고소함, 쓴맛이 기본값일 수 있음 |
| `dark_range` | 다크, 이탈리안에 가까운 진한 배전 | 쓴맛, 로스티, 묵직함이 기본값일 수 있음 |

Rules:
- `range`는 추천의 상위 해석 컨텍스트로 사용한다.
- `range`가 `unknown`이면 맛 태그와 추출값 중심 규칙을 적용한다.
- `confidence`가 낮으면 추천 결과의 불확실성에 반영한다.
- 배전 범위만으로 추출 문제를 단정하지 않는다.

Unknown default:

```json
{
  "range": "unknown",
  "confidence": "unknown",
  "source": "unknown"
}
```

Example:

```json
{
  "id": "session_001",
  "name": "새 원두 세션 2026-06-04",
  "beanName": "Ethiopia Guji",
  "roaster": "Sample Roaster",
  "roastDate": "2026-05-28",
  "roastProfile": {
    "range": "medium_light_range",
    "label": "Medium Light",
    "confidence": "medium",
    "source": "roaster_label"
  },
  "note": "첫 다이얼링",
  "status": "active",
  "createdAt": "2026-06-04T09:00:00+09:00",
  "updatedAt": "2026-06-04T09:00:00+09:00"
}
```
