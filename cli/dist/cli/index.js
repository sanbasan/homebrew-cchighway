#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// CLI entry point
const commander_1 = require("commander");
const commands_1 = require("./commands");
const ui_1 = require("./ui");
const logger_1 = require("../utils/logger");
const file_watcher_1 = require("../core/file-watcher");
const claude_runner_1 = require("../core/claude-runner");
const server_info_1 = require("../utils/server-info");
const program = new commander_1.Command();
const main = async () => {
    try {
        // Set up program info
        program
            .name("cchighway")
            .description("Claude Code Highway - A wrapper tool for Claude Code with web server interface")
            .version((0, ui_1.displayVersion)(), "-v, --version");
        // Initialize commands
        await (0, commands_1.initializeCommands)(program);
        // Check if we should display logo (no command specified)
        const args = process.argv.slice(2);
        if (args.length === 0) {
            (0, ui_1.displayLogo)();
            program.help();
            return;
        }
        // Display logo only for main help and version
        if ((args.length === 1 && (args[0] === "--help" || args[0] === "-h")) ||
            (args.length === 1 && (args[0] === "--version" || args[0] === "-v"))) {
            (0, ui_1.displayLogo)();
        }
        // Parse command line arguments
        await program.parseAsync(process.argv);
    }
    catch (error) {
        logger_1.logger.error("CLI Error:", error);
        process.exit(1);
    }
};
// Graceful shutdown
process.on("SIGINT", async () => {
    logger_1.logger.info("Shutting down CCHighway...");
    await (0, file_watcher_1.cleanupAllWatchers)();
    await (0, claude_runner_1.cleanupClaudeRunner)();
    await (0, server_info_1.removeServerInfo)();
    process.exit(0);
});
process.on("SIGTERM", async () => {
    logger_1.logger.info("Shutting down CCHighway...");
    await (0, file_watcher_1.cleanupAllWatchers)();
    await (0, claude_runner_1.cleanupClaudeRunner)();
    await (0, server_info_1.removeServerInfo)();
    process.exit(0);
});
// Start the CLI
void main();
//# sourceMappingURL=index.js.map