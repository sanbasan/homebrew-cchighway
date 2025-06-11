// CCHighway server implementation
import express from "express";
import cors from "cors";
import { Server } from "http";
import { logger } from "../utils/logger";
import { initializeRunner } from "../core/claude-runner";
import { requestLogger, errorHandler } from "./middleware";
import { apiRouter } from "./routes";
import {
  saveServerInfo,
  removeServerInfo,
  getServerStatus as getServerStatusImpl,
} from "../utils/server-info";

const app = express();
let serverInstance: Server | null = null;

export interface ServerOptions {
  port: number;
  workDir: string;
  daemon: boolean;
}

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get("/health", (_, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", apiRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

export const startServer = async (
  options: ServerOptions
): Promise<{ port: number; workDir: string }> => {
  // Initialize core modules
  await initializeRunner();

  return new Promise((resolve, reject) => {
    serverInstance = app.listen(options.port, "localhost", async () => {
      // Get version from package.json
      let version = "1.0.0";
      try {
        const packageJson = await import("../../package.json");
        version = packageJson.version;
      } catch {
        // Fallback version
      }

      // Save server info
      await saveServerInfo({
        port: options.port,
        workDir: options.workDir,
        pid: process.pid,
        startTime: new Date(),
        version,
      });

      logger.info(`CCHighway server started on port ${options.port}`, {
        port: options.port,
        workDir: options.workDir,
        daemon: options.daemon,
      });

      resolve({
        port: options.port,
        workDir: options.workDir,
      });
    });

    serverInstance.on("error", (error: Error) => {
      logger.error("Server failed to start:", error);
      reject(error);
    });
  });
};

export const stopServer = async (): Promise<boolean> => {
  if (serverInstance === null) {
    return false;
  }

  return new Promise(resolve => {
    if (serverInstance === null) {
      resolve(false);
      return;
    }

    serverInstance.close(async () => {
      // Remove server info file
      await removeServerInfo();

      logger.info("CCHighway server stopped");
      serverInstance = null;
      resolve(true);
    });
  });
};

export const getServerStatus = async (): Promise<{
  running: boolean;
  info?: {
    port: number;
    workDir: string;
    uptime: string;
    activeSessions: number;
  };
}> => {
  return getServerStatusImpl();
};

export { app };
