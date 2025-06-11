"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configCommand = void 0;
// Configuration commands
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const config_1 = require("../config");
const ui_1 = require("../ui");
exports.configCommand = new commander_1.Command().description("Manage configuration");
// Config set command
exports.configCommand
    .command("set")
    .description("Set a configuration value")
    .argument("<key>", "Configuration key")
    .argument("<value>", "Configuration value")
    .action(async (key, value) => {
    try {
        const config = await (0, config_1.loadConfig)();
        // Validate key exists
        if (!(key in config)) {
            console.error(chalk_1.default.red(`Unknown configuration key: ${key}`));
            console.log(chalk_1.default.yellow("Available keys:"));
            Object.keys(config).forEach(k => {
                console.log(chalk_1.default.gray(`  ${k}`));
            });
            return;
        }
        // Parse value based on the current type
        const currentValue = config[key];
        let parsedValue;
        if (typeof currentValue === "number") {
            parsedValue = Number(value);
            if (isNaN(parsedValue)) {
                console.error(chalk_1.default.red(`Value must be a number for key: ${key}`));
                return;
            }
        }
        else if (typeof currentValue === "boolean") {
            parsedValue = value.toLowerCase() === "true";
        }
        else if (Array.isArray(currentValue)) {
            parsedValue = value.split(",").map(s => s.trim());
        }
        else {
            parsedValue = value;
        }
        // Validate the update
        const update = { [key]: parsedValue };
        const errors = (0, config_1.validateConfig)(update);
        if (errors.length > 0) {
            console.error(chalk_1.default.red("Configuration validation failed:"));
            errors.forEach(error => {
                console.error(chalk_1.default.red(`  ${error}`));
            });
            return;
        }
        // Update configuration
        await (0, config_1.updateConfig)(update);
        (0, ui_1.displaySuccessBox)("Configuration Updated", `${key} = ${JSON.stringify(parsedValue)}`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        (0, ui_1.displayErrorBox)("Configuration Error", message);
    }
});
// Config get command
exports.configCommand
    .command("get")
    .description("Get a configuration value")
    .argument("<key>", "Configuration key")
    .action(async (key) => {
    try {
        const config = await (0, config_1.loadConfig)();
        if (!(key in config)) {
            console.error(chalk_1.default.red(`Unknown configuration key: ${key}`));
            return;
        }
        const value = config[key];
        console.log(chalk_1.default.blue(`${key}: ${JSON.stringify(value, null, 2)}`));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        (0, ui_1.displayErrorBox)("Configuration Error", message);
    }
});
// Config list command
exports.configCommand
    .command("list")
    .description("List all configuration values")
    .action(async () => {
    try {
        const config = await (0, config_1.loadConfig)();
        const table = new cli_table3_1.default({
            head: [chalk_1.default.cyan("Key"), chalk_1.default.cyan("Value"), chalk_1.default.cyan("Type")],
            colWidths: [25, 40, 15],
        });
        Object.entries(config).forEach(([key, value]) => {
            table.push([key, JSON.stringify(value), typeof value]);
        });
        console.log("\\nCurrent Configuration:");
        console.log(table.toString());
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        (0, ui_1.displayErrorBox)("Configuration Error", message);
    }
});
// Config reset command
exports.configCommand
    .command("reset")
    .description("Reset configuration to defaults")
    .option("-y, --yes", "Skip confirmation prompt")
    .action(async (options) => {
    try {
        let confirmed = options.yes;
        if (!confirmed) {
            const answers = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "confirm",
                    message: "Are you sure you want to reset all configuration to defaults?",
                    default: false,
                },
            ]);
            confirmed = answers.confirm;
        }
        if (confirmed) {
            await (0, config_1.resetConfig)();
            (0, ui_1.displaySuccessBox)("Configuration Reset", "All configuration values have been reset to defaults");
        }
        else {
            console.log(chalk_1.default.yellow("Configuration reset cancelled"));
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        (0, ui_1.displayErrorBox)("Configuration Error", message);
    }
});
// Config edit command (interactive)
exports.configCommand
    .command("edit")
    .description("Edit configuration interactively")
    .action(async () => {
    try {
        const config = await (0, config_1.loadConfig)();
        const choices = Object.keys(config).map(key => ({
            name: `${key}: ${JSON.stringify(config[key])}`,
            value: key,
        }));
        const answers = await inquirer_1.default.prompt([
            {
                type: "list",
                name: "key",
                message: "Which configuration value would you like to edit?",
                choices: [
                    ...choices,
                    new inquirer_1.default.Separator(),
                    { name: "Cancel", value: null },
                ],
            },
        ]);
        if (answers.key === null) {
            console.log(chalk_1.default.yellow("Configuration edit cancelled"));
            return;
        }
        const key = answers.key;
        const currentValue = config[key];
        let newValueInput;
        if (typeof currentValue === "boolean") {
            newValueInput = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "value",
                    message: `New value for ${key}:`,
                    default: currentValue,
                },
            ]);
        }
        else if (Array.isArray(currentValue)) {
            newValueInput = await inquirer_1.default.prompt([
                {
                    type: "input",
                    name: "value",
                    message: `New value for ${key} (comma-separated):`,
                    default: currentValue.join(", "),
                },
            ]);
        }
        else {
            newValueInput = await inquirer_1.default.prompt([
                {
                    type: "input",
                    name: "value",
                    message: `New value for ${key}:`,
                    default: String(currentValue),
                },
            ]);
        }
        let parsedValue = newValueInput.value;
        if (typeof currentValue === "number") {
            parsedValue = Number(newValueInput.value);
            if (isNaN(parsedValue)) {
                console.error(chalk_1.default.red("Invalid number value"));
                return;
            }
        }
        else if (Array.isArray(currentValue)) {
            parsedValue = newValueInput.value
                .split(",")
                .map(s => s.trim());
        }
        // Validate the update
        const update = { [key]: parsedValue };
        const errors = (0, config_1.validateConfig)(update);
        if (errors.length > 0) {
            console.error(chalk_1.default.red("Configuration validation failed:"));
            errors.forEach(error => {
                console.error(chalk_1.default.red(`  ${error}`));
            });
            return;
        }
        await (0, config_1.updateConfig)(update);
        (0, ui_1.displaySuccessBox)("Configuration Updated", `${key} = ${JSON.stringify(parsedValue)}`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        (0, ui_1.displayErrorBox)("Configuration Error", message);
    }
});
//# sourceMappingURL=config.js.map