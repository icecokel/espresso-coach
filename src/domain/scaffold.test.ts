import { describe, expect, it } from "vitest";
import { createEmptyBasicObservation, createUnknownRoastProfile } from "./defaults";
import {
  sampleNoChangeRecommendation,
  sampleShotRecord,
  unknownRoastProfile,
} from "./fixtures";

describe("domain contract fixtures", () => {
  it("keeps unknown and empty defaults explicit", () => {
    expect(createUnknownRoastProfile()).toEqual(unknownRoastProfile);
    expect(createEmptyBasicObservation()).toEqual({
      prepObservations: [],
      channelingObserved: "unknown",
      puckCondition: "unknown",
      prepIssue: "unknown",
      prepIssueTypes: [],
    });
    expect(sampleShotRecord.advancedObservation).toBeNull();
    expect(sampleShotRecord.changesFromPrevious).toEqual([]);
  });

  it("represents balanced shots with no_change only in recommendations", () => {
    expect(sampleNoChangeRecommendation.primary).toMatchObject({
      variable: "no_change",
      direction: "keep",
      amountLabel: "none",
      priority: 1,
    });
  });
});
