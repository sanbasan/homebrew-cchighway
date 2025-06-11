// Session management routes
import { Router } from "express";
import {
  createNewSession,
  getSessionById,
  getAllSessions,
  removeSession,
} from "../../core/session";
import { logger } from "../../utils/logger";
import { ApiError } from "../middleware/error-handler";

const router = Router();

// GET /api/sessions - セッション一覧取得
router.get("/", async (_, res, next) => {
  try {
    const sessions = await getAllSessions();
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
});

// POST /api/sessions - 新規セッション作成
router.post("/", async (req, res, next) => {
  try {
    const { workDir } = req.body as { workDir?: string };
    const session = await createNewSession(workDir);

    logger.info(`Created new session: ${session.id}`);
    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id - セッション詳細取得
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await getSessionById(id);

    if (session === null) {
      const error: ApiError = new Error(`Session ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    res.json({ session });
  } catch (error) {
    next(error);
  }
});

// GET /api/sessions/:id/history - セッション履歴全取得
router.get("/:id/history", async (req, res, next) => {
  try {
    const { id } = req.params;

    // セッションの存在確認
    const session = await getSessionById(id);
    if (session === null) {
      const error: ApiError = new Error(`Session ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    // stream.jsonファイルから履歴を読み取り
    const { readSessionHistory } = await import("../../utils/session-files");
    const history = await readSessionHistory(id);

    res.json({
      sessionId: id,
      history,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/sessions/:id - セッション削除
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // セッションの存在確認
    const session = await getSessionById(id);
    if (session === null) {
      const error: ApiError = new Error(`Session ${id} not found`);
      error.statusCode = 404;
      throw error;
    }

    // 実行中セッションは削除不可
    if (session.status === "running") {
      const error: ApiError = new Error(`Cannot delete running session ${id}`);
      error.statusCode = 400;
      throw error;
    }

    await removeSession(id);
    logger.info(`Deleted session: ${id}`);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as sessionsRouter };
