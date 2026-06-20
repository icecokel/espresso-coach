import type {
  TasteConfidence,
  TasteIntensity,
  TastePattern,
  TastePolarity,
  TastePosition,
  TasteTag,
  TasteTagId,
} from "../types";

export interface TasteParseResult {
  tasteTags: TasteTag[];
  tastePatterns: TastePattern[];
}

type TasteExpressionKind = "direct" | "ambiguous";

interface TasteExpression {
  id: TasteTagId;
  phrase: string;
  kind: TasteExpressionKind;
}

interface MatchedExpression {
  expression: TasteExpression;
  index: number;
}

const TAG_METADATA: Record<
  TasteTagId,
  { label: string; polarity: TastePolarity }
> = {
  sour: { label: "신맛", polarity: "under_extraction" },
  bitter: { label: "쓴맛", polarity: "over_extraction" },
  watery: { label: "밍밍함", polarity: "weak_extraction" },
  astringent: { label: "떫고 텁텁함", polarity: "over_extraction" },
  harsh: { label: "거친 맛", polarity: "prep_issue" },
  hollow: { label: "빈 느낌", polarity: "weak_extraction" },
  balanced: { label: "균형 잡힘", polarity: "balanced" },
};

const EXPRESSIONS: TasteExpression[] = [
  ...direct("sour", [
    "산미가 강하다",
    "산미가 강",
    "날카로운 산미",
    "찌르는 신맛",
    "혀를 찌른다",
    "레몬 같다",
    "레몬처럼",
    "식초 같다",
    "새콤하다",
    "새콤",
    "신맛",
    "시다",
    "시고",
    "신데",
    "셔요",
  ]),
  ...ambiguous("sour", ["산미가 있다", "산미가 있고", "상큼하다", "밝다", "과일 같다", "톡 쏜다"]),
  ...direct("bitter", [
    "까맣게 탄 맛",
    "탄 것 같다",
    "한약 같다",
    "쓴 기운",
    "탄맛",
    "약맛",
    "재맛",
    "잿맛",
    "쓴맛",
    "쓰다",
    "쓰고",
    "쓴데",
    "써요",
  ]),
  ...ambiguous("bitter", ["다크하다", "진하다", "묵직하다", "로스티하다", "스모키하다"]),
  ...direct("watery", [
    "물 탄 것 같다",
    "물 탄 것처럼",
    "바디가 없다",
    "진하지 않다",
    "힘이 없다",
    "밍밍하다",
    "밍밍하고",
    "밍밍한데",
    "물 같다",
    "연하다",
    "묽다",
    "싱겁다",
  ]),
  ...ambiguous("watery", ["가볍다", "깔끔하다", "부드럽다", "약하다"]),
  ...direct("astringent", [
    "입안이 마른다",
    "마르는 느낌",
    "입이 마른다",
    "혀가 마른다",
    "드라이하다",
    "입에 남는다",
    "텁텁하다",
    "까끌하다",
    "떫다",
  ]),
  ...ambiguous("astringent", ["깔끔하지 않다", "잔맛이 남는다", "무겁다", "답답하다"]),
  ...direct("harsh", [
    "날카롭고 거칠다",
    "맛이 지저분하다",
    "정리가 안 된다",
    "균일하지 않다",
    "자극적이다",
    "튀는 맛",
    "불쾌하다",
    "거칠다",
    "날뛴다",
    "잡맛",
  ]),
  ...ambiguous("harsh", ["산만하다", "복잡하다", "튀다"]),
  ...direct("hollow", [
    "앞뒤만 있고 가운데가 없다",
    "향은 있는데 맛이 없다",
    "속이 비었다",
    "중간이 없다",
    "맛이 비었다",
    "비어 있다",
    "빈 느낌",
    "깊이가 없다",
  ]),
  ...ambiguous("hollow", ["여운이 없다", "허전하다", "단조롭다", "심심하다", "짧다"]),
  ...direct("balanced", [
    "이 정도면 좋다",
    "밸런스 좋다",
    "밸런스가 좋다",
    "균형 있다",
    "마시기 좋다",
    "문제 없다",
    "조화롭다",
    "괜찮다",
    "괜찮은데",
    "맛있다",
    "맛있는데",
    "좋다",
    "좋은데",
    "무난하다",
  ]),
  ...ambiguous("balanced", ["나쁘지 않다", "먹을 만하다"]),
].sort((left, right) => right.phrase.length - left.phrase.length);

const WEAK_HINTS = ["살짝", "조금", "좀", "약간", "은은하게", "미세하게", "덜", "가볍게"];
const STRONG_HINTS = [
  "너무",
  "엄청",
  "많이",
  "강하게",
  "확",
  "심하게",
  "과하게",
  "찌르는",
  "거슬릴 정도로",
];

const POSITION_HINTS: Record<TastePosition, string[]> = {
  start: ["입에 넣자마자", "처음엔", "처음", "초반", "첫맛", "앞쪽"],
  middle: ["마시는 중간", "중간맛", "중간", "중반", "가운데"],
  finish: ["끝맛", "마지막", "뒷맛", "후반", "뒤에", "여운", "끝"],
  overall: ["전체적으로", "전반적으로", "대체로", "계속"],
};

const BITTER_LOW_CONTEXT = ["좋다", "좋은데", "고소하다", "초콜릿 같다"];
const WATERY_LOW_CONTEXT = ["좋다", "좋은데", "괜찮다", "괜찮은데", "마시기 편하다"];
const ASTRINGENT_HIGH_CONTEXT = ["끝", "끝맛", "뒷맛", "뒤에", "입안"];
const HOLLOW_HIGH_CONTEXT = ["중간", "가운데", "향은 있는데"];
const NEGATIVE_TAG_IDS: TasteTagId[] = [
  "sour",
  "bitter",
  "watery",
  "astringent",
  "harsh",
  "hollow",
];

export function parseTasteDescription(description: string): TasteParseResult {
  const normalized = normalizeDescription(description);
  const clauses = splitClauses(normalized);
  const tasteTags = mergeDuplicateTags(
    clauses.flatMap((clause) => parseClause(clause)),
  );

  return {
    tasteTags,
    tastePatterns: deriveTastePatterns(tasteTags),
  };
}

function direct(id: TasteTagId, phrases: string[]): TasteExpression[] {
  return phrases.map((phrase) => ({ id, phrase, kind: "direct" }));
}

function ambiguous(id: TasteTagId, phrases: string[]): TasteExpression[] {
  return phrases.map((phrase) => ({ id, phrase, kind: "ambiguous" }));
}

function normalizeDescription(description: string): string {
  return description.trim().replace(/\s+/g, " ");
}

function splitClauses(description: string): string[] {
  if (description.length === 0) {
    return [];
  }

  return description
    .split(/\s*(?:[,./;]|그리고|근데|그런데|하지만)\s*/u)
    .flatMap(splitConnectiveEndings)
    .map((clause) => clause.trim())
    .filter(Boolean);
}

function splitConnectiveEndings(clause: string): string[] {
  const tokens = clause.split(" ");
  const clauses: string[] = [];
  let current: string[] = [];

  tokens.forEach((token, index) => {
    current.push(token);

    const isLastToken = index === tokens.length - 1;
    if (isLastToken) {
      return;
    }

    const candidate = current.join(" ");
    if (hasTasteExpression(candidate) && hasConnectiveEnding(token)) {
      clauses.push(candidate);
      current = [];
    }
  });

  if (current.length > 0) {
    clauses.push(current.join(" "));
  }

  return clauses;
}

function hasConnectiveEnding(token: string): boolean {
  return /(?:하고|면서|인데|은데|는데|고)$/u.test(token);
}

function hasTasteExpression(text: string): boolean {
  return EXPRESSIONS.some((expression) => text.includes(expression.phrase));
}

function parseClause(clause: string): TasteTag[] {
  const matches = findExpressionMatches(clause);

  return matches.flatMap(({ expression, index }) => {
    if (isNegated(clause, expression, index)) {
      return [];
    }

    const confidence = getConfidence(clause, expression);
    const metadata = TAG_METADATA[expression.id];

    return [
      {
        id: expression.id,
        label: metadata.label,
        polarity: metadata.polarity,
        intensity: getIntensity(clause),
        position: getPosition(clause, index),
        confidence,
        sourceText: clause,
      },
    ];
  });
}

function findExpressionMatches(clause: string): MatchedExpression[] {
  const occupied: boolean[] = Array.from({ length: clause.length }, () => false);
  const matches: MatchedExpression[] = [];

  EXPRESSIONS.forEach((expression) => {
    let index = clause.indexOf(expression.phrase);

    while (index !== -1) {
      if (!overlapsOccupied(occupied, index, expression.phrase.length)) {
        markOccupied(occupied, index, expression.phrase.length);
        matches.push({ expression, index });
      }

      index = clause.indexOf(expression.phrase, index + expression.phrase.length);
    }
  });

  return matches.sort((left, right) => left.index - right.index);
}

function overlapsOccupied(occupied: boolean[], start: number, length: number): boolean {
  return occupied.slice(start, start + length).some(Boolean);
}

function markOccupied(occupied: boolean[], start: number, length: number): void {
  for (let index = start; index < start + length; index += 1) {
    occupied[index] = true;
  }
}

function isNegated(clause: string, expression: TasteExpression, index: number): boolean {
  const phrase = expression.phrase;
  if (isDictionaryNegativeForm(phrase)) {
    return false;
  }

  const before = clause.slice(Math.max(0, index - 8), index).trim();
  const after = clause.slice(index + phrase.length, index + phrase.length + 8).trim();
  const phraseEnd = clause.slice(index, index + phrase.length + 8);

  return (
    /(?:^|\s)안\s*$/u.test(before) ||
    /없(?:다|고|는|어요|음)?/u.test(after) ||
    /지\s*않/u.test(phraseEnd) ||
    /은\s*없/u.test(after) ||
    /는\s*없/u.test(after)
  );
}

function isDictionaryNegativeForm(phrase: string): boolean {
  return phrase.includes("지 않") || phrase.includes("없다");
}

function getIntensity(clause: string): TasteIntensity {
  if (STRONG_HINTS.some((hint) => clause.includes(hint))) {
    return 3;
  }

  if (WEAK_HINTS.some((hint) => clause.includes(hint))) {
    return 1;
  }

  return 2;
}

function getPosition(clause: string, matchIndex: number): TastePosition {
  const hintMatches = Object.entries(POSITION_HINTS).flatMap(([position, hints]) =>
    hints.flatMap((hint) => {
      const index = clause.indexOf(hint);
      return index === -1
        ? []
        : [{ position: position as TastePosition, index, distance: Math.abs(index - matchIndex) }];
    }),
  );

  if (hintMatches.length === 0) {
    return "overall";
  }

  return hintMatches.sort((left, right) => left.distance - right.distance)[0].position;
}

function getConfidence(clause: string, expression: TasteExpression): TasteConfidence {
  if (expression.id === "balanced") {
    return "medium";
  }

  if (expression.id === "harsh" && hasAny(clause, ["지저분", "거칠", "잡맛", "정리가 안"])) {
    return "high";
  }

  if (expression.id === "astringent" && hasAny(clause, ASTRINGENT_HIGH_CONTEXT)) {
    return "high";
  }

  if (expression.id === "hollow" && hasAny(clause, HOLLOW_HIGH_CONTEXT)) {
    return "high";
  }

  if (expression.kind === "direct") {
    return "high";
  }

  if (expression.id === "bitter" && hasAny(clause, BITTER_LOW_CONTEXT)) {
    return "low";
  }

  if (expression.id === "watery" && hasAny(clause, WATERY_LOW_CONTEXT)) {
    return "low";
  }

  return "medium";
}

function hasAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

function mergeDuplicateTags(tags: TasteTag[]): TasteTag[] {
  const mergedTags: TasteTag[] = [];
  const tagIndexes = new Map<string, number>();

  tags.forEach((tag) => {
    const key = `${tag.id}:${tag.position ?? "overall"}`;
    const existingIndex = tagIndexes.get(key);

    if (existingIndex === undefined) {
      tagIndexes.set(key, mergedTags.length);
      mergedTags.push({ ...tag });
      return;
    }

    const existing = mergedTags[existingIndex];
    mergedTags[existingIndex] = {
      ...existing,
      intensity: maxIntensity(existing.intensity, tag.intensity),
      confidence: maxConfidence(existing.confidence, tag.confidence),
      sourceText: mergeSourceText(existing.sourceText, tag.sourceText),
    };
  });

  return mergedTags;
}

function maxIntensity(left: TasteIntensity, right: TasteIntensity): TasteIntensity {
  return left > right ? left : right;
}

function maxConfidence(left: TasteConfidence, right: TasteConfidence): TasteConfidence {
  const rank: Record<TasteConfidence, number> = { low: 1, medium: 2, high: 3 };
  return rank[left] >= rank[right] ? left : right;
}

function mergeSourceText(left: string, right: string): string {
  return left === right ? left : `${left} / ${right}`;
}

function deriveTastePatterns(tags: TasteTag[]): TastePattern[] {
  if (tags.length === 0) {
    return [
      {
        id: "unknown_description",
        sourceTagIds: [],
        confidence: "low",
      },
    ];
  }

  const tagIds = uniqueTagIds(tags);
  const patterns: TastePattern[] = [];

  const conflictingIds = getConflictingExtractionIds(tagIds);
  if (conflictingIds.length > 0) {
    patterns.push({
      id: "conflicting_extraction_signals",
      sourceTagIds: conflictingIds,
      confidence: areAllHighConfidence(tags, conflictingIds) ? "high" : "medium",
    });
  }

  const weakAndSourIds = getWeakAndSourIds(tagIds);
  if (weakAndSourIds.length > 0) {
    patterns.push({
      id: "weak_and_sour",
      sourceTagIds: weakAndSourIds,
      confidence: areAllHighConfidence(tags, weakAndSourIds) ? "high" : "medium",
    });
  }

  const negativeIds = tagIds.filter((id) => NEGATIVE_TAG_IDS.includes(id));
  if (tagIds.includes("balanced") && negativeIds.length > 0) {
    patterns.push({
      id: "balanced_with_negative_signal",
      sourceTagIds: ["balanced", ...negativeIds],
      confidence: "high",
    });
  }

  return patterns;
}

function uniqueTagIds(tags: TasteTag[]): TasteTagId[] {
  return tags.reduce<TasteTagId[]>((ids, tag) => {
    if (!ids.includes(tag.id)) {
      ids.push(tag.id);
    }
    return ids;
  }, []);
}

function getConflictingExtractionIds(tagIds: TasteTagId[]): TasteTagId[] {
  if (tagIds.includes("sour") && tagIds.includes("bitter")) {
    return ["sour", "bitter"];
  }

  if (tagIds.includes("sour") && tagIds.includes("astringent")) {
    return ["sour", "astringent"];
  }

  return [];
}

function getWeakAndSourIds(tagIds: TasteTagId[]): TasteTagId[] {
  if (!tagIds.includes("sour")) {
    return [];
  }

  const weakIds = (["watery", "hollow"] as TasteTagId[]).filter((id) =>
    tagIds.includes(id),
  );

  return weakIds.length === 0 ? [] : ["sour", ...weakIds];
}

function areAllHighConfidence(tags: TasteTag[], ids: TasteTagId[]): boolean {
  return ids.every((id) => tags.some((tag) => tag.id === id && tag.confidence === "high"));
}
