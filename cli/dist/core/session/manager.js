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
Object.defineProperty(exports, "__esModule", { value: true });
exports.canStartNewSession = exports.getActiveSessionCount = exports.getAllSessions = exports.removeSession = exports.completeSession = exports.updateSessionData = exports.getSessionById = exports.createNewSession = void 0;
const store = __importStar(require("./store"));
const logger_1 = require("../../utils/logger");
const paths_1 = require("../../utils/paths");
// Manager state
let initialized = false;
const activeSessions = new Map();
let cleanupInterval = null;
const initialize = async () => {
    if (initialized)
        return;
    await store.initializeStore();
    initialized = true;
    // Schedule periodic cleanup
    scheduleCleanup();
};
const scheduleCleanup = () => {
    // Run cleanup every hour
    cleanupInterval = setInterval(async () => {
        try {
            const retentionMs = parseInt(process.env.CCHIGHWAY_SESSION_RETENTION_DAYS ?? "30") *
                24 *
                60 *
                60 *
                1000;
            await store.cleanupSessions(retentionMs);
        }
        catch (error) {
            logger_1.logger.error("Session cleanup failed", error);
        }
    }, 60 * 60 * 1000);
};
const createNewSession = async (workDir) => {
    await ensureInitialized();
    const normalizedDir = workDir !== undefined && workDir !== null
        ? (0, paths_1.normalizePath)(workDir)
        : process.cwd();
    const session = await store.createSession(normalizedDir);
    activeSessions.set(session.id, session);
    return session;
};
exports.createNewSession = createNewSession;
const getSessionById = async (id) => {
    await ensureInitialized();
    // Check active sessions first
    if (activeSessions.has(id) === true) {
        const session = activeSessions.get(id);
        if (session !== undefined) {
            return session;
        }
    }
    // Load from store
    const session = await store.getSession(id);
    if (session !== null) {
        activeSessions.set(id, session);
    }
    return session;
};
exports.getSessionById = getSessionById;
const updateSessionData = async (id, updates) => {
    await ensureInitialized();
    await store.updateSession(id, updates);
    // Update cached session
    const cached = activeSessions.get(id);
    if (cached !== undefined) {
        Object.assign(cached, updates, {
            updatedAt: new Date(),
        });
    }
};
exports.updateSessionData = updateSessionData;
const completeSession = async (id, result) => {
    await (0, exports.updateSessionData)(id, {
        status: result.error !== undefined ? "error" : "completed",
        totalCost: result.cost,
        turnCount: result.turnCount,
    });
    // Remove from active sessions
    activeSessions.delete(id);
};
exports.completeSession = completeSession;
const removeSession = async (id) => {
    await ensureInitialized();
    await store.deleteSession(id);
    activeSessions.delete(id);
};
exports.removeSession = removeSession;
const getAllSessions = async () => {
    await ensureInitialized();
    return store.listSessions();
};
exports.getAllSessions = getAllSessions;
const getActiveSessionCount = async () => {
    const sessions = await (0, exports.getAllSessions)();
    return sessions.filter(s => s.status === "running").length;
};
exports.getActiveSessionCount = getActiveSessionCount;
const canStartNewSession = async () => {
    const maxConcurrent = parseInt(process.env.CCHIGHWAY_MAX_CONCURRENT_SESSIONS ?? "10");
    const activeCount = await (0, exports.getActiveSessionCount)();
    return activeCount < maxConcurrent;
};
exports.canStartNewSession = canStartNewSession;
const ensureInitialized = async () => {
    if (initialized === false) {
        await initialize();
    }
};
// Cleanup on process exit
process.on("beforeExit", () => {
    if (cleanupInterval !== null) {
        clearInterval(cleanupInterval);
    }
});
//# sourceMappingURL=manager.js.map