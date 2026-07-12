import type { Extraction, ShotChange, ShotRecord } from "./types";

type MeasuredExtraction = Pick<Extraction, "doseGrams" | "yieldGrams">;

export interface ShotComparisonInput {
  previousShot?: Pick<ShotRecord, "extraction"> | null;
  currentExtraction: MeasuredExtraction;
  manualChange?: ShotChange;
}

export function buildShotChangesFromComparison({
  previousShot,
  currentExtraction,
  manualChange,
}: ShotComparisonInput): ShotChange[] {
  const automaticChanges = getAutomaticChanges(previousShot, currentExtraction);

  if (!manualChange) {
    return automaticChanges;
  }

  const automaticChangeIndex = automaticChanges.findIndex(
    (change) => change.variable === manualChange.variable,
  );

  if (automaticChangeIndex < 0) {
    return [...automaticChanges, manualChange];
  }

  return automaticChanges.map((change, index) =>
    index === automaticChangeIndex ? manualChange : change,
  );
}

function getAutomaticChanges(
  previousShot: ShotComparisonInput["previousShot"],
  currentExtraction: MeasuredExtraction,
): ShotChange[] {
  if (
    !previousShot ||
    !hasValidMeasuredValues(previousShot.extraction) ||
    !hasValidMeasuredValues(currentExtraction)
  ) {
    return [];
  }

  return [
    getMeasuredChange(
      "dose",
      previousShot.extraction.doseGrams,
      currentExtraction.doseGrams,
    ),
    getMeasuredChange(
      "yield",
      previousShot.extraction.yieldGrams,
      currentExtraction.yieldGrams,
    ),
  ].filter((change): change is ShotChange => change !== undefined);
}

function hasValidMeasuredValues(extraction: MeasuredExtraction): boolean {
  return (
    Number.isFinite(extraction.doseGrams) &&
    extraction.doseGrams > 0 &&
    Number.isFinite(extraction.yieldGrams) &&
    extraction.yieldGrams > 0
  );
}

function getMeasuredChange(
  variable: "dose" | "yield",
  previousValue: number,
  currentValue: number,
): ShotChange | undefined {
  if (currentValue === previousValue) {
    return undefined;
  }

  return {
    variable,
    direction: currentValue > previousValue ? "increase" : "decrease",
  };
}
