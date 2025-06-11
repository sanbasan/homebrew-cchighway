"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionsRouter = void 0;
// Session management routes
const express_1 = require("express");
const session_1 = require("../../core/session");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
exports.sessionsRouter = router;
// GET /api/sessions - セッション一覧取得
router.get("/", async (_, res, next) => {
    try {
        const sessions = await (0, session_1.getAllSessions)();
        res.json({ sessions });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/sessions - 新規セッション作成
router.post("/", async (req, res, next) => {
    try {
        const { workDir } = req.body;
        const session = await (0, session_1.createNewSession)(workDir);
        logger_1.logger.info(`Created new session: ${session.id}`);
        res.status(201).json({ session });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/sessions/:id - セッション詳細取得
router.get("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const session = await (0, session_1.getSessionById)(id);
        if (session === null) {
            const error = new Error(`Session ${id} not found`);
            error.statusCode = 404;
            throw error;
        }
        res.json({ session });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/sessions/:id/history - セッション履歴全取得
router.get("/:id/history", async (req, res, next) => {
    try {
        const { id } = req.params;
        // セッションの存在確認
        const session = await (0, session_1.getSessionById)(id);
        if (session === null) {
            const error = new Error(`Session ${id} not found`);
            error.statusCode = 404;
            throw error;
        }
        // stream.jsonファイルから履歴を読み取り
        const { readSessionHistory } = await Promise.resolve().then(() => __importStar(require("../../utils/session-files")));
        const history = await readSessionHistory(id);
        res.json({
            sessionId: id,
            history,
        });
    }
    catch (error) {
        next(error);
    }
});
// DELETE /api/sessions/:id - セッション削除
router.delete("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        // セッションの存在確認
        const session = await (0, session_1.getSessionById)(id);
        if (session === null) {
            const error = new Error(`Session ${id} not found`);
            error.statusCode = 404;
            throw error;
        }
        // 実行中セッションは削除不可
        if (session.status === "running") {
            const error = new Error(`Cannot delete running session ${id}`);
            error.statusCode = 400;
            throw error;
        }
        await (0, session_1.removeSession)(id);
        logger_1.logger.info(`Deleted session: ${id}`);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=sessions.js.map