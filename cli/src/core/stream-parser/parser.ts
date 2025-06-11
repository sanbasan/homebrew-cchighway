// Stream parser implementation
import { StreamData } from "../../types";
import {
  ParsedStreamLine,
  ParserStats,
  ParseError,
  ParseErrorType,
} from "./types";
// import { logger } from "../../utils/logger"; // TODO: Add logging when needed

// Parser state
const parserStats = new Map<string, ParserStats>();

export const initializeParser = (sessionId: string): void => {
  parserStats.set(sessionId, {
    totalLines: 0,
    validLines: 0,
    invalidLines: 0,
    lastProcessedLine: 0,
    startTime: new Date(),
    lastUpdateTime: new Date(),
  });
};

export const parseStreamLine = (
  sessionId: string,
  line: string,
  lineNumber: number
): ParsedStreamLine | ParseError => {
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
    const data = JSON.parse(line) as StreamData;

    // Validate required fields
    if (
      data.type === undefined ||
      data.session_id === undefined ||
      data.session_id === ""
    ) {
      stats.invalidLines++;
      return createParseError(
        "missing_fields",
        lineNumber,
        line,
        "Missing required fields: type or session_id"
      );
    }

    // Validate type
    if (!["assistant", "user", "result"].includes(data.type)) {
      stats.invalidLines++;
      return createParseError(
        "unknown_type",
        lineNumber,
        line,
        `Unknown type: ${data.type}`
      );
    }

    stats.validLines++;
    return {
      data,
      lineNumber,
      timestamp: new Date(),
    };
  } catch (error) {
    stats.invalidLines++;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return createParseError("invalid_json", lineNumber, line, errorMessage);
  }
};

export const parseStreamLines = (
  sessionId: string,
  lines: string[],
  startLineNumber: number = 1
): {
  parsed: ParsedStreamLine[];
  errors: ParseError[];
} => {
  const parsed: ParsedStreamLine[] = [];
  const errors: ParseError[] = [];

  lines.forEach((line, index) => {
    const lineNumber = startLineNumber + index;
    const result = parseStreamLine(sessionId, line, lineNumber);

    if ("data" in result) {
      parsed.push(result);
    } else {
      errors.push(result);
    }
  });

  return { parsed, errors };
};

export const getParserStats = (sessionId: string): ParserStats | null => {
  return parserStats.get(sessionId) ?? null;
};

export const cleanupParser = (sessionId: string): void => {
  parserStats.delete(sessionId);
};

export const getAllParserStats = (): Record<string, ParserStats> => {
  const stats: Record<string, ParserStats> = {};
  for (const [sessionId, stat] of parserStats) {
    stats[sessionId] = stat;
  }
  return stats;
};

// Helper functions
const createParseError = (
  type: ParseErrorType,
  line: number,
  content: string,
  error: string
): ParseError => {
  return {
    type,
    line,
    content: content.length > 200 ? content.substring(0, 200) + "..." : content,
    error,
    timestamp: new Date(),
  };
};

// Validation helpers
export const validateStreamData = (data: unknown): data is StreamData => {
  if (data === null || data === undefined || typeof data !== "object") {
    return false;
  }

  // Type guard to ensure data has necessary structure
  const typedData = data as Record<string, unknown>;

  // Required fields
  if (
    typedData.type === undefined ||
    typedData.session_id === undefined ||
    (typeof typedData.session_id === "string" && typedData.session_id === "")
  ) {
    return false;
  }

  // Type validation
  if (
    !(["assistant", "user", "result"] as string[]).includes(
      typedData.type as string
    )
  ) {
    return false;
  }

  // Type-specific validation
  if (typedData.type === "result") {
    // Result type should have subtype and result fields
    if (
      typedData.subtype === undefined ||
      typedData.subtype === "" ||
      typeof typedData.result !== "string"
    ) {
      return false;
    }
  } else {
    // Assistant/user types should have message field
    if (typedData.message === undefined || typedData.message === null) {
      return false;
    }
  }

  return true;
};

export const extractSessionId = (line: string): string | null => {
  try {
    const data = JSON.parse(line) as Record<string, unknown>;
    return (data.session_id as string) ?? null;
  } catch {
    return null;
  }
};
