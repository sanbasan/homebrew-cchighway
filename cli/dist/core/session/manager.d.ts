import { Session } from "../../types";
export declare const createNewSession: (workDir?: string) => Promise<Session>;
export declare const getSessionById: (id: string) => Promise<Session | null>;
export declare const updateSessionData: (id: string, updates: Partial<Session>) => Promise<void>;
export declare const completeSession: (id: string, result: {
    cost?: number;
    turnCount: number;
    error?: string;
}) => Promise<void>;
export declare const removeSession: (id: string) => Promise<void>;
export declare const getAllSessions: () => Promise<Session[]>;
export declare const getActiveSessionCount: () => Promise<number>;
export declare const canStartNewSession: () => Promise<boolean>;
//# sourceMappingURL=manager.d.ts.map