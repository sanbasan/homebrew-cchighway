import { ChildProcess } from "child_process";
export interface ClaudeRunnerOptions {
    prompt: string;
    sessionId?: string;
    resumeSessionId?: string;
    workDir: string;
    streamFile: string;
}
export interface ClaudeProcess {
    id: string;
    process: ChildProcess;
    sessionId: string;
    streamFile: string;
    startTime: Date;
    options: ClaudeRunnerOptions;
}
export interface ClaudeCommandBuilder {
    build(options: ClaudeRunnerOptions): string[];
}
export type ProcessEvent = {
    type: "started";
    pid: number;
} | {
    type: "exit";
    code: number | null;
    signal: string | null;
} | {
    type: "error";
    error: Error;
} | {
    type: "stdout";
    data: string;
} | {
    type: "stderr";
    data: string;
};
//# sourceMappingURL=types.d.ts.map