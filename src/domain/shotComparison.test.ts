import { describe, expect, it } from "vitest";
import { buildShotChangesFromComparison } from "./shotComparison";
import type { Extraction, ShotChange, ShotRecord } from "./types";

function extraction({
  doseGrams = 18,
  yieldGrams = 36,
}: Partial<Pick<Extraction, "doseGrams" | "yieldGrams">> = {}): Extraction {
  return {
    tasteDescription: "test shot",
    doseGrams,
    yieldGrams,
    brewSeconds: 28,
    brewRatio: yieldGrams / doseGrams,
    brewTimeBand: "normal",
    brewRatioBand: "target",
    inputWarnings: [],
  };
}

function previousShot(currentExtraction: Extraction): Pick<ShotRecord, "extraction"> {
  return { extraction: currentExtraction };
}

describe("buildShotChangesFromComparison", () => {
  it("returns no automatic changes without a previous shot or when measured values are unchanged", () => {
    expect(
      buildShotChangesFromComparison({
        previousShot: null,
        currentExtraction: extraction(),
      }),
    ).toEqual([]);

    expect(
      buildShotChangesFromComparison({
        previousShot: previousShot(extraction()),
        currentExtraction: extraction(),
      }),
    ).toEqual([]);
  });

  it("records measured dose and yield increases or decreases", () => {
    expect(
      buildShotChangesFromComparison({
        previousShot: previousShot(extraction()),
        currentExtraction: extraction({ doseGrams: 19, yieldGrams: 34 }),
      }),
    ).toEqual([
      { variable: "dose", direction: "increase" },
      { variable: "yield", direction: "decrease" },
    ]);
  });

  it("does not detect automatic changes from invalid current values", () => {
    expect(
      buildShotChangesFromComparison({
        previousShot: previousShot(extraction()),
        currentExtraction: extraction({ doseGrams: Number.NaN, yieldGrams: 38 }),
      }),
    ).toEqual([]);
  });

  it("uses a manual change instead of an automatic change for the same variable", () => {
    const manualChange: ShotChange = {
      variable: "dose",
      direction: "decrease",
      result: "worse",
    };

    expect(
      buildShotChangesFromComparison({
        previousShot: previousShot(extraction()),
        currentExtraction: extraction({ doseGrams: 19, yieldGrams: 38 }),
        manualChange,
      }),
    ).toEqual([
      manualChange,
      { variable: "yield", direction: "increase" },
    ]);
  });

  it("appends a distinct manual change after automatic dose and yield changes", () => {
    const manualChange: ShotChange = {
      variable: "grind_size",
      direction: "finer",
      result: "improved",
    };

    expect(
      buildShotChangesFromComparison({
        previousShot: previousShot(extraction()),
        currentExtraction: extraction({ doseGrams: 19, yieldGrams: 38 }),
        manualChange,
      }),
    ).toEqual([
      { variable: "dose", direction: "increase" },
      { variable: "yield", direction: "increase" },
      manualChange,
    ]);
  });
});
