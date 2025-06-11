import winston from "winston";
export type LogLevel = "error" | "warn" | "info" | "debug" | "verbose";
export declare const logger: winston.Logger;
export declare const logError: (error: Error | unknown, context?: string) => void;
export declare const logRequest: (method: string, path: string, statusCode: number, duration: number) => void;
export declare const logSession: (sessionId: string, action: string, details?: unknown) => void;
export declare const logProcess: (pid: number, action: string, details?: unknown) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map