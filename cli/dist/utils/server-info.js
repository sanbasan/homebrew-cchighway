"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerStatus = exports.isServerRunning = exports.removeServerInfo = exports.loadServerInfo = exports.saveServerInfo = void 0;
// Server information management
const fs_extra_1 = __importDefault(require("fs-extra"));
const paths_1 = require("./paths");
const logger_1 = require("./logger");
const session_1 = require("../core/session");
// Save server info to file
const saveServerInfo = async (info) => {
    try {
        await fs_extra_1.default.writeJson(paths_1.SERVER_INFO_FILE, info, { spaces: 2 });
        logger_1.logger.debug("Server info saved", info);
    }
    catch (error) {
        logger_1.logger.error("Failed to save server info", error);
    }
};
exports.saveServerInfo = saveServerInfo;
// Load server info from file
const loadServerInfo = async () => {
    try {
        if (await fs_extra_1.default.pathExists(paths_1.SERVER_INFO_FILE)) {
            const info = (await fs_extra_1.default.readJson(paths_1.SERVER_INFO_FILE));
            // Convert string dates back to Date objects
            info.startTime = new Date(info.startTime);
            return info;
        }
        return null;
    }
    catch (error) {
        logger_1.logger.warn("Failed to load server info", error);
        return null;
    }
};
exports.loadServerInfo = loadServerInfo;
// Remove server info file
const removeServerInfo = async () => {
    try {
        await fs_extra_1.default.remove(paths_1.SERVER_INFO_FILE);
        logger_1.logger.debug("Server info file removed");
    }
    catch (error) {
        logger_1.logger.warn("Failed to remove server info file", error);
    }
};
exports.removeServerInfo = removeServerInfo;
// Check if server is running by PID
const isServerRunning = async () => {
    const info = await (0, exports.loadServerInfo)();
    if (info === null) {
        return false;
    }
    try {
        // Check if process is still running
        process.kill(info.pid, 0);
        return true;
    }
    catch {
        // Process not found, clean up stale info file
        await (0, exports.removeServerInfo)();
        return false;
    }
};
exports.isServerRunning = isServerRunning;
// Get current server status
const getServerStatus = async () => {
    const info = await (0, exports.loadServerInfo)();
    if (info === null || !(await (0, exports.isServerRunning)())) {
        return { running: false };
    }
    const uptime = Date.now() - info.startTime.getTime();
    const activeSessions = await (0, session_1.getActiveSessionCount)();
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
exports.getServerStatus = getServerStatus;
// Format uptime in human readable format
const formatUptime = (ms) => {
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
//# sourceMappingURL=server-info.js.map