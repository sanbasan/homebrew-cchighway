// Session manager - high level session operations
import { Session } from "../../types";
import * as store from "./store";
import { logger } from "../../utils/logger";
import { normalizePath } from "../../utils/paths";

// Manager state
let initialized = false;
const activeSessions = new Map<string, Session>();
let cleanupInterval: NodeJS.Timeout | null = null;

const initialize = async (): Promise<void> => {
  if (initialized) return;

  await store.initializeStore();
  initialized = true;

  // Schedule periodic cleanup
  scheduleCleanup();
};

const scheduleCleanup = (): void => {
  // Run cleanup every hour
  cleanupInterval = setInterval(
    async () => {
      try {
        const retentionMs =
          parseInt(process.env.CCHIGHWAY_SESSION_RETENTION_DAYS ?? "30") *
          24 *
          60 *
          60 *
          1000;
        await store.cleanupSessions(retentionMs);
      } catch (error) {
        logger.error("Session cleanup failed", error);
      }
    },
    60 * 60 * 1000
  );
};

export const createNewSession = async (workDir?: string): Promise<Session> => {
  await ensureInitialized();

  const normalizedDir =
    workDir !== undefined && workDir !== null
      ? normalizePath(workDir)
      : process.cwd();
  const session = await store.createSession(normalizedDir);

  activeSessions.set(session.id, session);
  return session;
};

export const getSessionById = async (id: string): Promise<Session | null> => {
  await ensureInitialized();

  // Check active sessions first
  if (activeSessions.has(id) === true) {
    const session = activeSessions.get(id);
    if (session !== undefined) {
      return session;
    }
  }

  // Load from store
  const session = await store.getSession(id);
  if (session !== null) {
    activeSessions.set(id, session);
  }

  return session;
};

export const updateSessionData = async (
  id: string,
  updates: Partial<Session>
): Promise<void> => {
  await ensureInitialized();

  await store.updateSession(id, updates);

  // Update cached session
  const cached = activeSessions.get(id);
  if (cached !== undefined) {
    Object.assign(cached, updates, {
      updatedAt: new Date(),
    });
  }
};

export const completeSession = async (
  id: string,
  result: {
    cost?: number;
    turnCount: number;
    error?: string;
  }
): Promise<void> => {
  await updateSessionData(id, {
    status: result.error !== undefined ? "error" : "completed",
    totalCost: result.cost,
    turnCount: result.turnCount,
  });

  // Remove from active sessions
  activeSessions.delete(id);
};

export const removeSession = async (id: string): Promise<void> => {
  await ensureInitialized();

  await store.deleteSession(id);
  activeSessions.delete(id);
};

export const getAllSessions = async (): Promise<Session[]> => {
  await ensureInitialized();
  return store.listSessions();
};

export const getActiveSessionCount = async (): Promise<number> => {
  const sessions = await getAllSessions();
  return sessions.filter(s => s.status === "running").length;
};

export const canStartNewSession = async (): Promise<boolean> => {
  const maxConcurrent = parseInt(
    process.env.CCHIGHWAY_MAX_CONCURRENT_SESSIONS ?? "10"
  );
  const activeCount = await getActiveSessionCount();
  return activeCount < maxConcurrent;
};

const ensureInitialized = async (): Promise<void> => {
  if (initialized === false) {
    await initialize();
  }
};

// Cleanup on process exit
process.on("beforeExit", () => {
  if (cleanupInterval !== null) {
    clearInterval(cleanupInterval);
  }
});
