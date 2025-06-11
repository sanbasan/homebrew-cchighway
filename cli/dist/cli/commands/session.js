"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionCommand = void 0;
// Session management commands
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const session_1 = require("../../core/session");
const ui_1 = require("../ui");
exports.sessionCommand = new commander_1.Command().description("Manage sessions");
// Session list command
exports.sessionCommand
    .command("list")
    .description("List all sessions")
    .option("-a, --all", "Show all sessions including completed ones")
    .action(async (options) => {
    try {
        const sessions = await (0, session_1.listSessions)();
        if (sessions.length === 0) {
            (0, ui_1.displayInfoBox)("No Sessions", "No sessions found");
            return;
        }
        const filteredSessions = options.all
            ? sessions
            : sessions.filter(s => s.status !== "completed" && s.status !== "error");
        if (filteredSessions.length === 0) {
            (0, ui_1.displayInfoBox)("No Active Sessions", "No active sessions found. Use --all to see completed sessions.");
            return;
        }
        const table = new cli_table3_1.default({
            head: [
                chalk_1.default.cyan("ID"),
                chalk_1.default.cyan("Status"),
                chalk_1.default.cyan("Work Dir"),
                chalk_1.default.cyan("Created"),
                chalk_1.default.cyan("Updated"),
                chalk_1.default.cyan("Turns"),
            ],
            colWidths: [15, 12, 30, 12, 12, 8],
        });
        filteredSessions.forEach(session => {
            const statusColor = getStatusColor(session.status);
            table.push([
                session.id.substring(0, 12) + "...",
                statusColor(session.status),
                session.workDir.length > 25
                    ? "..." + session.workDir.substring(session.workDir.length - 25)
                    : session.workDir,
                formatDate(session.createdAt),
                formatDate(session.updatedAt),
                String(session.turnCount),
            ]);
        });
        console.log(`\\nSessions (${filteredSessions.length} total):`);
        console.log(table.toString());
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        (0, ui_1.displayErrorBox)("Session Error", message);
    }
});
// Session info command
exports.sessionCommand
    .command("info")
    .description("Show detailed session information")
    .argument("<id>", "Session ID (can be partial)")
    .action(async (id) => {
    try {
        const sessions = await (0, session_1.listSessions)();
        const session = sessions.find(s => s.id.startsWith(id));
        if (session === undefined) {
            console.error(chalk_1.default.red(`Session not found: ${id}`));
            return;
        }
        console.log(chalk_1.default.bold("\\nSession Information:"));
        console.log(`ID: ${chalk_1.default.blue(session.id)}`);
        console.log(`Status: ${getStatusColor(session.status)(session.status)}`);
        console.log(`Work Directory: ${chalk_1.default.blue(session.workDir)}`);
        console.log(`Created: ${chalk_1.default.blue(session.createdAt.toLocaleString())}`);
        console.log(`Updated: ${chalk_1.default.blue(session.updatedAt.toLocaleString())}`);
        console.log(`Turn Count: ${chalk_1.default.blue(session.turnCount)}`);
        if (session.lastPrompt !== null && session.lastPrompt !== undefined) {
            console.log(`Last Prompt: ${chalk_1.default.gray(truncateText(session.lastPrompt, 100))}`);
        }
        if (session.totalCost !== undefined) {
            console.log(`Total Cost: ${chalk_1.default.green(`$${session.totalCost.toFixed(4)}`)}`);
        }
        if (session.claudeSessionId !== null &&
            session.claudeSessionId !== undefined) {
            console.log(`Claude Session ID: ${chalk_1.default.blue(session.claudeSessionId)}`);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        (0, ui_1.displayErrorBox)("Session Error", message);
    }
});
// Session clean command
exports.sessionCommand
    .command("clean")
    .description("Clean up old completed sessions")
    .option("-d, --days <days>", "Cleanup sessions older than N days", "30")
    .option("-y, --yes", "Skip confirmation prompt")
    .action(async (options) => {
    try {
        const days = parseInt(options.days, 10);
        if (isNaN(days) || days < 1) {
            console.error(chalk_1.default.red("Days must be a positive number"));
            return;
        }
        const maxAgeMs = days * 24 * 60 * 60 * 1000;
        let confirmed = options.yes;
        if (!confirmed) {
            const answers = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "confirm",
                    message: `Clean up sessions older than ${days} days?`,
                    default: false,
                },
            ]);
            confirmed = answers.confirm;
        }
        if (confirmed) {
            const cleaned = await (0, session_1.cleanupSessions)(maxAgeMs);
            (0, ui_1.displaySuccessBox)("Sessions Cleaned", cleaned > 0
                ? `Cleaned up ${cleaned} old sessions`
                : "No old sessions found to clean up");
        }
        else {
            console.log(chalk_1.default.yellow("Session cleanup cancelled"));
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        (0, ui_1.displayErrorBox)("Session Error", message);
    }
});
// Session delete command
exports.sessionCommand
    .command("delete")
    .description("Delete a specific session")
    .argument("<id>", "Session ID (can be partial)")
    .option("-y, --yes", "Skip confirmation prompt")
    .action(async (id, options) => {
    try {
        const sessions = await (0, session_1.listSessions)();
        const session = sessions.find(s => s.id.startsWith(id));
        if (session === undefined) {
            console.error(chalk_1.default.red(`Session not found: ${id}`));
            return;
        }
        let confirmed = options.yes;
        if (!confirmed) {
            const answers = await inquirer_1.default.prompt([
                {
                    type: "confirm",
                    name: "confirm",
                    message: `Delete session ${session.id}?`,
                    default: false,
                },
            ]);
            confirmed = answers.confirm;
        }
        if (confirmed) {
            await (0, session_1.deleteSession)(session.id);
            (0, ui_1.displaySuccessBox)("Session Deleted", `Session ${session.id} has been deleted`);
        }
        else {
            console.log(chalk_1.default.yellow("Session deletion cancelled"));
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        (0, ui_1.displayErrorBox)("Session Error", message);
    }
});
// Helper functions
const getStatusColor = (status) => {
    switch (status) {
        case "running":
            return chalk_1.default.green;
        case "idle":
            return chalk_1.default.blue;
        case "error":
            return chalk_1.default.red;
        case "completed":
            return chalk_1.default.gray;
        default:
            return chalk_1.default.white;
    }
};
const formatDate = (date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
        return "Today";
    }
    else if (diffDays === 1) {
        return "Yesterday";
    }
    else if (diffDays < 7) {
        return `${diffDays}d ago`;
    }
    else {
        return date.toLocaleDateString();
    }
};
const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) {
        return text;
    }
    return text.substring(0, maxLength) + "...";
};
//# sourceMappingURL=session.js.map