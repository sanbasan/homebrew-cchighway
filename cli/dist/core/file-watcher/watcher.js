"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeWatcherErrorListener = exports.removeStreamDataListener = exports.removeFileEventListener = exports.onWatcherError = exports.onStreamData = exports.onFileEvent = exports.cleanupAllWatchers = exports.getAllWatcherStates = exports.getWatcherState = exports.isWatching = exports.stopWatching = exports.startWatching = void 0;
// File watcher implementation
const chokidar_1 = __importDefault(require("chokidar"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
// Watcher state
const watchers = new Map();
const watcherStates = new Map();
const watcherEventEmitter = new events_1.EventEmitter();
const startWatching = async (sessionId, filePath, options = {}) => {
    // Stop existing watcher for this session
    await (0, exports.stopWatching)(sessionId);
    const defaultOptions = {
        polling: false,
        interval: 100,
        ignoreInitial: true,
        persistent: true,
        ...options,
    };
    // Initialize watcher state
    const state = {
        sessionId,
        filePath,
        lastPosition: 0,
        isWatching: true,
        startTime: new Date(),
        eventCount: 0,
    };
    // Get initial file size
    try {
        const stats = await fs_extra_1.default.stat(filePath);
        state.lastPosition = stats.size;
    }
    catch (error) {
        // File doesn't exist yet, start from 0
        state.lastPosition = 0;
    }
    watcherStates.set(sessionId, state);
    // Create chokidar watcher
    const watcher = chokidar_1.default.watch(filePath, {
        usePolling: defaultOptions.polling,
        interval: defaultOptions.interval,
        ignoreInitial: defaultOptions.ignoreInitial,
        persistent: defaultOptions.persistent,
    });
    watchers.set(sessionId, watcher);
    // Handle events
    watcher.on("add", async (path, stats) => {
        const event = {
            type: "add",
            path,
            stats,
            timestamp: new Date(),
        };
        logger_1.logger.debug(`File added: ${path}`);
        watcherEventEmitter.emit("file-event", sessionId, event);
        // Read initial content if file was added
        await handleFileChange(sessionId, path);
    });
    watcher.on("change", async (path, stats) => {
        const event = {
            type: "change",
            path,
            stats,
            timestamp: new Date(),
        };
        logger_1.logger.debug(`File changed: ${path}`);
        watcherEventEmitter.emit("file-event", sessionId, event);
        // Handle file content changes
        await handleFileChange(sessionId, path);
    });
    watcher.on("unlink", path => {
        const event = {
            type: "unlink",
            path,
            timestamp: new Date(),
        };
        logger_1.logger.debug(`File removed: ${path}`);
        watcherEventEmitter.emit("file-event", sessionId, event);
    });
    watcher.on("error", error => {
        logger_1.logger.error(`Watcher error for session ${sessionId}:`, error);
        watcherEventEmitter.emit("watcher-error", sessionId, error);
    });
    logger_1.logger.info(`Started watching file ${filePath} for session ${sessionId}`);
};
exports.startWatching = startWatching;
const stopWatching = async (sessionId) => {
    const watcher = watchers.get(sessionId);
    if (watcher !== undefined) {
        try {
            await watcher.close();
        }
        catch (error) {
            logger_1.logger.warn(`Failed to close watcher for session ${sessionId}:`, error);
        }
        watchers.delete(sessionId);
    }
    const state = watcherStates.get(sessionId);
    if (state !== undefined) {
        state.isWatching = false;
        watcherStates.delete(sessionId);
    }
    logger_1.logger.debug(`Stopped watching for session ${sessionId}`);
};
exports.stopWatching = stopWatching;
const isWatching = (sessionId) => {
    const state = watcherStates.get(sessionId);
    return state !== undefined ? state.isWatching : false;
};
exports.isWatching = isWatching;
const getWatcherState = (sessionId) => {
    return watcherStates.get(sessionId) ?? null;
};
exports.getWatcherState = getWatcherState;
const getAllWatcherStates = () => {
    const states = {};
    for (const [sessionId, state] of watcherStates) {
        states[sessionId] = state;
    }
    return states;
};
exports.getAllWatcherStates = getAllWatcherStates;
const cleanupAllWatchers = async () => {
    const promises = [];
    for (const sessionId of watchers.keys()) {
        promises.push((0, exports.stopWatching)(sessionId));
    }
    await Promise.all(promises);
    logger_1.logger.info("Cleaned up all file watchers");
};
exports.cleanupAllWatchers = cleanupAllWatchers;
// Handle file content changes (tail -f like behavior)
const handleFileChange = async (sessionId, filePath) => {
    const state = watcherStates.get(sessionId);
    if (state === undefined)
        return;
    try {
        const stats = await fs_extra_1.default.stat(filePath);
        const currentSize = stats.size;
        // Only read if file has grown
        if (currentSize > state.lastPosition) {
            const stream = fs_extra_1.default.createReadStream(filePath, {
                start: state.lastPosition,
                end: currentSize - 1,
                encoding: "utf8",
            });
            let content = "";
            for await (const chunk of stream) {
                content += chunk;
            }
            if (content !== "") {
                const lines = content.split("\\n").filter(line => line.trim() !== "");
                const startLineNumber = Math.floor(state.lastPosition / 100) + 1; // Rough estimate
                if (lines.length > 0) {
                    const streamEvent = {
                        type: "change",
                        path: filePath,
                        timestamp: new Date(),
                        sessionId,
                        newLines: lines,
                        lineNumbers: {
                            start: startLineNumber,
                            end: startLineNumber + lines.length - 1,
                        },
                    };
                    state.lastPosition = currentSize;
                    state.lastEventTime = new Date();
                    state.eventCount++;
                    watcherEventEmitter.emit("stream-data", sessionId, streamEvent);
                }
            }
        }
    }
    catch (error) {
        logger_1.logger.error(`Error reading file ${filePath} for session ${sessionId}:`, error);
    }
};
// Event emitter access
const onFileEvent = (listener) => {
    watcherEventEmitter.on("file-event", listener);
};
exports.onFileEvent = onFileEvent;
const onStreamData = (listener) => {
    watcherEventEmitter.on("stream-data", listener);
};
exports.onStreamData = onStreamData;
const onWatcherError = (listener) => {
    watcherEventEmitter.on("watcher-error", listener);
};
exports.onWatcherError = onWatcherError;
const removeFileEventListener = (listener) => {
    watcherEventEmitter.removeListener("file-event", listener);
};
exports.removeFileEventListener = removeFileEventListener;
const removeStreamDataListener = (listener) => {
    watcherEventEmitter.removeListener("stream-data", listener);
};
exports.removeStreamDataListener = removeStreamDataListener;
const removeWatcherErrorListener = (listener) => {
    watcherEventEmitter.removeListener("watcher-error", listener);
};
exports.removeWatcherErrorListener = removeWatcherErrorListener;
// Cleanup on process exit
process.on("beforeExit", () => {
    void (0, exports.cleanupAllWatchers)();
});
//# sourceMappingURL=watcher.js.map