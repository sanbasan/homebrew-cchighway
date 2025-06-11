"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClaudePath = exports.buildCommand = exports.initializeCommandBuilder = void 0;
const paths_1 = require("../../utils/paths");
const logger_1 = require("../../utils/logger");
// Command builder state
let claudePath = null;
let initialized = false;
const initializeCommandBuilder = async () => {
    if (initialized)
        return;
    claudePath = await (0, paths_1.findClaudeCode)();
    if (claudePath === null) {
        throw new Error("Claude Code executable not found. Please install Claude Code or set CLAUDE_CODE_PATH environment variable.");
    }
    logger_1.logger.info(`Using Claude Code at: ${claudePath}`);
    initialized = true;
};
exports.initializeCommandBuilder = initializeCommandBuilder;
const buildCommand = (options) => {
    if (claudePath === null || initialized === false) {
        throw new Error("CommandBuilder not initialized");
    }
    const args = [
        claudePath,
        "-p",
        options.prompt,
        "--output-format",
        "stream-json",
        "--dangerously-skip-permissions",
    ];
    // Add resume flag if continuing existing session
    if (options.resumeSessionId !== undefined) {
        args.push("--resume", options.resumeSessionId);
    }
    return args;
};
exports.buildCommand = buildCommand;
const getClaudePath = () => {
    return claudePath;
};
exports.getClaudePath = getClaudePath;
//# sourceMappingURL=command-builder.js.map