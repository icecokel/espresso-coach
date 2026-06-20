import type { BasicObservation, RoastProfile } from "./types";

export function createUnknownRoastProfile(): RoastProfile {
  return {
    range: "unknown",
    confidence: "unknown",
    source: "unknown",
  };
}

export function createEmptyBasicObservation(): BasicObservation {
  return {
    prepObservations: [],
    channelingObserved: "unknown",
    puckCondition: "unknown",
    prepIssue: "unknown",
    prepIssueTypes: [],
  };
}

export const emptyShotDefaults = {
  advancedObservation: null,
  changesFromPrevious: [],
  tasteTags: [],
  tastePatterns: [],
} as const;
