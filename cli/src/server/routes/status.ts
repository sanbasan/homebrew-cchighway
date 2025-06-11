// Status and monitoring routes
import { Router } from "express";
import { getAllSessions, getActiveSessionCount } from "../../core/session";
import { getAllWatcherStates } from "../../core/file-watcher";
import { getAllParserStats } from "../../core/stream-parser";

const router = Router();

// GET /api/status - サーバ状態取得
router.get("/", async (_, res, next) => {
  try {
    const [allSessions, activeSessionCount, watcherStates, parserStats] =
      await Promise.all([
        getAllSessions(),
        getActiveSessionCount(),
        Promise.resolve(getAllWatcherStates()),
        Promise.resolve(getAllParserStats()),
      ]);

    const totalSessions = allSessions.length;
    const completedSessions = allSessions.filter(
      s => s.status === "completed"
    ).length;
    const errorSessions = allSessions.filter(s => s.status === "error").length;

    res.json({
      server: {
        status: "running",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      sessions: {
        total: totalSessions,
        active: activeSessionCount,
        completed: completedSessions,
        error: errorSessions,
      },
      watchers: {
        active: Object.keys(watcherStates).length,
        states: watcherStates,
      },
      parsers: {
        active: Object.keys(parserStats).length,
        stats: parserStats,
      },
      memory: {
        usage: process.memoryUsage(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as statusRouter };
