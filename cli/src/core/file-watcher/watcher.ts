// File watcher implementation
import chokidar, { FSWatcher } from "chokidar";
import fs from "fs-extra";
import { EventEmitter } from "events";
import {
  WatcherOptions,
  FileWatchEvent,
  StreamWatchEvent,
  WatcherState,
} from "./types";
import { logger } from "../../utils/logger";

// Watcher state
const watchers = new Map<string, FSWatcher>();
const watcherStates = new Map<string, WatcherState>();
const watcherEventEmitter = new EventEmitter();

export const startWatching = async (
  sessionId: string,
  filePath: string,
  options: WatcherOptions = {}
): Promise<void> => {
  // Stop existing watcher for this session
  await stopWatching(sessionId);

  const defaultOptions: WatcherOptions = {
    polling: false,
    interval: 100,
    ignoreInitial: true,
    persistent: true,
    ...options,
  };

  // Initialize watcher state
  const state: WatcherState = {
    sessionId,
    filePath,
    lastPosition: 0,
    isWatching: true,
    startTime: new Date(),
    eventCount: 0,
  };

  // Get initial file size
  try {
    const stats = await fs.stat(filePath);
    state.lastPosition = stats.size;
  } catch (error) {
    // File doesn't exist yet, start from 0
    state.lastPosition = 0;
  }

  watcherStates.set(sessionId, state);

  // Create chokidar watcher
  const watcher = chokidar.watch(filePath, {
    usePolling: defaultOptions.polling,
    interval: defaultOptions.interval,
    ignoreInitial: defaultOptions.ignoreInitial,
    persistent: defaultOptions.persistent,
  });

  watchers.set(sessionId, watcher);

  // Handle events
  watcher.on("add", async (path, stats) => {
    const event: FileWatchEvent = {
      type: "add",
      path,
      stats,
      timestamp: new Date(),
    };

    logger.debug(`File added: ${path}`);
    watcherEventEmitter.emit("file-event", sessionId, event);

    // Read initial content if file was added
    await handleFileChange(sessionId, path);
  });

  watcher.on("change", async (path, stats) => {
    const event: FileWatchEvent = {
      type: "change",
      path,
      stats,
      timestamp: new Date(),
    };

    logger.debug(`File changed: ${path}`);
    watcherEventEmitter.emit("file-event", sessionId, event);

    // Handle file content changes
    await handleFileChange(sessionId, path);
  });

  watcher.on("unlink", path => {
    const event: FileWatchEvent = {
      type: "unlink",
      path,
      timestamp: new Date(),
    };

    logger.debug(`File removed: ${path}`);
    watcherEventEmitter.emit("file-event", sessionId, event);
  });

  watcher.on("error", error => {
    logger.error(`Watcher error for session ${sessionId}:`, error);
    watcherEventEmitter.emit("watcher-error", sessionId, error);
  });

  logger.info(`Started watching file ${filePath} for session ${sessionId}`);
};

export const stopWatching = async (sessionId: string): Promise<void> => {
  const watcher: FSWatcher | undefined = watchers.get(sessionId);
  if (watcher !== undefined) {
    try {
      await watcher.close();
    } catch (error: unknown) {
      logger.warn(`Failed to close watcher for session ${sessionId}:`, error);
    }
    watchers.delete(sessionId);
  }

  const state = watcherStates.get(sessionId);
  if (state !== undefined) {
    state.isWatching = false;
    watcherStates.delete(sessionId);
  }

  logger.debug(`Stopped watching for session ${sessionId}`);
};

export const isWatching = (sessionId: string): boolean => {
  const state = watcherStates.get(sessionId);
  return state !== undefined ? state.isWatching : false;
};

export const getWatcherState = (sessionId: string): WatcherState | null => {
  return watcherStates.get(sessionId) ?? null;
};

export const getAllWatcherStates = (): Record<string, WatcherState> => {
  const states: Record<string, WatcherState> = {};
  for (const [sessionId, state] of watcherStates) {
    states[sessionId] = state;
  }
  return states;
};

export const cleanupAllWatchers = async (): Promise<void> => {
  const promises: Promise<void>[] = [];

  for (const sessionId of watchers.keys()) {
    promises.push(stopWatching(sessionId));
  }

  await Promise.all(promises);
  logger.info("Cleaned up all file watchers");
};

// Handle file content changes (tail -f like behavior)
const handleFileChange = async (
  sessionId: string,
  filePath: string
): Promise<void> => {
  const state = watcherStates.get(sessionId);
  if (state === undefined) return;

  try {
    const stats = await fs.stat(filePath);
    const currentSize = stats.size;

    // Only read if file has grown
    if (currentSize > state.lastPosition) {
      const stream = fs.createReadStream(filePath, {
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
          const streamEvent: StreamWatchEvent = {
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
  } catch (error) {
    logger.error(
      `Error reading file ${filePath} for session ${sessionId}:`,
      error
    );
  }
};

// Event emitter access
export const onFileEvent = (
  listener: (sessionId: string, event: FileWatchEvent) => void
): void => {
  watcherEventEmitter.on("file-event", listener);
};

export const onStreamData = (
  listener: (sessionId: string, event: StreamWatchEvent) => void
): void => {
  watcherEventEmitter.on("stream-data", listener);
};

export const onWatcherError = (
  listener: (sessionId: string, error: Error) => void
): void => {
  watcherEventEmitter.on("watcher-error", listener);
};

export const removeFileEventListener = (
  listener: (sessionId: string, event: FileWatchEvent) => void
): void => {
  watcherEventEmitter.removeListener("file-event", listener);
};

export const removeStreamDataListener = (
  listener: (sessionId: string, event: StreamWatchEvent) => void
): void => {
  watcherEventEmitter.removeListener("stream-data", listener);
};

export const removeWatcherErrorListener = (
  listener: (sessionId: string, error: Error) => void
): void => {
  watcherEventEmitter.removeListener("watcher-error", listener);
};

// Cleanup on process exit
process.on("beforeExit", () => {
  void cleanupAllWatchers();
});
