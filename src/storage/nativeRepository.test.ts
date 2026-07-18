import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEmptyBasicObservation } from "../domain/defaults";
import type { BeanSession, RecommendationResult, ShotRecord } from "../domain/types";

const databaseMock = vi.hoisted(() => ({
  execAsync: vi.fn(),
  getFirstAsync: vi.fn(),
  getAllAsync: vi.fn(),
  runAsync: vi.fn(),
  withExclusiveTransactionAsync: vi.fn(),
}));

const openDatabaseAsyncMock = vi.hoisted(() => vi.fn());

vi.mock("expo-sqlite", () => ({
  openDatabaseAsync: openDatabaseAsyncMock,
}));

import { createNativeRepository } from "./nativeRepository";

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

function session(id = "session_1"): BeanSession {
  return {
    id,
    name: "Test Session",
    roastProfile: {
      range: "unknown",
      confidence: "low",
      source: "user_selected",
    },
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

function shot(sessionId = "session_1", shotNumber = 1): ShotRecord {
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

function shotDraft(sessionId = "session_1"): Omit<ShotRecord, "shotNumber"> {
  const { shotNumber: _shotNumber, ...draft } = shot(sessionId, 0);
  return draft;
}

describe("createNativeRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    openDatabaseAsyncMock.mockResolvedValue(databaseMock);
    databaseMock.getFirstAsync.mockImplementation((sql: string, sessionId?: string) => {
      if (sql.includes("FROM bean_sessions")) {
        const storedSession = session(sessionId);
        return Promise.resolve({
          id: storedSession.id,
          data: JSON.stringify(storedSession),
          status: storedSession.status,
          updated_at: storedSession.updatedAt,
        });
      }
      return Promise.resolve(undefined);
    });
    databaseMock.getAllAsync.mockResolvedValue([]);
    databaseMock.runAsync.mockResolvedValue({ changes: 1, lastInsertRowId: 1 });
    databaseMock.withExclusiveTransactionAsync.mockImplementation(
      async (task: (transaction: typeof databaseMock) => Promise<void>) => {
        await task(databaseMock);
      },
    );
  });

  it("initializes SQLite with foreign key enforcement and shot number uniqueness DDL", async () => {
    const repository = createNativeRepository({ databaseName: "test.db" });

    await repository.getSession("session_1");

    const execSql = databaseMock.execAsync.mock.calls.map(([sql]) => sql).join("\n");
    expect(execSql).toContain("PRAGMA foreign_keys = ON");
    expect(execSql).toContain("FOREIGN KEY (session_id) REFERENCES bean_sessions (id)");
    expect(execSql).toContain("CREATE TRIGGER IF NOT EXISTS shot_records_session_insert_fk");
    expect(execSql).toContain(
      "CREATE TRIGGER IF NOT EXISTS shot_records_session_shot_number_insert_unique",
    );
    expect(execSql).toContain("CREATE INDEX IF NOT EXISTS shot_records_session_id_idx");
    expect(execSql).toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS shot_records_session_shot_number_unique_idx",
    );
  });

  it("inserts shots without replace semantics so duplicate shot numbers fail at the DB boundary", async () => {
    const repository = createNativeRepository({ databaseName: "test.db" });

    await repository.createShot(shot());

    expect(databaseMock.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    const [sql] = databaseMock.runAsync.mock.calls[0];
    expect(sql).toContain("INSERT INTO shot_records");
    expect(sql).not.toContain("INSERT OR REPLACE INTO shot_records");
  });

  it("creates shots with the next shot number inside an exclusive transaction", async () => {
    databaseMock.getFirstAsync.mockImplementation((sql: string, sessionId?: string) => {
      if (sql.includes("MAX(shot_number)")) {
        return Promise.resolve({ nextShotNumber: 3 });
      }
      if (sql.includes("FROM bean_sessions")) {
        const storedSession = session(sessionId);
        return Promise.resolve({
          id: storedSession.id,
          data: JSON.stringify(storedSession),
          status: storedSession.status,
          updated_at: storedSession.updatedAt,
        });
      }
      return Promise.resolve(undefined);
    });
    const repository = createNativeRepository({ databaseName: "test.db" });

    const savedShot = await repository.createShotWithNextNumber(shotDraft());

    expect(savedShot.shotNumber).toBe(3);
    expect(databaseMock.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    const [sql, id, sessionId, shotNumber] = databaseMock.runAsync.mock.calls[0];
    expect(sql).toContain("INSERT INTO shot_records");
    expect(id).toBe("shot_0");
    expect(sessionId).toBe("session_1");
    expect(shotNumber).toBe(3);
  });

  it("deletes the latest shot and updates its session in one transaction", async () => {
    const deletedNow = "2026-06-20T18:10:00+09:00";
    databaseMock.getFirstAsync.mockImplementation((sql: string, sessionId?: string) => {
      if (sql.includes("ORDER BY shot_number DESC")) {
        return Promise.resolve({ id: "shot_2" });
      }
      if (sql.includes("FROM bean_sessions")) {
        const storedSession = session(sessionId);
        return Promise.resolve({
          id: storedSession.id,
          data: JSON.stringify(storedSession),
          status: storedSession.status,
          updated_at: storedSession.updatedAt,
        });
      }
      return Promise.resolve(undefined);
    });
    const repository = createNativeRepository({
      databaseName: "test.db",
      now: () => deletedNow,
    });

    await repository.deleteLatestShot("session_1", "shot_2");

    expect(databaseMock.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    const deleteCall = databaseMock.runAsync.mock.calls.find(([sql]) =>
      (sql as string).includes("DELETE FROM shot_records"),
    );
    expect(deleteCall?.slice(1)).toEqual(["shot_2", "session_1"]);
    const updateCall = databaseMock.runAsync.mock.calls.find(([sql]) =>
      (sql as string).includes("UPDATE bean_sessions"),
    );
    expect(JSON.parse(updateCall?.[1] as string)).toMatchObject({
      id: "session_1",
      updatedAt: deletedNow,
    });
  });

  it("rejects deletion when the requested shot is not the latest", async () => {
    databaseMock.getFirstAsync.mockImplementation((sql: string, sessionId?: string) => {
      if (sql.includes("ORDER BY shot_number DESC")) {
        return Promise.resolve({ id: "shot_2" });
      }
      if (sql.includes("FROM bean_sessions")) {
        const storedSession = session(sessionId);
        return Promise.resolve({
          id: storedSession.id,
          data: JSON.stringify(storedSession),
          status: storedSession.status,
          updated_at: storedSession.updatedAt,
        });
      }
      return Promise.resolve(undefined);
    });
    const repository = createNativeRepository({ databaseName: "test.db" });

    await expect(
      repository.deleteLatestShot("session_1", "shot_1"),
    ).rejects.toThrow("Only the latest shot can be deleted");
    expect(databaseMock.runAsync).not.toHaveBeenCalled();
  });

  it("updates sessions without replace semantics so existing shots are not cascaded away", async () => {
    const updatedNow = "2026-06-20T18:00:00+09:00";
    const repository = createNativeRepository({
      databaseName: "test.db",
      now: () => updatedNow,
    });

    await repository.updateSession("session_1", { name: "Updated Session" });

    const [sql, data, status, updatedAt, sessionId] = databaseMock.runAsync.mock.calls[0];
    expect(sql).toContain("UPDATE bean_sessions");
    expect(sql).not.toContain("INSERT OR REPLACE");
    expect(JSON.parse(data as string)).toMatchObject({
      id: "session_1",
      name: "Updated Session",
      updatedAt: updatedNow,
    });
    expect(status).toBe("active");
    expect(updatedAt).toBe(updatedNow);
    expect(sessionId).toBe("session_1");
  });

  it("preserves an archived stored status while updating session metadata", async () => {
    const archivedSession = { ...session(), status: "archived" as const };
    databaseMock.getFirstAsync.mockImplementation((sql: string, sessionId?: string) => {
      if (sql.includes("FROM bean_sessions")) {
        return Promise.resolve({
          id: sessionId ?? archivedSession.id,
          data: JSON.stringify({ ...archivedSession, status: "active" }),
          status: "archived",
          updated_at: archivedSession.updatedAt,
        });
      }
      return Promise.resolve(undefined);
    });
    const repository = createNativeRepository({ databaseName: "test.db" });

    const updated = await repository.updateSession(archivedSession.id, {
      name: "Metadata Update",
    });

    expect(databaseMock.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
    expect(updated).toMatchObject({
      name: "Metadata Update",
      status: "archived",
    });
    expect(JSON.parse(databaseMock.runAsync.mock.calls[0][1] as string)).toMatchObject({
      name: "Metadata Update",
      status: "archived",
    });
  });

  it("archives sessions without replace semantics so existing shots are not cascaded away", async () => {
    const archivedNow = "2026-06-20T18:30:00+09:00";
    const repository = createNativeRepository({
      databaseName: "test.db",
      now: () => archivedNow,
    });

    await repository.archiveSession("session_1");

    const [sql, data, status, updatedAt, sessionId] = databaseMock.runAsync.mock.calls[0];
    expect(sql).toContain("UPDATE bean_sessions");
    expect(sql).not.toContain("INSERT OR REPLACE");
    expect(JSON.parse(data as string)).toMatchObject({
      id: "session_1",
      status: "archived",
      updatedAt: archivedNow,
    });
    expect(status).toBe("archived");
    expect(updatedAt).toBe(archivedNow);
    expect(sessionId).toBe("session_1");
  });

  it("blocks archived sessions in both shot routes until they are restored", async () => {
    let storedSession = session();
    let nextShotNumber = 1;
    databaseMock.getFirstAsync.mockImplementation((sql: string, sessionId?: string) => {
      if (sql.includes("MAX(shot_number)")) {
        return Promise.resolve({ nextShotNumber });
      }
      if (sql.includes("FROM bean_sessions")) {
        return Promise.resolve({
          id: sessionId ?? storedSession.id,
          data: JSON.stringify(storedSession),
          status: storedSession.status,
          updated_at: storedSession.updatedAt,
        });
      }
      return Promise.resolve(undefined);
    });
    databaseMock.runAsync.mockImplementation((sql: string, data?: string) => {
      if (sql.includes("UPDATE bean_sessions")) {
        storedSession = JSON.parse(data as string) as BeanSession;
      }
      if (sql.includes("INSERT INTO shot_records")) {
        nextShotNumber += 1;
      }
      return Promise.resolve({ changes: 1, lastInsertRowId: 1 });
    });
    const repository = createNativeRepository({
      databaseName: "test.db",
      now: () => "2026-06-20T19:00:00+09:00",
    });

    await repository.archiveSession(storedSession.id);
    await expect(repository.createShot(shot(storedSession.id, 1))).rejects.toThrow(
      "Archived sessions cannot save shots",
    );
    await expect(
      repository.createShotWithNextNumber(shotDraft(storedSession.id)),
    ).rejects.toThrow("Archived sessions cannot save shots");
    expect(databaseMock.withExclusiveTransactionAsync).toHaveBeenCalledTimes(2);

    const restored = await repository.restoreSession(storedSession.id);
    expect(restored).toMatchObject({
      status: "active",
      updatedAt: "2026-06-20T19:00:00+09:00",
    });
    const restoredDirectShot = await repository.createShot(shot(storedSession.id, 1));
    expect(restoredDirectShot.shotNumber).toBe(1);
    const nextShot = await repository.createShotWithNextNumber(
      shotDraft(storedSession.id),
    );
    expect(nextShot.shotNumber).toBe(2);
    expect(databaseMock.withExclusiveTransactionAsync).toHaveBeenCalledTimes(4);
    expect(
      databaseMock.runAsync.mock.calls.some(([sql]) =>
        (sql as string).includes("INSERT INTO shot_records"),
      ),
    ).toBe(true);
  });

  it("skips the unique index migration when existing duplicate shot numbers are detected", async () => {
    databaseMock.getFirstAsync.mockImplementation((sql: string, sessionId?: string) => {
      if (sql.includes("GROUP BY session_id, shot_number")) {
        return Promise.resolve({ session_id: "session_1", shot_number: 1, duplicateCount: 2 });
      }
      if (sql.includes("FROM bean_sessions")) {
        const storedSession = session(sessionId);
        return Promise.resolve({
          id: storedSession.id,
          data: JSON.stringify(storedSession),
          status: storedSession.status,
          updated_at: storedSession.updatedAt,
        });
      }
      return Promise.resolve(undefined);
    });

    const repository = createNativeRepository({ databaseName: "test.db" });

    await repository.getSession("session_1");

    const execSql = databaseMock.execAsync.mock.calls.map(([sql]) => sql).join("\n");
    expect(execSql).not.toContain(
      "CREATE UNIQUE INDEX IF NOT EXISTS shot_records_session_shot_number_unique_idx",
    );
  });
});
