"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = void 0;
// Interactive initialization command
const inquirer_1 = __importDefault(require("inquirer"));
const chalk_1 = __importDefault(require("chalk"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const config_1 = require("../config");
const ui_1 = require("../ui");
const logger_1 = require("../../utils/logger");
const initCommand = async () => {
    try {
        console.log(chalk_1.default.bold("\\n🚀 Welcome to CCHighway Setup!\\n"));
        console.log(chalk_1.default.gray("This wizard will help you configure CCHighway for first use.\\n"));
        // Load current config
        const currentConfig = await (0, config_1.loadConfig)();
        // Claude Code path
        const claudeCodeQuestions = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "claudeCodePath",
                message: "Path to Claude Code executable:",
                default: currentConfig.claudeCodePath,
                validate: async (input) => {
                    if (input.trim() === "") {
                        return "Claude Code path is required";
                    }
                    try {
                        const stats = await fs_extra_1.default.stat(input);
                        if (!stats.isFile()) {
                            return "Path must point to a file";
                        }
                        // Check if file is executable (basic check)
                        try {
                            await fs_extra_1.default.access(input, fs_extra_1.default.constants.X_OK);
                            return true;
                        }
                        catch {
                            return "File is not executable";
                        }
                    }
                    catch {
                        return "File does not exist";
                    }
                },
            },
        ]);
        // Default working directory
        const workDirQuestions = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "defaultWorkDir",
                message: "Default working directory:",
                default: currentConfig.defaultWorkDir,
                validate: async (input) => {
                    if (input.trim() === "") {
                        return "Working directory is required";
                    }
                    const expandedPath = input.startsWith("~")
                        ? path_1.default.join(os_1.default.homedir(), input.slice(1))
                        : input;
                    try {
                        await fs_extra_1.default.ensureDir(expandedPath);
                        return true;
                    }
                    catch {
                        return "Cannot create or access directory";
                    }
                },
            },
        ]);
        // Server settings
        const serverQuestions = await inquirer_1.default.prompt([
            {
                type: "input",
                name: "defaultPort",
                message: "Default server port:",
                default: String(currentConfig.defaultPort),
                validate: (input) => {
                    const port = Number(input);
                    if (!Number.isInteger(port) || port < 1 || port > 65535) {
                        return "Port must be between 1 and 65535";
                    }
                    return true;
                },
            },
            {
                type: "list",
                name: "logLevel",
                message: "Log level:",
                choices: [
                    { name: "Error only", value: "error" },
                    { name: "Warnings and errors", value: "warn" },
                    { name: "Info, warnings, and errors (recommended)", value: "info" },
                    { name: "Debug information", value: "debug" },
                    { name: "Verbose (all logs)", value: "verbose" },
                ],
                default: currentConfig.logLevel,
            },
        ]);
        // Advanced settings
        const advancedQuestions = await inquirer_1.default.prompt([
            {
                type: "confirm",
                name: "configureAdvanced",
                message: "Configure advanced settings?",
                default: false,
            },
        ]);
        let advancedAnswers = {};
        if (advancedQuestions.configureAdvanced === true) {
            advancedAnswers = await inquirer_1.default.prompt([
                {
                    type: "input",
                    name: "sessionRetentionDays",
                    message: "Session retention days:",
                    default: String(currentConfig.sessionRetentionDays),
                    validate: (input) => {
                        const days = Number(input);
                        if (!Number.isInteger(days) || days < 1) {
                            return "Retention days must be a positive integer";
                        }
                        return true;
                    },
                },
                {
                    type: "input",
                    name: "maxConcurrentSessions",
                    message: "Maximum concurrent sessions:",
                    default: String(currentConfig.maxConcurrentSessions),
                    validate: (input) => {
                        const sessions = Number(input);
                        if (!Number.isInteger(sessions) || sessions < 1) {
                            return "Max sessions must be a positive integer";
                        }
                        return true;
                    },
                },
                {
                    type: "input",
                    name: "fileWatchInterval",
                    message: "File watch interval (ms):",
                    default: String(currentConfig.fileWatchInterval),
                    validate: (input) => {
                        const interval = Number(input);
                        if (!Number.isInteger(interval) || interval < 50) {
                            return "Watch interval must be at least 50ms";
                        }
                        return true;
                    },
                },
            ]);
        }
        // Combine all answers and parse numeric values
        const newConfig = {
            ...currentConfig,
            ...claudeCodeQuestions,
            ...workDirQuestions,
            ...serverQuestions,
            ...advancedAnswers,
        };
        // Parse numeric strings back to numbers
        if (newConfig.defaultPort !== undefined) {
            newConfig.defaultPort = Number(newConfig.defaultPort);
        }
        if (newConfig.sessionRetentionDays !== undefined) {
            newConfig.sessionRetentionDays = Number(newConfig.sessionRetentionDays);
        }
        if (newConfig.maxConcurrentSessions !== undefined) {
            newConfig.maxConcurrentSessions = Number(newConfig.maxConcurrentSessions);
        }
        if (newConfig.fileWatchInterval !== undefined) {
            newConfig.fileWatchInterval = Number(newConfig.fileWatchInterval);
        }
        // Expand tilde in paths
        if (typeof newConfig.defaultWorkDir === "string" &&
            newConfig.defaultWorkDir.startsWith("~")) {
            newConfig.defaultWorkDir = path_1.default.join(os_1.default.homedir(), newConfig.defaultWorkDir.slice(1));
        }
        // Validate configuration
        const errors = (0, config_1.validateConfig)(newConfig);
        if (errors.length > 0) {
            (0, ui_1.displayErrorBox)("Configuration Validation Failed", errors.join("\\n"));
            return;
        }
        // Show summary
        console.log(chalk_1.default.bold("\\n📋 Configuration Summary:"));
        console.log(`Claude Code Path: ${chalk_1.default.blue(newConfig.claudeCodePath)}`);
        console.log(`Default Work Dir: ${chalk_1.default.blue(newConfig.defaultWorkDir)}`);
        console.log(`Default Port: ${chalk_1.default.blue(newConfig.defaultPort)}`);
        console.log(`Log Level: ${chalk_1.default.blue(newConfig.logLevel)}`);
        if (advancedQuestions.configureAdvanced === true) {
            console.log(`Session Retention: ${chalk_1.default.blue(newConfig.sessionRetentionDays)} days`);
            console.log(`Max Sessions: ${chalk_1.default.blue(newConfig.maxConcurrentSessions)}`);
            console.log(`Watch Interval: ${chalk_1.default.blue(newConfig.fileWatchInterval)}ms`);
        }
        // Confirm save
        const confirmQuestions = await inquirer_1.default.prompt([
            {
                type: "confirm",
                name: "save",
                message: "Save this configuration?",
                default: true,
            },
        ]);
        if (confirmQuestions.save === true) {
            await (0, config_1.updateConfig)(newConfig);
            (0, ui_1.displaySuccessBox)("Setup Complete!", `CCHighway has been configured successfully.\\n\\nYou can now start the server with:\\n${chalk_1.default.cyan("cchighway start")}`);
            // Create initial directories
            await fs_extra_1.default.ensureDir(newConfig.defaultWorkDir);
            logger_1.logger.info("CCHighway initialization completed", {
                claudeCodePath: newConfig.claudeCodePath,
                defaultWorkDir: newConfig.defaultWorkDir,
                defaultPort: newConfig.defaultPort,
            });
        }
        else {
            (0, ui_1.displayInfoBox)("Setup Cancelled", "Configuration was not saved");
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        (0, ui_1.displayErrorBox)("Setup Error", message);
        throw error;
    }
};
exports.initCommand = initCommand;
//# sourceMappingURL=init.js.map