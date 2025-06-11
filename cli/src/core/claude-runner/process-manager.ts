// Process management for Claude Code
import { spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";
import fs from "fs-extra";
import { ClaudeProcess, ClaudeRunnerOptions, ProcessEvent } from "./types";
import { logger, logProcess } from "../../utils/logger";
import { EventEmitter } from "events";

// Process manager state
const processes = new Map<string, ClaudeProcess>();
const processEventEmitter = new EventEmitter();

export const spawnProcess = async (
  command: string[],
  options: ClaudeRunnerOptions
): Promise<ClaudeProcess> => {
  const processId = uuidv4();

  // Create stream file
  await fs.ensureFile(options.streamFile);
  const writeStream = fs.createWriteStream(options.streamFile);

  // Spawn Claude Code process
  const childProcess = spawn(command[0], command.slice(1), {
    cwd: options.workDir,
    env: {
      ...process.env,
      // Ensure proper environment for Claude Code
      NO_COLOR: "1", // Disable color output for cleaner logs
    },
  });

  const claudeProcess: ClaudeProcess = {
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
      logProcess(pid, "started", {
        sessionId: claudeProcess.sessionId,
      });
      processEventEmitter.emit("process-event", processId, {
        type: "started",
        pid,
      } as ProcessEvent);
    }
  });

  childProcess.on("error", error => {
    logger.error(`Process ${processId} error`, error);
    processEventEmitter.emit("process-event", processId, {
      type: "error",
      error,
    } as ProcessEvent);
  });

  childProcess.on("exit", (code, signal) => {
    const pid = childProcess.pid;
    if (pid !== undefined) {
      logProcess(pid, "exited", { code, signal });
    }
    processEventEmitter.emit("process-event", processId, {
      type: "exit",
      code,
      signal,
    } as ProcessEvent);
    processes.delete(processId);
    writeStream.end();
  });

  // Redirect stdout to stream file
  childProcess.stdout?.pipe(writeStream);

  // Log stderr but don't write to stream file
  childProcess.stderr?.on("data", data => {
    const message = String(data);
    logger.warn(`Claude Code stderr: ${message}`);
    processEventEmitter.emit("process-event", processId, {
      type: "stderr",
      data: message,
    } as ProcessEvent);
  });

  return claudeProcess;
};

export const killProcess = async (
  processId: string,
  signal: NodeJS.Signals = "SIGTERM"
): Promise<boolean> => {
  const claudeProcess = processes.get(processId);
  if (claudeProcess === undefined) {
    return false;
  }

  try {
    claudeProcess.process.kill(signal);
    const pid = claudeProcess.process.pid;
    if (pid !== undefined) {
      logProcess(pid, "killed", { signal });
    }
    return true;
  } catch (error) {
    logger.error(`Failed to kill process ${processId}`, error);
    return false;
  }
};

export const killProcessBySessionId = async (
  sessionId: string,
  signal: NodeJS.Signals = "SIGTERM"
): Promise<boolean> => {
  for (const [processId, claudeProcess] of processes) {
    if (claudeProcess.sessionId === sessionId) {
      return killProcess(processId, signal);
    }
  }
  return false;
};

export const getProcess = (processId: string): ClaudeProcess | undefined => {
  return processes.get(processId);
};

export const getProcessBySessionId = (
  sessionId: string
): ClaudeProcess | undefined => {
  for (const claudeProcess of processes.values()) {
    if (claudeProcess.sessionId === sessionId) {
      return claudeProcess;
    }
  }
  return undefined;
};

export const getAllProcesses = (): ClaudeProcess[] => {
  return Array.from(processes.values());
};

export const isSessionRunning = (sessionId: string): boolean => {
  return getProcessBySessionId(sessionId) !== undefined;
};

// Cleanup all processes on shutdown
export const cleanupProcesses = async (): Promise<void> => {
  const promises: Promise<boolean>[] = [];

  for (const processId of processes.keys()) {
    promises.push(killProcess(processId, "SIGTERM"));
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

// Event emitter access
export const onProcessEvent = (
  listener: (processId: string, event: ProcessEvent) => void
): void => {
  processEventEmitter.on("process-event", listener);
};

export const removeProcessEventListener = (
  listener: (processId: string, event: ProcessEvent) => void
): void => {
  processEventEmitter.removeListener("process-event", listener);
};
