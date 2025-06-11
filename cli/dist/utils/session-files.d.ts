export declare const createStreamFile: (sessionId: string) => Promise<string>;
export declare const getStreamFilePath: (sessionId: string) => string;
export declare const streamFileExists: (sessionId: string) => Promise<boolean>;
export declare const readSessionHistory: (sessionId: string) => Promise<unknown[]>;
export declare const cleanupSessionFiles: (sessionId: string) => Promise<void>;
//# sourceMappingURL=session-files.d.ts.map