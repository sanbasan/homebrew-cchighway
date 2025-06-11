"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStreamFile = exports.getStreamFilePath = exports.getStreamFileName = exports.cleanupOldTempFiles = exports.cleanupAllTempFiles = exports.cleanupTempFile = exports.createTempFile = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const paths_1 = require("./paths");
const logger_1 = require("./logger");
// Active temp files tracking
const activeTempFiles = new Set();
// Create a temporary file
const createTempFile = async (prefix = "temp", extension = "") => {
    await fs_extra_1.default.ensureDir(paths_1.TEMP_DIR);
    const filename = `${prefix}-${(0, uuid_1.v4)()}${extension}`;
    const filepath = path_1.default.join(paths_1.TEMP_DIR, filename);
    await fs_extra_1.default.writeFile(filepath, "");
    activeTempFiles.add(filepath);
    logger_1.logger.debug(`Created temp file: ${filepath}`);
    return filepath;
};
exports.createTempFile = createTempFile;
// Clean up a specific temp file
const cleanupTempFile = async (filepath) => {
    try {
        await fs_extra_1.default.remove(filepath);
        activeTempFiles.delete(filepath);
        logger_1.logger.debug(`Cleaned up temp file: ${filepath}`);
    }
    catch (error) {
        logger_1.logger.warn(`Failed to clean up temp file: ${filepath}`, error);
    }
};
exports.cleanupTempFile = cleanupTempFile;
// Clean up all active temp files
const cleanupAllTempFiles = async () => {
    const files = Array.from(activeTempFiles);
    for (const file of files) {
        await (0, exports.cleanupTempFile)(file);
    }
    logger_1.logger.info(`Cleaned up ${files.length} temp files`);
};
exports.cleanupAllTempFiles = cleanupAllTempFiles;
// Clean up old temp files (not tracked by current process)
const cleanupOldTempFiles = async (maxAgeMs = 24 * 60 * 60 * 1000 // 24 hours
) => {
    try {
        const files = await fs_extra_1.default.readdir(paths_1.TEMP_DIR);
        const now = Date.now();
        let cleanedCount = 0;
        for (const file of files) {
            // Only clean up files matching our pattern
            if (!file.startsWith("stream-") && !file.startsWith("temp-")) {
                continue;
            }
            const filepath = path_1.default.join(paths_1.TEMP_DIR, file);
            const stats = await fs_extra_1.default.stat(filepath);
            if (now - stats.mtimeMs > maxAgeMs) {
                await fs_extra_1.default.remove(filepath);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger_1.logger.info(`Cleaned up ${cleanedCount} old temp files`);
        }
    }
    catch (error) {
        logger_1.logger.warn("Failed to clean up old temp files", error);
    }
};
exports.cleanupOldTempFiles = cleanupOldTempFiles;
// Register cleanup handlers
process.on("exit", () => {
    // Synchronous cleanup on exit
    for (const file of activeTempFiles) {
        try {
            fs_extra_1.default.removeSync(file);
        }
        catch {
            // Ignore errors on exit
        }
    }
});
process.on("SIGINT", async () => {
    await (0, exports.cleanupAllTempFiles)();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    await (0, exports.cleanupAllTempFiles)();
    process.exit(0);
});
// Stream file specific utilities
const getStreamFileName = (sessionId) => {
    return `stream-${sessionId}.json`;
};
exports.getStreamFileName = getStreamFileName;
const getStreamFilePath = (sessionId) => {
    return path_1.default.join(paths_1.TEMP_DIR, (0, exports.getStreamFileName)(sessionId));
};
exports.getStreamFilePath = getStreamFilePath;
const createStreamFile = async (sessionId) => {
    const filepath = (0, exports.getStreamFilePath)(sessionId);
    await fs_extra_1.default.ensureDir(paths_1.TEMP_DIR);
    await fs_extra_1.default.writeFile(filepath, "");
    activeTempFiles.add(filepath);
    return filepath;
};
exports.createStreamFile = createStreamFile;
// Initialize temp directory and cleanup old files on module load
const initializeTempDir = async () => {
    fs_extra_1.default.ensureDirSync(paths_1.TEMP_DIR);
    // Clean up any leftover files from previous sessions
    await (0, exports.cleanupOldTempFiles)(0); // Clean all CCHighway temp files immediately
    logger_1.logger.debug("Temp directory initialized and cleaned");
};
// Run initialization
void initializeTempDir();
//# sourceMappingURL=temp-files.js.map