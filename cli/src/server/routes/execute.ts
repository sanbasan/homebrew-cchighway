// Execution routes
import { Router } from "express";
import {
  executeClaudeCode,
  stopClaudeCode,
  isClaudeCodeRunning,
} from "../../core/claude-runner";
import { getSessionById } from "../../core/session";
import { logger } from "../../utils/logger";
import { ApiError } from "../middleware/error-handler";

const router = Router();

// POST /api/execute - 新規実行（新セッション作成）
router.post("/", async (req, res, next) => {
  try {
    const { prompt, workDir } = req.body as {
      prompt: string;
      workDir?: string;
    };

    if (prompt === undefined || prompt.trim() === "") {
      const error: ApiError = new Error("Prompt is required");
      error.statusCode = 400;
      throw error;
    }

    const result = await executeClaudeCode({
      prompt,
      workDir,
    });

    logger.info(
      `Started new execution: session ${result.sessionId}, process ${result.processId}`
    );
    res.status(201).json({
      sessionId: result.sessionId,
      processId: result.processId,
      status: "running",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/:id/execute - セッションにリクエスト送信
router.post("/:id/execute", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prompt } = req.body as { prompt: string };

    if (prompt === undefined || prompt.trim() === "") {
      const error: ApiError = new Error("Prompt is required");
      error.statusCode = 400;
      throw error;
    }

    // セッション存在確認
    const session = await getSessionById(id);
    if (session === null) {
      const error: ApiError = new Error(`Session ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    // 実行中チェック
    if (isClaudeCodeRunning(id)) {
      const error: ApiError = new Error(`Session ${id} is already running`);
      error.statusCode = 409;
      throw error;
    }

    const result = await executeClaudeCode({
      prompt,
      sessionId: id,
    });

    logger.info(
      `Continued execution: session ${result.sessionId}, process ${result.processId}`
    );
    res.json({
      sessionId: result.sessionId,
      processId: result.processId,
      status: "running",
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions/:id/stop - 実行停止
router.post("/:id/stop", async (req, res, next) => {
  try {
    const { id } = req.params;

    // セッション存在確認
    const session = await getSessionById(id);
    if (session === null) {
      const error: ApiError = new Error(`Session ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    const stopped = await stopClaudeCode(id);

    if (stopped) {
      logger.info(`Stopped execution for session: ${id}`);
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
  } catch (error) {
    next(error);
  }
});

export { router as executeRouter };
