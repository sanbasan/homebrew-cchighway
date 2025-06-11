import { WatcherOptions, FileWatchEvent, StreamWatchEvent, WatcherState } from "./types";
export declare const startWatching: (sessionId: string, filePath: string, options?: WatcherOptions) => Promise<void>;
export declare const stopWatching: (sessionId: string) => Promise<void>;
export declare const isWatching: (sessionId: string) => boolean;
export declare const getWatcherState: (sessionId: string) => WatcherState | null;
export declare const getAllWatcherStates: () => Record<string, WatcherState>;
export declare const cleanupAllWatchers: () => Promise<void>;
export declare const onFileEvent: (listener: (sessionId: string, event: FileWatchEvent) => void) => void;
export declare const onStreamData: (listener: (sessionId: string, event: StreamWatchEvent) => void) => void;
export declare const onWatcherError: (listener: (sessionId: string, error: Error) => void) => void;
export declare const removeFileEventListener: (listener: (sessionId: string, event: FileWatchEvent) => void) => void;
export declare const removeStreamDataListener: (listener: (sessionId: string, event: StreamWatchEvent) => void) => void;
export declare const removeWatcherErrorListener: (listener: (sessionId: string, error: Error) => void) => void;
//# sourceMappingURL=watcher.d.ts.map