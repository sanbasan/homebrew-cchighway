declare const app: import("express-serve-static-core").Express;
export interface ServerOptions {
    port: number;
    workDir: string;
    daemon: boolean;
}
export declare const startServer: (options: ServerOptions) => Promise<{
    port: number;
    workDir: string;
}>;
export declare const stopServer: () => Promise<boolean>;
export declare const getServerStatus: () => Promise<{
    running: boolean;
    info?: {
        port: number;
        workDir: string;
        uptime: string;
        activeSessions: number;
    };
}>;
export { app };
//# sourceMappingURL=index.d.ts.map