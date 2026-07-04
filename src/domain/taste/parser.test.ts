import { describe, expect, it } from "vitest";
import { parseTasteDescription } from "./parser";

describe("parseTasteDescription", () => {
  it("maps conflicting start and finish extraction signals", () => {
    const result = parseTasteDescription("처음엔 시고 끝맛은 너무 쓰다");

    expect(result.tasteTags).toEqual([
      expect.objectContaining({
        id: "sour",
        intensity: 2,
        position: "start",
        confidence: "high",
        sourceText: "처음엔 시고",
      }),
      expect.objectContaining({
        id: "bitter",
        intensity: 3,
        position: "finish",
        confidence: "high",
        sourceText: "끝맛은 너무 쓰다",
      }),
    ]);
    expect(result.tastePatterns).toEqual([
      {
        id: "conflicting_extraction_signals",
        sourceTagIds: ["sour", "bitter"],
        confidence: "high",
      },
    ]);
  });

  it("maps weak and sour descriptions", () => {
    const result = parseTasteDescription("좀 시고 물 탄 것처럼 밍밍하다");

    expect(result.tasteTags).toEqual([
      expect.objectContaining({
        id: "sour",
        intensity: 1,
        position: "overall",
        confidence: "high",
        sourceText: "좀 시고",
      }),
      expect.objectContaining({
        id: "watery",
        intensity: 2,
        position: "overall",
        confidence: "high",
        sourceText: "물 탄 것처럼 밍밍하다",
      }),
    ]);
    expect(result.tastePatterns).toEqual([
      {
        id: "weak_and_sour",
        sourceTagIds: ["sour", "watery"],
        confidence: "high",
      },
    ]);
  });

  it("maps balanced descriptions with a negative finish signal", () => {
    const result = parseTasteDescription("전체적으로 괜찮은데 뒤에 살짝 텁텁하다");

    expect(result.tasteTags).toEqual([
      expect.objectContaining({
        id: "balanced",
        intensity: 2,
        position: "overall",
        confidence: "medium",
        sourceText: "전체적으로 괜찮은데",
      }),
      expect.objectContaining({
        id: "astringent",
        intensity: 1,
        position: "finish",
        confidence: "high",
        sourceText: "뒤에 살짝 텁텁하다",
      }),
    ]);
    expect(result.tastePatterns).toEqual([
      {
        id: "balanced_with_negative_signal",
        sourceTagIds: ["balanced", "astringent"],
        confidence: "high",
      },
    ]);
  });

  it("can derive multiple patterns from one description", () => {
    const result = parseTasteDescription("맛은 괜찮은데 처음엔 시고 끝은 쓰다");

    expect(result.tasteTags.map((tag) => [tag.id, tag.position])).toEqual([
      ["balanced", "overall"],
      ["sour", "start"],
      ["bitter", "finish"],
    ]);
    expect(result.tastePatterns).toEqual([
      {
        id: "conflicting_extraction_signals",
        sourceTagIds: ["sour", "bitter"],
        confidence: "high",
      },
      {
        id: "balanced_with_negative_signal",
        sourceTagIds: ["balanced", "sour", "bitter"],
        confidence: "high",
      },
    ]);
  });

  it("returns unknown_description when no taste tag maps", () => {
    const result = parseTasteDescription("맛이 뭔가 이상하다");

    expect(result).toEqual({
      tasteTags: [],
      tastePatterns: [
        {
          id: "unknown_description",
          sourceTagIds: [],
          confidence: "low",
        },
      ],
    });
  });

  it("does not create tags for negated taste expressions", () => {
    const result = parseTasteDescription("신맛은 없고 쓰지 않다");

    expect(result.tasteTags).toEqual([]);
    expect(result.tastePatterns).toEqual([
      {
        id: "unknown_description",
        sourceTagIds: [],
        confidence: "low",
      },
    ]);
  });

  it("keeps documented negative-form dictionary phrases as taste signals", () => {
    const result = parseTasteDescription("전체적으로 진하지 않다");

    expect(result.tasteTags).toEqual([
      expect.objectContaining({
        id: "watery",
        intensity: 2,
        position: "overall",
        confidence: "high",
      }),
    ]);
  });

  it("merges repeated tags with the same position using the strongest intensity", () => {
    const result = parseTasteDescription("처음엔 살짝 시고 처음엔 너무 신맛이 강하다");

    expect(result.tasteTags).toEqual([
      expect.objectContaining({
        id: "sour",
        intensity: 3,
        position: "start",
        sourceText: "처음엔 살짝 시고 / 처음엔 너무 신맛이 강하다",
      }),
    ]);
  });

  it("creates balanced for positive ambiguous sour descriptions", () => {
    const result = parseTasteDescription("산미가 있고 맛있다");

    expect(result.tasteTags).toEqual([
      expect.objectContaining({
        id: "sour",
        confidence: "medium",
      }),
      expect.objectContaining({
        id: "balanced",
        confidence: "medium",
      }),
    ]);
    expect(result.tastePatterns).toEqual([
      {
        id: "balanced_with_negative_signal",
        sourceTagIds: ["balanced", "sour"],
        confidence: "high",
      },
    ]);
  });
});
