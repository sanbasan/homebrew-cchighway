import { StreamData } from "../../types";
export interface ParsedStreamLine {
    data: StreamData;
    lineNumber: number;
    timestamp: Date;
}
export interface ParserStats {
    totalLines: number;
    validLines: number;
    invalidLines: number;
    lastProcessedLine: number;
    startTime: Date;
    lastUpdateTime: Date;
}
export type ParseErrorType = "invalid_json" | "missing_fields" | "unknown_type";
export interface ParseError {
    type: ParseErrorType;
    line: number;
    content: string;
    error: string;
    timestamp: Date;
}
//# sourceMappingURL=types.d.ts.map