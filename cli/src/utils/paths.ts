import path from "path";
import os from "os";
import fs from "fs-extra";

// Base paths
export const HOME_DIR = os.homedir();
export const CCHIGHWAY_DIR = path.join(HOME_DIR, ".cchighway");
export const CONFIG_FILE = path.join(CCHIGHWAY_DIR, "config.json");
export const SESSIONS_DIR = path.join(CCHIGHWAY_DIR, "sessions");
export const SESSIONS_INDEX = path.join(SESSIONS_DIR, "index.json");
export const SERVER_INFO_FILE = path.join(CCHIGHWAY_DIR, "server-info.json");
export const LOGS_DIR = path.join(CCHIGHWAY_DIR, "logs");
export const TEMP_DIR =
  process.env.CCHIGHWAY_TEMP_DIR ?? path.join(os.tmpdir(), "cchighway");

// Claude Code executable name (expect it to be in PATH)
export const CLAUDE_CODE_EXECUTABLE = ((): string => {
  if (process.platform === "win32") {
    throw new Error("Claude Code is not supported on Windows platform");
  }
  return "claude";
})();

// Ensure directories exist
export const ensureDirectories = async (): Promise<void> => {
  const dirs = [CCHIGHWAY_DIR, SESSIONS_DIR, LOGS_DIR, TEMP_DIR];

  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }
};

// Find Claude Code executable
export const findClaudeCode = async (): Promise<string | null> => {
  const customPath = process.env.CLAUDE_CODE_PATH;
  if (customPath !== undefined && customPath !== null && customPath !== "") {
    try {
      await fs.access(customPath, fs.constants.X_OK);
      return customPath;
    } catch {
      // Custom path not accessible
    }
  }

  // Check if claude is in PATH using which/where command
  try {
    const { execSync } = await import("child_process");
    const whichCommand = process.platform === "win32" ? "where" : "which";
    const result = execSync(`${whichCommand} ${CLAUDE_CODE_EXECUTABLE}`, { 
      encoding: "utf8",
      stdio: "pipe" 
    });
    const claudePath = result.trim();
    if (claudePath !== "") {
      return claudePath;
    }
  } catch {
    // claude not found in PATH
  }
  
  return null;
};

// Get session directory
export const getSessionDir = (sessionId: string): string => {
  return path.join(SESSIONS_DIR, sessionId);
};

// Get stream file path
export const getStreamFilePath = (sessionId: string): string => {
  return path.join(TEMP_DIR, `stream-${sessionId}.json`);
};

// Normalize and resolve paths
export const normalizePath = (inputPath: string): string => {
  // Expand ~ to home directory
  if (inputPath.startsWith("~")) {
    inputPath = path.join(HOME_DIR, inputPath.slice(1));
  }

  // Resolve to absolute path
  return path.resolve(inputPath);
};

// Check if path is safe (within allowed directories)
export const isPathSafe = (inputPath: string, allowedDir: string): boolean => {
  const normalizedInput = normalizePath(inputPath);
  const normalizedAllowed = normalizePath(allowedDir);

  return normalizedInput.startsWith(normalizedAllowed);
};

// Get relative path for display
export const getDisplayPath = (fullPath: string): string => {
  const normalized = normalizePath(fullPath);

  // Try to make it relative to home
  if (normalized.startsWith(HOME_DIR)) {
    return "~" + normalized.slice(HOME_DIR.length);
  }

  // Try to make it relative to current working directory
  const relative = path.relative(process.cwd(), normalized);
  if (!relative.startsWith("..")) {
    return relative;
  }

  return normalized;
};
