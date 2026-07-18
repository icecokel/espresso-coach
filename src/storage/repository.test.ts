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

function shotDraft(sessionId: string, id: string): Omit<ShotRecord, "shotNumber"> {
  const { shotNumber: _shotNumber, ...draft } = shot(sessionId, 0);
  return { ...draft, id };
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
  });

  it("creates shots with the next shot number at the repository boundary", async () => {
    const repository = createMemoryRepository();
    const session = await repository.createSession(createAutoBeanSession({ now }));

    const firstShot = await repository.createShotWithNextNumber(
      shotDraft(session.id, "shot_1"),
    );
    const secondShot = await repository.createShotWithNextNumber(
      shotDraft(session.id, "shot_2"),
    );

    expect(firstShot.shotNumber).toBe(1);
    expect(secondShot.shotNumber).toBe(2);
    await expect(repository.listShots(session.id)).resolves.toEqual([
      firstShot,
      secondShot,
    ]);
  });

  it("deletes only the latest shot and reuses the next sequential number", async () => {
    const repository = createMemoryRepository({ now: () => now });
    const session = await repository.createSession(createAutoBeanSession({ now }));
    const firstShot = await repository.createShotWithNextNumber(
      shotDraft(session.id, "shot_1"),
    );
    const secondShot = await repository.createShotWithNextNumber(
      shotDraft(session.id, "shot_2"),
    );

    await expect(
      repository.deleteLatestShot(session.id, firstShot.id),
    ).rejects.toThrow("Only the latest shot can be deleted");

    await repository.deleteLatestShot(session.id, secondShot.id);
    await expect(repository.getShot(secondShot.id)).resolves.toBeUndefined();
    await expect(repository.listShots(session.id)).resolves.toEqual([firstShot]);

    const replacement = await repository.createShotWithNextNumber(
      shotDraft(session.id, "shot_replacement"),
    );
    expect(replacement.shotNumber).toBe(2);
  });

  it("blocks shots for archived sessions until they are restored", async () => {
    let currentNow = "2026-06-20T18:00:00+09:00";
    const repository = createMemoryRepository({ now: () => currentNow });
    const session = await repository.createSession(createAutoBeanSession({ now }));
    const firstShot = await repository.createShotWithNextNumber(
      shotDraft(session.id, "shot_1"),
    );

    const archived = await repository.archiveSession(session.id);
    expect(archived.status).toBe("archived");
    await expect(repository.createShot(shot(session.id, 2))).rejects.toThrow(
      "Archived sessions cannot save shots",
    );
    await expect(
      repository.createShotWithNextNumber(shotDraft(session.id, "shot_blocked")),
    ).rejects.toThrow("Archived sessions cannot save shots");
    await expect(
      repository.deleteLatestShot(session.id, firstShot.id),
    ).rejects.toThrow("Archived sessions cannot save shots");

    currentNow = "2026-06-20T19:00:00+09:00";
    const restored = await repository.restoreSession(session.id);
    expect(restored).toMatchObject({
      status: "active",
      updatedAt: currentNow,
    });

    const nextShot = await repository.createShotWithNextNumber(
      shotDraft(session.id, "shot_2"),
    );
    expect(nextShot.shotNumber).toBe(firstShot.shotNumber + 1);
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
