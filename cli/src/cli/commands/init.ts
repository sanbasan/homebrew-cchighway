// Interactive initialization command
import inquirer from "inquirer";
import chalk from "chalk";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { updateConfig, loadConfig, validateConfig } from "../config";
import { displaySuccessBox, displayErrorBox, displayInfoBox } from "../ui";
import { logger } from "../../utils/logger";

export const initCommand = async (): Promise<void> => {
  try {
    console.log(chalk.bold("\\n🚀 Welcome to CCHighway Setup!\\n"));
    console.log(
      chalk.gray(
        "This wizard will help you configure CCHighway for first use.\\n"
      )
    );

    // Load current config
    const currentConfig = await loadConfig();

    // Claude Code path
    const claudeCodeQuestions = await inquirer.prompt([
      {
        type: "input",
        name: "claudeCodePath",
        message: "Path to Claude Code executable:",
        default: currentConfig.claudeCodePath,
        validate: async (input: string): Promise<string | boolean> => {
          if (input.trim() === "") {
            return "Claude Code path is required";
          }

          try {
            const stats = await fs.stat(input);
            if (!stats.isFile()) {
              return "Path must point to a file";
            }

            // Check if file is executable (basic check)
            try {
              await fs.access(input, fs.constants.X_OK);
              return true;
            } catch {
              return "File is not executable";
            }
          } catch {
            return "File does not exist";
          }
        },
      },
    ]);

    // Default working directory
    const workDirQuestions = await inquirer.prompt([
      {
        type: "input",
        name: "defaultWorkDir",
        message: "Default working directory:",
        default: currentConfig.defaultWorkDir,
        validate: async (input: string): Promise<string | boolean> => {
          if (input.trim() === "") {
            return "Working directory is required";
          }

          const expandedPath = input.startsWith("~")
            ? path.join(os.homedir(), input.slice(1))
            : input;

          try {
            await fs.ensureDir(expandedPath);
            return true;
          } catch {
            return "Cannot create or access directory";
          }
        },
      },
    ]);

    // Server settings
    const serverQuestions = await inquirer.prompt([
      {
        type: "input",
        name: "defaultPort",
        message: "Default server port:",
        default: String(currentConfig.defaultPort),
        validate: (input: string): string | boolean => {
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
    const advancedQuestions = await inquirer.prompt([
      {
        type: "confirm",
        name: "configureAdvanced",
        message: "Configure advanced settings?",
        default: false,
      },
    ]);

    let advancedAnswers = {};
    if (advancedQuestions.configureAdvanced === true) {
      advancedAnswers = await inquirer.prompt([
        {
          type: "input",
          name: "sessionRetentionDays",
          message: "Session retention days:",
          default: String(currentConfig.sessionRetentionDays),
          validate: (input: string): string | boolean => {
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
          validate: (input: string): string | boolean => {
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
          validate: (input: string): string | boolean => {
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
    if (
      typeof newConfig.defaultWorkDir === "string" &&
      newConfig.defaultWorkDir.startsWith("~")
    ) {
      newConfig.defaultWorkDir = path.join(
        os.homedir(),
        newConfig.defaultWorkDir.slice(1)
      );
    }

    // Validate configuration
    const errors = validateConfig(newConfig);
    if (errors.length > 0) {
      displayErrorBox("Configuration Validation Failed", errors.join("\\n"));
      return;
    }

    // Show summary
    console.log(chalk.bold("\\n📋 Configuration Summary:"));
    console.log(`Claude Code Path: ${chalk.blue(newConfig.claudeCodePath)}`);
    console.log(`Default Work Dir: ${chalk.blue(newConfig.defaultWorkDir)}`);
    console.log(`Default Port: ${chalk.blue(newConfig.defaultPort)}`);
    console.log(`Log Level: ${chalk.blue(newConfig.logLevel)}`);

    if (advancedQuestions.configureAdvanced === true) {
      console.log(
        `Session Retention: ${chalk.blue(newConfig.sessionRetentionDays)} days`
      );
      console.log(
        `Max Sessions: ${chalk.blue(newConfig.maxConcurrentSessions)}`
      );
      console.log(
        `Watch Interval: ${chalk.blue(newConfig.fileWatchInterval)}ms`
      );
    }

    // Confirm save
    const confirmQuestions = await inquirer.prompt([
      {
        type: "confirm",
        name: "save",
        message: "Save this configuration?",
        default: true,
      },
    ]);

    if (confirmQuestions.save === true) {
      await updateConfig(newConfig);

      displaySuccessBox(
        "Setup Complete!",
        `CCHighway has been configured successfully.\\n\\nYou can now start the server with:\\n${chalk.cyan("cchighway start")}`
      );

      // Create initial directories
      await fs.ensureDir(newConfig.defaultWorkDir);

      logger.info("CCHighway initialization completed", {
        claudeCodePath: newConfig.claudeCodePath,
        defaultWorkDir: newConfig.defaultWorkDir,
        defaultPort: newConfig.defaultPort,
      });
    } else {
      displayInfoBox("Setup Cancelled", "Configuration was not saved");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    displayErrorBox("Setup Error", message);
    throw error;
  }
};
