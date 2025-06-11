// Session file management utilities
import fs from "fs-extra";
import path from "path";
import { getSessionDir } from "./paths";
import { logger } from "./logger";

// Create stream file for a session
export const createStreamFile = async (sessionId: string): Promise<string> => {
  const sessionDir = getSessionDir(sessionId);

  await fs.ensureDir(sessionDir);
  const filepath = path.join(sessionDir, "stream.json");
  await fs.writeFile(filepath, "");

  logger.debug(`Created stream file: ${filepath}`);
  return filepath;
};

// Get stream file path for a session
export const getStreamFilePath = (sessionId: string): string => {
  const sessionDir = getSessionDir(sessionId);
  return path.join(sessionDir, "stream.json");
};

// Check if stream file exists for a session
export const streamFileExists = async (sessionId: string): Promise<boolean> => {
  const filepath = getStreamFilePath(sessionId);
  return fs.pathExists(filepath);
};

// Read session history from stream file
export const readSessionHistory = async (
  sessionId: string
): Promise<unknown[]> => {
  const filepath = getStreamFilePath(sessionId);

  if (!(await fs.pathExists(filepath))) {
    return [];
  }

  const content = await fs.readFile(filepath, "utf8");
  const lines = content.split("\n").filter(line => line.trim() !== "");

  const history: unknown[] = [];

  for (const line of lines) {
    try {
      const data = JSON.parse(line);
      history.push(data);
    } catch (parseError) {
      logger.warn(`Invalid JSON line in ${filepath}:`, parseError);
    }
  }

  return history;
};

// Clean up session files
export const cleanupSessionFiles = async (sessionId: string): Promise<void> => {
  const sessionDir = getSessionDir(sessionId);

  try {
    await fs.remove(sessionDir);
    logger.debug(`Cleaned up session files: ${sessionDir}`);
  } catch (error) {
    logger.warn(`Failed to clean up session files: ${sessionDir}`, error);
  }
};
