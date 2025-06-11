// Server information management
import fs from "fs-extra";
import { SERVER_INFO_FILE } from "./paths";
import { logger } from "./logger";
import { getActiveSessionCount } from "../core/session";

export interface ServerInfo {
  port: number;
  workDir: string;
  pid: number;
  startTime: Date;
  version: string;
}

export interface ServerStatus {
  running: boolean;
  info?: {
    port: number;
    workDir: string;
    uptime: string;
    activeSessions: number;
  };
}

// Save server info to file
export const saveServerInfo = async (info: ServerInfo): Promise<void> => {
  try {
    await fs.writeJson(SERVER_INFO_FILE, info, { spaces: 2 });
    logger.debug("Server info saved", info);
  } catch (error) {
    logger.error("Failed to save server info", error);
  }
};

// Load server info from file
export const loadServerInfo = async (): Promise<ServerInfo | null> => {
  try {
    if (await fs.pathExists(SERVER_INFO_FILE)) {
      const info = (await fs.readJson(SERVER_INFO_FILE)) as ServerInfo;
      // Convert string dates back to Date objects
      info.startTime = new Date(info.startTime);
      return info;
    }
    return null;
  } catch (error) {
    logger.warn("Failed to load server info", error);
    return null;
  }
};

// Remove server info file
export const removeServerInfo = async (): Promise<void> => {
  try {
    await fs.remove(SERVER_INFO_FILE);
    logger.debug("Server info file removed");
  } catch (error) {
    logger.warn("Failed to remove server info file", error);
  }
};

// Check if server is running by PID
export const isServerRunning = async (): Promise<boolean> => {
  const info = await loadServerInfo();
  if (info === null) {
    return false;
  }

  try {
    // Check if process is still running
    process.kill(info.pid, 0);
    return true;
  } catch {
    // Process not found, clean up stale info file
    await removeServerInfo();
    return false;
  }
};

// Get current server status
export const getServerStatus = async (): Promise<ServerStatus> => {
  const info = await loadServerInfo();

  if (info === null || !(await isServerRunning())) {
    return { running: false };
  }

  const uptime = Date.now() - info.startTime.getTime();
  const activeSessions = await getActiveSessionCount();

  return {
    running: true,
    info: {
      port: info.port,
      workDir: info.workDir,
      uptime: formatUptime(uptime),
      activeSessions,
    },
  };
};

// Format uptime in human readable format
const formatUptime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }

  return `${seconds}s`;
};
