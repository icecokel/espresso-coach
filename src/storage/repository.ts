import { createUnknownRoastProfile } from "../domain/defaults";
import type { BeanSession, DateTimeString, RoastProfile, ShotRecord } from "../domain/types";

export type ShotRecordDraft = Omit<ShotRecord, "shotNumber">;

export const ARCHIVED_SESSION_SHOT_ERROR = "Archived sessions cannot save shots";

export interface EspressoCoachRepository {
  createSession(session: BeanSession): Promise<BeanSession>;
  updateSession(
    sessionId: string,
    patch: Partial<
      Pick<BeanSession, "name" | "beanName" | "roaster" | "roastDate" | "roastProfile" | "note">
    >,
  ): Promise<BeanSession>;
  archiveSession(sessionId: string): Promise<BeanSession>;
  restoreSession(sessionId: string): Promise<BeanSession>;
  listSessions(): Promise<BeanSession[]>;
  getSession(sessionId: string): Promise<BeanSession | undefined>;
  createShot(shot: ShotRecord): Promise<ShotRecord>;
  createShotWithNextNumber(shot: ShotRecordDraft): Promise<ShotRecord>;
  getShot(shotId: string): Promise<ShotRecord | undefined>;
  listShots(sessionId: string): Promise<ShotRecord[]>;
}

export interface RepositoryOptions {
  now?: () => DateTimeString;
}

export interface AutoBeanSessionInput {
  now: DateTimeString;
  id?: string;
  roastProfile?: RoastProfile;
}

export function createAutoBeanSession({
  now,
  id = createId("session"),
  roastProfile = createUnknownRoastProfile(),
}: AutoBeanSessionInput): BeanSession {
  return {
    id,
    name: `새 원두 세션 ${now.slice(0, 10)}`,
    roastProfile,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

export function createMemoryRepository(
  options: RepositoryOptions = {},
): EspressoCoachRepository {
  const now = options.now ?? (() => new Date().toISOString());
  const sessions = new Map<string, BeanSession>();
  const shots = new Map<string, ShotRecord>();

  return {
    async createSession(session) {
      const stored = clone(session);
      sessions.set(stored.id, stored);
      return clone(stored);
    },

    async updateSession(sessionId, patch) {
      const existing = getRequiredSession(sessions, sessionId);
      const updated: BeanSession = {
        ...existing,
        ...patch,
        updatedAt: now(),
      };
      sessions.set(sessionId, clone(updated));
      return clone(updated);
    },

    async archiveSession(sessionId) {
      const existing = getRequiredSession(sessions, sessionId);
      const archived: BeanSession = {
        ...existing,
        status: "archived",
        updatedAt: now(),
      };
      sessions.set(sessionId, clone(archived));
      return clone(archived);
    },

    async restoreSession(sessionId) {
      const existing = getRequiredSession(sessions, sessionId);
      const restored: BeanSession = {
        ...existing,
        status: "active",
        updatedAt: now(),
      };
      sessions.set(sessionId, clone(restored));
      return clone(restored);
    },

    async listSessions() {
      return [...sessions.values()]
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .map(clone);
    },

    async getSession(sessionId) {
      const session = sessions.get(sessionId);
      return session ? clone(session) : undefined;
    },

    async createShot(shot) {
      validateShotForStorage(shot);
      requireActiveSession(getRequiredSession(sessions, shot.sessionId));
      const stored = clone(shot);
      shots.set(stored.id, stored);
      return clone(stored);
    },

    async createShotWithNextNumber(shot) {
      requireActiveSession(getRequiredSession(sessions, shot.sessionId));
      const nextShotNumber =
        [...shots.values()]
          .filter((item) => item.sessionId === shot.sessionId)
          .reduce((max, item) => Math.max(max, item.shotNumber), 0) + 1;
      return this.createShot({ ...shot, shotNumber: nextShotNumber });
    },

    async getShot(shotId) {
      const shot = shots.get(shotId);
      return shot ? clone(shot) : undefined;
    },

    async listShots(sessionId) {
      getRequiredSession(sessions, sessionId);
      return [...shots.values()]
        .filter((shot) => shot.sessionId === sessionId)
        .sort((left, right) => left.shotNumber - right.shotNumber)
        .map(clone);
    },
  };
}

export function validateShotForStorage(shot: ShotRecord): void {
  if (!shot.recommendation?.primary) {
    throw new Error("ShotRecord.recommendation is required");
  }
}

function getRequiredSession(
  sessions: Map<string, BeanSession>,
  sessionId: string,
): BeanSession {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error(`BeanSession not found: ${sessionId}`);
  }
  return session;
}

function requireActiveSession(session: BeanSession): BeanSession {
  if (session.status === "archived") {
    throw new Error(ARCHIVED_SESSION_SHOT_ERROR);
  }

  return session;
}

function createId(prefix: "session"): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
