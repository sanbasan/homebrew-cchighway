// Version utilities
import { readFileSync } from "fs";
import { join } from "path";

// Get version from package.json
export const getVersion = (): string => {
  try {
    // In development, package.json is at project root
    // In production (pkg bundled), it might be embedded
    const packageJsonPath = join(__dirname, "../../package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
      version: string;
    };
    return packageJson.version;
  } catch {
    // Fallback version if package.json is not accessible
    return "1.0.0";
  }
};

// Get version with build info
export const getVersionWithBuild = (): string => {
  const version = getVersion();
  const buildTime = new Date().toISOString();
  return `${version} (built: ${buildTime})`;
};
