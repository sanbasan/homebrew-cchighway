// Routes aggregation
import { Router } from "express";
import { sessionsRouter } from "./sessions";
import { executeRouter } from "./execute";
import { statusRouter } from "./status";

const apiRouter = Router();

// Mount routes
apiRouter.use("/sessions", sessionsRouter);
apiRouter.use("/", executeRouter); // /api/execute
apiRouter.use("/status", statusRouter);

export { apiRouter };
