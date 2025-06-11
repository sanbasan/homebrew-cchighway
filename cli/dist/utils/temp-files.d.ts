export declare const createTempFile: (prefix?: string, extension?: string) => Promise<string>;
export declare const cleanupTempFile: (filepath: string) => Promise<void>;
export declare const cleanupAllTempFiles: () => Promise<void>;
export declare const cleanupOldTempFiles: (maxAgeMs?: number) => Promise<void>;
export declare const getStreamFileName: (sessionId: string) => string;
export declare const getStreamFilePath: (sessionId: string) => string;
export declare const createStreamFile: (sessionId: string) => Promise<string>;
//# sourceMappingURL=temp-files.d.ts.map