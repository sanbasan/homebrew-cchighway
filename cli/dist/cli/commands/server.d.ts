export interface ServerStartOptions {
    port: number;
    workDir: string;
    daemon: boolean;
}
export interface ServerInfo {
    port: number;
    workDir: string;
    uptime: string;
    activeSessions: number;
}
export interface ServerStatus {
    running: boolean;
    info?: ServerInfo;
}
export declare const startServer: (options: ServerStartOptions) => Promise<{
    port: number;
    workDir: string;
}>;
export declare const stopServer: () => Promise<boolean>;
export declare const getServerStatus: () => Promise<ServerStatus>;
//# sourceMappingURL=server.d.ts.map