import { describe, expect, it } from "vitest";
import { buildNextShotHref } from "./shotRoutes";

describe("shot routes", () => {
  it("keeps the shot session when building the next-shot route", () => {
    expect(buildNextShotHref("session_123")).toEqual({
      pathname: "/",
      params: { sessionId: "session_123" },
    });
  });
});
