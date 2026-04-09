/**
 * Glass Authentication
 *
 * Handles the "authenticate once, everything lights up" flow:
 *
 * 1. User authenticates via SSO (Okta, Azure AD, etc.)
 * 2. SSO token is exchanged for Salesforce OAuth tokens
 * 3. Tokens are stored in Anthropic Vault for the session
 * 4. MCP servers use vault credentials — no manual setup
 *
 * This module manages the token lifecycle. In production, this runs
 * behind your SSO proxy. In development, it uses SF username/password.
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface AuthResult {
  userId: string;
  displayName: string;
  email: string;
  vaultId: string;
  salesforceInstanceUrl: string;
}

/**
 * Provision a vault with Salesforce credentials for a user session.
 * In production, the OAuth flow is handled by your SSO provider.
 * The vault stores tokens securely so agents never see raw credentials.
 */
export async function provisionVault(params: {
  accessToken: string;
  instanceUrl: string;
  refreshToken?: string;
}): Promise<string> {
  const vault = await client.beta.vaults.create({
    name: `glass-sf-${Date.now()}`,
    secrets: [
      { name: "SF_ACCESS_TOKEN", value: params.accessToken },
      { name: "SF_INSTANCE_URL", value: params.instanceUrl },
      ...(params.refreshToken
        ? [{ name: "SF_REFRESH_TOKEN", value: params.refreshToken }]
        : []),
    ],
  });

  return vault.id;
}

/**
 * Validate that a vault's Salesforce credentials are still valid.
 * Call this before starting a session to avoid mid-conversation auth failures.
 */
export async function validateCredentials(vaultId: string): Promise<boolean> {
  // In a real implementation, you'd test the SF access token
  // by making a lightweight API call (e.g., /services/data/)
  // For now, we trust the vault exists
  try {
    await client.beta.vaults.retrieve(vaultId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Full SSO → Salesforce → Vault flow.
 * This is what runs when a user first opens Glass.
 *
 * Flow:
 *   1. Frontend redirects to Okta → user authenticates
 *   2. Okta callback hits your backend with auth code
 *   3. Backend exchanges for Okta tokens
 *   4. Backend uses Okta token to get SF OAuth token (Connected App with SSO)
 *   5. SF tokens are stored in Anthropic Vault
 *   6. Vault ID is passed to session creation
 *
 * This function handles steps 4-6. Steps 1-3 happen in your web framework.
 */
export async function authenticateFromSSO(ssoToken: string): Promise<AuthResult> {
  // Step 4: Exchange SSO token for Salesforce access
  // In production, this calls your Salesforce Connected App's OAuth endpoint
  // which trusts your Okta IdP via SAML or OpenID Connect
  const sfAuth = await exchangeSSOForSalesforce(ssoToken);

  // Step 5: Store in vault
  const vaultId = await provisionVault({
    accessToken: sfAuth.accessToken,
    instanceUrl: sfAuth.instanceUrl,
    refreshToken: sfAuth.refreshToken,
  });

  // Step 6: Return session-ready auth result
  return {
    userId: sfAuth.userId,
    displayName: sfAuth.displayName,
    email: sfAuth.email,
    vaultId,
    salesforceInstanceUrl: sfAuth.instanceUrl,
  };
}

// ---------------------------------------------------------------------------
// Internal: SSO → Salesforce token exchange
// ---------------------------------------------------------------------------

interface SalesforceAuthResponse {
  accessToken: string;
  instanceUrl: string;
  refreshToken: string;
  userId: string;
  displayName: string;
  email: string;
}

async function exchangeSSOForSalesforce(ssoToken: string): Promise<SalesforceAuthResponse> {
  // This is a placeholder for the actual OAuth exchange.
  // In production, you'd POST to your Salesforce Connected App's
  // token endpoint with the SAML assertion or JWT from your IdP.
  //
  // Example with SAML assertion flow:
  //   POST https://login.salesforce.com/services/oauth2/token
  //   grant_type=urn:ietf:params:oauth:grant-type:saml2-bearer
  //   assertion=<base64-encoded SAML assertion from Okta>
  //   ...

  throw new Error(
    "exchangeSSOForSalesforce must be implemented with your Okta/Salesforce Connected App configuration. "
    + "See: https://help.salesforce.com/s/articleView?id=sf.sso_provider_openid_connect.htm"
  );
}
