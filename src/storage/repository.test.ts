import { describe, expect, it } from "vitest";
import { createEmptyBasicObservation, createUnknownRoastProfile } from "../domain/defaults";
import type { RecommendationResult, ShotRecord } from "../domain/types";
import { createAutoBeanSession, createMemoryRepository } from "./repository";

const now = "2026-06-20T17:40:00+09:00";

const recommendation: RecommendationResult = {
  primary: {
    id: "A-NO-CHANGE",
    variable: "no_change",
    direction: "keep",
    amountLabel: "none",
    priority: 1,
    message: "현재 설정을 유지하세요.",
  },
  alternatives: [],
  rationale: ["맛이 만족스럽다면 다음 샷에서 변수를 바꾸지 않는다."],
  uncertainty: [],
  matchedRules: ["R-BALANCED"],
  keepVariables: ["grind_size", "dose", "yield", "distribution", "puck_prep"],
};

function shot(sessionId: string, shotNumber: number): ShotRecord {
  return {
    id: `shot_${shotNumber}`,
    sessionId,
    shotNumber,
    extraction: {
      tasteDescription: "괜찮다",
      doseGrams: 18,
      yieldGrams: 36,
      brewSeconds: 28,
      brewRatio: 2,
      brewTimeBand: "normal",
      brewRatioBand: "target",
      inputWarnings: [],
    },
    basicObservation: createEmptyBasicObservation(),
    advancedObservation: null,
    changesFromPrevious: [],
    tasteTags: [],
    tastePatterns: [],
    recommendation,
    pulledAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

describe("EspressoCoachRepository", () => {
  it("creates, updates, archives, and lists sessions", async () => {
    const repository = createMemoryRepository({ now: () => now });
    const session = await repository.createSession(
      createAutoBeanSession({ now, roastProfile: createUnknownRoastProfile() }),
    );

    expect(session.name).toBe("새 원두 세션 2026-06-20");
    expect(session.roastProfile.range).toBe("unknown");

    const updated = await repository.updateSession(session.id, {
      beanName: "Ethiopia Guji",
      note: "첫 테스트",
    });
    expect(updated.beanName).toBe("Ethiopia Guji");
    expect(updated.updatedAt).toBe(now);

    const archived = await repository.archiveSession(session.id);
    expect(archived.status).toBe("archived");

    await expect(repository.listSessions()).resolves.toEqual([archived]);
  });

  it("saves and reads shots with recommendation snapshots", async () => {
    const repository = createMemoryRepository();
    const session = await repository.createSession(createAutoBeanSession({ now }));
    const firstShot = await repository.createShot(shot(session.id, 1));

    expect(firstShot.recommendation.primary.variable).toBe("no_change");
    await expect(repository.getShot(firstShot.id)).resolves.toEqual(firstShot);
    await expect(repository.listShots(session.id)).resolves.toEqual([firstShot]);
    await expect(repository.getNextShotNumber(session.id)).resolves.toBe(2);
  });

  it("rejects saved shots without a recommendation snapshot", async () => {
    const repository = createMemoryRepository();
    const session = await repository.createSession(createAutoBeanSession({ now }));
    const invalidShot = {
      ...shot(session.id, 1),
      recommendation: undefined,
    } as unknown as ShotRecord;

    await expect(repository.createShot(invalidShot)).rejects.toThrow(
      "ShotRecord.recommendation is required",
    );
  });
});
