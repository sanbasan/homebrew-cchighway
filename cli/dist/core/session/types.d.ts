import { Session } from "../../types";
export interface SessionStore {
    create(workDir: string): Promise<Session>;
    get(id: string): Promise<Session | null>;
    update(id: string, updates: Partial<Session>): Promise<void>;
    delete(id: string): Promise<void>;
    list(): Promise<Session[]>;
    cleanup(maxAgeMs: number): Promise<number>;
}
export interface SessionIndex {
    sessions: string[];
    lastCleanup: Date;
}
export interface SessionData extends Session {
    history: SessionHistoryEntry[];
}
export interface SessionHistoryEntry {
    timestamp: Date;
    action: "created" | "updated" | "resumed" | "completed" | "error";
    prompt?: string;
    cost?: number;
    duration?: number;
    error?: string;
}
//# sourceMappingURL=types.d.ts.map