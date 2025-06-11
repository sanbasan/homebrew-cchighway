"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupSessionFiles = exports.readSessionHistory = exports.streamFileExists = exports.getStreamFilePath = exports.createStreamFile = void 0;
// Session file management utilities
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const paths_1 = require("./paths");
const logger_1 = require("./logger");
// Create stream file for a session
const createStreamFile = async (sessionId) => {
    const sessionDir = (0, paths_1.getSessionDir)(sessionId);
    await fs_extra_1.default.ensureDir(sessionDir);
    const filepath = path_1.default.join(sessionDir, "stream.json");
    await fs_extra_1.default.writeFile(filepath, "");
    logger_1.logger.debug(`Created stream file: ${filepath}`);
    return filepath;
};
exports.createStreamFile = createStreamFile;
// Get stream file path for a session
const getStreamFilePath = (sessionId) => {
    const sessionDir = (0, paths_1.getSessionDir)(sessionId);
    return path_1.default.join(sessionDir, "stream.json");
};
exports.getStreamFilePath = getStreamFilePath;
// Check if stream file exists for a session
const streamFileExists = async (sessionId) => {
    const filepath = (0, exports.getStreamFilePath)(sessionId);
    return fs_extra_1.default.pathExists(filepath);
};
exports.streamFileExists = streamFileExists;
// Read session history from stream file
const readSessionHistory = async (sessionId) => {
    const filepath = (0, exports.getStreamFilePath)(sessionId);
    if (!(await fs_extra_1.default.pathExists(filepath))) {
        return [];
    }
    const content = await fs_extra_1.default.readFile(filepath, "utf8");
    const lines = content.split("\n").filter(line => line.trim() !== "");
    const history = [];
    for (const line of lines) {
        try {
            const data = JSON.parse(line);
            history.push(data);
        }
        catch (parseError) {
            logger_1.logger.warn(`Invalid JSON line in ${filepath}:`, parseError);
        }
    }
    return history;
};
exports.readSessionHistory = readSessionHistory;
// Clean up session files
const cleanupSessionFiles = async (sessionId) => {
    const sessionDir = (0, paths_1.getSessionDir)(sessionId);
    try {
        await fs_extra_1.default.remove(sessionDir);
        logger_1.logger.debug(`Cleaned up session files: ${sessionDir}`);
    }
    catch (error) {
        logger_1.logger.warn(`Failed to clean up session files: ${sessionDir}`, error);
    }
};
exports.cleanupSessionFiles = cleanupSessionFiles;
//# sourceMappingURL=session-files.js.map