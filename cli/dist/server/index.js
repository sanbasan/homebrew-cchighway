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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = exports.getServerStatus = exports.stopServer = exports.startServer = void 0;
// CCHighway server implementation
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const logger_1 = require("../utils/logger");
const claude_runner_1 = require("../core/claude-runner");
const middleware_1 = require("./middleware");
const routes_1 = require("./routes");
const server_info_1 = require("../utils/server-info");
const app = (0, express_1.default)();
exports.app = app;
let serverInstance = null;
// Basic middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(middleware_1.requestLogger);
// Health check
app.get("/health", (_, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// API routes
app.use("/api", routes_1.apiRouter);
// Error handling middleware (must be last)
app.use(middleware_1.errorHandler);
const startServer = async (options) => {
    // Initialize core modules
    await (0, claude_runner_1.initializeRunner)();
    return new Promise((resolve, reject) => {
        serverInstance = app.listen(options.port, "localhost", async () => {
            // Get version from package.json
            let version = "1.0.0";
            try {
                const packageJson = await Promise.resolve().then(() => __importStar(require("../../package.json")));
                version = packageJson.version;
            }
            catch {
                // Fallback version
            }
            // Save server info
            await (0, server_info_1.saveServerInfo)({
                port: options.port,
                workDir: options.workDir,
                pid: process.pid,
                startTime: new Date(),
                version,
            });
            logger_1.logger.info(`CCHighway server started on port ${options.port}`, {
                port: options.port,
                workDir: options.workDir,
                daemon: options.daemon,
            });
            resolve({
                port: options.port,
                workDir: options.workDir,
            });
        });
        serverInstance.on("error", (error) => {
            logger_1.logger.error("Server failed to start:", error);
            reject(error);
        });
    });
};
exports.startServer = startServer;
const stopServer = async () => {
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
            await (0, server_info_1.removeServerInfo)();
            logger_1.logger.info("CCHighway server stopped");
            serverInstance = null;
            resolve(true);
        });
    });
};
exports.stopServer = stopServer;
const getServerStatus = async () => {
    return (0, server_info_1.getServerStatus)();
};
exports.getServerStatus = getServerStatus;
//# sourceMappingURL=index.js.map