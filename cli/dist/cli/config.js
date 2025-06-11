"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFile = exports.getConfigDir = exports.validateConfig = exports.getConfigValue = exports.resetConfig = exports.updateConfig = exports.saveConfig = exports.loadConfig = exports.ensureConfigDir = void 0;
// Configuration management
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const logger_1 = require("../utils/logger");
const DEFAULT_CONFIG = {
    claudeCodePath: "/usr/local/bin/claude",
    defaultWorkDir: path_1.default.join(os_1.default.homedir(), "projects"),
    sessionRetentionDays: 30,
    maxConcurrentSessions: 10,
    streamBufferSize: 65536,
    fileWatchInterval: 100,
    allowedTools: ["Bash", "Read", "Glob", "Grep", "Edit", "Write"],
    defaultPort: 3000,
    defaultHost: "localhost",
    logLevel: "info",
};
const CONFIG_DIR = path_1.default.join(os_1.default.homedir(), ".cchighway");
const CONFIG_FILE = path_1.default.join(CONFIG_DIR, "config.json");
let cachedConfig = null;
const ensureConfigDir = async () => {
    await fs_extra_1.default.ensureDir(CONFIG_DIR);
};
exports.ensureConfigDir = ensureConfigDir;
const loadConfig = async () => {
    if (cachedConfig !== null) {
        return cachedConfig;
    }
    await (0, exports.ensureConfigDir)();
    try {
        if (await fs_extra_1.default.pathExists(CONFIG_FILE)) {
            const configData = (await fs_extra_1.default.readJson(CONFIG_FILE));
            cachedConfig = { ...DEFAULT_CONFIG, ...configData };
        }
        else {
            cachedConfig = { ...DEFAULT_CONFIG };
            await (0, exports.saveConfig)(cachedConfig);
        }
    }
    catch (error) {
        logger_1.logger.error("Failed to load config, using defaults", error);
        cachedConfig = { ...DEFAULT_CONFIG };
    }
    return cachedConfig;
};
exports.loadConfig = loadConfig;
const saveConfig = async (config) => {
    try {
        await (0, exports.ensureConfigDir)();
        await fs_extra_1.default.writeJson(CONFIG_FILE, config, { spaces: 2 });
        cachedConfig = config;
        logger_1.logger.debug("Configuration saved");
    }
    catch (error) {
        logger_1.logger.error("Failed to save config", error);
        throw error;
    }
};
exports.saveConfig = saveConfig;
const updateConfig = async (updates) => {
    const config = await (0, exports.loadConfig)();
    const updatedConfig = { ...config, ...updates };
    await (0, exports.saveConfig)(updatedConfig);
    return updatedConfig;
};
exports.updateConfig = updateConfig;
const resetConfig = async () => {
    const config = { ...DEFAULT_CONFIG };
    await (0, exports.saveConfig)(config);
    return config;
};
exports.resetConfig = resetConfig;
const getConfigValue = (config, key) => {
    return config[key];
};
exports.getConfigValue = getConfigValue;
const validateConfig = (config) => {
    const errors = [];
    if (config.defaultPort !== undefined) {
        const port = Number(config.defaultPort);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            errors.push("Port must be between 1 and 65535");
        }
    }
    if (config.sessionRetentionDays !== undefined) {
        const days = Number(config.sessionRetentionDays);
        if (!Number.isInteger(days) || days < 1) {
            errors.push("Session retention days must be a positive integer");
        }
    }
    if (config.maxConcurrentSessions !== undefined) {
        const sessions = Number(config.maxConcurrentSessions);
        if (!Number.isInteger(sessions) || sessions < 1) {
            errors.push("Max concurrent sessions must be a positive integer");
        }
    }
    if (config.logLevel !== undefined) {
        const validLevels = ["error", "warn", "info", "debug", "verbose"];
        if (!validLevels.includes(config.logLevel)) {
            errors.push(`Log level must be one of: ${validLevels.join(", ")}`);
        }
    }
    return errors;
};
exports.validateConfig = validateConfig;
const getConfigDir = () => {
    return CONFIG_DIR;
};
exports.getConfigDir = getConfigDir;
const getConfigFile = () => {
    return CONFIG_FILE;
};
exports.getConfigFile = getConfigFile;
//# sourceMappingURL=config.js.map