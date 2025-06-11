"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../../utils/logger");
const errorHandler = (error, req, res, _) => {
    const statusCode = error.statusCode ?? 500;
    const message = error.message !== "" ? error.message : "Internal Server Error";
    logger_1.logger.error("API Error:", {
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
exports.errorHandler = errorHandler;
//# sourceMappingURL=error-handler.js.map