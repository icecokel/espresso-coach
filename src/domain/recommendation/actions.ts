import type {
  RecommendationAction,
  RecommendationActionAmountLabel,
  RecommendationActionDirection,
  RecommendationActionPriority,
  RecommendationActionVariable,
} from "../types";

export type RecommendationActionId =
  | "A-GRIND-FINER"
  | "A-GRIND-COARSER"
  | "A-YIELD-INCREASE"
  | "A-YIELD-DECREASE"
  | "A-DOSE-INCREASE"
  | "A-DOSE-DECREASE"
  | "A-CHANNELING-CHECK"
  | "A-DISTRIBUTION-CHECK"
  | "A-TAMPING-CHECK"
  | "A-PUCK-PREP-CHECK"
  | "A-NO-CHANGE";

export interface RecommendationActionCatalogEntry {
  id: RecommendationActionId;
  variable: RecommendationActionVariable;
  direction: RecommendationActionDirection;
  amountLabel: RecommendationActionAmountLabel;
  message: string;
}

export const RECOMMENDATION_ACTION_CATALOG: Record<
  RecommendationActionId,
  RecommendationActionCatalogEntry
> = {
  "A-GRIND-FINER": {
    id: "A-GRIND-FINER",
    variable: "grind_size",
    direction: "finer",
    amountLabel: "one_small_step",
    message: "분쇄도를 한 단계만 곱게 조정하세요.",
  },
  "A-GRIND-COARSER": {
    id: "A-GRIND-COARSER",
    variable: "grind_size",
    direction: "coarser",
    amountLabel: "one_small_step",
    message: "분쇄도를 한 단계만 굵게 조정하세요.",
  },
  "A-YIELD-INCREASE": {
    id: "A-YIELD-INCREASE",
    variable: "yield",
    direction: "increase",
    amountLabel: "small",
    message: "추출량을 소폭 늘려보세요.",
  },
  "A-YIELD-DECREASE": {
    id: "A-YIELD-DECREASE",
    variable: "yield",
    direction: "decrease",
    amountLabel: "small",
    message: "추출량을 소폭 줄여보세요.",
  },
  "A-DOSE-INCREASE": {
    id: "A-DOSE-INCREASE",
    variable: "dose",
    direction: "increase",
    amountLabel: "small",
    message: "도징량을 소폭 늘려보세요.",
  },
  "A-DOSE-DECREASE": {
    id: "A-DOSE-DECREASE",
    variable: "dose",
    direction: "decrease",
    amountLabel: "small",
    message: "도징량을 소폭 줄여보세요.",
  },
  "A-CHANNELING-CHECK": {
    id: "A-CHANNELING-CHECK",
    variable: "channeling_check",
    direction: "check",
    amountLabel: "next_shot_observation",
    message: "다음 샷에서는 채널링이 있는지 먼저 확인하세요.",
  },
  "A-DISTRIBUTION-CHECK": {
    id: "A-DISTRIBUTION-CHECK",
    variable: "distribution",
    direction: "check",
    amountLabel: "next_shot_observation",
    message: "다음 샷에서는 분배와 레벨링을 먼저 점검하세요.",
  },
  "A-TAMPING-CHECK": {
    id: "A-TAMPING-CHECK",
    variable: "tamping_consistency",
    direction: "check",
    amountLabel: "next_shot_observation",
    message: "다음 샷에서는 탬핑 수평과 일관성을 먼저 점검하세요.",
  },
  "A-PUCK-PREP-CHECK": {
    id: "A-PUCK-PREP-CHECK",
    variable: "puck_prep",
    direction: "check",
    amountLabel: "next_shot_observation",
    message: "다음 샷에서는 퍽 표면과 준비 과정을 먼저 점검하세요.",
  },
  "A-NO-CHANGE": {
    id: "A-NO-CHANGE",
    variable: "no_change",
    direction: "keep",
    amountLabel: "none",
    message: "현재 설정을 유지하세요.",
  },
};

export function createRecommendationAction(
  id: RecommendationActionId,
  priority: RecommendationActionPriority,
): RecommendationAction {
  return {
    ...RECOMMENDATION_ACTION_CATALOG[id],
    priority,
  };
}
