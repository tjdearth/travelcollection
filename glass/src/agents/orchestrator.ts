/**
 * Glass Orchestrator Agent
 *
 * The main entry point for Glass. Creates a coordinator agent that can
 * delegate to specialist agents (trip planning, reporting, advisor ops)
 * and connects to the Salesforce MCP server for all platform operations.
 *
 * Architecture:
 *   User → Glass Orchestrator → Specialist Agents → Salesforce MCP → SF Platform
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// ---------------------------------------------------------------------------
// Specialist agent definitions
// ---------------------------------------------------------------------------

interface AgentRef {
  id: string;
  version: string;
}

async function createSpecialistAgents(): Promise<{
  tripPlanner: AgentRef;
  reporter: AgentRef;
  advisorOps: AgentRef;
}> {
  const [tripPlanner, reporter, advisorOps] = await Promise.all([
    client.beta.agents.create({
      name: "Trip Planner",
      model: "claude-sonnet-4-6",
      system: `You are the Trip Planner specialist for Travel Collection.

Your job is to help advisors build, modify, and finalize trip itineraries.
You have access to the Salesforce travel management platform through MCP tools.

When planning a trip:
1. Search for the traveler's history and preferences first
2. Identify preferred suppliers at the destination
3. Build the itinerary day-by-day, matching traveler preferences
4. Flag any scheduling conflicts or supplier availability issues

Always present itineraries in a clear, day-by-day format with timing,
locations, and supplier details. Include estimated costs when available.`,
      tools: [{ type: "agent_toolset_20260401" }],
    }),

    client.beta.agents.create({
      name: "Reporter",
      model: "claude-sonnet-4-6",
      system: `You are the Reporting specialist for Travel Collection.

Your job is to generate business reports from Salesforce data:
- Pipeline reports (trips by status, revenue forecasting)
- Advisor performance (bookings, revenue, traveler satisfaction)
- Destination analytics (popular routes, seasonal trends)
- Supplier scorecards (ratings, booking volume, issues)

When generating reports:
1. Use the pipeline_report tool or run_soql for custom queries
2. Present data in clear tables with totals and comparisons
3. Highlight notable trends or outliers
4. Include period-over-period comparisons when date ranges allow`,
      tools: [{ type: "agent_toolset_20260401" }],
    }),

    client.beta.agents.create({
      name: "Advisor Ops",
      model: "claude-sonnet-4-6",
      system: `You are the Advisor Operations specialist for Travel Collection.

Your job is to help with day-to-day advisor workflow:
- Look up traveler information and trip details
- Update trip statuses (confirm, complete, cancel)
- Find and vet suppliers for destinations
- Draft communications to travelers and suppliers

When handling requests:
1. Always verify you have the right record before making changes
2. Summarize what you changed and why
3. Flag anything that needs human review (e.g. cancellation policies)`,
      tools: [{ type: "agent_toolset_20260401" }],
    }),
  ]);

  return {
    tripPlanner: { id: tripPlanner.id, version: tripPlanner.version },
    reporter: { id: reporter.id, version: reporter.version },
    advisorOps: { id: advisorOps.id, version: advisorOps.version },
  };
}

// ---------------------------------------------------------------------------
// Environment — production container config
// ---------------------------------------------------------------------------

async function createEnvironment() {
  return client.beta.environments.create({
    name: "glass-prod",
    config: {
      type: "cloud",
      packages: {
        npm: ["jsforce", "@modelcontextprotocol/sdk", "zod"],
      },
      networking: {
        type: "limited",
        allowed_hosts: [
          "login.salesforce.com",
          "*.salesforce.com",
          "*.force.com",
        ],
        allow_mcp_servers: true,
        allow_package_managers: true,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Glass orchestrator
// ---------------------------------------------------------------------------

export async function createGlassAgent() {
  const [specialists, environment] = await Promise.all([
    createSpecialistAgents(),
    createEnvironment(),
  ]);

  const orchestrator = await client.beta.agents.create({
    name: "Glass",
    model: "claude-sonnet-4-6",
    system: `You are Glass, the AI assistant for Travel Collection's travel management platform.

You coordinate a team of specialist agents to help travel advisors work faster:

- **Trip Planner**: Building and modifying itineraries, finding suppliers, crafting experiences
- **Reporter**: Pipeline reports, advisor performance, destination analytics, revenue forecasting
- **Advisor Ops**: Day-to-day operations — traveler lookups, status updates, supplier management

## How to route requests

1. Understand the advisor's intent
2. Delegate to the right specialist — don't try to do everything yourself
3. If a request spans multiple domains (e.g. "plan a trip and show me the pipeline impact"),
   delegate to multiple agents in parallel
4. Synthesize results into a clear, actionable response

## Communication style

- Be concise and direct — advisors are busy
- Lead with the answer, then provide supporting detail
- When presenting options, rank them by fit
- Always surface traveler preferences and history when relevant

## What you know

Travel Collection operates as a network of DMCs across 22 countries. You manage
the full lifecycle: lead → trip design → booking → operations → post-trip.
The Salesforce platform tracks trips, travelers, suppliers, accommodations,
experiences, and advisor workflows.`,
    tools: [{ type: "agent_toolset_20260401" }],
    callable_agents: [
      { type: "agent", id: specialists.tripPlanner.id, version: specialists.tripPlanner.version },
      { type: "agent", id: specialists.reporter.id, version: specialists.reporter.version },
      { type: "agent", id: specialists.advisorOps.id, version: specialists.advisorOps.version },
    ],
  });

  return { orchestrator, specialists, environment };
}

// ---------------------------------------------------------------------------
// Session management — start a conversation
// ---------------------------------------------------------------------------

export async function startSession(orchestratorId: string, environmentId: string) {
  const session = await client.beta.sessions.create({
    agent: orchestratorId,
    environment_id: environmentId,
  });

  return session;
}

export async function sendMessage(sessionId: string, message: string) {
  return client.beta.sessions.events.send(sessionId, {
    events: [
      {
        type: "user.message",
        content: [{ type: "text", text: message }],
      },
    ],
  });
}

// ---------------------------------------------------------------------------
// CLI entry point — for local development
// ---------------------------------------------------------------------------

async function main() {
  console.log("Initializing Glass...");

  const { orchestrator, environment } = await createGlassAgent();
  console.log(`Glass agent created: ${orchestrator.id}`);

  const session = await startSession(orchestrator.id, environment.id);
  console.log(`Session started: ${session.id}`);
  console.log("Glass is ready. Send messages via the API or connect the frontend.\n");

  // In dev mode, read from stdin
  if (process.argv.includes("--interactive")) {
    const readline = await import("readline");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    const prompt = () => {
      rl.question("You: ", async (input) => {
        if (input.toLowerCase() === "exit") {
          rl.close();
          return;
        }
        await sendMessage(session.id, input);
        console.log("(Processing... check session events for response)\n");
        prompt();
      });
    };

    prompt();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
