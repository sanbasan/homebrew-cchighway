export interface CCHighwayConfig {
    claudeCodePath: string;
    defaultWorkDir: string;
    sessionRetentionDays: number;
    maxConcurrentSessions: number;
    streamBufferSize: number;
    fileWatchInterval: number;
    allowedTools: string[];
    defaultPort: number;
    defaultHost: string;
    logLevel: string;
}
export declare const ensureConfigDir: () => Promise<void>;
export declare const loadConfig: () => Promise<CCHighwayConfig>;
export declare const saveConfig: (config: CCHighwayConfig) => Promise<void>;
export declare const updateConfig: (updates: Partial<CCHighwayConfig>) => Promise<CCHighwayConfig>;
export declare const resetConfig: () => Promise<CCHighwayConfig>;
export declare const getConfigValue: <K extends keyof CCHighwayConfig>(config: CCHighwayConfig, key: K) => CCHighwayConfig[K];
export declare const validateConfig: (config: Partial<CCHighwayConfig>) => string[];
export declare const getConfigDir: () => string;
export declare const getConfigFile: () => string;
//# sourceMappingURL=config.d.ts.map