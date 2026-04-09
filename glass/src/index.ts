/**
 * Glass — AI Agent Platform for Travel Collection
 *
 * Built on the Claude Agent SDK. Connects to your Salesforce travel
 * management platform via MCP. Authenticate once, everything lights up.
 *
 * Usage:
 *   # Development (interactive CLI)
 *   npm run dev -- --interactive
 *
 *   # Production (API server — connect your frontend)
 *   npm start
 */

export { createGlassAgent, startSession, sendMessage } from "./agents/orchestrator.js";
export { authenticateFromSSO, provisionVault, validateCredentials } from "./config/auth.js";
export { getEnvironment, environments } from "./config/environment.js";
export type { GlassEnvironmentConfig, McpServerConfig } from "./config/environment.js";
export type { AuthResult } from "./config/auth.js";
