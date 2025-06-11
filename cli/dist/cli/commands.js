"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeCommands = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const server_1 = require("./commands/server");
const config_1 = require("./commands/config");
const session_1 = require("./commands/session");
const init_1 = require("./commands/init");
const logger_1 = require("../utils/logger");
const initializeCommands = async (program) => {
    // Start command
    program
        .command("start")
        .description("Start the CCHighway server")
        .option("-p, --port <port>", "Port number", "3000")
        .option("-d, --dir <directory>", "Working directory", process.cwd())
        .option("-D, --daemon", "Run in daemon mode", false)
        .action(async (options) => {
        const spinner = (0, ora_1.default)("Starting CCHighway server...").start();
        try {
            const port = parseInt(options.port, 10);
            const result = await (0, server_1.startServer)({
                port,
                workDir: options.dir,
                daemon: options.daemon,
            });
            spinner.succeed("Server started successfully!");
            console.log(chalk_1.default.green(`\\n✓ CCHighway server running on port ${result.port}`));
            console.log(chalk_1.default.blue(`  Working directory: ${result.workDir}`));
            console.log(chalk_1.default.blue(`  API URL: http://localhost:${result.port}/api`));
            console.log(chalk_1.default.blue(`  WebSocket URL: ws://localhost:${result.port}`));
            if (!options.daemon) {
                console.log(chalk_1.default.yellow("\\nPress Ctrl+C to stop the server"));
            }
        }
        catch (error) {
            spinner.fail("Failed to start server");
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error(chalk_1.default.red(`Error: ${message}`));
            process.exit(1);
        }
    });
    // Stop command
    program
        .command("stop")
        .description("Stop the CCHighway server")
        .action(async () => {
        const spinner = (0, ora_1.default)("Stopping CCHighway server...").start();
        try {
            const stopped = await (0, server_1.stopServer)();
            if (stopped) {
                spinner.succeed("Server stopped successfully!");
                return;
            }
            spinner.warn("No running server found");
        }
        catch (error) {
            spinner.fail("Failed to stop server");
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error(chalk_1.default.red(`Error: ${message}`));
            process.exit(1);
        }
    });
    // Status command
    program
        .command("status")
        .description("Show server status")
        .action(async () => {
        try {
            const status = await (0, server_1.getServerStatus)();
            console.log(chalk_1.default.bold("\\nCCHighway Server Status:"));
            console.log(`Status: ${status.running ? chalk_1.default.green("Running") : chalk_1.default.red("Stopped")}`);
            if (status.running && status.info !== undefined) {
                console.log(`Port: ${chalk_1.default.blue(status.info.port)}`);
                console.log(`Working Directory: ${chalk_1.default.blue(status.info.workDir)}`);
                console.log(`Uptime: ${chalk_1.default.blue(status.info.uptime)}`);
                console.log(`Active Sessions: ${chalk_1.default.blue(status.info.activeSessions)}`);
            }
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error(chalk_1.default.red(`Error: ${message}`));
            process.exit(1);
        }
    });
    // Config command
    const configMainCommand = program
        .command("config")
        .description("Manage configuration");
    config_1.configCommand.commands.forEach(cmd => {
        configMainCommand.addCommand(cmd);
    });
    // Session command
    const sessionMainCommand = program
        .command("session")
        .description("Manage sessions");
    session_1.sessionCommand.commands.forEach(cmd => {
        sessionMainCommand.addCommand(cmd);
    });
    // Init command
    program
        .command("init")
        .description("Initialize CCHighway with interactive setup")
        .action(async () => {
        try {
            await (0, init_1.initCommand)();
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error";
            console.error(chalk_1.default.red(`Error: ${message}`));
            process.exit(1);
        }
    });
    logger_1.logger.debug("CLI commands initialized");
};
exports.initializeCommands = initializeCommands;
//# sourceMappingURL=commands.js.map