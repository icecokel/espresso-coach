import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import type { BeanSession, DateTimeString, ShotRecord } from "../domain/types";
import {
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

export function createNativeRepository(
  options: NativeRepositoryOptions = {},
): EspressoCoachRepository {
  const databaseName = options.databaseName ?? "espresso-coach.db";
  const now = options.now ?? (() => new Date().toISOString());
  let databasePromise: Promise<SQLiteDatabase> | undefined;

  async function getDatabase(): Promise<SQLiteDatabase> {
    databasePromise ??= openDatabaseAsync(databaseName).then(async (database) => {
      await database.execAsync(`
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
          created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS shot_records_session_id_idx
          ON shot_records (session_id, shot_number);
      `);
      return database;
    });
    return databasePromise;
  }

  async function getRequiredSession(sessionId: string): Promise<BeanSession> {
    const session = await repository.getSession(sessionId);
    if (!session) {
      throw new Error(`BeanSession not found: ${sessionId}`);
    }
    return session;
  }

  const repository: EspressoCoachRepository = {
    async createSession(session) {
      const database = await getDatabase();
      await database.runAsync(
        `INSERT OR REPLACE INTO bean_sessions (id, data, status, updated_at)
         VALUES (?, ?, ?, ?)`,
        session.id,
        JSON.stringify(session),
        session.status,
        session.updatedAt,
      );
      return clone(session);
    },

    async updateSession(sessionId, patch) {
      const existing = await getRequiredSession(sessionId);
      const updated: BeanSession = {
        ...existing,
        ...patch,
        updatedAt: now(),
      };
      await this.createSession(updated);
      return clone(updated);
    },

    async archiveSession(sessionId) {
      const existing = await getRequiredSession(sessionId);
      const archived: BeanSession = {
        ...existing,
        status: "archived",
        updatedAt: now(),
      };
      await this.createSession(archived);
      return clone(archived);
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
      await getRequiredSession(shot.sessionId);
      const database = await getDatabase();
      await database.runAsync(
        `INSERT OR REPLACE INTO shot_records
          (id, session_id, shot_number, data, pulled_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        shot.id,
        shot.sessionId,
        shot.shotNumber,
        JSON.stringify(shot),
        shot.pulledAt,
        shot.createdAt,
      );
      return clone(shot);
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

    async getNextShotNumber(sessionId) {
      await getRequiredSession(sessionId);
      const database = await getDatabase();
      const row = await database.getFirstAsync<{ nextShotNumber: number }>(
        `SELECT COALESCE(MAX(shot_number), 0) + 1 AS nextShotNumber
           FROM shot_records
          WHERE session_id = ?`,
        sessionId,
      );
      return row?.nextShotNumber ?? 1;
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

export type NativeDateTimeString = DateTimeString;
