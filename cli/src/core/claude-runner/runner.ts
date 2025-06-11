// Main Claude runner orchestrator
import { ClaudeRunnerOptions, ClaudeProcess } from "./types";
import * as commandBuilder from "./command-builder";
import * as processManager from "./process-manager";
import * as sessionManager from "../session";
import { createStreamFile } from "../../utils/session-files";
import { logger } from "../../utils/logger";
import { EventEmitter } from "events";

// Runner state
let initialized = false;
const runnerEventEmitter = new EventEmitter();

// Forward process events
processManager.onProcessEvent((processId, event) => {
  runnerEventEmitter.emit("process-event", processId, event);
});

export const initializeRunner = async (): Promise<void> => {
  if (initialized) return;

  await commandBuilder.initializeCommandBuilder();
  initialized = true;
};

export const executeClaudeCode = async (options: {
  prompt: string;
  sessionId?: string;
  workDir?: string;
}): Promise<{ sessionId: string; processId: string }> => {
  await ensureInitialized();

  // Check if we can start a new session
  if (!(await sessionManager.canStartNewSession())) {
    throw new Error("Maximum concurrent sessions reached");
  }

  let session;
  let resumeSessionId: string | undefined;

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
  const streamFile = await createStreamFile(session.id);

  // Build command
  const runnerOptions: ClaudeRunnerOptions = {
    prompt: options.prompt,
    sessionId: session.id,
    resumeSessionId,
    workDir: session.workDir,
    streamFile,
  };

  const command = commandBuilder.buildCommand(runnerOptions);

  try {
    // Spawn process
    const claudeProcess = await processManager.spawnProcess(
      command,
      runnerOptions
    );

    logger.info(`Started Claude Code process for session ${session.id}`);

    return {
      sessionId: session.id,
      processId: claudeProcess.id,
    };
  } catch (error) {
    // Update session on error
    await sessionManager.updateSessionData(session.id, {
      status: "error",
    });
    throw error;
  }
};

export const stopClaudeCode = async (sessionId: string): Promise<boolean> => {
  const killed = await processManager.killProcessBySessionId(sessionId);

  if (killed) {
    await sessionManager.updateSessionData(sessionId, {
      status: "idle",
    });
  }

  return killed;
};

export const isClaudeCodeRunning = (sessionId: string): boolean => {
  return processManager.isSessionRunning(sessionId);
};

export const getClaudeProcess = (
  sessionId: string
): ClaudeProcess | undefined => {
  return processManager.getProcessBySessionId(sessionId);
};

export const cleanupClaudeRunner = async (): Promise<void> => {
  await processManager.cleanupProcesses();
};

const ensureInitialized = async (): Promise<void> => {
  if (!initialized) {
    await initializeRunner();
  }
};

// Event emitter access
export const onRunnerEvent = (
  event: string,
  listener: (...args: unknown[]) => void
): void => {
  runnerEventEmitter.on(event, listener);
};

export const removeRunnerEventListener = (
  event: string,
  listener: (...args: unknown[]) => void
): void => {
  runnerEventEmitter.removeListener(event, listener);
};
