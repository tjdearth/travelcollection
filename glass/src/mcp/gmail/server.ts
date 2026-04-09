/**
 * Gmail MCP Server for Travel Collection
 *
 * Gives Glass the ability to read incoming agent briefs, search email threads,
 * draft replies in the advisor's voice, and send responses — all from Gmail.
 *
 * Auth: Google OAuth 2.0 via service account or user consent flow.
 * In production, tokens come from Anthropic Vault (provisioned during SSO).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Google API client — lazy-initialized from vault/env credentials
// ---------------------------------------------------------------------------

interface GmailClient {
  accessToken: string;
  userEmail: string;
}

let gmailClient: GmailClient | null = null;

function getClient(): GmailClient {
  if (gmailClient) return gmailClient;

  gmailClient = {
    accessToken: process.env.GOOGLE_ACCESS_TOKEN ?? "",
    userEmail: process.env.GOOGLE_USER_EMAIL ?? "me",
  };

  return gmailClient;
}

async function gmailAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const client = getClient();
  const base = "https://gmail.googleapis.com/gmail/v1/users/me";
  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${client.accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gmail API error (${response.status}): ${error}`);
  }

  return response.json();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function decodeBase64Url(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
}

function encodeBase64Url(data: string): string {
  return Buffer.from(data).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function extractHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractBody(payload: any): string {
  // Simple text/plain body
  if (payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart — find text/plain or text/html
  if (payload.parts) {
    const textPart = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (textPart?.body?.data) return decodeBase64Url(textPart.body.data);

    const htmlPart = payload.parts.find((p: any) => p.mimeType === "text/html");
    if (htmlPart?.body?.data) {
      const html = decodeBase64Url(htmlPart.body.data);
      // Strip HTML tags for a readable text version
      return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    }

    // Nested multipart
    for (const part of payload.parts) {
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }
  }

  return "";
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "gmail-travel",
  version: "0.1.0",
});

// --- Read emails -------------------------------------------------------------

server.tool(
  "search_emails",
  "Search the advisor's Gmail inbox. Use Gmail search syntax " +
    "(e.g. 'from:agent@agency.com subject:brief', 'is:unread label:briefs', " +
    "'newer_than:7d has:attachment').",
  {
    query: z.string().describe("Gmail search query"),
    max_results: z.number().default(10).describe("Max emails to return"),
  },
  async ({ query, max_results }) => {
    const data = await gmailAPI(`/messages?q=${encodeURIComponent(query)}&maxResults=${max_results}`);

    if (!data.messages || data.messages.length === 0) {
      return { content: [{ type: "text" as const, text: "No emails found matching that search." }] };
    }

    // Fetch metadata for each message
    const messages = await Promise.all(
      data.messages.map(async (msg: any) => {
        const full = await gmailAPI(`/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date`);
        const headers = full.payload?.headers ?? [];
        return {
          id: full.id,
          threadId: full.threadId,
          from: extractHeader(headers, "From"),
          to: extractHeader(headers, "To"),
          subject: extractHeader(headers, "Subject"),
          date: extractHeader(headers, "Date"),
          snippet: full.snippet,
          labels: full.labelIds,
        };
      }),
    );

    return { content: [{ type: "text" as const, text: JSON.stringify(messages, null, 2) }] };
  },
);

server.tool(
  "read_email",
  "Read the full content of a specific email, including the complete body text. " +
    "Use this after search_emails to read an agent brief in full.",
  {
    message_id: z.string().describe("Gmail message ID"),
  },
  async ({ message_id }) => {
    const msg = await gmailAPI(`/messages/${message_id}?format=full`);
    const headers = msg.payload?.headers ?? [];

    const email = {
      id: msg.id,
      threadId: msg.threadId,
      from: extractHeader(headers, "From"),
      to: extractHeader(headers, "To"),
      cc: extractHeader(headers, "Cc"),
      subject: extractHeader(headers, "Subject"),
      date: extractHeader(headers, "Date"),
      body: extractBody(msg.payload),
      labels: msg.labelIds,
    };

    return { content: [{ type: "text" as const, text: JSON.stringify(email, null, 2) }] };
  },
);

server.tool(
  "read_thread",
  "Read an entire email thread (conversation). Useful for seeing the full back-and-forth " +
    "with an agent, including any follow-up questions or changes to the brief.",
  {
    thread_id: z.string().describe("Gmail thread ID"),
  },
  async ({ thread_id }) => {
    const thread = await gmailAPI(`/threads/${thread_id}?format=full`);

    const messages = thread.messages.map((msg: any) => {
      const headers = msg.payload?.headers ?? [];
      return {
        id: msg.id,
        from: extractHeader(headers, "From"),
        to: extractHeader(headers, "To"),
        date: extractHeader(headers, "Date"),
        body: extractBody(msg.payload),
      };
    });

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ threadId: thread.id, subject: extractHeader(thread.messages[0]?.payload?.headers ?? [], "Subject"), messages }, null, 2),
      }],
    };
  },
);

// --- Draft and send replies --------------------------------------------------

server.tool(
  "draft_reply",
  "Create a draft reply to an email thread. The draft is saved in Gmail Drafts " +
    "so the advisor can review before sending. Use this for proposal responses.",
  {
    thread_id: z.string().describe("Gmail thread ID to reply to"),
    reply_to_message_id: z.string().describe("Message ID of the email being replied to"),
    to: z.string().describe("Recipient email address"),
    cc: z.string().optional().describe("CC recipients (comma-separated)"),
    subject: z.string().describe("Email subject (typically Re: original subject)"),
    body: z.string().describe("Email body text (plain text — will be converted to HTML)"),
  },
  async ({ thread_id, reply_to_message_id, to, cc, subject, body }) => {
    // Build the RFC 2822 message
    const lines = [
      `To: ${to}`,
      ...(cc ? [`Cc: ${cc}`] : []),
      `Subject: ${subject}`,
      `In-Reply-To: ${reply_to_message_id}`,
      `References: ${reply_to_message_id}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      body.replace(/\n/g, "<br>"),
    ];

    const raw = encodeBase64Url(lines.join("\r\n"));

    const draft = await gmailAPI("/drafts", {
      method: "POST",
      body: JSON.stringify({
        message: {
          raw,
          threadId: thread_id,
        },
      }),
    });

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          status: "Draft created",
          draftId: draft.id,
          threadId: thread_id,
          note: "Draft saved in Gmail. Advisor can review and send from their inbox.",
        }, null, 2),
      }],
    };
  },
);

server.tool(
  "send_reply",
  "Send a reply directly (no draft step). Use this only when the advisor has " +
    "explicitly approved the response content.",
  {
    thread_id: z.string().describe("Gmail thread ID to reply to"),
    reply_to_message_id: z.string().describe("Message ID of the email being replied to"),
    to: z.string().describe("Recipient email address"),
    cc: z.string().optional().describe("CC recipients"),
    subject: z.string().describe("Email subject"),
    body: z.string().describe("Email body text"),
  },
  async ({ thread_id, reply_to_message_id, to, cc, subject, body }) => {
    const lines = [
      `To: ${to}`,
      ...(cc ? [`Cc: ${cc}`] : []),
      `Subject: ${subject}`,
      `In-Reply-To: ${reply_to_message_id}`,
      `References: ${reply_to_message_id}`,
      "Content-Type: text/html; charset=utf-8",
      "",
      body.replace(/\n/g, "<br>"),
    ];

    const raw = encodeBase64Url(lines.join("\r\n"));

    const sent = await gmailAPI("/messages/send", {
      method: "POST",
      body: JSON.stringify({
        raw,
        threadId: thread_id,
      }),
    });

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          status: "Sent",
          messageId: sent.id,
          threadId: thread_id,
        }, null, 2),
      }],
    };
  },
);

// --- Advisor style learning --------------------------------------------------

server.tool(
  "get_sent_emails",
  "Retrieve the advisor's recently sent emails to learn their writing style, " +
    "tone, sign-off, and typical response structure. Glass uses this to draft " +
    "replies that sound like the advisor.",
  {
    max_results: z.number().default(20).describe("Number of sent emails to analyze"),
    to_filter: z.string().optional().describe("Only get emails sent to this address/domain"),
  },
  async ({ max_results, to_filter }) => {
    let query = "in:sent";
    if (to_filter) query += ` to:${to_filter}`;

    const data = await gmailAPI(`/messages?q=${encodeURIComponent(query)}&maxResults=${max_results}`);

    if (!data.messages || data.messages.length === 0) {
      return { content: [{ type: "text" as const, text: "No sent emails found." }] };
    }

    const messages = await Promise.all(
      data.messages.slice(0, max_results).map(async (msg: any) => {
        const full = await gmailAPI(`/messages/${msg.id}?format=full`);
        const headers = full.payload?.headers ?? [];
        return {
          to: extractHeader(headers, "To"),
          subject: extractHeader(headers, "Subject"),
          date: extractHeader(headers, "Date"),
          body: extractBody(full.payload),
        };
      }),
    );

    return { content: [{ type: "text" as const, text: JSON.stringify(messages, null, 2) }] };
  },
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gmail Travel MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
