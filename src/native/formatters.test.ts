import { describe, expect, it } from "vitest";
import {
  formatActionDirection,
  formatActionVariable,
  formatInputWarning,
  formatKeepVariables,
  formatRoastRange,
  formatSessionStatus,
  formatTasteTagPreview,
} from "./formatters";

describe("native formatters", () => {
  it("formats recommendation action labels and falls back to raw values", () => {
    expect(formatActionVariable("grind_size")).toBe("분쇄도");
    expect(formatActionVariable("channeling_check")).toBe("채널링");
    expect(formatActionVariable("custom_variable")).toBe("custom_variable");

    expect(formatActionDirection("finer")).toBe("더 곱게");
    expect(formatActionDirection("improved")).toBe("개선됨");
    expect(formatActionDirection("worse")).toBe("나빠짐");
    expect(formatActionDirection("custom_direction")).toBe("custom_direction");
  });

  it("formats parsed taste tag preview labels with confidence", () => {
    expect(
      formatTasteTagPreview([
        {
          id: "sour",
          label: "신맛",
          polarity: "under_extraction",
          intensity: 2,
          position: "overall",
          confidence: "high",
          sourceText: "시고",
        },
        {
          id: "astringent",
          label: "떫고 텁텁함",
          polarity: "over_extraction",
          intensity: 1,
          position: "finish",
          confidence: "medium",
          sourceText: "끝맛이 떫다",
        },
      ]),
    ).toBe("신맛 · 높음, 떫고 텁텁함 · 보통");
    expect(formatTasteTagPreview([])).toBe("");
  });

  it("formats keep-variable guidance", () => {
    expect(formatKeepVariables([])).toBe("이번 샷에서는 추가로 유지할 변수가 없습니다.");
    expect(formatKeepVariables(["grind_size", "yield"])).toBe(
      "분쇄도, 추출량은 그대로 두세요.",
    );
  });

  it("formats session and roast labels", () => {
    expect(formatSessionStatus("active")).toBe("진행 중");
    expect(formatSessionStatus("archived")).toBe("보관됨");
    expect(formatRoastRange("medium_dark_range")).toBe("중강배전");
    expect(formatRoastRange("unknown")).toBe("배전도 모름");
  });

  it("formats extraction input warning labels in Korean", () => {
    expect(formatInputWarning("dose_out_of_common_range")).toBe(
      "도징량이 일반적인 범위를 벗어났습니다.",
    );
    expect(formatInputWarning("yield_out_of_common_range")).toBe(
      "추출량이 일반적인 범위를 벗어났습니다.",
    );
    expect(formatInputWarning("time_out_of_common_range")).toBe(
      "추출 시간이 일반적인 범위를 벗어났습니다.",
    );
    expect(formatInputWarning("ratio_out_of_common_range")).toBe(
      "추출 비율이 일반적인 범위를 벗어났습니다.",
    );
  });
});
