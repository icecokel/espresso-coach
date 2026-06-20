import type {
  BasicObservation,
  BeanSession,
  Extraction,
  PrimaryRecommendationAction,
  RecommendationAction,
  RecommendationActionVariable,
  RecommendationKeepVariable,
  RecommendationResult,
  ShotChange,
  TastePattern,
  TastePatternId,
  TasteTag,
  TasteTagId,
} from "../types";
import {
  createRecommendationAction,
  type RecommendationActionId,
} from "./actions";
import {
  BASE_RULES,
  type BaseRuleResultTemplate,
  DARK_ROAST_RANGES,
  LIGHT_ROAST_RANGES,
  OBSERVATION_RULES,
  type BaseRuleId,
  type ObservationRuleId,
  type PreviousShotRuleId,
  type RecommendationRuleId,
  type RoastContextRuleId,
  type RuleResultTemplate,
} from "./rules";

export interface RecommendationInput {
  session: Pick<BeanSession, "roastProfile">;
  extraction: Extraction;
  basicObservation: BasicObservation;
  changesFromPrevious: ShotChange[];
  tasteTags: TasteTag[];
  tastePatterns: TastePattern[];
}

interface BuildContext {
  tagIds: ReadonlySet<TasteTagId>;
  patternIds: ReadonlySet<TastePatternId>;
  negativeTagIds: ReadonlySet<TasteTagId>;
  rationale: string[];
  uncertainty: string[];
  matchedRules: RecommendationRuleId[];
  scores: Map<RecommendationActionId, number>;
}

const RECIPE_KEEP_BY_ACTION: Partial<
  Record<RecommendationActionVariable, RecommendationKeepVariable[]>
> = {
  grind_size: ["dose", "yield", "distribution", "puck_prep"],
  yield: ["grind_size", "dose", "distribution", "puck_prep"],
  dose: ["grind_size", "yield", "distribution", "puck_prep"],
  channeling_check: ["grind_size", "dose", "yield"],
  distribution: ["grind_size", "dose", "yield"],
  tamping_consistency: ["grind_size", "dose", "yield"],
  puck_prep: ["grind_size", "dose", "yield"],
};

const RECIPE_ACTION_VARIABLE_ORDER: RecommendationActionVariable[] = [
  "grind_size",
  "yield",
  "dose",
];

const PREP_ACTION_VARIABLE_ORDER: RecommendationActionVariable[] = [
  "channeling_check",
  "distribution",
  "tamping_consistency",
  "puck_prep",
];

export function buildRecommendation(
  input: RecommendationInput,
): RecommendationResult {
  const context = createContext(input);
  const noIssueRuleId = findNoIssueRule(input.basicObservation);
  const overrideRuleId = findObservationOverride(input.basicObservation);
  applyBalancedWithNegativeModifier(context);
  const baseRule = selectBaseRule(input, context);

  if (noIssueRuleId) {
    addMatchedRule(context, noIssueRuleId);
  }

  if (overrideRuleId) {
    const overrideRule = OBSERVATION_RULES[overrideRuleId];
    addMatchedRule(context, overrideRule.id);
    addMatchedRule(context, baseRule.id);
    applyBaseScore(context, baseRule.id);
    applyRoastContext(input, context);
    applyPreviousShotComparison(input, context);

    return buildFromTemplate({
      template: overrideRule,
      matchedRules: context.matchedRules,
      rationale: [overrideRule.rationale, ...context.rationale],
      uncertainty: [...overrideRule.uncertainty, ...context.uncertainty],
      extraAlternatives: [baseRule.primary],
    });
  }

  applyBaseScore(context, baseRule.id);
  addMatchedRule(context, baseRule.id);
  applyRoastContext(input, context);
  applyPreviousShotComparison(input, context);

  if (baseRule.id === "R-BALANCED") {
    return buildFromTemplate({
      template: baseRule,
      matchedRules: context.matchedRules,
      rationale: [baseRule.rationale],
      uncertainty: baseRule.uncertainty,
    });
  }

  const topScoredActionId = selectTopScoredAction(context);
  if (topScoredActionId && topScoredActionId !== baseRule.primary) {
    return buildFromScoredAction(topScoredActionId, baseRule, context);
  }

  const uncertainty = [...baseRule.uncertainty, ...context.uncertainty];
  if (noIssueRuleId) {
    uncertainty.push(...OBSERVATION_RULES[noIssueRuleId].uncertainty);
  }

  return buildFromTemplate({
    template: baseRule,
    matchedRules: context.matchedRules,
    rationale: [baseRule.rationale, ...context.rationale],
    uncertainty,
  });
}

function createContext(input: RecommendationInput): BuildContext {
  const tagIds = new Set(input.tasteTags.map((tag) => tag.id));
  const patternIds = new Set(input.tastePatterns.map((pattern) => pattern.id));
  const negativeTagIds = new Set<TasteTagId>(
    [...tagIds].filter((id) => id !== "balanced"),
  );

  return {
    tagIds,
    patternIds,
    negativeTagIds,
    rationale: [],
    uncertainty: [],
    matchedRules: [],
    scores: new Map(),
  };
}

function findObservationOverride(
  observation: BasicObservation,
): ObservationRuleId | undefined {
  const prepObservations = new Set(observation.prepObservations);
  const prepIssueTypes = new Set(observation.prepIssueTypes);
  const hasFlowObservation =
    observation.channelingObserved === "yes" ||
    prepObservations.has("one_sided_flow") ||
    prepObservations.has("spurting_or_spraying") ||
    prepObservations.has("sudden_flow_acceleration") ||
    prepIssueTypes.has("flow");

  if (hasFlowObservation) {
    return "O-CHANNELING-OBSERVED";
  }

  if (
    prepObservations.has("uneven_distribution") ||
    prepIssueTypes.has("distribution")
  ) {
    return "O-DISTRIBUTION-OBSERVED";
  }

  if (prepObservations.has("tilted_tamp") || prepIssueTypes.has("tamping")) {
    return "O-TAMPING-OBSERVED";
  }

  if (
    prepObservations.has("cracked_puck") ||
    prepObservations.has("uneven_puck_surface") ||
    observation.puckCondition === "cracked" ||
    observation.puckCondition === "uneven"
  ) {
    return "O-PUCK-SURFACE-OBSERVED";
  }

  return undefined;
}

function findNoIssueRule(
  observation: BasicObservation,
): ObservationRuleId | undefined {
  if (
    observation.prepObservations.length === 1 &&
    observation.prepObservations[0] === "no_issue_observed" &&
    observation.channelingObserved === "no" &&
    observation.prepIssue === "none"
  ) {
    return "O-NO-ISSUE-OBSERVED";
  }

  return undefined;
}

function selectBaseRule(
  input: RecommendationInput,
  context: BuildContext,
): BaseRuleResultTemplate {
  const has = (id: TasteTagId) => context.tagIds.has(id);
  const hasPattern = (id: TastePatternId) => context.patternIds.has(id);
  const hasWeakTaste = has("watery") || has("hollow");
  const hasBitterOrAstringent = has("bitter") || has("astringent");

  if (
    hasPattern("conflicting_extraction_signals") ||
    (has("sour") && hasBitterOrAstringent)
  ) {
    return BASE_RULES["R-SOUR-BITTER-CONFLICT"];
  }

  if (has("sour")) {
    if (input.extraction.brewTimeBand === "short") {
      return BASE_RULES["R-SOUR-SHORT"];
    }

    if (!hasBitterOrAstringent) {
      return BASE_RULES["R-SOUR-NORMAL-LONG"];
    }
  }

  if (has("bitter")) {
    if (input.extraction.brewTimeBand === "long") {
      return BASE_RULES["R-BITTER-LONG"];
    }

    if (input.extraction.brewRatioBand === "high") {
      return BASE_RULES["R-BITTER-HIGH-RATIO"];
    }
  }

  if (hasWeakTaste) {
    if (input.extraction.brewRatioBand === "high") {
      return BASE_RULES["R-WATERY-HOLLOW-HIGH-RATIO"];
    }

    if (input.extraction.brewTimeBand === "short") {
      return BASE_RULES["R-WATERY-HOLLOW-SHORT"];
    }
  }

  if (has("astringent") && input.extraction.brewTimeBand === "long") {
    return BASE_RULES["R-ASTRINGENT-LONG"];
  }

  if (has("harsh")) {
    return BASE_RULES["R-HARSH-PREP"];
  }

  if (
    has("balanced") &&
    context.negativeTagIds.size === 0 &&
    !hasPattern("unknown_description") &&
    input.basicObservation.prepIssue === "none"
  ) {
    return BASE_RULES["R-BALANCED"];
  }

  return BASE_RULES["R-UNKNOWN"];
}

function applyBalancedWithNegativeModifier(context: BuildContext): void {
  if (!context.patternIds.has("balanced_with_negative_signal")) {
    return;
  }

  addMatchedRule(context, "R-BALANCED-WITH-NEGATIVE");
  context.uncertainty.push(
    "만족 신호가 함께 있어 조정 강도는 작은 단계로 제한한다.",
  );
}

function applyBaseScore(context: BuildContext, ruleId: BaseRuleId): void {
  switch (ruleId) {
    case "R-SOUR-BITTER-CONFLICT":
      addScore(context, "A-CHANNELING-CHECK", 4);
      addScore(context, "A-DISTRIBUTION-CHECK", 3);
      break;
    case "R-SOUR-SHORT":
    case "R-BITTER-LONG":
    case "R-ASTRINGENT-LONG":
    case "R-WATERY-HOLLOW-SHORT":
      addScore(context, BASE_RULES[ruleId].primary, 3);
      break;
    case "R-BITTER-HIGH-RATIO":
    case "R-WATERY-HOLLOW-HIGH-RATIO":
      addScore(context, "A-YIELD-DECREASE", 3);
      break;
    case "R-HARSH-PREP":
      addScore(context, "A-DISTRIBUTION-CHECK", 3);
      break;
    case "R-SOUR-NORMAL-LONG":
      addScore(context, "A-CHANNELING-CHECK", 3);
      break;
    case "R-BALANCED":
    case "R-UNKNOWN":
      break;
  }
}

function applyRoastContext(
  input: RecommendationInput,
  context: BuildContext,
): void {
  const range = input.session.roastProfile.range;
  const confidence = input.session.roastProfile.confidence;
  const lowConfidence = confidence === "low" || confidence === "unknown";
  const modifier = lowConfidence ? 0 : 1;
  const has = (id: TasteTagId) => context.tagIds.has(id);

  if (LIGHT_ROAST_RANGES.has(range) && has("sour")) {
    addMatchedRule(context, "ROAST-LIGHT-SOUR");
    context.rationale.push("밝은 배전에서는 산미가 원두 특성일 수 있다.");
    if (input.extraction.brewTimeBand === "short") {
      addScore(context, "A-GRIND-FINER", modifier);
    }
  }

  if (LIGHT_ROAST_RANGES.has(range) && (has("bitter") || has("astringent"))) {
    addMatchedRule(context, "ROAST-LIGHT-BITTER");
    addScore(context, "A-GRIND-COARSER", modifier);
  }

  if (DARK_ROAST_RANGES.has(range) && has("bitter")) {
    addMatchedRule(context, "ROAST-DARK-BITTER");
    context.rationale.push("쓴맛이 다크 배전 원두 특성일 수 있다.");
    if (input.extraction.brewTimeBand === "long") {
      addScore(context, "A-GRIND-COARSER", modifier);
    }
    if (input.extraction.brewRatioBand === "high") {
      addScore(context, "A-YIELD-DECREASE", modifier);
    }
  }

  if (DARK_ROAST_RANGES.has(range) && has("sour")) {
    addMatchedRule(context, "ROAST-DARK-SOUR");
    addScore(context, "A-CHANNELING-CHECK", modifier);
    addScore(context, "A-DISTRIBUTION-CHECK", modifier);
    addScore(context, "A-GRIND-FINER", modifier);
  }

  if (range === "unknown" && lowConfidence) {
    return;
  }
}

function applyPreviousShotComparison(
  input: RecommendationInput,
  context: BuildContext,
): void {
  const has = (id: TasteTagId) => context.tagIds.has(id);
  const changes = input.changesFromPrevious;

  if (
    changes.some(
      (change) =>
        change.variable === "grind_size" && change.direction === "finer",
    ) &&
    (has("bitter") || has("astringent"))
  ) {
    addMatchedRule(context, "C-GRIND-FINER-BITTER");
    addScore(context, "A-GRIND-COARSER", 2);
    context.rationale.push("직전 조정 후 쓴맛/떫음이 늘었을 수 있다.");
  }

  if (
    changes.some(
      (change) =>
        change.variable === "grind_size" && change.direction === "coarser",
    ) &&
    has("sour")
  ) {
    addMatchedRule(context, "C-GRIND-COARSER-SOUR");
    addScore(context, "A-GRIND-FINER", 2);
    context.rationale.push("직전 조정 후 신맛이 늘었을 수 있다.");
  }

  if (
    changes.some(
      (change) => change.variable === "yield" && change.direction === "increase",
    ) &&
    (has("watery") || has("hollow"))
  ) {
    addMatchedRule(context, "C-YIELD-UP-WATERY");
    addScore(context, "A-YIELD-DECREASE", 2);
    context.rationale.push("직전 추출량 증가 후 희석감이 커졌을 수 있다.");
  }
}

function buildFromTemplate({
  template,
  matchedRules,
  rationale,
  uncertainty,
  extraAlternatives = [],
}: {
  template: RuleResultTemplate;
  matchedRules: RecommendationRuleId[];
  rationale: string[];
  uncertainty: string[];
  extraAlternatives?: RecommendationActionId[];
}): RecommendationResult {
  const alternativeIds = dedupeActionIds([
    ...template.alternatives,
    ...extraAlternatives,
  ]).filter((id) => id !== template.primary);

  return {
    primary: createRecommendationAction(template.primary, 1) as PrimaryRecommendationAction,
    alternatives: createAlternatives(alternativeIds),
    rationale: dedupeStrings(rationale),
    uncertainty: dedupeStrings(uncertainty),
    matchedRules: dedupeStrings(matchedRules),
    keepVariables: template.keepVariables,
  };
}

function buildFromScoredAction(
  actionId: RecommendationActionId,
  baseRule: RuleResultTemplate,
  context: BuildContext,
): RecommendationResult {
  const primary = createRecommendationAction(
    actionId,
    1,
  ) as PrimaryRecommendationAction;
  const alternativeIds = dedupeActionIds([
    baseRule.primary,
    ...baseRule.alternatives,
  ]).filter((id) => id !== actionId);

  return {
    primary,
    alternatives: createAlternatives(alternativeIds),
    rationale: dedupeStrings([baseRule.rationale, ...context.rationale]),
    uncertainty: dedupeStrings([...baseRule.uncertainty, ...context.uncertainty]),
    matchedRules: dedupeStrings(context.matchedRules),
    keepVariables:
      RECIPE_KEEP_BY_ACTION[primary.variable] ?? baseRule.keepVariables,
  };
}

function createAlternatives(
  alternativeIds: RecommendationActionId[],
): RecommendationAction[] {
  return alternativeIds.map((id, index) =>
    createRecommendationAction(id, index === 0 ? 2 : 3),
  );
}

function selectTopScoredAction(
  context: BuildContext,
): RecommendationActionId | undefined {
  const candidates = [...context.scores.entries()].filter(([, score]) => score > 0);
  if (candidates.length === 0) {
    return undefined;
  }

  candidates.sort(([leftId, leftScore], [rightId, rightScore]) => {
    if (rightScore !== leftScore) {
      return rightScore - leftScore;
    }

    return compareActionTieBreak(leftId, rightId);
  });

  return candidates[0][0];
}

function compareActionTieBreak(
  leftId: RecommendationActionId,
  rightId: RecommendationActionId,
): number {
  const left = createRecommendationAction(leftId, 1);
  const right = createRecommendationAction(rightId, 1);
  const recipeLeft = RECIPE_ACTION_VARIABLE_ORDER.indexOf(left.variable);
  const recipeRight = RECIPE_ACTION_VARIABLE_ORDER.indexOf(right.variable);

  if (recipeLeft >= 0 && recipeRight >= 0) {
    return recipeLeft - recipeRight;
  }

  const prepLeft = PREP_ACTION_VARIABLE_ORDER.indexOf(left.variable);
  const prepRight = PREP_ACTION_VARIABLE_ORDER.indexOf(right.variable);

  if (prepLeft >= 0 && prepRight >= 0) {
    return prepLeft - prepRight;
  }

  if (prepLeft >= 0 && recipeRight >= 0) {
    return -1;
  }

  if (recipeLeft >= 0 && prepRight >= 0) {
    return 1;
  }

  return leftId.localeCompare(rightId);
}

function addScore(
  context: BuildContext,
  actionId: RecommendationActionId,
  score: number,
): void {
  context.scores.set(actionId, (context.scores.get(actionId) ?? 0) + score);
}

function addMatchedRule(
  context: BuildContext,
  ruleId: RecommendationRuleId,
): void {
  if (!context.matchedRules.includes(ruleId)) {
    context.matchedRules.push(ruleId);
  }
}

function dedupeActionIds(
  actionIds: RecommendationActionId[],
): RecommendationActionId[] {
  return [...new Set(actionIds)];
}

function dedupeStrings<T extends string>(values: T[]): T[] {
  return [...new Set(values)];
}
