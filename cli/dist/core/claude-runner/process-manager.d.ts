import { ClaudeProcess, ClaudeRunnerOptions, ProcessEvent } from "./types";
export declare const spawnProcess: (command: string[], options: ClaudeRunnerOptions) => Promise<ClaudeProcess>;
export declare const killProcess: (processId: string, signal?: NodeJS.Signals) => Promise<boolean>;
export declare const killProcessBySessionId: (sessionId: string, signal?: NodeJS.Signals) => Promise<boolean>;
export declare const getProcess: (processId: string) => ClaudeProcess | undefined;
export declare const getProcessBySessionId: (sessionId: string) => ClaudeProcess | undefined;
export declare const getAllProcesses: () => ClaudeProcess[];
export declare const isSessionRunning: (sessionId: string) => boolean;
export declare const cleanupProcesses: () => Promise<void>;
export declare const onProcessEvent: (listener: (processId: string, event: ProcessEvent) => void) => void;
export declare const removeProcessEventListener: (listener: (processId: string, event: ProcessEvent) => void) => void;
//# sourceMappingURL=process-manager.d.ts.map