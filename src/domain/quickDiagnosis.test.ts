import { describe, expect, it } from "vitest";
import {
  buildExtraction,
  createInputWarningConfirmation,
  createSubmissionLock,
  deriveBasicObservation,
  shouldInvalidateInputWarningConfirmation,
  shouldRequestInputWarningConfirmation,
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

  it("requires a fresh confirmation before continuing with warning inputs", () => {
    const input = {
      tasteDescription: "너무 시다",
      doseGrams: 4,
      yieldGrams: 8,
      brewSeconds: 8,
    };
    const extraction = buildExtraction(input);
    const confirmation = createInputWarningConfirmation(input);

    expect(
      shouldRequestInputWarningConfirmation({
        input,
        inputWarnings: extraction.inputWarnings,
        confirmation: null,
      }),
    ).toBe(true);
    expect(
      shouldRequestInputWarningConfirmation({
        input,
        inputWarnings: extraction.inputWarnings,
        confirmation,
      }),
    ).toBe(false);
    expect(
      shouldRequestInputWarningConfirmation({
        input: { ...input, doseGrams: 5 },
        inputWarnings: extraction.inputWarnings,
        confirmation,
      }),
    ).toBe(true);
    expect(
      shouldRequestInputWarningConfirmation({
        input: { ...input, doseGrams: 18, yieldGrams: 36, brewSeconds: 28 },
        inputWarnings: [],
        confirmation: null,
      }),
    ).toBe(false);
  });

  it("invalidates a warning confirmation when a measured extraction value changes", () => {
    expect(
      shouldInvalidateInputWarningConfirmation("doseGrams", "4", "5"),
    ).toBe(true);
    expect(
      shouldInvalidateInputWarningConfirmation("yieldGrams", "8", "9"),
    ).toBe(true);
    expect(
      shouldInvalidateInputWarningConfirmation("brewSeconds", "8", "9"),
    ).toBe(true);
    expect(
      shouldInvalidateInputWarningConfirmation("yieldGrams", "8", "8"),
    ).toBe(false);
    expect(
      shouldInvalidateInputWarningConfirmation("tasteDescription", "시다", "쓰다"),
    ).toBe(false);
  });

  it("allows only one synchronous submission lock acquisition until released", () => {
    const lock = createSubmissionLock();

    expect(lock.acquire()).toBe(true);
    expect(lock.acquire()).toBe(false);

    lock.release();

    expect(lock.acquire()).toBe(true);
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
