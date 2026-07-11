import type {
  BasicObservation,
  BrewRatioBand,
  BrewTimeBand,
  Extraction,
  ExtractionInputWarningCode,
  PrepIssue,
  PrepIssueType,
  PrepObservationId,
  PuckCondition,
} from "./types";

export interface QuickDiagnosisRequiredInput {
  tasteDescription: string;
  doseGrams: number;
  yieldGrams: number;
  brewSeconds: number;
}

export interface QuickDiagnosisValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof QuickDiagnosisRequiredInput, string>>;
}

export type InputWarningConfirmation = Pick<
  QuickDiagnosisRequiredInput,
  "doseGrams" | "yieldGrams" | "brewSeconds"
>;

export interface BasicObservationInput {
  grindNote?: string;
  prepObservations?: PrepObservationId[];
}

export function validateQuickDiagnosisInput(
  input: QuickDiagnosisRequiredInput,
): QuickDiagnosisValidationResult {
  const errors: QuickDiagnosisValidationResult["errors"] = {};

  if (input.tasteDescription.trim().length === 0) {
    errors.tasteDescription = "맛을 한마디로 적어주세요. 예: 시다, 쓰다, 밍밍하다";
  }

  validatePositiveNumber(input.doseGrams, "doseGrams", errors);
  validatePositiveNumber(input.yieldGrams, "yieldGrams", errors);
  validatePositiveNumber(input.brewSeconds, "brewSeconds", errors);

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}

export function createInputWarningConfirmation(
  input: QuickDiagnosisRequiredInput,
): InputWarningConfirmation {
  return {
    doseGrams: input.doseGrams,
    yieldGrams: input.yieldGrams,
    brewSeconds: input.brewSeconds,
  };
}

export function shouldRequestInputWarningConfirmation({
  input,
  inputWarnings,
  confirmation,
}: {
  input: QuickDiagnosisRequiredInput;
  inputWarnings: readonly ExtractionInputWarningCode[];
  confirmation: InputWarningConfirmation | null;
}): boolean {
  if (inputWarnings.length === 0) {
    return false;
  }

  return (
    confirmation === null ||
    confirmation.doseGrams !== input.doseGrams ||
    confirmation.yieldGrams !== input.yieldGrams ||
    confirmation.brewSeconds !== input.brewSeconds
  );
}

export function shouldInvalidateInputWarningConfirmation(
  field: string,
  previousValue: string,
  nextValue: string,
): boolean {
  return (
    (field === "doseGrams" || field === "yieldGrams" || field === "brewSeconds") &&
    previousValue !== nextValue
  );
}

export function buildExtraction(input: QuickDiagnosisRequiredInput): Extraction {
  const brewRatio = input.yieldGrams / input.doseGrams;

  return {
    tasteDescription: input.tasteDescription.trim(),
    doseGrams: input.doseGrams,
    yieldGrams: input.yieldGrams,
    brewSeconds: input.brewSeconds,
    brewRatio,
    brewTimeBand: getBrewTimeBand(input.brewSeconds),
    brewRatioBand: getBrewRatioBand(brewRatio),
    inputWarnings: getInputWarnings(input, brewRatio),
  };
}

export function deriveBasicObservation({
  grindNote,
  prepObservations = [],
}: BasicObservationInput): BasicObservation {
  const observations = normalizePrepObservations(prepObservations);
  const observationSet = new Set(observations);
  const issueTypes: PrepIssueType[] = [];

  const hasFlow =
    observationSet.has("one_sided_flow") ||
    observationSet.has("spurting_or_spraying") ||
    observationSet.has("sudden_flow_acceleration");
  const hasDistribution =
    observationSet.has("one_sided_flow") ||
    observationSet.has("uneven_distribution") ||
    observationSet.has("uneven_puck_surface");
  const hasTamping = observationSet.has("tilted_tamp");
  const hasPuckSurface =
    observationSet.has("cracked_puck") ||
    observationSet.has("uneven_puck_surface") ||
    observationSet.has("soupy_puck");

  if (hasFlow) {
    issueTypes.push("flow");
  }
  if (hasDistribution) {
    issueTypes.push("distribution");
  }
  if (hasTamping) {
    issueTypes.push("tamping");
  }
  if (hasPuckSurface) {
    issueTypes.push("puck_surface");
  }

  const issueTypeSet = [...new Set(issueTypes)];
  const noIssueOnly =
    observations.length === 1 && observationSet.has("no_issue_observed");

  return {
    ...(grindNote?.trim() ? { grindNote: grindNote.trim() } : {}),
    prepObservations: observations,
    channelingObserved: noIssueOnly ? "no" : hasFlow ? "yes" : "unknown",
    puckCondition: noIssueOnly ? "clean" : getPuckCondition(observationSet),
    prepIssue: getPrepIssue({ noIssueOnly, issueTypeSet }),
    prepIssueTypes: issueTypeSet,
  };
}

function validatePositiveNumber(
  value: number,
  field: Exclude<keyof QuickDiagnosisRequiredInput, "tasteDescription">,
  errors: QuickDiagnosisValidationResult["errors"],
): void {
  if (Number.isNaN(value)) {
    errors[field] = "숫자만 입력해주세요.";
    return;
  }

  if (value <= 0) {
    errors[field] = "0보다 큰 값을 입력해주세요.";
  }
}

function getBrewTimeBand(brewSeconds: number): BrewTimeBand {
  if (brewSeconds < 25) {
    return "short";
  }
  if (brewSeconds > 32) {
    return "long";
  }
  return "normal";
}

function getBrewRatioBand(brewRatio: number): BrewRatioBand {
  if (brewRatio < 1.7) {
    return "low";
  }
  if (brewRatio > 2.3) {
    return "high";
  }
  return "target";
}

function getInputWarnings(
  input: QuickDiagnosisRequiredInput,
  brewRatio: number,
): ExtractionInputWarningCode[] {
  const warnings: ExtractionInputWarningCode[] = [];

  if (input.doseGrams < 5 || input.doseGrams > 30) {
    warnings.push("dose_out_of_common_range");
  }
  if (input.yieldGrams < 5 || input.yieldGrams > 80) {
    warnings.push("yield_out_of_common_range");
  }
  if (input.brewSeconds < 10 || input.brewSeconds > 60) {
    warnings.push("time_out_of_common_range");
  }
  if (brewRatio < 1 || brewRatio > 4) {
    warnings.push("ratio_out_of_common_range");
  }

  return warnings;
}

function normalizePrepObservations(
  prepObservations: PrepObservationId[],
): PrepObservationId[] {
  const unique = [...new Set(prepObservations)];
  const hasProblemObservation = unique.some(
    (observation) => observation !== "no_issue_observed" && observation !== "not_sure",
  );

  return unique.filter((observation) => {
    if (observation === "no_issue_observed" && hasProblemObservation) {
      return false;
    }
    if (observation === "not_sure" && hasProblemObservation) {
      return false;
    }
    return true;
  });
}

function getPuckCondition(observationSet: Set<PrepObservationId>): PuckCondition {
  if (observationSet.has("cracked_puck")) {
    return "cracked";
  }
  if (observationSet.has("uneven_puck_surface")) {
    return "uneven";
  }
  if (observationSet.has("soupy_puck")) {
    return "soupy";
  }
  return "unknown";
}

function getPrepIssue({
  noIssueOnly,
  issueTypeSet,
}: {
  noIssueOnly: boolean;
  issueTypeSet: PrepIssueType[];
}): PrepIssue {
  if (noIssueOnly) {
    return "none";
  }
  return issueTypeSet.length > 0 ? "suspected" : "unknown";
}
