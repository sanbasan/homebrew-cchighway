"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVersionWithBuild = exports.getVersion = void 0;
// Version utilities
const fs_1 = require("fs");
const path_1 = require("path");
// Get version from package.json
const getVersion = () => {
    try {
        // In development, package.json is at project root
        // In production (pkg bundled), it might be embedded
        const packageJsonPath = (0, path_1.join)(__dirname, "../../package.json");
        const packageJson = JSON.parse((0, fs_1.readFileSync)(packageJsonPath, "utf8"));
        return packageJson.version;
    }
    catch {
        // Fallback version if package.json is not accessible
        return "1.0.0";
    }
};
exports.getVersion = getVersion;
// Get version with build info
const getVersionWithBuild = () => {
    const version = (0, exports.getVersion)();
    const buildTime = new Date().toISOString();
    return `${version} (built: ${buildTime})`;
};
exports.getVersionWithBuild = getVersionWithBuild;
//# sourceMappingURL=version.js.map