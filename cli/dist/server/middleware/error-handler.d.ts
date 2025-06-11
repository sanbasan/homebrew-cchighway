import { Request, Response, NextFunction } from "express";
export interface ApiError extends Error {
    statusCode?: number;
    details?: unknown;
}
export declare const errorHandler: (error: ApiError, req: Request, res: Response, _: NextFunction) => void;
//# sourceMappingURL=error-handler.d.ts.map