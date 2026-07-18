import type {
  RecommendationKeepVariable,
  RoastRange,
} from "../types";
import type { RecommendationActionId } from "./actions";

export type RecommendationRuleId =
  | ObservationRuleId
  | BaseRuleId
  | RoastContextRuleId
  | PreviousShotRuleId
  | "R-BALANCED-WITH-NEGATIVE";

export type ObservationRuleId =
  | "O-CHANNELING-OBSERVED"
  | "O-DISTRIBUTION-OBSERVED"
  | "O-TAMPING-OBSERVED"
  | "O-PUCK-SURFACE-OBSERVED"
  | "O-NO-ISSUE-OBSERVED";

export type BaseRuleId =
  | "R-SOUR-SHORT"
  | "R-SOUR-NORMAL-LONG"
  | "R-BITTER-LONG"
  | "R-BITTER-HIGH-RATIO"
  | "R-WATERY-HOLLOW-HIGH-RATIO"
  | "R-WATERY-HOLLOW-SHORT"
  | "R-SOUR-BITTER-CONFLICT"
  | "R-ASTRINGENT-LONG"
  | "R-HARSH-PREP"
  | "R-BALANCED"
  | "R-UNKNOWN";

type RoastContextRuleId =
  | "ROAST-LIGHT-SOUR"
  | "ROAST-LIGHT-BITTER"
  | "ROAST-DARK-BITTER"
  | "ROAST-DARK-SOUR"
  | "ROAST-UNKNOWN";

type PreviousShotRuleId =
  | "C-GRIND-FINER-BITTER"
  | "C-GRIND-COARSER-SOUR"
  | "C-YIELD-UP-WATERY";

export interface RuleResultTemplate {
  id: BaseRuleId | ObservationRuleId;
  primary: RecommendationActionId;
  alternatives: RecommendationActionId[];
  rationale: string;
  uncertainty: string[];
  keepVariables: RecommendationKeepVariable[];
}

export type ObservationRuleResultTemplate = RuleResultTemplate & {
  id: ObservationRuleId;
};

export type BaseRuleResultTemplate = RuleResultTemplate & {
  id: BaseRuleId;
};

export const OBSERVATION_RULES: Record<
  ObservationRuleId,
  ObservationRuleResultTemplate
> = {
  "O-CHANNELING-OBSERVED": {
    id: "O-CHANNELING-OBSERVED",
    primary: "A-CHANNELING-CHECK",
    alternatives: ["A-DISTRIBUTION-CHECK", "A-PUCK-PREP-CHECK"],
    rationale: "채널링 관찰값이 있어 레시피 변수보다 흐름 문제를 먼저 확인한다.",
    uncertainty: [
      "채널링 원인은 분쇄도, 분배, 탬핑, puck prep이 함께 만들 수 있다.",
    ],
    keepVariables: ["grind_size", "dose", "yield"],
  },
  "O-DISTRIBUTION-OBSERVED": {
    id: "O-DISTRIBUTION-OBSERVED",
    primary: "A-DISTRIBUTION-CHECK",
    alternatives: ["A-CHANNELING-CHECK", "A-TAMPING-CHECK"],
    rationale: "분배가 고르지 않으면 같은 레시피에서도 신맛과 쓴맛이 같이 날 수 있다.",
    uncertainty: [
      "분배 관찰은 사용자의 주관 입력이므로 다음 샷에서 다시 확인한다.",
    ],
    keepVariables: ["grind_size", "dose", "yield"],
  },
  "O-TAMPING-OBSERVED": {
    id: "O-TAMPING-OBSERVED",
    primary: "A-TAMPING-CHECK",
    alternatives: ["A-DISTRIBUTION-CHECK", "A-PUCK-PREP-CHECK"],
    rationale: "기울어진 탬핑은 한쪽 과다추출과 한쪽 과소추출을 함께 만들 수 있다.",
    uncertainty: [
      "탬핑만의 문제인지 분배 문제와 함께 생긴 문제인지는 다음 샷 관찰이 필요하다.",
    ],
    keepVariables: ["grind_size", "dose", "yield"],
  },
  "O-PUCK-SURFACE-OBSERVED": {
    id: "O-PUCK-SURFACE-OBSERVED",
    primary: "A-PUCK-PREP-CHECK",
    alternatives: ["A-DISTRIBUTION-CHECK", "A-CHANNELING-CHECK"],
    rationale: "갈라지거나 고르지 않은 puck 표면은 균일 추출 문제를 의심하게 한다.",
    uncertainty: ["puck 표면은 추출 후 상태라 원인을 단정하지 않는다."],
    keepVariables: ["grind_size", "dose", "yield"],
  },
  "O-NO-ISSUE-OBSERVED": {
    id: "O-NO-ISSUE-OBSERVED",
    primary: "A-NO-CHANGE",
    alternatives: [],
    rationale: "명시적으로 이상 관찰이 없으면 base rule의 레시피 변수 판단 신뢰도를 올린다.",
    uncertainty: ["육안 관찰이 없어도 미세한 channeling 가능성은 남는다."],
    keepVariables: [],
  },
};

export const BASE_RULES: Record<BaseRuleId, BaseRuleResultTemplate> = {
  "R-SOUR-SHORT": {
    id: "R-SOUR-SHORT",
    primary: "A-GRIND-FINER",
    alternatives: ["A-YIELD-INCREASE", "A-CHANNELING-CHECK"],
    rationale: "신맛과 짧은 추출 시간은 과소추출 가능성을 높인다.",
    uncertainty: ["관찰값이 unknown이면 channeling 가능성을 배제하지 않는다."],
    keepVariables: ["dose", "yield", "distribution", "puck_prep"],
  },
  "R-SOUR-NORMAL-LONG": {
    id: "R-SOUR-NORMAL-LONG",
    primary: "A-CHANNELING-CHECK",
    alternatives: ["A-DISTRIBUTION-CHECK", "A-YIELD-INCREASE"],
    rationale: "시간이 짧지 않은데 신맛이 두드러지면 균일 추출 문제나 원두 특성 가능성을 먼저 본다.",
    uncertainty: ["밝은 배전에서는 산미가 원두 특성일 수 있다."],
    keepVariables: ["grind_size", "dose", "yield"],
  },
  "R-BITTER-LONG": {
    id: "R-BITTER-LONG",
    primary: "A-GRIND-COARSER",
    alternatives: ["A-YIELD-DECREASE", "A-CHANNELING-CHECK"],
    rationale: "쓴맛과 긴 추출 시간은 과다추출 가능성을 높인다.",
    uncertainty: ["다크 배전에서는 쓴맛 일부가 원두 특성일 수 있다."],
    keepVariables: ["dose", "yield", "distribution", "puck_prep"],
  },
  "R-BITTER-HIGH-RATIO": {
    id: "R-BITTER-HIGH-RATIO",
    primary: "A-YIELD-DECREASE",
    alternatives: ["A-GRIND-COARSER", "A-CHANNELING-CHECK"],
    rationale: "추출 비율이 높으면 끝맛이 길어지고 쓴맛이 커질 수 있다.",
    uncertainty: [
      "쓴맛이 다크 배전 특성인지 과한 추출량 때문인지는 분리해서 봐야 한다.",
    ],
    keepVariables: ["grind_size", "dose", "distribution", "puck_prep"],
  },
  "R-WATERY-HOLLOW-HIGH-RATIO": {
    id: "R-WATERY-HOLLOW-HIGH-RATIO",
    primary: "A-YIELD-DECREASE",
    alternatives: ["A-GRIND-FINER", "A-DOSE-INCREASE"],
    rationale: "높은 추출 비율은 희석감, 빈 느낌, 얇은 바디를 만들 수 있다.",
    uncertainty: [
      "밍밍함은 원두 노화, 물, 장비 영향도 받을 수 있으나 MVP에서는 대안으로만 둔다.",
    ],
    keepVariables: ["grind_size", "dose", "distribution", "puck_prep"],
  },
  "R-WATERY-HOLLOW-SHORT": {
    id: "R-WATERY-HOLLOW-SHORT",
    primary: "A-GRIND-FINER",
    alternatives: ["A-YIELD-INCREASE", "A-CHANNELING-CHECK"],
    rationale: "짧은 추출과 약한 맛은 충분히 추출되지 않았다는 신호일 수 있다.",
    uncertainty: ["빠른 흐름이 puck prep 문제에서 왔을 수도 있다."],
    keepVariables: ["dose", "yield", "distribution", "puck_prep"],
  },
  "R-SOUR-BITTER-CONFLICT": {
    id: "R-SOUR-BITTER-CONFLICT",
    primary: "A-CHANNELING-CHECK",
    alternatives: ["A-DISTRIBUTION-CHECK", "A-PUCK-PREP-CHECK"],
    rationale: "신맛과 쓴맛 또는 떫음이 함께 있으면 균일하지 않은 추출 가능성을 먼저 본다.",
    uncertainty: ["복합 맛은 단일 레시피 변수만으로 설명하기 어렵다."],
    keepVariables: ["grind_size", "dose", "yield"],
  },
  "R-ASTRINGENT-LONG": {
    id: "R-ASTRINGENT-LONG",
    primary: "A-GRIND-COARSER",
    alternatives: ["A-YIELD-DECREASE", "A-CHANNELING-CHECK"],
    rationale: "떫고 텁텁한 맛과 긴 추출 시간은 과다추출 가능성을 높인다.",
    uncertainty: ["떫음은 미분이나 channeling에서도 생길 수 있다."],
    keepVariables: ["dose", "yield", "distribution", "puck_prep"],
  },
  "R-HARSH-PREP": {
    id: "R-HARSH-PREP",
    primary: "A-DISTRIBUTION-CHECK",
    alternatives: ["A-CHANNELING-CHECK", "A-PUCK-PREP-CHECK"],
    rationale: "거칠고 정리되지 않은 맛은 준비나 흐름의 균일성 문제일 수 있다.",
    uncertainty: ["harsh 단독 표현은 맛 원인이 넓어 불확실성이 높다."],
    keepVariables: ["grind_size", "dose", "yield"],
  },
  "R-BALANCED": {
    id: "R-BALANCED",
    primary: "A-NO-CHANGE",
    alternatives: [],
    rationale: "맛이 만족스럽다면 다음 샷에서 변수를 바꾸지 않는다.",
    uncertainty: [],
    keepVariables: [
      "grind_size",
      "dose",
      "yield",
      "tamping_consistency",
      "distribution",
      "puck_prep",
    ],
  },
  "R-UNKNOWN": {
    id: "R-UNKNOWN",
    primary: "A-CHANNELING-CHECK",
    alternatives: ["A-DISTRIBUTION-CHECK"],
    rationale: "맛 표현이 내부 태그로 충분히 매핑되지 않아 관찰과 기본 추출값으로 최소 판단한다.",
    uncertainty: ["맛 설명을 구조화하지 못해 추천 신뢰도가 낮다."],
    keepVariables: ["grind_size", "dose", "yield"],
  },
};

export const LIGHT_ROAST_RANGES: ReadonlySet<RoastRange> = new Set([
  "light_range",
  "medium_light_range",
]);

export const DARK_ROAST_RANGES: ReadonlySet<RoastRange> = new Set([
  "medium_dark_range",
  "dark_range",
]);
