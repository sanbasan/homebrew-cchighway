import winston from "winston";
import chalk from "chalk";
import path from "path";
import fs from "fs-extra";

// Logger types
export type LogLevel = "error" | "warn" | "info" | "debug" | "verbose";

// Ensure log directory exists
const logDir = path.join(
  process.env.HOME ?? process.env.USERPROFILE ?? "",
  ".cchighway",
  "logs"
);
fs.ensureDirSync(logDir);

// Custom console format with colors
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const levelColors: Record<string, typeof chalk> = {
      error: chalk.red,
      warn: chalk.yellow,
      info: chalk.blue,
      debug: chalk.green,
      verbose: chalk.gray,
    };

    const formatMeta = (meta: Record<string, unknown>): string =>
      Object.keys(meta).length > 0
        ? "\n" + chalk.gray(JSON.stringify(meta, null, 2))
        : "";

    const colorize = levelColors[level] ?? chalk.white;
    const levelStr = colorize(`[${level.toUpperCase()}]`);

    return `${chalk.gray(timestamp)} ${levelStr} ${message}${formatMeta(meta)}`;
  })
);

// File format (no colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: (process.env.CCHIGHWAY_LOG_LEVEL as LogLevel) ?? "info",
  transports: [
    // Console transport
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    // File transport for errors only
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: fileFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
});

// Helper functions for common logging patterns
export const logError = (error: Error | unknown, context?: string): void => {
  const errorObj =
    error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : { error };

  logger.error(context ?? "Error occurred", errorObj);
};

export const logRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number
): void => {
  const level = statusCode >= 400 ? "warn" : "info";
  logger.log(level, `${method} ${path} ${statusCode} ${duration}ms`);
};

export const logSession = (
  sessionId: string,
  action: string,
  details?: unknown
): void => {
  logger.info(`Session ${sessionId}: ${action}`, details);
};

export const logProcess = (
  pid: number,
  action: string,
  details?: unknown
): void => {
  logger.debug(`Process ${pid}: ${action}`, details);
};

export default logger;
