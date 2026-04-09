/**
 * Glass Environment Configuration
 *
 * Defines environments for different deployment contexts.
 * Each environment specifies:
 * - Which packages are pre-installed in the container
 * - Network access rules (principle of least privilege)
 * - MCP server connections
 */

export interface GlassEnvironmentConfig {
  salesforce: {
    loginUrl: string;
    clientId: string;
    username: string;
  };
  mcpServers: McpServerConfig[];
  networking: {
    allowedHosts: string[];
  };
}

export interface McpServerConfig {
  name: string;
  url: string;
  authType: "oauth" | "token" | "vault";
}

export const environments = {
  production: {
    salesforce: {
      loginUrl: "https://login.salesforce.com",
      clientId: process.env.SF_CLIENT_ID ?? "",
      username: process.env.SF_USERNAME ?? "",
    },
    mcpServers: [
      {
        name: "salesforce-travel",
        url: process.env.MCP_SALESFORCE_URL ?? "http://localhost:3001/sse",
        authType: "vault" as const,
      },
    ],
    networking: {
      allowedHosts: [
        "login.salesforce.com",
        "*.salesforce.com",
        "*.force.com",
      ],
    },
  },

  development: {
    salesforce: {
      loginUrl: process.env.SF_LOGIN_URL ?? "https://test.salesforce.com",
      clientId: process.env.SF_CLIENT_ID ?? "",
      username: process.env.SF_USERNAME ?? "",
    },
    mcpServers: [
      {
        name: "salesforce-travel",
        url: process.env.MCP_SALESFORCE_URL ?? "http://localhost:3001/sse",
        authType: "token" as const,
      },
    ],
    networking: {
      allowedHosts: [
        "test.salesforce.com",
        "*.cs*.salesforce.com",
        "localhost",
      ],
    },
  },
} satisfies Record<string, GlassEnvironmentConfig>;

export type EnvironmentName = keyof typeof environments;

export function getEnvironment(name?: string): GlassEnvironmentConfig {
  const envName = (name ?? process.env.GLASS_ENV ?? "development") as EnvironmentName;
  const config = environments[envName];
  if (!config) {
    throw new Error(`Unknown environment: ${envName}. Available: ${Object.keys(environments).join(", ")}`);
  }
  return config;
}
