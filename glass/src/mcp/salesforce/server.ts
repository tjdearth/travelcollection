/**
 * Salesforce MCP Server for Travel Collection
 *
 * Exposes Salesforce travel management platform operations as MCP tools
 * that Claude agents can call. Handles authentication via OAuth 2.0 (JWT bearer)
 * so advisors authenticate once via SSO and all tools light up.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import jsforce from "jsforce";

// ---------------------------------------------------------------------------
// Salesforce connection — singleton, lazy-initialized
// ---------------------------------------------------------------------------

let conn: jsforce.Connection | null = null;

async function getConnection(): Promise<jsforce.Connection> {
  if (conn) return conn;

  const loginUrl = process.env.SF_LOGIN_URL ?? "https://login.salesforce.com";
  conn = new jsforce.Connection({ loginUrl });

  // Prefer OAuth JWT flow for SSO environments; fall back to username/password
  // for local dev. In production, the JWT private key comes from Vault.
  if (process.env.SF_PRIVATE_KEY) {
    await conn.authorize({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      client_id: process.env.SF_CLIENT_ID!,
      username: process.env.SF_USERNAME!,
      privateKey: process.env.SF_PRIVATE_KEY,
    } as any);
  } else {
    await conn.login(
      process.env.SF_USERNAME!,
      process.env.SF_PASSWORD! + (process.env.SF_SECURITY_TOKEN ?? ""),
    );
  }

  return conn;
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "salesforce-travel",
  version: "0.1.0",
});

// --- Trip / Itinerary tools ---------------------------------------------------

server.tool(
  "search_trips",
  "Search trips and itineraries in the travel management platform. " +
    "Supports filtering by traveler name, destination, date range, status, and advisor.",
  {
    query: z.string().optional().describe("Free-text search across trip name, traveler, destination"),
    destination: z.string().optional().describe("Destination country or city"),
    status: z.enum(["Draft", "Confirmed", "In Progress", "Completed", "Cancelled"]).optional(),
    advisor_id: z.string().optional().describe("Salesforce ID of the assigned travel advisor"),
    date_from: z.string().optional().describe("Trip start date lower bound (YYYY-MM-DD)"),
    date_to: z.string().optional().describe("Trip start date upper bound (YYYY-MM-DD)"),
    limit: z.number().default(20).describe("Max results to return"),
  },
  async (params) => {
    const sf = await getConnection();

    let soql = "SELECT Id, Name, Traveler__r.Name, Destination__c, Start_Date__c, End_Date__c, "
      + "Status__c, Advisor__r.Name, Total_Value__c, Pax__c "
      + "FROM Trip__c";

    const conditions: string[] = [];
    if (params.query) {
      const q = params.query.replace(/'/g, "\\'");
      conditions.push(`(Name LIKE '%${q}%' OR Traveler__r.Name LIKE '%${q}%' OR Destination__c LIKE '%${q}%')`);
    }
    if (params.destination) conditions.push(`Destination__c = '${params.destination}'`);
    if (params.status) conditions.push(`Status__c = '${params.status}'`);
    if (params.advisor_id) conditions.push(`Advisor__c = '${params.advisor_id}'`);
    if (params.date_from) conditions.push(`Start_Date__c >= ${params.date_from}`);
    if (params.date_to) conditions.push(`Start_Date__c <= ${params.date_to}`);

    if (conditions.length > 0) soql += " WHERE " + conditions.join(" AND ");
    soql += ` ORDER BY Start_Date__c DESC LIMIT ${params.limit}`;

    const result = await sf.query(soql);
    return { content: [{ type: "text" as const, text: JSON.stringify(result.records, null, 2) }] };
  },
);

server.tool(
  "get_trip_details",
  "Get full details for a trip including day-by-day itinerary, accommodations, " +
    "transfers, experiences, and supplier contacts.",
  {
    trip_id: z.string().describe("Salesforce Trip__c record ID"),
  },
  async ({ trip_id }) => {
    const sf = await getConnection();

    const [trip, days, accommodations, experiences] = await Promise.all([
      sf.sobject("Trip__c").retrieve(trip_id),
      sf.query(
        `SELECT Id, Day_Number__c, Date__c, Location__c, Notes__c
         FROM Itinerary_Day__c WHERE Trip__c = '${trip_id}' ORDER BY Day_Number__c`,
      ),
      sf.query(
        `SELECT Id, Property_Name__c, Check_In__c, Check_Out__c, Room_Type__c, Confirmation__c
         FROM Accommodation__c WHERE Trip__c = '${trip_id}' ORDER BY Check_In__c`,
      ),
      sf.query(
        `SELECT Id, Name, Type__c, Date__c, Duration__c, Supplier__r.Name, Notes__c
         FROM Experience__c WHERE Trip__c = '${trip_id}' ORDER BY Date__c`,
      ),
    ]);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ trip, days: days.records, accommodations: accommodations.records, experiences: experiences.records }, null, 2),
      }],
    };
  },
);

server.tool(
  "create_trip",
  "Create a new trip record in the travel management platform.",
  {
    name: z.string().describe("Trip name (e.g. 'Smith Family - Tuscany 2026')"),
    traveler_id: z.string().describe("Salesforce Contact ID of the primary traveler"),
    destination: z.string().describe("Primary destination"),
    start_date: z.string().describe("Trip start date (YYYY-MM-DD)"),
    end_date: z.string().describe("Trip end date (YYYY-MM-DD)"),
    pax: z.number().describe("Number of travelers"),
    advisor_id: z.string().optional().describe("Advisor Salesforce ID (defaults to current user)"),
    notes: z.string().optional().describe("Internal notes"),
  },
  async (params) => {
    const sf = await getConnection();
    const result = await sf.sobject("Trip__c").create({
      Name: params.name,
      Traveler__c: params.traveler_id,
      Destination__c: params.destination,
      Start_Date__c: params.start_date,
      End_Date__c: params.end_date,
      Pax__c: params.pax,
      Advisor__c: params.advisor_id,
      Notes__c: params.notes,
      Status__c: "Draft",
    });

    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

server.tool(
  "update_trip_status",
  "Update the status of a trip (e.g. Draft → Confirmed, or mark as Completed).",
  {
    trip_id: z.string().describe("Salesforce Trip__c record ID"),
    status: z.enum(["Draft", "Confirmed", "In Progress", "Completed", "Cancelled"]),
    notes: z.string().optional().describe("Optional status change notes"),
  },
  async ({ trip_id, status, notes }) => {
    const sf = await getConnection();
    const update: Record<string, unknown> = { Id: trip_id, Status__c: status };
    if (notes) update.Status_Notes__c = notes;

    const result = await sf.sobject("Trip__c").update(update);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// --- Traveler / Contact tools -------------------------------------------------

server.tool(
  "search_travelers",
  "Search for travelers (contacts) in Salesforce by name, email, or account.",
  {
    query: z.string().describe("Name or email to search"),
    limit: z.number().default(10),
  },
  async ({ query, limit }) => {
    const sf = await getConnection();
    const q = query.replace(/'/g, "\\'");
    const result = await sf.query(
      `SELECT Id, Name, Email, Phone, Account.Name, Travel_Preferences__c, Loyalty_Tier__c
       FROM Contact
       WHERE Name LIKE '%${q}%' OR Email LIKE '%${q}%'
       ORDER BY Name LIMIT ${limit}`,
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(result.records, null, 2) }] };
  },
);

server.tool(
  "get_traveler_history",
  "Get a traveler's complete trip history, preferences, and past feedback.",
  {
    contact_id: z.string().describe("Salesforce Contact ID"),
  },
  async ({ contact_id }) => {
    const sf = await getConnection();
    const [contact, trips, feedback] = await Promise.all([
      sf.sobject("Contact").retrieve(contact_id),
      sf.query(
        `SELECT Id, Name, Destination__c, Start_Date__c, End_Date__c, Status__c, Total_Value__c
         FROM Trip__c WHERE Traveler__c = '${contact_id}' ORDER BY Start_Date__c DESC`,
      ),
      sf.query(
        `SELECT Id, Trip__r.Name, Rating__c, Comments__c, CreatedDate
         FROM Trip_Feedback__c WHERE Trip__r.Traveler__c = '${contact_id}' ORDER BY CreatedDate DESC`,
      ),
    ]);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ contact, trips: trips.records, feedback: feedback.records }, null, 2),
      }],
    };
  },
);

// --- Supplier / DMC tools -----------------------------------------------------

server.tool(
  "search_suppliers",
  "Search for destination suppliers (hotels, DMCs, experience providers) by destination or type.",
  {
    destination: z.string().optional().describe("Country or city"),
    type: z.enum(["Hotel", "DMC", "Experience Provider", "Transfer", "Guide", "Restaurant"]).optional(),
    query: z.string().optional().describe("Free-text search on supplier name"),
    limit: z.number().default(20),
  },
  async (params) => {
    const sf = await getConnection();
    const conditions: string[] = [];
    if (params.destination) conditions.push(`Destination__c = '${params.destination}'`);
    if (params.type) conditions.push(`Type__c = '${params.type}'`);
    if (params.query) {
      const q = params.query.replace(/'/g, "\\'");
      conditions.push(`Name LIKE '%${q}%'`);
    }

    let soql = "SELECT Id, Name, Type__c, Destination__c, Rating__c, Contact_Email__c, Preferred__c "
      + "FROM Supplier__c";
    if (conditions.length > 0) soql += " WHERE " + conditions.join(" AND ");
    soql += ` ORDER BY Rating__c DESC NULLS LAST LIMIT ${params.limit}`;

    const result = await sf.query(soql);
    return { content: [{ type: "text" as const, text: JSON.stringify(result.records, null, 2) }] };
  },
);

// --- Reporting tools ----------------------------------------------------------

server.tool(
  "pipeline_report",
  "Generate a pipeline report showing trips by status, total revenue, and advisor breakdown.",
  {
    date_from: z.string().optional().describe("Start date for report window (YYYY-MM-DD)"),
    date_to: z.string().optional().describe("End date for report window (YYYY-MM-DD)"),
    advisor_id: z.string().optional().describe("Filter to a specific advisor"),
  },
  async (params) => {
    const sf = await getConnection();
    const conditions: string[] = [];
    if (params.date_from) conditions.push(`Start_Date__c >= ${params.date_from}`);
    if (params.date_to) conditions.push(`Start_Date__c <= ${params.date_to}`);
    if (params.advisor_id) conditions.push(`Advisor__c = '${params.advisor_id}'`);

    const whereClause = conditions.length > 0 ? " WHERE " + conditions.join(" AND ") : "";

    const [byStatus, byAdvisor] = await Promise.all([
      sf.query(
        `SELECT Status__c, COUNT(Id) cnt, SUM(Total_Value__c) revenue
         FROM Trip__c${whereClause} GROUP BY Status__c`,
      ),
      sf.query(
        `SELECT Advisor__r.Name advisor, COUNT(Id) cnt, SUM(Total_Value__c) revenue
         FROM Trip__c${whereClause} GROUP BY Advisor__r.Name ORDER BY SUM(Total_Value__c) DESC`,
      ),
    ]);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ by_status: byStatus.records, by_advisor: byAdvisor.records }, null, 2),
      }],
    };
  },
);

// --- SOQL escape hatch -------------------------------------------------------

server.tool(
  "run_soql",
  "Run a custom SOQL query against the Salesforce travel management platform. " +
    "Use this for ad-hoc reporting or data exploration that the other tools don't cover.",
  {
    query: z.string().describe("SOQL query to execute"),
  },
  async ({ query }) => {
    const sf = await getConnection();

    // Safety: reject DML-like keywords (this is read-only)
    const upper = query.toUpperCase().trim();
    if (!upper.startsWith("SELECT")) {
      return { content: [{ type: "text" as const, text: "Error: Only SELECT queries are allowed." }] };
    }

    const result = await sf.query(query);
    return { content: [{ type: "text" as const, text: JSON.stringify(result.records, null, 2) }] };
  },
);

// ---------------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Salesforce Travel MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
