import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type { BeanSession, ShotRecord } from "../domain/types";
import {
  ARCHIVED_SESSION_SHOT_ERROR,
  LATEST_SHOT_DELETE_ERROR,
  type EspressoCoachRepository,
  type RepositoryOptions,
  validateShotForStorage,
} from "./repository";

interface StoredSessionRow {
  id: string;
  data: string;
  status: BeanSession["status"];
  updated_at: string;
}

interface StoredShotRow {
  id: string;
  session_id: string;
  shot_number: number;
  data: string;
  pulled_at: string;
  created_at: string;
}

export interface NativeRepositoryOptions extends RepositoryOptions {
  databaseName?: string;
}

interface DuplicateShotNumberRow {
  session_id: string;
  shot_number: number;
  duplicateCount: number;
}

export function createNativeRepository(
  options: NativeRepositoryOptions = {},
): EspressoCoachRepository {
  const databaseName = options.databaseName ?? "espresso-coach.db";
  const now = options.now ?? (() => new Date().toISOString());
  let databasePromise: Promise<SQLiteDatabase> | undefined;

  async function getDatabase(): Promise<SQLiteDatabase> {
    databasePromise ??= openDatabaseAsync(databaseName).then(async (database) => {
      await initializeDatabase(database);
      return database;
    });
    return databasePromise;
  }

  async function initializeDatabase(database: SQLiteDatabase): Promise<void> {
    await database.execAsync(`
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS bean_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          data TEXT NOT NULL,
          status TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS shot_records (
          id TEXT PRIMARY KEY NOT NULL,
          session_id TEXT NOT NULL,
          shot_number INTEGER NOT NULL,
          data TEXT NOT NULL,
          pulled_at TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (session_id) REFERENCES bean_sessions (id) ON DELETE CASCADE
        );

        CREATE TRIGGER IF NOT EXISTS shot_records_session_insert_fk
        BEFORE INSERT ON shot_records
        FOR EACH ROW
        WHEN (SELECT id FROM bean_sessions WHERE id = NEW.session_id) IS NULL
        BEGIN
          SELECT RAISE(ABORT, 'shot_records.session_id references missing bean_sessions.id');
        END;

        CREATE TRIGGER IF NOT EXISTS shot_records_session_update_fk
        BEFORE UPDATE OF session_id ON shot_records
        FOR EACH ROW
        WHEN (SELECT id FROM bean_sessions WHERE id = NEW.session_id) IS NULL
        BEGIN
          SELECT RAISE(ABORT, 'shot_records.session_id references missing bean_sessions.id');
        END;

        CREATE TRIGGER IF NOT EXISTS shot_records_session_shot_number_insert_unique
        BEFORE INSERT ON shot_records
        FOR EACH ROW
        WHEN EXISTS (
          SELECT 1
            FROM shot_records
           WHERE session_id = NEW.session_id
             AND shot_number = NEW.shot_number
        )
        BEGIN
          SELECT RAISE(ABORT, 'shot_records.session_id and shot_number must be unique');
        END;

        CREATE TRIGGER IF NOT EXISTS shot_records_session_shot_number_update_unique
        BEFORE UPDATE OF session_id, shot_number ON shot_records
        FOR EACH ROW
        WHEN EXISTS (
          SELECT 1
            FROM shot_records
           WHERE session_id = NEW.session_id
             AND shot_number = NEW.shot_number
             AND id <> OLD.id
        )
        BEGIN
          SELECT RAISE(ABORT, 'shot_records.session_id and shot_number must be unique');
        END;

        CREATE INDEX IF NOT EXISTS shot_records_session_id_idx
          ON shot_records (session_id, shot_number);
      `);

    const duplicateShotNumber = await database.getFirstAsync<DuplicateShotNumberRow>(`
        SELECT session_id, shot_number, COUNT(*) AS duplicateCount
          FROM shot_records
         GROUP BY session_id, shot_number
        HAVING COUNT(*) > 1
         LIMIT 1
      `);

    if (!duplicateShotNumber) {
      await database.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS shot_records_session_shot_number_unique_idx
          ON shot_records (session_id, shot_number);
      `);
    }
  }

  async function getRequiredSession(sessionId: string): Promise<BeanSession> {
    const session = await repository.getSession(sessionId);
    if (!session) {
      throw new Error(`BeanSession not found: ${sessionId}`);
    }
    return session;
  }

  async function updateStoredSession(session: BeanSession): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `UPDATE bean_sessions
          SET data = ?, status = ?, updated_at = ?
        WHERE id = ?`,
      JSON.stringify(session),
      session.status,
      session.updatedAt,
      session.id,
    );
  }

  const repository: EspressoCoachRepository = {
    async createSession(session) {
      const database = await getDatabase();
      await database.runAsync(
        `INSERT INTO bean_sessions (id, data, status, updated_at)
         VALUES (?, ?, ?, ?)`,
        session.id,
        JSON.stringify(session),
        session.status,
        session.updatedAt,
      );
      return clone(session);
    },

    async updateSession(sessionId, patch) {
      const database = await getDatabase();
      let updatedSession: BeanSession | undefined;

      await database.withExclusiveTransactionAsync(async (transaction) => {
        const sessionRow = await transaction.getFirstAsync<StoredSessionRow>(
          `SELECT * FROM bean_sessions WHERE id = ?`,
          sessionId,
        );
        if (!sessionRow) {
          throw new Error(`BeanSession not found: ${sessionId}`);
        }

        const updated: BeanSession = {
          ...parseStoredJson<BeanSession>(sessionRow.data),
          ...patch,
          status: sessionRow.status,
          updatedAt: now(),
        };
        await transaction.runAsync(
          `UPDATE bean_sessions
              SET data = ?, status = ?, updated_at = ?
            WHERE id = ?`,
          JSON.stringify(updated),
          updated.status,
          updated.updatedAt,
          updated.id,
        );
        updatedSession = clone(updated);
      });

      if (!updatedSession) {
        throw new Error(`BeanSession not found: ${sessionId}`);
      }
      return updatedSession;
    },

    async archiveSession(sessionId) {
      const existing = await getRequiredSession(sessionId);
      const archived: BeanSession = {
        ...existing,
        status: "archived",
        updatedAt: now(),
      };
      await updateStoredSession(archived);
      return clone(archived);
    },

    async restoreSession(sessionId) {
      const existing = await getRequiredSession(sessionId);
      const restored: BeanSession = {
        ...existing,
        status: "active",
        updatedAt: now(),
      };
      await updateStoredSession(restored);
      return clone(restored);
    },

    async listSessions() {
      const database = await getDatabase();
      const rows = await database.getAllAsync<StoredSessionRow>(
        `SELECT * FROM bean_sessions ORDER BY updated_at DESC`,
      );
      return rows.map((row) => parseStoredJson<BeanSession>(row.data));
    },

    async getSession(sessionId) {
      const database = await getDatabase();
      const row = await database.getFirstAsync<StoredSessionRow>(
        `SELECT * FROM bean_sessions WHERE id = ?`,
        sessionId,
      );
      return row ? parseStoredJson<BeanSession>(row.data) : undefined;
    },

    async createShot(shot) {
      validateShotForStorage(shot);
      const database = await getDatabase();
      await database.withExclusiveTransactionAsync(async (transaction) => {
        const sessionRow = await transaction.getFirstAsync<StoredSessionRow>(
          `SELECT * FROM bean_sessions WHERE id = ?`,
          shot.sessionId,
        );
        if (!sessionRow) {
          throw new Error(`BeanSession not found: ${shot.sessionId}`);
        }
        if (sessionRow.status === "archived") {
          throw new Error(ARCHIVED_SESSION_SHOT_ERROR);
        }

        await transaction.runAsync(
          `INSERT INTO shot_records
            (id, session_id, shot_number, data, pulled_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          shot.id,
          shot.sessionId,
          shot.shotNumber,
          JSON.stringify(shot),
          shot.pulledAt,
          shot.createdAt,
        );
      });
      return clone(shot);
    },

    async createShotWithNextNumber(shot) {
      const database = await getDatabase();
      let savedShot: ShotRecord | undefined;

      await database.withExclusiveTransactionAsync(async (transaction) => {
        const sessionRow = await transaction.getFirstAsync<StoredSessionRow>(
          `SELECT * FROM bean_sessions WHERE id = ?`,
          shot.sessionId,
        );
        if (!sessionRow) {
          throw new Error(`BeanSession not found: ${shot.sessionId}`);
        }
        if (sessionRow.status === "archived") {
          throw new Error(ARCHIVED_SESSION_SHOT_ERROR);
        }

        const row = await transaction.getFirstAsync<{ nextShotNumber: number }>(
          `SELECT COALESCE(MAX(shot_number), 0) + 1 AS nextShotNumber
             FROM shot_records
            WHERE session_id = ?`,
          shot.sessionId,
        );
        const nextShot: ShotRecord = {
          ...shot,
          shotNumber: row?.nextShotNumber ?? 1,
        };
        validateShotForStorage(nextShot);
        await transaction.runAsync(
          `INSERT INTO shot_records
            (id, session_id, shot_number, data, pulled_at, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          nextShot.id,
          nextShot.sessionId,
          nextShot.shotNumber,
          JSON.stringify(nextShot),
          nextShot.pulledAt,
          nextShot.createdAt,
        );
        savedShot = clone(nextShot);
      });

      if (!savedShot) {
        throw new Error("ShotRecord was not created");
      }
      return savedShot;
    },

    async deleteLatestShot(sessionId, shotId) {
      const database = await getDatabase();

      await database.withExclusiveTransactionAsync(async (transaction) => {
        const sessionRow = await transaction.getFirstAsync<StoredSessionRow>(
          `SELECT * FROM bean_sessions WHERE id = ?`,
          sessionId,
        );
        if (!sessionRow) {
          throw new Error(`BeanSession not found: ${sessionId}`);
        }
        if (sessionRow.status === "archived") {
          throw new Error(ARCHIVED_SESSION_SHOT_ERROR);
        }

        const latestShot = await transaction.getFirstAsync<Pick<StoredShotRow, "id">>(
          `SELECT id
             FROM shot_records
            WHERE session_id = ?
            ORDER BY shot_number DESC
            LIMIT 1`,
          sessionId,
        );
        if (!latestShot || latestShot.id !== shotId) {
          throw new Error(LATEST_SHOT_DELETE_ERROR);
        }

        await transaction.runAsync(
          `DELETE FROM shot_records WHERE id = ? AND session_id = ?`,
          shotId,
          sessionId,
        );

        const updatedSession: BeanSession = {
          ...parseStoredJson<BeanSession>(sessionRow.data),
          status: sessionRow.status,
          updatedAt: now(),
        };
        await transaction.runAsync(
          `UPDATE bean_sessions
              SET data = ?, status = ?, updated_at = ?
            WHERE id = ?`,
          JSON.stringify(updatedSession),
          updatedSession.status,
          updatedSession.updatedAt,
          updatedSession.id,
        );
      });
    },

    async getShot(shotId) {
      const database = await getDatabase();
      const row = await database.getFirstAsync<StoredShotRow>(
        `SELECT * FROM shot_records WHERE id = ?`,
        shotId,
      );
      return row ? parseStoredJson<ShotRecord>(row.data) : undefined;
    },

    async listShots(sessionId) {
      await getRequiredSession(sessionId);
      const database = await getDatabase();
      const rows = await database.getAllAsync<StoredShotRow>(
        `SELECT * FROM shot_records WHERE session_id = ? ORDER BY shot_number ASC`,
        sessionId,
      );
      return rows.map((row) => parseStoredJson<ShotRecord>(row.data));
    },
  };

  return repository;
}

function parseStoredJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
