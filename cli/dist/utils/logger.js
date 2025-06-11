"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logProcess = exports.logSession = exports.logRequest = exports.logError = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const chalk_1 = __importDefault(require("chalk"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
// Ensure log directory exists
const logDir = path_1.default.join(process.env.HOME ?? process.env.USERPROFILE ?? "", ".cchighway", "logs");
fs_extra_1.default.ensureDirSync(logDir);
// Custom console format with colors
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    const levelColors = {
        error: chalk_1.default.red,
        warn: chalk_1.default.yellow,
        info: chalk_1.default.blue,
        debug: chalk_1.default.green,
        verbose: chalk_1.default.gray,
    };
    const formatMeta = (meta) => Object.keys(meta).length > 0
        ? "\n" + chalk_1.default.gray(JSON.stringify(meta, null, 2))
        : "";
    const colorize = levelColors[level] ?? chalk_1.default.white;
    const levelStr = colorize(`[${level.toUpperCase()}]`);
    return `${chalk_1.default.gray(timestamp)} ${levelStr} ${message}${formatMeta(meta)}`;
}));
// File format (no colors)
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json());
// Create logger instance
exports.logger = winston_1.default.createLogger({
    level: process.env.CCHIGHWAY_LOG_LEVEL ?? "info",
    transports: [
        // Console transport
        new winston_1.default.transports.Console({
            format: consoleFormat,
        }),
        // File transport for all logs
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, "combined.log"),
            format: fileFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
        // File transport for errors only
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, "error.log"),
            level: "error",
            format: fileFormat,
            maxsize: 10 * 1024 * 1024, // 10MB
            maxFiles: 5,
        }),
    ],
});
// Helper functions for common logging patterns
const logError = (error, context) => {
    const errorObj = error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
        }
        : { error };
    exports.logger.error(context ?? "Error occurred", errorObj);
};
exports.logError = logError;
const logRequest = (method, path, statusCode, duration) => {
    const level = statusCode >= 400 ? "warn" : "info";
    exports.logger.log(level, `${method} ${path} ${statusCode} ${duration}ms`);
};
exports.logRequest = logRequest;
const logSession = (sessionId, action, details) => {
    exports.logger.info(`Session ${sessionId}: ${action}`, details);
};
exports.logSession = logSession;
const logProcess = (pid, action, details) => {
    exports.logger.debug(`Process ${pid}: ${action}`, details);
};
exports.logProcess = logProcess;
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map