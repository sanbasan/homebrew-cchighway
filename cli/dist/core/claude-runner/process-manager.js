"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeProcessEventListener = exports.onProcessEvent = exports.cleanupProcesses = exports.isSessionRunning = exports.getAllProcesses = exports.getProcessBySessionId = exports.getProcess = exports.killProcessBySessionId = exports.killProcess = exports.spawnProcess = void 0;
// Process management for Claude Code
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
const fs_extra_1 = __importDefault(require("fs-extra"));
const logger_1 = require("../../utils/logger");
const events_1 = require("events");
// Process manager state
const processes = new Map();
const processEventEmitter = new events_1.EventEmitter();
const spawnProcess = async (command, options) => {
    const processId = (0, uuid_1.v4)();
    // Create stream file
    await fs_extra_1.default.ensureFile(options.streamFile);
    const writeStream = fs_extra_1.default.createWriteStream(options.streamFile);
    // Spawn Claude Code process
    const childProcess = (0, child_process_1.spawn)(command[0], command.slice(1), {
        cwd: options.workDir,
        env: {
            ...process.env,
            // Ensure proper environment for Claude Code
            NO_COLOR: "1", // Disable color output for cleaner logs
        },
    });
    const claudeProcess = {
        id: processId,
        process: childProcess,
        sessionId: options.sessionId ?? processId,
        streamFile: options.streamFile,
        startTime: new Date(),
        options,
    };
    processes.set(processId, claudeProcess);
    // Handle process events
    childProcess.on("spawn", () => {
        const pid = childProcess.pid;
        if (pid !== undefined) {
            (0, logger_1.logProcess)(pid, "started", {
                sessionId: claudeProcess.sessionId,
            });
            processEventEmitter.emit("process-event", processId, {
                type: "started",
                pid,
            });
        }
    });
    childProcess.on("error", error => {
        logger_1.logger.error(`Process ${processId} error`, error);
        processEventEmitter.emit("process-event", processId, {
            type: "error",
            error,
        });
    });
    childProcess.on("exit", (code, signal) => {
        const pid = childProcess.pid;
        if (pid !== undefined) {
            (0, logger_1.logProcess)(pid, "exited", { code, signal });
        }
        processEventEmitter.emit("process-event", processId, {
            type: "exit",
            code,
            signal,
        });
        processes.delete(processId);
        writeStream.end();
    });
    // Redirect stdout to stream file
    childProcess.stdout?.pipe(writeStream);
    // Log stderr but don't write to stream file
    childProcess.stderr?.on("data", data => {
        const message = String(data);
        logger_1.logger.warn(`Claude Code stderr: ${message}`);
        processEventEmitter.emit("process-event", processId, {
            type: "stderr",
            data: message,
        });
    });
    return claudeProcess;
};
exports.spawnProcess = spawnProcess;
const killProcess = async (processId, signal = "SIGTERM") => {
    const claudeProcess = processes.get(processId);
    if (claudeProcess === undefined) {
        return false;
    }
    try {
        claudeProcess.process.kill(signal);
        const pid = claudeProcess.process.pid;
        if (pid !== undefined) {
            (0, logger_1.logProcess)(pid, "killed", { signal });
        }
        return true;
    }
    catch (error) {
        logger_1.logger.error(`Failed to kill process ${processId}`, error);
        return false;
    }
};
exports.killProcess = killProcess;
const killProcessBySessionId = async (sessionId, signal = "SIGTERM") => {
    for (const [processId, claudeProcess] of processes) {
        if (claudeProcess.sessionId === sessionId) {
            return (0, exports.killProcess)(processId, signal);
        }
    }
    return false;
};
exports.killProcessBySessionId = killProcessBySessionId;
const getProcess = (processId) => {
    return processes.get(processId);
};
exports.getProcess = getProcess;
const getProcessBySessionId = (sessionId) => {
    for (const claudeProcess of processes.values()) {
        if (claudeProcess.sessionId === sessionId) {
            return claudeProcess;
        }
    }
    return undefined;
};
exports.getProcessBySessionId = getProcessBySessionId;
const getAllProcesses = () => {
    return Array.from(processes.values());
};
exports.getAllProcesses = getAllProcesses;
const isSessionRunning = (sessionId) => {
    return (0, exports.getProcessBySessionId)(sessionId) !== undefined;
};
exports.isSessionRunning = isSessionRunning;
// Cleanup all processes on shutdown
const cleanupProcesses = async () => {
    const promises = [];
    for (const processId of processes.keys()) {
        promises.push((0, exports.killProcess)(processId, "SIGTERM"));
    }
    await Promise.all(promises);
    // Give processes time to exit gracefully
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Force kill any remaining processes
    for (const [, claudeProcess] of processes) {
        if (!claudeProcess.process.killed) {
            claudeProcess.process.kill("SIGKILL");
        }
    }
};
exports.cleanupProcesses = cleanupProcesses;
// Event emitter access
const onProcessEvent = (listener) => {
    processEventEmitter.on("process-event", listener);
};
exports.onProcessEvent = onProcessEvent;
const removeProcessEventListener = (listener) => {
    processEventEmitter.removeListener("process-event", listener);
};
exports.removeProcessEventListener = removeProcessEventListener;
//# sourceMappingURL=process-manager.js.map