// CLI commands implementation
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { startServer, stopServer, getServerStatus } from "./commands/server";
import { configCommand } from "./commands/config";
import { sessionCommand } from "./commands/session";
import { initCommand } from "./commands/init";
import { logger } from "../utils/logger";

export const initializeCommands = async (program: Command): Promise<void> => {
  // Start command
  program
    .command("start")
    .description("Start the CCHighway server")
    .option("-p, --port <port>", "Port number", "3000")
    .option("-d, --dir <directory>", "Working directory", process.cwd())
    .option("-D, --daemon", "Run in daemon mode", false)
    .action(async (options: { port: string; dir: string; daemon: boolean }) => {
      const spinner = ora("Starting CCHighway server...").start();

      try {
        const port = parseInt(options.port, 10);
        const result = await startServer({
          port,
          workDir: options.dir,
          daemon: options.daemon,
        });

        spinner.succeed("Server started successfully!");
        console.log(
          chalk.green(`\\n✓ CCHighway server running on port ${result.port}`)
        );
        console.log(chalk.blue(`  Working directory: ${result.workDir}`));
        console.log(
          chalk.blue(`  API URL: http://localhost:${result.port}/api`)
        );
        console.log(
          chalk.blue(`  WebSocket URL: ws://localhost:${result.port}`)
        );

        if (!options.daemon) {
          console.log(chalk.yellow("\\nPress Ctrl+C to stop the server"));
        }
      } catch (error) {
        spinner.fail("Failed to start server");
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error(chalk.red(`Error: ${message}`));
        process.exit(1);
      }
    });

  // Stop command
  program
    .command("stop")
    .description("Stop the CCHighway server")
    .action(async () => {
      const spinner = ora("Stopping CCHighway server...").start();

      try {
        const stopped = await stopServer();

        if (stopped) {
          spinner.succeed("Server stopped successfully!");
          return;
        }

        spinner.warn("No running server found");
      } catch (error) {
        spinner.fail("Failed to stop server");
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error(chalk.red(`Error: ${message}`));
        process.exit(1);
      }
    });

  // Status command
  program
    .command("status")
    .description("Show server status")
    .action(async () => {
      try {
        const status = await getServerStatus();

        console.log(chalk.bold("\\nCCHighway Server Status:"));
        console.log(
          `Status: ${status.running ? chalk.green("Running") : chalk.red("Stopped")}`
        );

        if (status.running && status.info !== undefined) {
          console.log(`Port: ${chalk.blue(status.info.port)}`);
          console.log(`Working Directory: ${chalk.blue(status.info.workDir)}`);
          console.log(`Uptime: ${chalk.blue(status.info.uptime)}`);
          console.log(
            `Active Sessions: ${chalk.blue(status.info.activeSessions)}`
          );
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error(chalk.red(`Error: ${message}`));
        process.exit(1);
      }
    });

  // Config command
  const configMainCommand = program
    .command("config")
    .description("Manage configuration");
  
  configCommand.commands.forEach(cmd => {
    configMainCommand.addCommand(cmd);
  });

  // Session command
  const sessionMainCommand = program
    .command("session")
    .description("Manage sessions");
  
  sessionCommand.commands.forEach(cmd => {
    sessionMainCommand.addCommand(cmd);
  });

  // Init command
  program
    .command("init")
    .description("Initialize CCHighway with interactive setup")
    .action(async () => {
      try {
        await initCommand();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error(chalk.red(`Error: ${message}`));
        process.exit(1);
      }
    });

  logger.debug("CLI commands initialized");
};
