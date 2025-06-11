#!/usr/bin/env node

// CLI entry point
import { Command } from "commander";
import { initializeCommands } from "./commands";
import { displayLogo, displayVersion } from "./ui";
import { logger } from "../utils/logger";
import { cleanupAllWatchers } from "../core/file-watcher";
import { cleanupClaudeRunner } from "../core/claude-runner";
import { removeServerInfo } from "../utils/server-info";

const program = new Command();

const main = async (): Promise<void> => {
  try {
    // Set up program info
    program
      .name("cchighway")
      .description(
        "Claude Code Highway - A wrapper tool for Claude Code with web server interface"
      )
      .version(displayVersion(), "-v, --version");

    // Initialize commands
    await initializeCommands(program);

    // Check if we should display logo (no command specified)
    const args = process.argv.slice(2);
    if (args.length === 0) {
      displayLogo();
      program.help();
      return;
    }

    // Display logo only for main help and version
    if ((args.length === 1 && (args[0] === "--help" || args[0] === "-h")) ||
        (args.length === 1 && (args[0] === "--version" || args[0] === "-v"))) {
      displayLogo();
    }

    // Parse command line arguments
    await program.parseAsync(process.argv);
  } catch (error) {
    logger.error("CLI Error:", error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down CCHighway...");
  await cleanupAllWatchers();
  await cleanupClaudeRunner();
  await removeServerInfo();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down CCHighway...");
  await cleanupAllWatchers();
  await cleanupClaudeRunner();
  await removeServerInfo();
  process.exit(0);
});

// Start the CLI
void main();
