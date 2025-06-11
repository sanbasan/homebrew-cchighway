"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusRouter = void 0;
// Status and monitoring routes
const express_1 = require("express");
const session_1 = require("../../core/session");
const file_watcher_1 = require("../../core/file-watcher");
const stream_parser_1 = require("../../core/stream-parser");
const router = (0, express_1.Router)();
exports.statusRouter = router;
// GET /api/status - サーバ状態取得
router.get("/", async (_, res, next) => {
    try {
        const [allSessions, activeSessionCount, watcherStates, parserStats] = await Promise.all([
            (0, session_1.getAllSessions)(),
            (0, session_1.getActiveSessionCount)(),
            Promise.resolve((0, file_watcher_1.getAllWatcherStates)()),
            Promise.resolve((0, stream_parser_1.getAllParserStats)()),
        ]);
        const totalSessions = allSessions.length;
        const completedSessions = allSessions.filter(s => s.status === "completed").length;
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
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=status.js.map