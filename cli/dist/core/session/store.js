"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupSessions = exports.listSessions = exports.deleteSession = exports.updateSession = exports.getSession = exports.createSession = exports.initializeStore = void 0;
// Session store implementation
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const paths_1 = require("../../utils/paths");
const logger_1 = require("../../utils/logger");
// Session index state
let sessionIndex = null;
const loadIndex = async () => {
    try {
        if (await fs_extra_1.default.pathExists(paths_1.SESSIONS_INDEX)) {
            const data = (await fs_extra_1.default.readJson(paths_1.SESSIONS_INDEX));
            sessionIndex = data;
            return data;
        }
        const newIndex = {
            sessions: [],
            lastCleanup: new Date(),
        };
        await saveIndex(newIndex);
        return newIndex;
    }
    catch (error) {
        logger_1.logger.error("Failed to load session index", error);
        const fallbackIndex = {
            sessions: [],
            lastCleanup: new Date(),
        };
        sessionIndex = fallbackIndex;
        return fallbackIndex;
    }
};
const saveIndex = async (index) => {
    try {
        await fs_extra_1.default.writeJson(paths_1.SESSIONS_INDEX, index, { spaces: 2 });
        sessionIndex = index;
    }
    catch (error) {
        logger_1.logger.error("Failed to save session index", error);
    }
};
const initializeStore = async () => {
    await fs_extra_1.default.ensureDir(paths_1.SESSIONS_DIR);
    await loadIndex();
};
exports.initializeStore = initializeStore;
const createSession = async (workDir) => {
    if (sessionIndex === null) {
        await loadIndex();
    }
    const session = {
        id: (0, uuid_1.v4)(),
        workDir,
        status: "idle",
        createdAt: new Date(),
        updatedAt: new Date(),
        turnCount: 0,
    };
    const sessionData = {
        ...session,
        history: [
            {
                timestamp: new Date(),
                action: "created",
            },
        ],
    };
    const sessionDir = (0, paths_1.getSessionDir)(session.id);
    await fs_extra_1.default.ensureDir(sessionDir);
    await fs_extra_1.default.writeJson(path_1.default.join(sessionDir, "session.json"), sessionData, {
        spaces: 2,
    });
    if (sessionIndex !== null) {
        sessionIndex.sessions.push(session.id);
        await saveIndex(sessionIndex);
    }
    (0, logger_1.logSession)(session.id, "created", { workDir });
    return session;
};
exports.createSession = createSession;
const getSession = async (id) => {
    const sessionPath = path_1.default.join((0, paths_1.getSessionDir)(id), "session.json");
    try {
        if (await fs_extra_1.default.pathExists(sessionPath)) {
            const data = (await fs_extra_1.default.readJson(sessionPath));
            const { history, ...session } = data;
            // Convert date strings back to Date objects
            session.createdAt = new Date(session.createdAt);
            session.updatedAt = new Date(session.updatedAt);
            return session;
        }
    }
    catch (error) {
        logger_1.logger.error(`Failed to read session ${id}`, error);
    }
    return null;
};
exports.getSession = getSession;
const updateSession = async (id, updates) => {
    const sessionPath = path_1.default.join((0, paths_1.getSessionDir)(id), "session.json");
    try {
        if (await fs_extra_1.default.pathExists(sessionPath)) {
            const data = (await fs_extra_1.default.readJson(sessionPath));
            // Update session data
            Object.assign(data, updates, {
                updatedAt: new Date(),
            });
            // Add history entry
            data.history.push({
                timestamp: new Date(),
                action: "updated",
                prompt: updates.lastPrompt,
                cost: updates.totalCost !== undefined
                    ? updates.totalCost - (data.totalCost ?? 0)
                    : undefined,
            });
            await fs_extra_1.default.writeJson(sessionPath, data, { spaces: 2 });
            (0, logger_1.logSession)(id, "updated", updates);
        }
    }
    catch (error) {
        logger_1.logger.error(`Failed to update session ${id}`, error);
        throw error;
    }
};
exports.updateSession = updateSession;
const deleteSession = async (id) => {
    const sessionDir = (0, paths_1.getSessionDir)(id);
    try {
        await fs_extra_1.default.remove(sessionDir);
        if (sessionIndex !== null) {
            sessionIndex.sessions = sessionIndex.sessions.filter(s => s !== id);
            await saveIndex(sessionIndex);
        }
        (0, logger_1.logSession)(id, "deleted");
    }
    catch (error) {
        logger_1.logger.error(`Failed to delete session ${id}`, error);
        throw error;
    }
};
exports.deleteSession = deleteSession;
const listSessions = async () => {
    if (sessionIndex === null) {
        await loadIndex();
    }
    const sessions = [];
    for (const id of sessionIndex?.sessions ?? []) {
        const session = await (0, exports.getSession)(id);
        if (session !== null) {
            sessions.push(session);
        }
    }
    // Sort by updated date, newest first
    sessions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return sessions;
};
exports.listSessions = listSessions;
const cleanupSessions = async (maxAgeMs) => {
    const now = Date.now();
    const sessions = await (0, exports.listSessions)();
    let cleaned = 0;
    for (const session of sessions) {
        if (session.status === "completed" || session.status === "error") {
            const age = now - session.updatedAt.getTime();
            if (age > maxAgeMs) {
                await (0, exports.deleteSession)(session.id);
                cleaned++;
            }
        }
    }
    if (sessionIndex !== null) {
        sessionIndex.lastCleanup = new Date();
        await saveIndex(sessionIndex);
    }
    if (cleaned > 0) {
        logger_1.logger.info(`Cleaned up ${cleaned} old sessions`);
    }
    return cleaned;
};
exports.cleanupSessions = cleanupSessions;
//# sourceMappingURL=store.js.map