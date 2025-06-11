"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.displayWarningBox = exports.displayInfoBox = exports.displayErrorBox = exports.displaySuccessBox = exports.displayVersion = exports.displayLogo = void 0;
// CLI UI utilities
const figlet_1 = __importDefault(require("figlet"));
const chalk_1 = __importDefault(require("chalk"));
const boxen_1 = __importDefault(require("boxen"));
const fs_1 = require("fs");
const path_1 = require("path");
const displayLogo = () => {
    const logo = figlet_1.default.textSync("CCHighway", {
        font: "Standard",
        horizontalLayout: "default",
        verticalLayout: "default",
    });
    console.log(chalk_1.default.cyan(logo));
    console.log(chalk_1.default.gray("Claude Code Highway - Wrapper Tool\\n"));
};
exports.displayLogo = displayLogo;
const displayVersion = () => {
    try {
        const packageJsonPath = (0, path_1.join)(__dirname, "../../package.json");
        const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, "utf8"));
        return packageJson.version;
    }
    catch {
        return "1.0.0";
    }
};
exports.displayVersion = displayVersion;
const displaySuccessBox = (title, message) => {
    const content = chalk_1.default.green(`✓ ${title}\\n\\n${message}`);
    console.log((0, boxen_1.default)(content, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "green",
    }));
};
exports.displaySuccessBox = displaySuccessBox;
const displayErrorBox = (title, message) => {
    const content = chalk_1.default.red(`✗ ${title}\\n\\n${message}`);
    console.log((0, boxen_1.default)(content, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "red",
    }));
};
exports.displayErrorBox = displayErrorBox;
const displayInfoBox = (title, message) => {
    const content = chalk_1.default.blue(`ℹ ${title}\\n\\n${message}`);
    console.log((0, boxen_1.default)(content, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "blue",
    }));
};
exports.displayInfoBox = displayInfoBox;
const displayWarningBox = (title, message) => {
    const content = chalk_1.default.yellow(`⚠ ${title}\\n\\n${message}`);
    console.log((0, boxen_1.default)(content, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
    }));
};
exports.displayWarningBox = displayWarningBox;
//# sourceMappingURL=ui.js.map