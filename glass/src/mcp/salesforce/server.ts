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
  version: "0.2.0",
});

// === TRIP TOOLS ==============================================================

server.tool(
  "search_trips",
  "Search trips and itineraries. Supports filtering by traveler, destination, " +
    "date range, status, advisor, and agent.",
  {
    query: z.string().optional().describe("Free-text search across trip name, traveler, destination"),
    destination: z.string().optional().describe("Destination country or city"),
    status: z.enum(["Draft", "Confirmed", "In Progress", "Completed", "Cancelled"]).optional(),
    advisor_id: z.string().optional().describe("Salesforce ID of the assigned travel advisor"),
    agent_id: z.string().optional().describe("Salesforce ID of the booking agent"),
    date_from: z.string().optional().describe("Trip start date lower bound (YYYY-MM-DD)"),
    date_to: z.string().optional().describe("Trip start date upper bound (YYYY-MM-DD)"),
    limit: z.number().default(20).describe("Max results to return"),
  },
  async (params) => {
    const sf = await getConnection();

    let soql = "SELECT Id, Name, Traveler__r.Name, Destination__c, Start_Date__c, End_Date__c, "
      + "Status__c, Advisor__r.Name, Agent__r.Name, Total_Value__c, Pax__c, Version__c "
      + "FROM Trip__c";

    const conditions: string[] = [];
    if (params.query) {
      const q = params.query.replace(/'/g, "\\'");
      conditions.push(`(Name LIKE '%${q}%' OR Traveler__r.Name LIKE '%${q}%' OR Destination__c LIKE '%${q}%')`);
    }
    if (params.destination) conditions.push(`Destination__c = '${params.destination}'`);
    if (params.status) conditions.push(`Status__c = '${params.status}'`);
    if (params.advisor_id) conditions.push(`Advisor__c = '${params.advisor_id}'`);
    if (params.agent_id) conditions.push(`Agent__c = '${params.agent_id}'`);
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
    "transfers, experiences, services, and supplier contacts.",
  {
    trip_id: z.string().describe("Salesforce Trip__c record ID"),
  },
  async ({ trip_id }) => {
    const sf = await getConnection();

    const [trip, days, accommodations, services, transfers] = await Promise.all([
      sf.sobject("Trip__c").retrieve(trip_id),
      sf.query(
        `SELECT Id, Day_Number__c, Date__c, Location__c, Notes__c
         FROM Itinerary_Day__c WHERE Trip__c = '${trip_id}' ORDER BY Day_Number__c`,
      ),
      sf.query(
        `SELECT Id, Property_Name__c, Check_In__c, Check_Out__c, Room_Type__c,
                Confirmation__c, Nightly_Rate__c, Nights__c
         FROM Accommodation__c WHERE Trip__c = '${trip_id}' ORDER BY Check_In__c`,
      ),
      sf.query(
        `SELECT Id, Name, Service_Type__c, Date__c, Duration__c, Description__c,
                Supplier__r.Name, Supplier__r.Destination__c, Rate__c, Pax__c,
                Day_Number__c, Time_Of_Day__c
         FROM Service_Line__c WHERE Trip__c = '${trip_id}' ORDER BY Day_Number__c, Time_Of_Day__c`,
      ),
      sf.query(
        `SELECT Id, Name, From_Location__c, To_Location__c, Date__c, Duration_Minutes__c,
                Transfer_Type__c, Rate__c, Day_Number__c
         FROM Transfer__c WHERE Trip__c = '${trip_id}' ORDER BY Day_Number__c`,
      ),
    ]);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          trip,
          days: days.records,
          accommodations: accommodations.records,
          services: services.records,
          transfers: transfers.records,
        }, null, 2),
      }],
    };
  },
);

server.tool(
  "create_trip",
  "Create a new trip record. Returns the trip ID for adding services.",
  {
    name: z.string().describe("Trip name (e.g. 'Smith Family - Tuscany 2026')"),
    traveler_id: z.string().optional().describe("Salesforce Contact ID of the primary traveler"),
    destination: z.string().describe("Primary destination(s)"),
    start_date: z.string().describe("Trip start date (YYYY-MM-DD)"),
    end_date: z.string().describe("Trip end date (YYYY-MM-DD)"),
    pax: z.number().describe("Number of travelers"),
    advisor_id: z.string().optional().describe("Advisor Salesforce ID"),
    agent_id: z.string().optional().describe("Booking agent Salesforce ID"),
    notes: z.string().optional().describe("Internal notes"),
    version: z.number().default(1).describe("Proposal version number"),
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
      Agent__c: params.agent_id,
      Notes__c: params.notes,
      Version__c: params.version,
      Status__c: "Draft",
    });

    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

server.tool(
  "update_trip",
  "Update any fields on a trip record.",
  {
    trip_id: z.string().describe("Salesforce Trip__c record ID"),
    fields: z.record(z.unknown()).describe("Map of field API names to new values"),
  },
  async ({ trip_id, fields }) => {
    const sf = await getConnection();
    const result = await sf.sobject("Trip__c").update({ Id: trip_id, ...fields });
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  },
);

// === SERVICE / EXPERIENCE TOOLS =============================================

server.tool(
  "search_services",
  "Search available services (experiences, activities, guides, restaurants) by destination. " +
    "Returns supplier, service type, description, duration, and rate. " +
    "Use description content to match services to traveler interests from the brief.",
  {
    destination: z.string().describe("Destination country, region, or city"),
    service_type: z.string().optional().describe("Service type filter (e.g. 'Experience', 'Guide', 'Restaurant', 'Activity')"),
    query: z.string().optional().describe("Free-text search across service name and description"),
    limit: z.number().default(30).describe("Max results — use higher limits for interest matching"),
  },
  async (params) => {
    const sf = await getConnection();
    const conditions: string[] = [];
    conditions.push(`Supplier__r.Destination__c = '${params.destination}'`);
    if (params.service_type) conditions.push(`Service_Type__c = '${params.service_type}'`);
    if (params.query) {
      const q = params.query.replace(/'/g, "\\'");
      conditions.push(`(Name LIKE '%${q}%' OR Description__c LIKE '%${q}%')`);
    }

    const soql = `SELECT Id, Name, Service_Type__c, Description__c, Duration__c,
                         Rate__c, Rate_Type__c, Max_Pax__c,
                         Supplier__r.Name, Supplier__r.Destination__c, Supplier__r.Preferred__c
                  FROM Service__c
                  WHERE ${conditions.join(" AND ")}
                  ORDER BY Supplier__r.Preferred__c DESC, Supplier__r.Rating__c DESC NULLS LAST
                  LIMIT ${params.limit}`;

    const result = await sf.query(soql);
    return { content: [{ type: "text" as const, text: JSON.stringify(result.records, null, 2) }] };
  },
);

server.tool(
  "search_transfers",
  "Search available transfer routes at a destination.",
  {
    destination: z.string().describe("Destination country or region"),
    from_location: z.string().optional().describe("Origin point (airport, city, hotel area)"),
    to_location: z.string().optional().describe("Destination point"),
  },
  async (params) => {
    const sf = await getConnection();
    const conditions: string[] = [];
    conditions.push(`Destination__c = '${params.destination}'`);
    if (params.from_location) {
      const q = params.from_location.replace(/'/g, "\\'");
      conditions.push(`From_Location__c LIKE '%${q}%'`);
    }
    if (params.to_location) {
      const q = params.to_location.replace(/'/g, "\\'");
      conditions.push(`To_Location__c LIKE '%${q}%'`);
    }

    const soql = `SELECT Id, Name, From_Location__c, To_Location__c, Duration_Minutes__c,
                         Transfer_Type__c, Rate__c, Vehicle_Type__c, Max_Pax__c,
                         Supplier__r.Name
                  FROM Transfer_Route__c
                  WHERE ${conditions.join(" AND ")}
                  ORDER BY From_Location__c, To_Location__c`;

    const result = await sf.query(soql);
    return { content: [{ type: "text" as const, text: JSON.stringify(result.records, null, 2) }] };
  },
);

// === SUPPLIER TOOLS =========================================================

server.tool(
  "search_suppliers",
  "Search for destination suppliers (hotels, DMCs, experience providers) by destination or type.",
  {
    destination: z.string().optional().describe("Country or city"),
    type: z.string().optional().describe("Supplier type (Hotel, DMC, Experience Provider, Transfer, Guide, Restaurant)"),
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

    let soql = `SELECT Id, Name, Type__c, Destination__c, Rating__c, Contact_Email__c,
                       Contact_Name__c, Preferred__c, Notes__c
                FROM Supplier__c`;
    if (conditions.length > 0) soql += " WHERE " + conditions.join(" AND ");
    soql += ` ORDER BY Preferred__c DESC, Rating__c DESC NULLS LAST LIMIT ${params.limit}`;

    const result = await sf.query(soql);
    return { content: [{ type: "text" as const, text: JSON.stringify(result.records, null, 2) }] };
  },
);

// === AGENT TOOLS ============================================================

server.tool(
  "get_agent_profile",
  "Get a booking agent's profile including their past bookings, preferences, " +
    "communication style notes, and booking patterns. Use this to understand " +
    "how to tailor proposals and email replies for this agent.",
  {
    agent_id: z.string().describe("Salesforce agent record ID"),
  },
  async ({ agent_id }) => {
    const sf = await getConnection();

    const [agent, trips, notes] = await Promise.all([
      sf.sobject("Agent__c").retrieve(agent_id),
      sf.query(
        `SELECT Id, Name, Destination__c, Start_Date__c, Pax__c, Total_Value__c,
                Status__c, Version__c
         FROM Trip__c WHERE Agent__c = '${agent_id}'
         ORDER BY Start_Date__c DESC LIMIT 50`,
      ),
      sf.query(
        `SELECT Id, Body__c, CreatedDate, CreatedBy.Name
         FROM Agent_Note__c WHERE Agent__c = '${agent_id}'
         ORDER BY CreatedDate DESC LIMIT 20`,
      ),
    ]);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({ agent, recent_trips: trips.records, notes: notes.records }, null, 2),
      }],
    };
  },
);

server.tool(
  "search_agents",
  "Search for booking agents by name, agency, or consortium.",
  {
    query: z.string().describe("Agent name, agency, or consortium to search"),
    limit: z.number().default(10),
  },
  async ({ query, limit }) => {
    const sf = await getConnection();
    const q = query.replace(/'/g, "\\'");
    const result = await sf.query(
      `SELECT Id, Name, Agency__c, Consortium__c, Email__c, Phone__c, Notes__c
       FROM Agent__c
       WHERE Name LIKE '%${q}%' OR Agency__c LIKE '%${q}%' OR Consortium__c LIKE '%${q}%'
       ORDER BY Name LIMIT ${limit}`,
    );
    return { content: [{ type: "text" as const, text: JSON.stringify(result.records, null, 2) }] };
  },
);

// === TRAVELER TOOLS =========================================================

server.tool(
  "search_travelers",
  "Search for travelers (contacts) by name, email, or account.",
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

// === PATTERN ANALYSIS TOOLS =================================================

server.tool(
  "get_destination_patterns",
  "Analyze past delivered trips for a destination to understand how travel works there: " +
    "common services, transfer patterns, guide usage, typical trip length, seasonal booking " +
    "patterns, and price ranges. Used to derive destination-specific assembly rules.",
  {
    destination: z.string().describe("Destination to analyze"),
    min_trips: z.number().default(10).describe("Minimum delivered trips to analyze"),
  },
  async ({ destination, min_trips }) => {
    const sf = await getConnection();
    const q = destination.replace(/'/g, "\\'");

    const [trips, services, transfers, accommodations, seasonality] = await Promise.all([
      sf.query(
        `SELECT COUNT(Id) total, AVG(Pax__c) avg_pax,
                AVG(Total_Value__c) avg_value, MIN(Start_Date__c) earliest,
                MAX(Start_Date__c) latest
         FROM Trip__c
         WHERE Destination__c LIKE '%${q}%' AND Status__c IN ('Completed', 'Confirmed')`,
      ),
      sf.query(
        `SELECT Service_Type__c, Name, COUNT(Id) times_booked, AVG(Rate__c) avg_rate
         FROM Service_Line__c
         WHERE Trip__r.Destination__c LIKE '%${q}%'
           AND Trip__r.Status__c IN ('Completed', 'Confirmed')
         GROUP BY Service_Type__c, Name
         ORDER BY COUNT(Id) DESC
         LIMIT 50`,
      ),
      sf.query(
        `SELECT From_Location__c, To_Location__c, Transfer_Type__c,
                COUNT(Id) times_used, AVG(Rate__c) avg_rate, AVG(Duration_Minutes__c) avg_duration
         FROM Transfer__c
         WHERE Trip__r.Destination__c LIKE '%${q}%'
           AND Trip__r.Status__c IN ('Completed', 'Confirmed')
         GROUP BY From_Location__c, To_Location__c, Transfer_Type__c
         ORDER BY COUNT(Id) DESC`,
      ),
      sf.query(
        `SELECT Property_Name__c, Room_Type__c,
                COUNT(Id) times_booked, AVG(Nightly_Rate__c) avg_rate, AVG(Nights__c) avg_nights
         FROM Accommodation__c
         WHERE Trip__r.Destination__c LIKE '%${q}%'
           AND Trip__r.Status__c IN ('Completed', 'Confirmed')
         GROUP BY Property_Name__c, Room_Type__c
         ORDER BY COUNT(Id) DESC
         LIMIT 20`,
      ),
      sf.query(
        `SELECT CALENDAR_MONTH(Start_Date__c) month, COUNT(Id) trips
         FROM Trip__c
         WHERE Destination__c LIKE '%${q}%' AND Status__c IN ('Completed', 'Confirmed')
         GROUP BY CALENDAR_MONTH(Start_Date__c)
         ORDER BY CALENDAR_MONTH(Start_Date__c)`,
      ),
    ]);

    // Detect travel model from patterns
    const guideServices = (services.records as any[]).filter(
      (s) => s.Service_Type__c === "Guide" || s.Service_Type__c === "Driver",
    );
    const hasFullTimeGuide = guideServices.some((s) => s.times_booked >= min_trips * 0.7);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          summary: trips.records[0],
          travel_model: hasFullTimeGuide ? "guide_and_driver" : "point_to_point",
          services: services.records,
          transfer_routes: transfers.records,
          hotels: accommodations.records,
          seasonality: seasonality.records,
        }, null, 2),
      }],
    };
  },
);

server.tool(
  "get_similar_proposals",
  "Find past proposals similar to a brief — matching destination, pax, trip length, " +
    "and interests. Use this to see what blocks were used in similar trips, how they " +
    "were priced, and how they were structured. Do NOT copy these proposals — use them " +
    "as reference for what blocks exist and what works operationally.",
  {
    destination: z.string().describe("Primary destination"),
    nights: z.number().optional().describe("Approximate number of nights"),
    pax: z.number().optional().describe("Number of travelers"),
    interests: z.string().optional().describe("Brief interest keywords to match against service descriptions"),
    limit: z.number().default(5).describe("Number of similar proposals to return"),
  },
  async (params) => {
    const sf = await getConnection();
    const q = params.destination.replace(/'/g, "\\'");
    const conditions: string[] = [
      `Destination__c LIKE '%${q}%'`,
      `Status__c IN ('Completed', 'Confirmed', 'Draft')`,
    ];
    if (params.pax) {
      conditions.push(`Pax__c >= ${params.pax - 1} AND Pax__c <= ${params.pax + 2}`);
    }

    const trips = await sf.query(
      `SELECT Id, Name, Destination__c, Start_Date__c, End_Date__c, Pax__c,
              Total_Value__c, Status__c, Version__c
       FROM Trip__c
       WHERE ${conditions.join(" AND ")}
       ORDER BY Start_Date__c DESC
       LIMIT ${params.limit * 3}`,
    );

    // Get full details for top matches
    const detailedTrips = await Promise.all(
      (trips.records as any[]).slice(0, params.limit).map(async (trip) => {
        const [services, accommodations, transfers] = await Promise.all([
          sf.query(
            `SELECT Name, Service_Type__c, Description__c, Duration__c, Rate__c,
                    Supplier__r.Name, Day_Number__c, Time_Of_Day__c
             FROM Service_Line__c WHERE Trip__c = '${trip.Id}' ORDER BY Day_Number__c`,
          ),
          sf.query(
            `SELECT Property_Name__c, Check_In__c, Check_Out__c, Room_Type__c, Nightly_Rate__c, Nights__c
             FROM Accommodation__c WHERE Trip__c = '${trip.Id}' ORDER BY Check_In__c`,
          ),
          sf.query(
            `SELECT From_Location__c, To_Location__c, Transfer_Type__c, Rate__c, Day_Number__c
             FROM Transfer__c WHERE Trip__c = '${trip.Id}' ORDER BY Day_Number__c`,
          ),
        ]);
        return {
          trip,
          services: services.records,
          accommodations: accommodations.records,
          transfers: transfers.records,
        };
      }),
    );

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(detailedTrips, null, 2),
      }],
    };
  },
);

// === REPORTING ==============================================================

server.tool(
  "pipeline_report",
  "Generate a pipeline report: trips by status, revenue, and advisor breakdown.",
  {
    date_from: z.string().optional().describe("Start date (YYYY-MM-DD)"),
    date_to: z.string().optional().describe("End date (YYYY-MM-DD)"),
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

// === SOQL ESCAPE HATCH ======================================================

server.tool(
  "run_soql",
  "Run a custom read-only SOQL query for ad-hoc reporting or data exploration.",
  {
    query: z.string().describe("SOQL query (SELECT only)"),
  },
  async ({ query }) => {
    const sf = await getConnection();
    const upper = query.toUpperCase().trim();
    if (!upper.startsWith("SELECT")) {
      return { content: [{ type: "text" as const, text: "Error: Only SELECT queries are allowed." }] };
    }
    const result = await sf.query(query);
    return { content: [{ type: "text" as const, text: JSON.stringify(result.records, null, 2) }] };
  },
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Salesforce Travel MCP server v0.2.0 running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
