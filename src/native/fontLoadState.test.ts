import { describe, expect, it } from "vitest";
import { getFontLoadState } from "./fontLoadState";

describe("getFontLoadState", () => {
  it("keeps the app in a loading state while fonts are pending", () => {
    expect(getFontLoadState(false, null)).toBe("loading");
  });

  it("shows an error state when font loading fails", () => {
    expect(getFontLoadState(false, new Error("Font unavailable"))).toBe("error");
  });

  it("continues to the app after fonts load", () => {
    expect(getFontLoadState(true, null)).toBe("ready");
  });
});
