export type DateString = string;
export type DateTimeString = string;

export type BeanSessionStatus = "active" | "archived";

export type RoastRange =
  | "unknown"
  | "light_range"
  | "medium_light_range"
  | "medium_range"
  | "medium_dark_range"
  | "dark_range";

export type RoastConfidence = "unknown" | "low" | "medium" | "high";

export type RoastProfileSource =
  | "unknown"
  | "user_selected"
  | "roaster_label"
  | "inferred";

export interface RoastProfile {
  range: RoastRange;
  label?: string;
  confidence: RoastConfidence;
  source: RoastProfileSource;
}

export interface BeanSession {
  id: string;
  name: string;
  beanName?: string;
  roaster?: string;
  roastDate?: DateString;
  roastProfile: RoastProfile;
  note?: string;
  status: BeanSessionStatus;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}

export type BrewTimeBand = "short" | "normal" | "long";
export type BrewRatioBand = "low" | "target" | "high";

export type ExtractionInputWarningCode =
  | "dose_out_of_common_range"
  | "yield_out_of_common_range"
  | "time_out_of_common_range"
  | "ratio_out_of_common_range";

export interface Extraction {
  tasteDescription: string;
  doseGrams: number;
  yieldGrams: number;
  brewSeconds: number;
  brewRatio: number;
  brewTimeBand: BrewTimeBand;
  brewRatioBand: BrewRatioBand;
  inputWarnings: ExtractionInputWarningCode[];
}

export type PrepObservationId =
  | "no_issue_observed"
  | "one_sided_flow"
  | "spurting_or_spraying"
  | "sudden_flow_acceleration"
  | "cracked_puck"
  | "uneven_puck_surface"
  | "soupy_puck"
  | "tilted_tamp"
  | "uneven_distribution"
  | "not_sure";

export type ChannelingObserved = "unknown" | "yes" | "no";

export type PuckCondition =
  | "unknown"
  | "clean"
  | "wet"
  | "soupy"
  | "cracked"
  | "uneven";

export type PrepIssue = "unknown" | "none" | "suspected" | "confirmed";

export type PrepIssueType =
  | "distribution"
  | "tamping"
  | "puck_surface"
  | "flow";

export interface BasicObservation {
  grindNote?: string;
  prepObservations: PrepObservationId[];
  channelingObserved: ChannelingObserved;
  puckCondition: PuckCondition;
  prepIssue: PrepIssue;
  prepIssueTypes: PrepIssueType[];
}

export interface AdvancedObservation {
  pressureBars?: number;
  temperatureCelsius?: number;
  daysOffRoast?: number;
  waterNote?: string;
  equipmentNote?: string;
  preinfusionNote?: string;
}

export type ShotChangeVariable =
  | "grind_size"
  | "dose"
  | "yield"
  | "tamping_consistency"
  | "distribution"
  | "puck_prep"
  | "advanced_condition";

export type ShotChangeDirection =
  | "finer"
  | "coarser"
  | "increase"
  | "decrease"
  | "improved"
  | "worse"
  | "changed"
  | "unknown";

export type ShotChangeResult = "improved" | "worse" | "unknown";

export type ChangeAmountLabel =
  | "one_small_step"
  | "small"
  | "next_shot_observation"
  | "none";

export interface ShotChange {
  variable: ShotChangeVariable;
  direction: ShotChangeDirection;
  result?: ShotChangeResult;
  amountLabel?: ChangeAmountLabel;
  note?: string;
}

export type TasteTagId =
  | "sour"
  | "bitter"
  | "watery"
  | "astringent"
  | "harsh"
  | "hollow"
  | "balanced";

export type TastePolarity =
  | "under_extraction"
  | "over_extraction"
  | "weak_extraction"
  | "prep_issue"
  | "balanced"
  | "unknown";

export type TasteIntensity = 1 | 2 | 3;
export type TastePosition = "start" | "middle" | "finish" | "overall";
export type TasteConfidence = "low" | "medium" | "high";

export interface TasteTag {
  id: TasteTagId;
  label: string;
  polarity: TastePolarity;
  intensity: TasteIntensity;
  position?: TastePosition;
  confidence: TasteConfidence;
  sourceText: string;
}

export type TastePatternId =
  | "conflicting_extraction_signals"
  | "weak_and_sour"
  | "balanced_with_negative_signal"
  | "unknown_description";

export interface TastePattern {
  id: TastePatternId;
  sourceTagIds: TasteTagId[];
  confidence: TasteConfidence;
}

export type RecommendationActionVariable =
  | "no_change"
  | "grind_size"
  | "dose"
  | "yield"
  | "tamping_consistency"
  | "distribution"
  | "channeling_check"
  | "puck_prep"
  | "advanced_condition";

export type RecommendationActionDirection =
  | "finer"
  | "coarser"
  | "increase"
  | "decrease"
  | "check"
  | "keep";

export type RecommendationActionAmountLabel = ChangeAmountLabel;
export type RecommendationActionPriority = 1 | 2 | 3;

export interface RecommendationAction {
  id: string;
  variable: RecommendationActionVariable;
  direction: RecommendationActionDirection;
  amountLabel: RecommendationActionAmountLabel;
  priority: RecommendationActionPriority;
  message: string;
}

export type PrimaryRecommendationAction = RecommendationAction & {
  priority: 1;
};

export type RecommendationKeepVariable =
  | "grind_size"
  | "dose"
  | "yield"
  | "tamping_consistency"
  | "distribution"
  | "puck_prep"
  | "advanced_condition";

export interface RecommendationResult {
  primary: PrimaryRecommendationAction;
  alternatives: RecommendationAction[];
  rationale: string[];
  uncertainty: string[];
  matchedRules: string[];
  keepVariables: RecommendationKeepVariable[];
}

export interface ShotRecord {
  id: string;
  sessionId: string;
  shotNumber: number;
  extraction: Extraction;
  basicObservation: BasicObservation;
  advancedObservation: AdvancedObservation | null;
  changesFromPrevious: ShotChange[];
  tasteTags: TasteTag[];
  tastePatterns: TastePattern[];
  recommendation: RecommendationResult;
  pulledAt: DateTimeString;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
}
