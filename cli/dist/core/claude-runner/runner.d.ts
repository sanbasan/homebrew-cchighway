import { ClaudeProcess } from "./types";
export declare const initializeRunner: () => Promise<void>;
export declare const executeClaudeCode: (options: {
    prompt: string;
    sessionId?: string;
    workDir?: string;
}) => Promise<{
    sessionId: string;
    processId: string;
}>;
export declare const stopClaudeCode: (sessionId: string) => Promise<boolean>;
export declare const isClaudeCodeRunning: (sessionId: string) => boolean;
export declare const getClaudeProcess: (sessionId: string) => ClaudeProcess | undefined;
export declare const cleanupClaudeRunner: () => Promise<void>;
export declare const onRunnerEvent: (event: string, listener: (...args: unknown[]) => void) => void;
export declare const removeRunnerEventListener: (event: string, listener: (...args: unknown[]) => void) => void;
//# sourceMappingURL=runner.d.ts.map