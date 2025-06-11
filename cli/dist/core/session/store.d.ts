import { Session } from "../../types";
export declare const initializeStore: () => Promise<void>;
export declare const createSession: (workDir: string) => Promise<Session>;
export declare const getSession: (id: string) => Promise<Session | null>;
export declare const updateSession: (id: string, updates: Partial<Session>) => Promise<void>;
export declare const deleteSession: (id: string) => Promise<void>;
export declare const listSessions: () => Promise<Session[]>;
export declare const cleanupSessions: (maxAgeMs: number) => Promise<number>;
//# sourceMappingURL=store.d.ts.map