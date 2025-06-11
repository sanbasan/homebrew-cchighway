export interface ServerInfo {
    port: number;
    workDir: string;
    pid: number;
    startTime: Date;
    version: string;
}
export interface ServerStatus {
    running: boolean;
    info?: {
        port: number;
        workDir: string;
        uptime: string;
        activeSessions: number;
    };
}
export declare const saveServerInfo: (info: ServerInfo) => Promise<void>;
export declare const loadServerInfo: () => Promise<ServerInfo | null>;
export declare const removeServerInfo: () => Promise<void>;
export declare const isServerRunning: () => Promise<boolean>;
export declare const getServerStatus: () => Promise<ServerStatus>;
//# sourceMappingURL=server-info.d.ts.map