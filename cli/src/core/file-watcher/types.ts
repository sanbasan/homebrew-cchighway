// File watcher types
export interface WatcherOptions {
  polling?: boolean;
  interval?: number;
  ignoreInitial?: boolean;
  persistent?: boolean;
}

export interface FileWatchEvent {
  type: "add" | "change" | "unlink";
  path: string;
  stats?: unknown;
  timestamp: Date;
}

export interface StreamWatchEvent extends FileWatchEvent {
  sessionId: string;
  newLines: string[];
  lineNumbers: { start: number; end: number };
}

export interface WatcherState {
  sessionId: string;
  filePath: string;
  lastPosition: number;
  isWatching: boolean;
  startTime: Date;
  lastEventTime?: Date;
  eventCount: number;
}
