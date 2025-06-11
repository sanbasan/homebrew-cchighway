"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServerStatus = exports.stopServer = exports.startServer = void 0;
// Server management commands
const config_1 = require("../config");
const server_1 = require("../../server");
const startServer = async (options) => {
    await (0, config_1.loadConfig)();
    // Validate port
    if (options.port < 1 || options.port > 65535) {
        throw new Error("Port must be between 1 and 65535");
    }
    return (0, server_1.startServer)(options);
};
exports.startServer = startServer;
const stopServer = async () => {
    return (0, server_1.stopServer)();
};
exports.stopServer = stopServer;
const getServerStatus = async () => {
    return (0, server_1.getServerStatus)();
};
exports.getServerStatus = getServerStatus;
//# sourceMappingURL=server.js.map