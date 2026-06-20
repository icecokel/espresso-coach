import { createUnknownRoastProfile } from "../domain/defaults";
import type { BeanSession, DateTimeString, RoastProfile, ShotRecord } from "../domain/types";

export interface EspressoCoachRepository {
  createSession(session: BeanSession): Promise<BeanSession>;
  updateSession(
    sessionId: string,
    patch: Partial<
      Pick<BeanSession, "name" | "beanName" | "roaster" | "roastDate" | "roastProfile" | "note">
    >,
  ): Promise<BeanSession>;
  archiveSession(sessionId: string): Promise<BeanSession>;
  listSessions(): Promise<BeanSession[]>;
  getSession(sessionId: string): Promise<BeanSession | undefined>;
  createShot(shot: ShotRecord): Promise<ShotRecord>;
  getShot(shotId: string): Promise<ShotRecord | undefined>;
  listShots(sessionId: string): Promise<ShotRecord[]>;
  getNextShotNumber(sessionId: string): Promise<number>;
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
      getRequiredSession(sessions, shot.sessionId);
      const stored = clone(shot);
      shots.set(stored.id, stored);
      return clone(stored);
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

    async getNextShotNumber(sessionId) {
      const sessionShots = await this.listShots(sessionId);
      return sessionShots.length + 1;
    },
  };
}

export interface IndexedDbRepositoryOptions extends RepositoryOptions {
  databaseName?: string;
}

export function createIndexedDbRepository(
  options: IndexedDbRepositoryOptions = {},
): EspressoCoachRepository {
  const databaseName = options.databaseName ?? "espresso-coach";
  const now = options.now ?? (() => new Date().toISOString());

  return {
    async createSession(session) {
      await put("sessions", session);
      return clone(session);
    },

    async updateSession(sessionId, patch) {
      const existing = await getRequiredStoredSession(sessionId);
      const updated: BeanSession = {
        ...existing,
        ...patch,
        updatedAt: now(),
      };
      await put("sessions", updated);
      return clone(updated);
    },

    async archiveSession(sessionId) {
      const existing = await getRequiredStoredSession(sessionId);
      const archived: BeanSession = {
        ...existing,
        status: "archived",
        updatedAt: now(),
      };
      await put("sessions", archived);
      return clone(archived);
    },

    async listSessions() {
      const values = await getAll<BeanSession>("sessions");
      return values.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    },

    async getSession(sessionId) {
      return getByKey<BeanSession>("sessions", sessionId);
    },

    async createShot(shot) {
      validateShotForStorage(shot);
      await getRequiredStoredSession(shot.sessionId);
      await put("shots", shot);
      return clone(shot);
    },

    async getShot(shotId) {
      return getByKey<ShotRecord>("shots", shotId);
    },

    async listShots(sessionId) {
      await getRequiredStoredSession(sessionId);
      const values = await getAll<ShotRecord>("shots");
      return values
        .filter((shot) => shot.sessionId === sessionId)
        .sort((left, right) => left.shotNumber - right.shotNumber);
    },

    async getNextShotNumber(sessionId) {
      const sessionShots = await this.listShots(sessionId);
      return sessionShots.length + 1;
    },
  };

  async function getRequiredStoredSession(sessionId: string): Promise<BeanSession> {
    const session = await getByKey<BeanSession>("sessions", sessionId);
    if (!session) {
      throw new Error(`BeanSession not found: ${sessionId}`);
    }
    return session;
  }

  async function put(storeName: StoreName, value: BeanSession | ShotRecord): Promise<void> {
    const database = await openDatabase(databaseName);
    await requestToPromise(
      database.transaction(storeName, "readwrite").objectStore(storeName).put(value),
    );
    database.close();
  }

  async function getByKey<T>(storeName: StoreName, key: string): Promise<T | undefined> {
    const database = await openDatabase(databaseName);
    const value = await requestToPromise<T | undefined>(
      database.transaction(storeName, "readonly").objectStore(storeName).get(key),
    );
    database.close();
    return value ? clone(value) : undefined;
  }

  async function getAll<T>(storeName: StoreName): Promise<T[]> {
    const database = await openDatabase(databaseName);
    const values = await requestToPromise<T[]>(
      database.transaction(storeName, "readonly").objectStore(storeName).getAll(),
    );
    database.close();
    return values.map(clone);
  }
}

type StoreName = "sessions" | "shots";

function validateShotForStorage(shot: ShotRecord): void {
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

function createId(prefix: "session"): string {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}_${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now().toString(36)}`;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function openDatabase(databaseName: string): Promise<IDBDatabase> {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error("IndexedDB is not available"));
  }

  const request = indexedDB.open(databaseName, 1);

  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains("sessions")) {
      database.createObjectStore("sessions", { keyPath: "id" });
    }
    if (!database.objectStoreNames.contains("shots")) {
      const shotStore = database.createObjectStore("shots", { keyPath: "id" });
      shotStore.createIndex("sessionId", "sessionId", { unique: false });
    }
  };

  return requestToPromise(request);
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
