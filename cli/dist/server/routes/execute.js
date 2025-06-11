"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeRouter = void 0;
// Execution routes
const express_1 = require("express");
const claude_runner_1 = require("../../core/claude-runner");
const session_1 = require("../../core/session");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
exports.executeRouter = router;
// POST /api/execute - 新規実行（新セッション作成）
router.post("/", async (req, res, next) => {
    try {
        const { prompt, workDir } = req.body;
        if (prompt === undefined || prompt.trim() === "") {
            const error = new Error("Prompt is required");
            error.statusCode = 400;
            throw error;
        }
        const result = await (0, claude_runner_1.executeClaudeCode)({
            prompt,
            workDir,
        });
        logger_1.logger.info(`Started new execution: session ${result.sessionId}, process ${result.processId}`);
        res.status(201).json({
            sessionId: result.sessionId,
            processId: result.processId,
            status: "running",
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/sessions/:id/execute - セッションにリクエスト送信
router.post("/:id/execute", async (req, res, next) => {
    try {
        const { id } = req.params;
        const { prompt } = req.body;
        if (prompt === undefined || prompt.trim() === "") {
            const error = new Error("Prompt is required");
            error.statusCode = 400;
            throw error;
        }
        // セッション存在確認
        const session = await (0, session_1.getSessionById)(id);
        if (session === null) {
            const error = new Error(`Session ${id} not found`);
            error.statusCode = 404;
            throw error;
        }
        // 実行中チェック
        if ((0, claude_runner_1.isClaudeCodeRunning)(id)) {
            const error = new Error(`Session ${id} is already running`);
            error.statusCode = 409;
            throw error;
        }
        const result = await (0, claude_runner_1.executeClaudeCode)({
            prompt,
            sessionId: id,
        });
        logger_1.logger.info(`Continued execution: session ${result.sessionId}, process ${result.processId}`);
        res.json({
            sessionId: result.sessionId,
            processId: result.processId,
            status: "running",
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/sessions/:id/stop - 実行停止
router.post("/:id/stop", async (req, res, next) => {
    try {
        const { id } = req.params;
        // セッション存在確認
        const session = await (0, session_1.getSessionById)(id);
        if (session === null) {
            const error = new Error(`Session ${id} not found`);
            error.statusCode = 404;
            throw error;
        }
        const stopped = await (0, claude_runner_1.stopClaudeCode)(id);
        if (stopped) {
            logger_1.logger.info(`Stopped execution for session: ${id}`);
            res.json({
                sessionId: id,
                status: "stopped",
            });
            return;
        }
        res.json({
            sessionId: id,
            status: "not_running",
        });
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=execute.js.map