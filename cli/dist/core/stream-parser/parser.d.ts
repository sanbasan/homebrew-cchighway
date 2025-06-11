import { StreamData } from "../../types";
import { ParsedStreamLine, ParserStats, ParseError } from "./types";
export declare const initializeParser: (sessionId: string) => void;
export declare const parseStreamLine: (sessionId: string, line: string, lineNumber: number) => ParsedStreamLine | ParseError;
export declare const parseStreamLines: (sessionId: string, lines: string[], startLineNumber?: number) => {
    parsed: ParsedStreamLine[];
    errors: ParseError[];
};
export declare const getParserStats: (sessionId: string) => ParserStats | null;
export declare const cleanupParser: (sessionId: string) => void;
export declare const getAllParserStats: () => Record<string, ParserStats>;
export declare const validateStreamData: (data: unknown) => data is StreamData;
export declare const extractSessionId: (line: string) => string | null;
//# sourceMappingURL=parser.d.ts.map