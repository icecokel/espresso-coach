import type {
  BeanSession,
  RecommendationActionDirection,
  RecommendationActionVariable,
  RecommendationKeepVariable,
  RoastRange,
  ShotChangeDirection,
  ShotChangeVariable,
  TasteConfidence,
  TasteTag,
} from "../domain/types";

const actionVariableLabels: Record<
  RecommendationActionVariable | RecommendationKeepVariable | ShotChangeVariable,
  string
> = {
  grind_size: "분쇄도",
  yield: "추출량",
  dose: "도징량",
  channeling_check: "채널링",
  distribution: "분배",
  tamping_consistency: "탬핑",
  puck_prep: "퍽 준비",
  no_change: "유지",
  advanced_condition: "고급 조건",
};

const keepVariableLabels: Record<RecommendationKeepVariable, string> = {
  grind_size: "분쇄도",
  dose: "도징량",
  yield: "추출량",
  tamping_consistency: "탬핑 방식",
  distribution: "레벨링/분배",
  puck_prep: "퍽 준비 과정",
  advanced_condition: "고급 조건",
};

const actionDirectionLabels: Record<RecommendationActionDirection | ShotChangeDirection, string> = {
  finer: "더 곱게",
  coarser: "더 굵게",
  increase: "늘리기",
  decrease: "줄이기",
  improved: "개선됨",
  worse: "나빠짐",
  changed: "변경",
  unknown: "방향 모름",
  keep: "그대로",
  check: "확인",
};

const roastRangeLabels: Record<RoastRange, string> = {
  unknown: "배전도 모름",
  light_range: "약배전",
  medium_light_range: "약중배전",
  medium_range: "중배전",
  medium_dark_range: "중강배전",
  dark_range: "강배전",
};

const tasteConfidenceLabels: Record<TasteConfidence, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export function formatActionVariable(variable: string): string {
  return actionVariableLabels[variable as keyof typeof actionVariableLabels] ?? variable;
}

export function formatActionDirection(direction: string): string {
  return actionDirectionLabels[direction as keyof typeof actionDirectionLabels] ?? direction;
}

export function formatKeepVariables(variables: readonly string[]): string {
  if (variables.length === 0) {
    return "이번 샷에서는 추가로 유지할 변수가 없습니다.";
  }

  const labels = variables.map(
    (variable) =>
      keepVariableLabels[variable as keyof typeof keepVariableLabels] ?? variable,
  );
  return `${labels.join(", ")}은 그대로 두세요.`;
}

export function formatTasteTagPreview(tags: readonly TasteTag[]): string {
  return tags
    .map((tag) => `${tag.label} · ${tasteConfidenceLabels[tag.confidence]}`)
    .join(", ");
}

export function formatSessionStatus(status: BeanSession["status"]): string {
  return status === "active" ? "진행 중" : "보관됨";
}

export function formatRoastRange(range: RoastRange): string {
  return roastRangeLabels[range];
}

export const roastRangeOptions: Array<{ value: RoastRange; label: string }> = [
  { value: "unknown", label: roastRangeLabels.unknown },
  { value: "light_range", label: roastRangeLabels.light_range },
  { value: "medium_light_range", label: roastRangeLabels.medium_light_range },
  { value: "medium_range", label: roastRangeLabels.medium_range },
  { value: "medium_dark_range", label: roastRangeLabels.medium_dark_range },
  { value: "dark_range", label: roastRangeLabels.dark_range },
];
