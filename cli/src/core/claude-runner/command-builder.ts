// Claude command builder
import { ClaudeRunnerOptions } from "./types";
import { findClaudeCode } from "../../utils/paths";
import { logger } from "../../utils/logger";

// Command builder state
let claudePath: string | null = null;
let initialized = false;

export const initializeCommandBuilder = async (): Promise<void> => {
  if (initialized) return;

  claudePath = await findClaudeCode();
  if (claudePath === null) {
    throw new Error(
      "Claude Code executable not found. Please install Claude Code or set CLAUDE_CODE_PATH environment variable."
    );
  }
  logger.info(`Using Claude Code at: ${claudePath}`);
  initialized = true;
};

export const buildCommand = (options: ClaudeRunnerOptions): string[] => {
  if (claudePath === null || initialized === false) {
    throw new Error("CommandBuilder not initialized");
  }

  const args: string[] = [
    claudePath,
    "-p",
    options.prompt,
    "--output-format",
    "stream-json",
    "--dangerously-skip-permissions",
  ];

  // Add resume flag if continuing existing session
  if (options.resumeSessionId !== undefined) {
    args.push("--resume", options.resumeSessionId);
  }

  return args;
};

export const getClaudePath = (): string | null => {
  return claudePath;
};
