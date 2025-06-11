// Configuration management
import fs from "fs-extra";
import path from "path";
import os from "os";
import { logger } from "../utils/logger";

export interface CCHighwayConfig {
  claudeCodePath: string;
  defaultWorkDir: string;
  sessionRetentionDays: number;
  maxConcurrentSessions: number;
  streamBufferSize: number;
  fileWatchInterval: number;
  allowedTools: string[];
  defaultPort: number;
  defaultHost: string;
  logLevel: string;
}

const DEFAULT_CONFIG: CCHighwayConfig = {
  claudeCodePath: "/usr/local/bin/claude",
  defaultWorkDir: path.join(os.homedir(), "projects"),
  sessionRetentionDays: 30,
  maxConcurrentSessions: 10,
  streamBufferSize: 65536,
  fileWatchInterval: 100,
  allowedTools: ["Bash", "Read", "Glob", "Grep", "Edit", "Write"],
  defaultPort: 3000,
  defaultHost: "localhost",
  logLevel: "info",
};

const CONFIG_DIR = path.join(os.homedir(), ".cchighway");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

let cachedConfig: CCHighwayConfig | null = null;

export const ensureConfigDir = async (): Promise<void> => {
  await fs.ensureDir(CONFIG_DIR);
};

export const loadConfig = async (): Promise<CCHighwayConfig> => {
  if (cachedConfig !== null) {
    return cachedConfig;
  }

  await ensureConfigDir();

  try {
    if (await fs.pathExists(CONFIG_FILE)) {
      const configData = (await fs.readJson(
        CONFIG_FILE
      )) as Partial<CCHighwayConfig>;
      cachedConfig = { ...DEFAULT_CONFIG, ...configData };
    } else {
      cachedConfig = { ...DEFAULT_CONFIG };
      await saveConfig(cachedConfig);
    }
  } catch (error) {
    logger.error("Failed to load config, using defaults", error);
    cachedConfig = { ...DEFAULT_CONFIG };
  }

  return cachedConfig;
};

export const saveConfig = async (config: CCHighwayConfig): Promise<void> => {
  try {
    await ensureConfigDir();
    await fs.writeJson(CONFIG_FILE, config, { spaces: 2 });
    cachedConfig = config;
    logger.debug("Configuration saved");
  } catch (error) {
    logger.error("Failed to save config", error);
    throw error;
  }
};

export const updateConfig = async (
  updates: Partial<CCHighwayConfig>
): Promise<CCHighwayConfig> => {
  const config = await loadConfig();
  const updatedConfig = { ...config, ...updates };
  await saveConfig(updatedConfig);
  return updatedConfig;
};

export const resetConfig = async (): Promise<CCHighwayConfig> => {
  const config = { ...DEFAULT_CONFIG };
  await saveConfig(config);
  return config;
};

export const getConfigValue = <K extends keyof CCHighwayConfig>(
  config: CCHighwayConfig,
  key: K
): CCHighwayConfig[K] => {
  return config[key];
};

export const validateConfig = (config: Partial<CCHighwayConfig>): string[] => {
  const errors: string[] = [];

  if (config.defaultPort !== undefined) {
    const port = Number(config.defaultPort);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      errors.push("Port must be between 1 and 65535");
    }
  }

  if (config.sessionRetentionDays !== undefined) {
    const days = Number(config.sessionRetentionDays);
    if (!Number.isInteger(days) || days < 1) {
      errors.push("Session retention days must be a positive integer");
    }
  }

  if (config.maxConcurrentSessions !== undefined) {
    const sessions = Number(config.maxConcurrentSessions);
    if (!Number.isInteger(sessions) || sessions < 1) {
      errors.push("Max concurrent sessions must be a positive integer");
    }
  }

  if (config.logLevel !== undefined) {
    const validLevels = ["error", "warn", "info", "debug", "verbose"];
    if (!validLevels.includes(config.logLevel)) {
      errors.push(`Log level must be one of: ${validLevels.join(", ")}`);
    }
  }

  return errors;
};

export const getConfigDir = (): string => {
  return CONFIG_DIR;
};

export const getConfigFile = (): string => {
  return CONFIG_FILE;
};
