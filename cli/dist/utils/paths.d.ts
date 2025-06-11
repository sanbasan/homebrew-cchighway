export declare const HOME_DIR: string;
export declare const CCHIGHWAY_DIR: string;
export declare const CONFIG_FILE: string;
export declare const SESSIONS_DIR: string;
export declare const SESSIONS_INDEX: string;
export declare const SERVER_INFO_FILE: string;
export declare const LOGS_DIR: string;
export declare const TEMP_DIR: string;
export declare const CLAUDE_CODE_EXECUTABLE: string;
export declare const ensureDirectories: () => Promise<void>;
export declare const findClaudeCode: () => Promise<string | null>;
export declare const getSessionDir: (sessionId: string) => string;
export declare const getStreamFilePath: (sessionId: string) => string;
export declare const normalizePath: (inputPath: string) => string;
export declare const isPathSafe: (inputPath: string, allowedDir: string) => boolean;
export declare const getDisplayPath: (fullPath: string) => string;
//# sourceMappingURL=paths.d.ts.map