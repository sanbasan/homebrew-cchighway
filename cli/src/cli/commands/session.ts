// Session management commands
import { Command } from "commander";
import chalk from "chalk";
import inquirer from "inquirer";
import Table from "cli-table3";
import {
  listSessions,
  deleteSession,
  cleanupSessions,
} from "../../core/session";
import { displaySuccessBox, displayErrorBox, displayInfoBox } from "../ui";

export const sessionCommand = new Command().description(
  "Manage sessions"
);

// Session list command
sessionCommand
  .command("list")
  .description("List all sessions")
  .option("-a, --all", "Show all sessions including completed ones")
  .action(async (options: { all: boolean }) => {
    try {
      const sessions = await listSessions();

      if (sessions.length === 0) {
        displayInfoBox("No Sessions", "No sessions found");
        return;
      }

      const filteredSessions = options.all
        ? sessions
        : sessions.filter(
            s => s.status !== "completed" && s.status !== "error"
          );

      if (filteredSessions.length === 0) {
        displayInfoBox(
          "No Active Sessions",
          "No active sessions found. Use --all to see completed sessions."
        );
        return;
      }

      const table = new Table({
        head: [
          chalk.cyan("ID"),
          chalk.cyan("Status"),
          chalk.cyan("Work Dir"),
          chalk.cyan("Created"),
          chalk.cyan("Updated"),
          chalk.cyan("Turns"),
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      displayErrorBox("Session Error", message);
    }
  });

// Session info command
sessionCommand
  .command("info")
  .description("Show detailed session information")
  .argument("<id>", "Session ID (can be partial)")
  .action(async (id: string) => {
    try {
      const sessions = await listSessions();
      const session = sessions.find(s => s.id.startsWith(id));

      if (session === undefined) {
        console.error(chalk.red(`Session not found: ${id}`));
        return;
      }

      console.log(chalk.bold("\\nSession Information:"));
      console.log(`ID: ${chalk.blue(session.id)}`);
      console.log(`Status: ${getStatusColor(session.status)(session.status)}`);
      console.log(`Work Directory: ${chalk.blue(session.workDir)}`);
      console.log(`Created: ${chalk.blue(session.createdAt.toLocaleString())}`);
      console.log(`Updated: ${chalk.blue(session.updatedAt.toLocaleString())}`);
      console.log(`Turn Count: ${chalk.blue(session.turnCount)}`);

      if (session.lastPrompt !== null && session.lastPrompt !== undefined) {
        console.log(
          `Last Prompt: ${chalk.gray(truncateText(session.lastPrompt, 100))}`
        );
      }

      if (session.totalCost !== undefined) {
        console.log(
          `Total Cost: ${chalk.green(`$${session.totalCost.toFixed(4)}`)}`
        );
      }

      if (
        session.claudeSessionId !== null &&
        session.claudeSessionId !== undefined
      ) {
        console.log(
          `Claude Session ID: ${chalk.blue(session.claudeSessionId)}`
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      displayErrorBox("Session Error", message);
    }
  });

// Session clean command
sessionCommand
  .command("clean")
  .description("Clean up old completed sessions")
  .option("-d, --days <days>", "Cleanup sessions older than N days", "30")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (options: { days: string; yes: boolean }) => {
    try {
      const days = parseInt(options.days, 10);
      if (isNaN(days) || days < 1) {
        console.error(chalk.red("Days must be a positive number"));
        return;
      }

      const maxAgeMs = days * 24 * 60 * 60 * 1000;
      let confirmed = options.yes;

      if (!confirmed) {
        const answers = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirm",
            message: `Clean up sessions older than ${days} days?`,
            default: false,
          },
        ]);
        confirmed = answers.confirm as boolean;
      }

      if (confirmed) {
        const cleaned = await cleanupSessions(maxAgeMs);
        displaySuccessBox(
          "Sessions Cleaned",
          cleaned > 0
            ? `Cleaned up ${cleaned} old sessions`
            : "No old sessions found to clean up"
        );
      } else {
        console.log(chalk.yellow("Session cleanup cancelled"));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      displayErrorBox("Session Error", message);
    }
  });

// Session delete command
sessionCommand
  .command("delete")
  .description("Delete a specific session")
  .argument("<id>", "Session ID (can be partial)")
  .option("-y, --yes", "Skip confirmation prompt")
  .action(async (id: string, options: { yes: boolean }) => {
    try {
      const sessions = await listSessions();
      const session = sessions.find(s => s.id.startsWith(id));

      if (session === undefined) {
        console.error(chalk.red(`Session not found: ${id}`));
        return;
      }

      let confirmed = options.yes;

      if (!confirmed) {
        const answers = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirm",
            message: `Delete session ${session.id}?`,
            default: false,
          },
        ]);
        confirmed = answers.confirm as boolean;
      }

      if (confirmed) {
        await deleteSession(session.id);
        displaySuccessBox(
          "Session Deleted",
          `Session ${session.id} has been deleted`
        );
      } else {
        console.log(chalk.yellow("Session deletion cancelled"));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      displayErrorBox("Session Error", message);
    }
  });

// Helper functions
const getStatusColor = (status: string): ((text: string) => string) => {
  switch (status) {
    case "running":
      return chalk.green;
    case "idle":
      return chalk.blue;
    case "error":
      return chalk.red;
    case "completed":
      return chalk.gray;
    default:
      return chalk.white;
  }
};

const formatDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
};
