"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractSessionId = exports.validateStreamData = exports.getAllParserStats = exports.cleanupParser = exports.getParserStats = exports.parseStreamLines = exports.parseStreamLine = exports.initializeParser = void 0;
// import { logger } from "../../utils/logger"; // TODO: Add logging when needed
// Parser state
const parserStats = new Map();
const initializeParser = (sessionId) => {
    parserStats.set(sessionId, {
        totalLines: 0,
        validLines: 0,
        invalidLines: 0,
        lastProcessedLine: 0,
        startTime: new Date(),
        lastUpdateTime: new Date(),
    });
};
exports.initializeParser = initializeParser;
const parseStreamLine = (sessionId, line, lineNumber) => {
    const stats = parserStats.get(sessionId);
    if (stats === undefined) {
        throw new Error(`Parser not initialized for session ${sessionId}`);
    }
    stats.totalLines++;
    stats.lastProcessedLine = lineNumber;
    stats.lastUpdateTime = new Date();
    // Skip empty lines
    if (line.trim() === "") {
        return createParseError("invalid_json", lineNumber, line, "Empty line");
    }
    try {
        const data = JSON.parse(line);
        // Validate required fields
        if (data.type === undefined ||
            data.session_id === undefined ||
            data.session_id === "") {
            stats.invalidLines++;
            return createParseError("missing_fields", lineNumber, line, "Missing required fields: type or session_id");
        }
        // Validate type
        if (!["assistant", "user", "result"].includes(data.type)) {
            stats.invalidLines++;
            return createParseError("unknown_type", lineNumber, line, `Unknown type: ${data.type}`);
        }
        stats.validLines++;
        return {
            data,
            lineNumber,
            timestamp: new Date(),
        };
    }
    catch (error) {
        stats.invalidLines++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return createParseError("invalid_json", lineNumber, line, errorMessage);
    }
};
exports.parseStreamLine = parseStreamLine;
const parseStreamLines = (sessionId, lines, startLineNumber = 1) => {
    const parsed = [];
    const errors = [];
    lines.forEach((line, index) => {
        const lineNumber = startLineNumber + index;
        const result = (0, exports.parseStreamLine)(sessionId, line, lineNumber);
        if ("data" in result) {
            parsed.push(result);
        }
        else {
            errors.push(result);
        }
    });
    return { parsed, errors };
};
exports.parseStreamLines = parseStreamLines;
const getParserStats = (sessionId) => {
    return parserStats.get(sessionId) ?? null;
};
exports.getParserStats = getParserStats;
const cleanupParser = (sessionId) => {
    parserStats.delete(sessionId);
};
exports.cleanupParser = cleanupParser;
const getAllParserStats = () => {
    const stats = {};
    for (const [sessionId, stat] of parserStats) {
        stats[sessionId] = stat;
    }
    return stats;
};
exports.getAllParserStats = getAllParserStats;
// Helper functions
const createParseError = (type, line, content, error) => {
    return {
        type,
        line,
        content: content.length > 200 ? content.substring(0, 200) + "..." : content,
        error,
        timestamp: new Date(),
    };
};
// Validation helpers
const validateStreamData = (data) => {
    if (data === null || data === undefined || typeof data !== "object") {
        return false;
    }
    // Type guard to ensure data has necessary structure
    const typedData = data;
    // Required fields
    if (typedData.type === undefined ||
        typedData.session_id === undefined ||
        (typeof typedData.session_id === "string" && typedData.session_id === "")) {
        return false;
    }
    // Type validation
    if (!["assistant", "user", "result"].includes(typedData.type)) {
        return false;
    }
    // Type-specific validation
    if (typedData.type === "result") {
        // Result type should have subtype and result fields
        if (typedData.subtype === undefined ||
            typedData.subtype === "" ||
            typeof typedData.result !== "string") {
            return false;
        }
    }
    else {
        // Assistant/user types should have message field
        if (typedData.message === undefined || typedData.message === null) {
            return false;
        }
    }
    return true;
};
exports.validateStreamData = validateStreamData;
const extractSessionId = (line) => {
    try {
        const data = JSON.parse(line);
        return data.session_id ?? null;
    }
    catch {
        return null;
    }
};
exports.extractSessionId = extractSessionId;
//# sourceMappingURL=parser.js.map