"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRouter = void 0;
// Routes aggregation
const express_1 = require("express");
const sessions_1 = require("./sessions");
const execute_1 = require("./execute");
const status_1 = require("./status");
const apiRouter = (0, express_1.Router)();
exports.apiRouter = apiRouter;
// Mount routes
apiRouter.use("/sessions", sessions_1.sessionsRouter);
apiRouter.use("/", execute_1.executeRouter); // /api/execute
apiRouter.use("/status", status_1.statusRouter);
//# sourceMappingURL=index.js.map