// Express error handler middleware
import { Request, Response, NextFunction } from "express";
import { logger } from "../../utils/logger";

export interface ApiError extends Error {
  statusCode?: number;
  details?: unknown;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  _: NextFunction
): void => {
  const statusCode = error.statusCode ?? 500;
  const message =
    error.message !== "" ? error.message : "Internal Server Error";

  logger.error("API Error:", {
    method: req.method,
    url: req.url,
    statusCode,
    message,
    details: error.details,
    stack: error.stack,
  });

  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
    },
  });
};
