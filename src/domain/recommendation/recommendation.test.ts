import { describe, expect, it } from "vitest";
import { createEmptyBasicObservation, createUnknownRoastProfile } from "../defaults";
import type {
  BasicObservation,
  BrewRatioBand,
  BrewTimeBand,
  RoastProfile,
  ShotChange,
  TastePattern,
  TastePatternId,
  TasteTag,
  TasteTagId,
} from "../types";
import { buildRecommendation } from "./recommendation";

function extraction(
  brewTimeBand: BrewTimeBand,
  brewRatioBand: BrewRatioBand,
) {
  return {
    tasteDescription: "test shot",
    doseGrams: 18,
    yieldGrams: brewRatioBand === "high" ? 44 : 36,
    brewSeconds:
      brewTimeBand === "short" ? 22 : brewTimeBand === "long" ? 36 : 28,
    brewRatio: brewRatioBand === "high" ? 44 / 18 : 2,
    brewTimeBand,
    brewRatioBand,
    inputWarnings: [],
  };
}

function tag(id: TasteTagId): TasteTag {
  return {
    id,
    label: id,
    polarity:
      id === "balanced"
        ? "balanced"
        : id === "watery" || id === "hollow"
          ? "weak_extraction"
          : id === "harsh"
            ? "prep_issue"
            : id === "sour"
              ? "under_extraction"
              : "over_extraction",
    intensity: 2,
    position: "overall",
    confidence: "high",
    sourceText: id,
  };
}

function pattern(id: TastePatternId, sourceTagIds: TasteTagId[]): TastePattern {
  return {
    id,
    sourceTagIds,
    confidence: id === "unknown_description" ? "low" : "high",
  };
}

function buildInput({
  tasteTags = [],
  tastePatterns = [],
  basicObservation = createEmptyBasicObservation(),
  roastProfile = createUnknownRoastProfile(),
  changesFromPrevious = [],
  brewTimeBand = "normal",
  brewRatioBand = "target",
}: {
  tasteTags?: TasteTag[];
  tastePatterns?: TastePattern[];
  basicObservation?: BasicObservation;
  roastProfile?: RoastProfile;
  changesFromPrevious?: ShotChange[];
  brewTimeBand?: BrewTimeBand;
  brewRatioBand?: BrewRatioBand;
}) {
  return {
    session: {
      id: "session_001",
      name: "Test session",
      roastProfile,
      status: "active" as const,
      createdAt: "2026-06-04T09:00:00+09:00",
      updatedAt: "2026-06-04T09:00:00+09:00",
    },
    extraction: extraction(brewTimeBand, brewRatioBand),
    basicObservation,
    changesFromPrevious,
    tasteTags,
    tastePatterns,
  };
}

describe("buildRecommendation", () => {
  it("recommends one finer grind step for sour short shots", () => {
    const result = buildRecommendation(
      buildInput({
        tasteTags: [tag("sour")],
        brewTimeBand: "short",
      }),
    );

    expect(result.primary).toMatchObject({
      id: "A-GRIND-FINER",
      variable: "grind_size",
      direction: "finer",
      amountLabel: "one_small_step",
      priority: 1,
      message: "분쇄도를 한 단계만 곱게 조정하세요.",
    });
    expect(result.alternatives.map((action) => [action.id, action.priority])).toEqual([
      ["A-YIELD-INCREASE", 2],
      ["A-CHANNELING-CHECK", 3],
    ]);
    expect(result.matchedRules).toEqual(["R-SOUR-SHORT"]);
    expect(result.keepVariables).toEqual([
      "dose",
      "yield",
      "distribution",
      "puck_prep",
    ]);
    expect(result.primary.variable).not.toBe("brew_time");
  });

  it("keeps recipe variables when channeling observation overrides a recipe rule", () => {
    const result = buildRecommendation(
      buildInput({
        tasteTags: [tag("sour"), tag("watery")],
        tastePatterns: [pattern("weak_and_sour", ["sour", "watery"])],
        brewTimeBand: "short",
        basicObservation: {
          ...createEmptyBasicObservation(),
          prepObservations: ["spurting_or_spraying"],
          channelingObserved: "yes",
          prepIssue: "suspected",
          prepIssueTypes: ["flow"],
        },
      }),
    );

    expect(result.primary).toMatchObject({
      id: "A-CHANNELING-CHECK",
      variable: "channeling_check",
      priority: 1,
    });
    expect(result.alternatives.map((action) => action.id)).toEqual([
      "A-DISTRIBUTION-CHECK",
      "A-PUCK-PREP-CHECK",
      "A-GRIND-FINER",
    ]);
    expect(result.matchedRules).toEqual([
      "O-CHANNELING-OBSERVED",
      "R-SOUR-SHORT",
    ]);
    expect(result.keepVariables).toEqual(["grind_size", "dose", "yield"]);
  });

  it("uses no_change only for balanced shots without negative taste or prep issues", () => {
    const result = buildRecommendation(
      buildInput({
        tasteTags: [tag("balanced")],
        brewTimeBand: "normal",
        brewRatioBand: "target",
        basicObservation: {
          ...createEmptyBasicObservation(),
          prepObservations: ["no_issue_observed"],
          channelingObserved: "no",
          puckCondition: "clean",
          prepIssue: "none",
        },
      }),
    );

    expect(result.primary).toMatchObject({
      id: "A-NO-CHANGE",
      variable: "no_change",
      direction: "keep",
      amountLabel: "none",
      priority: 1,
    });
    expect(result.alternatives).toEqual([]);
    expect(result.uncertainty).toEqual([]);
    expect(result.matchedRules).toEqual(["O-NO-ISSUE-OBSERVED", "R-BALANCED"]);
  });

  it("uses conflict tie-break before single taste recipe rules", () => {
    const result = buildRecommendation(
      buildInput({
        tasteTags: [tag("sour"), tag("bitter")],
        tastePatterns: [
          pattern("conflicting_extraction_signals", ["sour", "bitter"]),
        ],
        brewTimeBand: "normal",
      }),
    );

    expect(result.primary).toMatchObject({
      id: "A-CHANNELING-CHECK",
      variable: "channeling_check",
      priority: 1,
    });
    expect(result.alternatives.map((action) => action.id)).toEqual([
      "A-DISTRIBUTION-CHECK",
      "A-PUCK-PREP-CHECK",
    ]);
    expect(result.matchedRules).toEqual(["R-SOUR-BITTER-CONFLICT"]);
  });

  it("records balanced-with-negative modifier while selecting the negative rule", () => {
    const result = buildRecommendation(
      buildInput({
        tasteTags: [tag("balanced"), tag("sour")],
        tastePatterns: [
          pattern("balanced_with_negative_signal", ["balanced", "sour"]),
        ],
        brewTimeBand: "short",
      }),
    );

    expect(result.primary).toMatchObject({
      id: "A-GRIND-FINER",
      variable: "grind_size",
      priority: 1,
    });
    expect(result.matchedRules).toEqual([
      "R-BALANCED-WITH-NEGATIVE",
      "R-SOUR-SHORT",
    ]);
    expect(result.uncertainty).toContain(
      "만족 신호가 함께 있어 조정 강도는 작은 단계로 제한한다.",
    );
  });

  it("adds roast context without making roast a standalone action", () => {
    const result = buildRecommendation(
      buildInput({
        tasteTags: [tag("bitter")],
        brewTimeBand: "long",
        roastProfile: {
          range: "dark_range",
          confidence: "high",
          source: "user_selected",
        },
      }),
    );

    expect(result.primary).toMatchObject({
      id: "A-GRIND-COARSER",
      variable: "grind_size",
    });
    expect(result.matchedRules).toEqual(["R-BITTER-LONG", "ROAST-DARK-BITTER"]);
    expect(result.rationale).toContain("쓴맛이 다크 배전 원두 특성일 수 있다.");
  });

  it("uses previous-shot changes as a corrective modifier", () => {
    const result = buildRecommendation(
      buildInput({
        tasteTags: [tag("watery")],
        brewRatioBand: "target",
        changesFromPrevious: [
          {
            variable: "yield",
            direction: "increase",
            amountLabel: "small",
          },
        ],
      }),
    );

    expect(result.primary).toMatchObject({
      id: "A-YIELD-DECREASE",
      variable: "yield",
      priority: 1,
    });
    expect(result.matchedRules).toContain("C-YIELD-UP-WATERY");
    expect(result.rationale).toContain(
      "직전 추출량 증가 후 희석감이 커졌을 수 있다.",
    );
  });

  it("distinguishes a successful adjustment from a worsening adjustment", () => {
    const improvedResult = buildRecommendation(
      buildInput({
        changesFromPrevious: [
          {
            variable: "yield",
            direction: "increase",
            result: "improved",
          },
        ],
      }),
    );
    const worseResult = buildRecommendation(
      buildInput({
        changesFromPrevious: [
          {
            variable: "yield",
            direction: "increase",
            result: "worse",
          },
        ],
      }),
    );

    expect(improvedResult.primary.id).toBe("A-YIELD-INCREASE");
    expect(improvedResult.rationale).toContain(
      "직전 조정 후 개선되어 같은 방향을 소폭 이어간다.",
    );
    expect(worseResult.primary.id).toBe("A-YIELD-DECREASE");
    expect(worseResult.rationale).toContain(
      "직전 조정 후 악화되어 반대 방향 조정을 우선한다.",
    );
  });

  it("prioritizes reversing a worse grind adjustment over a sour short base rule", () => {
    const result = buildRecommendation(
      buildInput({
        tasteTags: [tag("sour")],
        brewTimeBand: "short",
        changesFromPrevious: [
          {
            variable: "grind_size",
            direction: "finer",
            result: "worse",
          },
        ],
      }),
    );

    expect(result.primary.id).toBe("A-GRIND-COARSER");
    expect(result.alternatives.map((action) => action.id)).toContain(
      "A-GRIND-FINER",
    );
  });

  it("prioritizes reversing a worse grind adjustment over a sour bitter conflict rule", () => {
    const result = buildRecommendation(
      buildInput({
        tasteTags: [tag("sour"), tag("bitter")],
        tastePatterns: [
          pattern("conflicting_extraction_signals", ["sour", "bitter"]),
        ],
        changesFromPrevious: [
          {
            variable: "grind_size",
            direction: "finer",
            result: "worse",
          },
        ],
      }),
    );

    expect(result.primary.id).toBe("A-GRIND-COARSER");
  });

  it("preserves legacy previous-shot behavior when result is missing or unknown", () => {
    const legacyResult = buildRecommendation(
      buildInput({
        tasteTags: [tag("watery")],
        brewRatioBand: "target",
        changesFromPrevious: [
          {
            variable: "yield",
            direction: "increase",
            amountLabel: "small",
          },
        ],
      }),
    );
    const unknownResult = buildRecommendation(
      buildInput({
        tasteTags: [tag("watery")],
        brewRatioBand: "target",
        changesFromPrevious: [
          {
            variable: "yield",
            direction: "increase",
            amountLabel: "small",
            result: "unknown",
          },
        ],
      }),
    );

    expect(unknownResult).toEqual(legacyResult);
  });

  it("preserves the legacy finer-grind corrective modifier when result is missing or unknown", () => {
    const legacyResult = buildRecommendation(
      buildInput({
        tasteTags: [tag("bitter")],
        brewTimeBand: "normal",
        changesFromPrevious: [
          {
            variable: "grind_size",
            direction: "finer",
          },
        ],
      }),
    );
    const unknownResult = buildRecommendation(
      buildInput({
        tasteTags: [tag("bitter")],
        brewTimeBand: "normal",
        changesFromPrevious: [
          {
            variable: "grind_size",
            direction: "finer",
            result: "unknown",
          },
        ],
      }),
    );

    expect(legacyResult.primary.id).toBe("A-GRIND-COARSER");
    expect(unknownResult).toEqual(legacyResult);
  });

  it("keeps an observation override as the primary action after a worse result", () => {
    const result = buildRecommendation(
      buildInput({
        tasteTags: [tag("sour")],
        brewTimeBand: "short",
        basicObservation: {
          ...createEmptyBasicObservation(),
          prepObservations: ["spurting_or_spraying"],
          channelingObserved: "yes",
          prepIssue: "suspected",
          prepIssueTypes: ["flow"],
        },
        changesFromPrevious: [
          {
            variable: "grind_size",
            direction: "finer",
            result: "worse",
          },
        ],
      }),
    );

    expect(result.primary.id).toBe("A-CHANNELING-CHECK");
    expect(result.rationale).toContain(
      "직전 조정 후 악화되어 반대 방향 조정을 우선한다.",
    );
  });
});
