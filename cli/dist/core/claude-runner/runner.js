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
exports.removeRunnerEventListener = exports.onRunnerEvent = exports.cleanupClaudeRunner = exports.getClaudeProcess = exports.isClaudeCodeRunning = exports.stopClaudeCode = exports.executeClaudeCode = exports.initializeRunner = void 0;
const commandBuilder = __importStar(require("./command-builder"));
const processManager = __importStar(require("./process-manager"));
const sessionManager = __importStar(require("../session"));
const session_files_1 = require("../../utils/session-files");
const logger_1 = require("../../utils/logger");
const events_1 = require("events");
// Runner state
let initialized = false;
const runnerEventEmitter = new events_1.EventEmitter();
// Forward process events
processManager.onProcessEvent((processId, event) => {
    runnerEventEmitter.emit("process-event", processId, event);
});
const initializeRunner = async () => {
    if (initialized)
        return;
    await commandBuilder.initializeCommandBuilder();
    initialized = true;
};
exports.initializeRunner = initializeRunner;
const executeClaudeCode = async (options) => {
    await ensureInitialized();
    // Check if we can start a new session
    if (!(await sessionManager.canStartNewSession())) {
        throw new Error("Maximum concurrent sessions reached");
    }
    let session;
    let resumeSessionId;
    if (options.sessionId !== null && options.sessionId !== undefined) {
        // Resume existing session
        session = await sessionManager.getSessionById(options.sessionId);
        if (session === null) {
            throw new Error(`Session ${options.sessionId} not found`);
        }
        resumeSessionId = session.claudeSessionId;
    }
    // Create new session if not found
    session ??= await sessionManager.createNewSession(options.workDir);
    // Update session status
    await sessionManager.updateSessionData(session.id, {
        status: "running",
        lastPrompt: options.prompt,
    });
    // Create stream file
    const streamFile = await (0, session_files_1.createStreamFile)(session.id);
    // Build command
    const runnerOptions = {
        prompt: options.prompt,
        sessionId: session.id,
        resumeSessionId,
        workDir: session.workDir,
        streamFile,
    };
    const command = commandBuilder.buildCommand(runnerOptions);
    try {
        // Spawn process
        const claudeProcess = await processManager.spawnProcess(command, runnerOptions);
        logger_1.logger.info(`Started Claude Code process for session ${session.id}`);
        return {
            sessionId: session.id,
            processId: claudeProcess.id,
        };
    }
    catch (error) {
        // Update session on error
        await sessionManager.updateSessionData(session.id, {
            status: "error",
        });
        throw error;
    }
};
exports.executeClaudeCode = executeClaudeCode;
const stopClaudeCode = async (sessionId) => {
    const killed = await processManager.killProcessBySessionId(sessionId);
    if (killed) {
        await sessionManager.updateSessionData(sessionId, {
            status: "idle",
        });
    }
    return killed;
};
exports.stopClaudeCode = stopClaudeCode;
const isClaudeCodeRunning = (sessionId) => {
    return processManager.isSessionRunning(sessionId);
};
exports.isClaudeCodeRunning = isClaudeCodeRunning;
const getClaudeProcess = (sessionId) => {
    return processManager.getProcessBySessionId(sessionId);
};
exports.getClaudeProcess = getClaudeProcess;
const cleanupClaudeRunner = async () => {
    await processManager.cleanupProcesses();
};
exports.cleanupClaudeRunner = cleanupClaudeRunner;
const ensureInitialized = async () => {
    if (!initialized) {
        await (0, exports.initializeRunner)();
    }
};
// Event emitter access
const onRunnerEvent = (event, listener) => {
    runnerEventEmitter.on(event, listener);
};
exports.onRunnerEvent = onRunnerEvent;
const removeRunnerEventListener = (event, listener) => {
    runnerEventEmitter.removeListener(event, listener);
};
exports.removeRunnerEventListener = removeRunnerEventListener;
//# sourceMappingURL=runner.js.map