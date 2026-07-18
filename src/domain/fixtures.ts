import { createUnknownRoastProfile } from "./defaults";
import type {
  BeanSession,
  RecommendationResult,
  RoastProfile,
  ShotRecord,
} from "./types";

export const unknownRoastProfile: RoastProfile = createUnknownRoastProfile();

export const sampleNoChangeRecommendation: RecommendationResult = {
  primary: {
    id: "action_no_change_001",
    variable: "no_change",
    direction: "keep",
    amountLabel: "none",
    priority: 1,
    message: "Keep this recipe for the next shot.",
  },
  alternatives: [],
  rationale: ["The shot is balanced enough to keep the current variables."],
  uncertainty: [],
  matchedRules: ["R-BALANCED-KEEP"],
  keepVariables: [
    "grind_size",
    "dose",
    "yield",
    "tamping_consistency",
    "distribution",
    "puck_prep",
  ],
};

const sampleBeanSession: BeanSession = {
  id: "session_001",
  name: "New bean session 2026-06-04",
  beanName: "Ethiopia Guji",
  roaster: "Sample Roaster",
  roastDate: "2026-05-28",
  roastProfile: {
    range: "medium_light_range",
    label: "Medium Light",
    confidence: "medium",
    source: "roaster_label",
  },
  note: "First dialing session",
  status: "active",
  createdAt: "2026-06-04T09:00:00+09:00",
  updatedAt: "2026-06-04T09:00:00+09:00",
};

export const sampleShotRecord: ShotRecord = {
  id: "shot_001",
  sessionId: sampleBeanSession.id,
  shotNumber: 1,
  extraction: {
    tasteDescription: "Sour at the start and slightly bitter finish",
    doseGrams: 18,
    yieldGrams: 36,
    brewSeconds: 27,
    brewRatio: 2,
    brewTimeBand: "normal",
    brewRatioBand: "target",
    inputWarnings: [],
  },
  basicObservation: {
    grindNote: "First baseline shot",
    prepObservations: ["one_sided_flow", "uneven_puck_surface"],
    channelingObserved: "yes",
    puckCondition: "uneven",
    prepIssue: "suspected",
    prepIssueTypes: ["flow", "distribution", "puck_surface"],
  },
  advancedObservation: null,
  changesFromPrevious: [],
  tasteTags: [
    {
      id: "sour",
      label: "Sour",
      polarity: "under_extraction",
      intensity: 2,
      position: "start",
      confidence: "high",
      sourceText: "Sour at the start",
    },
    {
      id: "bitter",
      label: "Bitter",
      polarity: "over_extraction",
      intensity: 1,
      position: "finish",
      confidence: "medium",
      sourceText: "slightly bitter finish",
    },
  ],
  tastePatterns: [
    {
      id: "conflicting_extraction_signals",
      sourceTagIds: ["sour", "bitter"],
      confidence: "high",
    },
  ],
  recommendation: {
    primary: {
      id: "action_channeling_check_001",
      variable: "channeling_check",
      direction: "check",
      amountLabel: "next_shot_observation",
      priority: 1,
      message: "Check for channeling first on the next shot.",
    },
    alternatives: [
      {
        id: "action_distribution_001",
        variable: "distribution",
        direction: "check",
        amountLabel: "next_shot_observation",
        priority: 2,
        message: "Also check whether distribution and leveling are even.",
      },
    ],
    rationale: [
      "Sour and bitter signals together can indicate uneven extraction.",
    ],
    uncertainty: [
      "One shot is not enough to confirm the cause.",
    ],
    matchedRules: ["R-PREP-CONFLICT"],
    keepVariables: ["dose", "yield", "grind_size"],
  },
  pulledAt: "2026-06-04T09:18:00+09:00",
  createdAt: "2026-06-04T09:20:00+09:00",
  updatedAt: "2026-06-04T09:20:00+09:00",
};
