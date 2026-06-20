import { describe, expect, it } from "vitest";
import {
  buildExtraction,
  deriveBasicObservation,
  validateQuickDiagnosisInput,
} from "./quickDiagnosis";

describe("quick diagnosis helpers", () => {
  it("builds extraction values and warning codes from required inputs", () => {
    const extraction = buildExtraction({
      tasteDescription: "좀 시다",
      doseGrams: 18,
      yieldGrams: 44,
      brewSeconds: 22,
    });

    expect(extraction).toMatchObject({
      tasteDescription: "좀 시다",
      brewRatio: 44 / 18,
      brewTimeBand: "short",
      brewRatioBand: "high",
      inputWarnings: [],
    });
  });

  it("returns blocking validation errors for missing and invalid required values", () => {
    const result = validateQuickDiagnosisInput({
      tasteDescription: "",
      doseGrams: 0,
      yieldGrams: Number.NaN,
      brewSeconds: -1,
    });

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual({
      tasteDescription: "맛을 한마디로 적어주세요. 예: 시다, 쓰다, 밍밍하다",
      doseGrams: "0보다 큰 값을 입력해주세요.",
      yieldGrams: "숫자만 입력해주세요.",
      brewSeconds: "0보다 큰 값을 입력해주세요.",
    });
  });

  it("derives prep summary from observed flow and puck issues", () => {
    const observation = deriveBasicObservation({
      grindNote: "18 클릭",
      prepObservations: ["one_sided_flow", "uneven_distribution", "cracked_puck"],
    });

    expect(observation).toEqual({
      grindNote: "18 클릭",
      prepObservations: ["one_sided_flow", "uneven_distribution", "cracked_puck"],
      channelingObserved: "yes",
      puckCondition: "cracked",
      prepIssue: "suspected",
      prepIssueTypes: ["flow", "distribution", "puck_surface"],
    });
  });
});
