"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDisplayPath = exports.isPathSafe = exports.normalizePath = exports.getStreamFilePath = exports.getSessionDir = exports.findClaudeCode = exports.ensureDirectories = exports.CLAUDE_CODE_EXECUTABLE = exports.TEMP_DIR = exports.LOGS_DIR = exports.SERVER_INFO_FILE = exports.SESSIONS_INDEX = exports.SESSIONS_DIR = exports.CONFIG_FILE = exports.CCHIGHWAY_DIR = exports.HOME_DIR = void 0;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// Base paths
exports.HOME_DIR = os_1.default.homedir();
exports.CCHIGHWAY_DIR = path_1.default.join(exports.HOME_DIR, ".cchighway");
exports.CONFIG_FILE = path_1.default.join(exports.CCHIGHWAY_DIR, "config.json");
exports.SESSIONS_DIR = path_1.default.join(exports.CCHIGHWAY_DIR, "sessions");
exports.SESSIONS_INDEX = path_1.default.join(exports.SESSIONS_DIR, "index.json");
exports.SERVER_INFO_FILE = path_1.default.join(exports.CCHIGHWAY_DIR, "server-info.json");
exports.LOGS_DIR = path_1.default.join(exports.CCHIGHWAY_DIR, "logs");
exports.TEMP_DIR = process.env.CCHIGHWAY_TEMP_DIR ?? path_1.default.join(os_1.default.tmpdir(), "cchighway");
// Claude Code executable name (expect it to be in PATH)
exports.CLAUDE_CODE_EXECUTABLE = (() => {
    if (process.platform === "win32") {
        throw new Error("Claude Code is not supported on Windows platform");
    }
    return "claude";
})();
// Ensure directories exist
const ensureDirectories = async () => {
    const dirs = [exports.CCHIGHWAY_DIR, exports.SESSIONS_DIR, exports.LOGS_DIR, exports.TEMP_DIR];
    for (const dir of dirs) {
        await fs_extra_1.default.ensureDir(dir);
    }
};
exports.ensureDirectories = ensureDirectories;
// Find Claude Code executable
const findClaudeCode = async () => {
    const customPath = process.env.CLAUDE_CODE_PATH;
    if (customPath !== undefined && customPath !== null && customPath !== "") {
        try {
            await fs_extra_1.default.access(customPath, fs_extra_1.default.constants.X_OK);
            return customPath;
        }
        catch {
            // Custom path not accessible
        }
    }
    // Check if claude is in PATH using which/where command
    try {
        const { execSync } = await Promise.resolve().then(() => __importStar(require("child_process")));
        const whichCommand = process.platform === "win32" ? "where" : "which";
        const result = execSync(`${whichCommand} ${exports.CLAUDE_CODE_EXECUTABLE}`, {
            encoding: "utf8",
            stdio: "pipe"
        });
        const claudePath = result.trim();
        if (claudePath !== "") {
            return claudePath;
        }
    }
    catch {
        // claude not found in PATH
    }
    return null;
};
exports.findClaudeCode = findClaudeCode;
// Get session directory
const getSessionDir = (sessionId) => {
    return path_1.default.join(exports.SESSIONS_DIR, sessionId);
};
exports.getSessionDir = getSessionDir;
// Get stream file path
const getStreamFilePath = (sessionId) => {
    return path_1.default.join(exports.TEMP_DIR, `stream-${sessionId}.json`);
};
exports.getStreamFilePath = getStreamFilePath;
// Normalize and resolve paths
const normalizePath = (inputPath) => {
    // Expand ~ to home directory
    if (inputPath.startsWith("~")) {
        inputPath = path_1.default.join(exports.HOME_DIR, inputPath.slice(1));
    }
    // Resolve to absolute path
    return path_1.default.resolve(inputPath);
};
exports.normalizePath = normalizePath;
// Check if path is safe (within allowed directories)
const isPathSafe = (inputPath, allowedDir) => {
    const normalizedInput = (0, exports.normalizePath)(inputPath);
    const normalizedAllowed = (0, exports.normalizePath)(allowedDir);
    return normalizedInput.startsWith(normalizedAllowed);
};
exports.isPathSafe = isPathSafe;
// Get relative path for display
const getDisplayPath = (fullPath) => {
    const normalized = (0, exports.normalizePath)(fullPath);
    // Try to make it relative to home
    if (normalized.startsWith(exports.HOME_DIR)) {
        return "~" + normalized.slice(exports.HOME_DIR.length);
    }
    // Try to make it relative to current working directory
    const relative = path_1.default.relative(process.cwd(), normalized);
    if (!relative.startsWith("..")) {
        return relative;
    }
    return normalized;
};
exports.getDisplayPath = getDisplayPath;
//# sourceMappingURL=paths.js.map