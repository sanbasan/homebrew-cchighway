// Server management commands
import { loadConfig } from "../config";
import {
  startServer as startServerImpl,
  stopServer as stopServerImpl,
  getServerStatus as getServerStatusImpl,
} from "../../server";

export interface ServerStartOptions {
  port: number;
  workDir: string;
  daemon: boolean;
}

export interface ServerInfo {
  port: number;
  workDir: string;
  uptime: string;
  activeSessions: number;
}

export interface ServerStatus {
  running: boolean;
  info?: ServerInfo;
}

export const startServer = async (
  options: ServerStartOptions
): Promise<{ port: number; workDir: string }> => {
  await loadConfig();

  // Validate port
  if (options.port < 1 || options.port > 65535) {
    throw new Error("Port must be between 1 and 65535");
  }

  return startServerImpl(options);
};

export const stopServer = async (): Promise<boolean> => {
  return stopServerImpl();
};

export const getServerStatus = async (): Promise<ServerStatus> => {
  return getServerStatusImpl();
};
