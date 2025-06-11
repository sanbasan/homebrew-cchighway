// Configuration commands
import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import Table from "cli-table3";
import {
  loadConfig,
  updateConfig,
  resetConfig,
  validateConfig,
  CCHighwayConfig,
} from "../config";
import { displaySuccessBox, displayErrorBox } from "../ui";

export const configCommand = new Command().description(
  "Manage configuration"
);

// Config set command
configCommand
  .command("set")
  .description("Set a configuration value")
  .argument("<key>", "Configuration key")
  .argument("<value>", "Configuration value")
  .action(async (key: string, value: string) => {
    try {
      const config = await loadConfig();

      // Validate key exists
      if (!(key in config)) {
        console.error(chalk.red(`Unknown configuration key: ${key}`));
        console.log(chalk.yellow("Available keys:"));
        Object.keys(config).forEach(k => {
          console.log(chalk.gray(`  ${k}`));
        });
        return;
      }

      // Parse value based on the current type
      const currentValue = config[key as keyof CCHighwayConfig];
      let parsedValue: unknown;

      if (typeof currentValue === "number") {
        parsedValue = Number(value);
        if (isNaN(parsedValue as number)) {
          console.error(chalk.red(`Value must be a number for key: ${key}`));
          return;
        }
      } else if (typeof currentValue === "boolean") {
        parsedValue = value.toLowerCase() === "true";
      } else if (Array.isArray(currentValue)) {
        parsedValue = value.split(",").map(s => s.trim());
      } else {
        parsedValue = value;
      }

      // Validate the update
      const update = { [key]: parsedValue } as Partial<CCHighwayConfig>;
      const errors = validateConfig(update);

      if (errors.length > 0) {
        console.error(chalk.red("Configuration validation failed:"));
        errors.forEach(error => {
          console.error(chalk.red(`  ${error}`));
        });
        return;
      }

      // Update configuration
      await updateConfig(update);

      displaySuccessBox(
        "Configuration Updated",
        `${key} = ${JSON.stringify(parsedValue)}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      displayErrorBox("Configuration Error", message);
    }
  });

// Config get command
configCommand
  .command("get")
  .description("Get a configuration value")
  .argument("<key>", "Configuration key")
  .action(async (key: string) => {
    try {
      const config = await loadConfig();

      if (!(key in config)) {
        console.error(chalk.red(`Unknown configuration key: ${key}`));
        return;
      }

      const value = config[key as keyof CCHighwayConfig];
      console.log(chalk.blue(`${key}: ${JSON.stringify(value, null, 2)}`));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      displayErrorBox("Configuration Error", message);
    }
  });

// Config list command
configCommand
  .command("list")
  .description("List all configuration values")
  .action(async () => {
    try {
      const config = await loadConfig();

      const table = new Table({
        head: [chalk.cyan("Key"), chalk.cyan("Value"), chalk.cyan("Type")],
        colWidths: [25, 40, 15],
      });

      Object.entries(config).forEach(([key, value]) => {
        table.push([key, JSON.stringify(value), typeof value]);
      });

      console.log("\\nCurrent Configuration:");
      console.log(table.toString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      displayErrorBox("Configuration Error", message);
    }
  });

// Config reset command
configCommand
  .command("reset")
  .description("Reset configuration to defaults")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (options: { yes: boolean }) => {
    try {
      let confirmed = options.yes;

      if (!confirmed) {
        const answers = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirm",
            message:
              "Are you sure you want to reset all configuration to defaults?",
            default: false,
          },
        ]);
        confirmed = answers.confirm as boolean;
      }

      if (confirmed) {
        await resetConfig();
        displaySuccessBox(
          "Configuration Reset",
          "All configuration values have been reset to defaults"
        );
      } else {
        console.log(chalk.yellow("Configuration reset cancelled"));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      displayErrorBox("Configuration Error", message);
    }
  });

// Config edit command (interactive)
configCommand
  .command("edit")
  .description("Edit configuration interactively")
  .action(async () => {
    try {
      const config = await loadConfig();

      const choices = Object.keys(config).map(key => ({
        name: `${key}: ${JSON.stringify(config[key as keyof CCHighwayConfig])}`,
        value: key,
      }));

      const answers = await inquirer.prompt([
        {
          type: "list",
          name: "key",
          message: "Which configuration value would you like to edit?",
          choices: [
            ...choices,
            new inquirer.Separator(),
            { name: "Cancel", value: null },
          ],
        },
      ]);

      if (answers.key === null) {
        console.log(chalk.yellow("Configuration edit cancelled"));
        return;
      }

      const key = answers.key as string;
      const currentValue = config[key as keyof CCHighwayConfig];

      let newValueInput;
      if (typeof currentValue === "boolean") {
        newValueInput = await inquirer.prompt([
          {
            type: "confirm",
            name: "value",
            message: `New value for ${key}:`,
            default: currentValue,
          },
        ]);
      } else if (Array.isArray(currentValue)) {
        newValueInput = await inquirer.prompt([
          {
            type: "input",
            name: "value",
            message: `New value for ${key} (comma-separated):`,
            default: currentValue.join(", "),
          },
        ]);
      } else {
        newValueInput = await inquirer.prompt([
          {
            type: "input",
            name: "value",
            message: `New value for ${key}:`,
            default: String(currentValue),
          },
        ]);
      }

      let parsedValue: unknown = newValueInput.value;

      if (typeof currentValue === "number") {
        parsedValue = Number(newValueInput.value);
        if (isNaN(parsedValue as number)) {
          console.error(chalk.red("Invalid number value"));
          return;
        }
      } else if (Array.isArray(currentValue)) {
        parsedValue = (newValueInput.value as string)
          .split(",")
          .map(s => s.trim());
      }

      // Validate the update
      const update = { [key]: parsedValue } as Partial<CCHighwayConfig>;
      const errors = validateConfig(update);

      if (errors.length > 0) {
        console.error(chalk.red("Configuration validation failed:"));
        errors.forEach(error => {
          console.error(chalk.red(`  ${error}`));
        });
        return;
      }

      await updateConfig(update);

      displaySuccessBox(
        "Configuration Updated",
        `${key} = ${JSON.stringify(parsedValue)}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      displayErrorBox("Configuration Error", message);
    }
  });
