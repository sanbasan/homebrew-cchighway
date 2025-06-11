// Session store implementation
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Session } from "../../types";
import { SessionIndex, SessionData } from "./types";
import { SESSIONS_DIR, SESSIONS_INDEX, getSessionDir } from "../../utils/paths";
import { logger, logSession } from "../../utils/logger";

// Session index state
let sessionIndex: SessionIndex | null = null;

const loadIndex = async (): Promise<SessionIndex> => {
  try {
    if (await fs.pathExists(SESSIONS_INDEX)) {
      const data = (await fs.readJson(SESSIONS_INDEX)) as SessionIndex;
      sessionIndex = data;
      return data;
    }

    const newIndex = {
      sessions: [],
      lastCleanup: new Date(),
    };
    await saveIndex(newIndex);
    return newIndex;
  } catch (error) {
    logger.error("Failed to load session index", error);
    const fallbackIndex = {
      sessions: [],
      lastCleanup: new Date(),
    };
    sessionIndex = fallbackIndex;
    return fallbackIndex;
  }
};

const saveIndex = async (index: SessionIndex): Promise<void> => {
  try {
    await fs.writeJson(SESSIONS_INDEX, index, { spaces: 2 });
    sessionIndex = index;
  } catch (error) {
    logger.error("Failed to save session index", error);
  }
};

export const initializeStore = async (): Promise<void> => {
  await fs.ensureDir(SESSIONS_DIR);
  await loadIndex();
};

export const createSession = async (workDir: string): Promise<Session> => {
  if (sessionIndex === null) {
    await loadIndex();
  }

  const session: Session = {
    id: uuidv4(),
    workDir,
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
    turnCount: 0,
  };

  const sessionData: SessionData = {
    ...session,
    history: [
      {
        timestamp: new Date(),
        action: "created",
      },
    ],
  };

  const sessionDir = getSessionDir(session.id);
  await fs.ensureDir(sessionDir);
  await fs.writeJson(path.join(sessionDir, "session.json"), sessionData, {
    spaces: 2,
  });

  if (sessionIndex !== null) {
    sessionIndex.sessions.push(session.id);
    await saveIndex(sessionIndex);
  }

  logSession(session.id, "created", { workDir });
  return session;
};

export const getSession = async (id: string): Promise<Session | null> => {
  const sessionPath = path.join(getSessionDir(id), "session.json");

  try {
    if (await fs.pathExists(sessionPath)) {
      const data = (await fs.readJson(sessionPath)) as SessionData;
      const { history, ...session } = data;

      // Convert date strings back to Date objects
      session.createdAt = new Date(session.createdAt);
      session.updatedAt = new Date(session.updatedAt);

      return session;
    }
  } catch (error) {
    logger.error(`Failed to read session ${id}`, error);
  }

  return null;
};

export const updateSession = async (
  id: string,
  updates: Partial<Session>
): Promise<void> => {
  const sessionPath = path.join(getSessionDir(id), "session.json");

  try {
    if (await fs.pathExists(sessionPath)) {
      const data = (await fs.readJson(sessionPath)) as SessionData;

      // Update session data
      Object.assign(data, updates, {
        updatedAt: new Date(),
      });

      // Add history entry
      data.history.push({
        timestamp: new Date(),
        action: "updated",
        prompt: updates.lastPrompt,
        cost:
          updates.totalCost !== undefined
            ? updates.totalCost - (data.totalCost ?? 0)
            : undefined,
      });

      await fs.writeJson(sessionPath, data, { spaces: 2 });
      logSession(id, "updated", updates);
    }
  } catch (error) {
    logger.error(`Failed to update session ${id}`, error);
    throw error;
  }
};

export const deleteSession = async (id: string): Promise<void> => {
  const sessionDir = getSessionDir(id);

  try {
    await fs.remove(sessionDir);

    if (sessionIndex !== null) {
      sessionIndex.sessions = sessionIndex.sessions.filter(s => s !== id);
      await saveIndex(sessionIndex);
    }

    logSession(id, "deleted");
  } catch (error) {
    logger.error(`Failed to delete session ${id}`, error);
    throw error;
  }
};

export const listSessions = async (): Promise<Session[]> => {
  if (sessionIndex === null) {
    await loadIndex();
  }

  const sessions: Session[] = [];

  for (const id of sessionIndex?.sessions ?? []) {
    const session = await getSession(id);
    if (session !== null) {
      sessions.push(session);
    }
  }

  // Sort by updated date, newest first
  sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return sessions;
};

export const cleanupSessions = async (maxAgeMs: number): Promise<number> => {
  const now = Date.now();
  const sessions = await listSessions();
  let cleaned = 0;

  for (const session of sessions) {
    if (session.status === "completed" || session.status === "error") {
      const age = now - session.updatedAt.getTime();
      if (age > maxAgeMs) {
        await deleteSession(session.id);
        cleaned++;
      }
    }
  }

  if (sessionIndex !== null) {
    sessionIndex.lastCleanup = new Date();
    await saveIndex(sessionIndex);
  }

  if (cleaned > 0) {
    logger.info(`Cleaned up ${cleaned} old sessions`);
  }

  return cleaned;
};
