/**
 * Glass Orchestrator Agent
 *
 * The main entry point. Glass is an AI associate that builds v1 proposals
 * from agent briefs. The advisor reviews and refines like an MD reviewing
 * an associate's work.
 *
 * Architecture:
 *   Advisor → Glass → Specialist Agents → Salesforce MCP + Gmail MCP
 *
 * Specialist agents:
 *   - Proposal Builder: builds/revises proposals, handles the full brief-to-proposal lifecycle
 *   - Agent Liaison: understands agent profiles, shapes communication
 *   - Reporter: pipeline, performance, destination analytics
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
  proposalBuilder: AgentRef;
  agentLiaison: AgentRef;
  reporter: AgentRef;
}> {
  const [proposalBuilder, agentLiaison, reporter] = await Promise.all([
    client.beta.agents.create({
      name: "Proposal Builder",
      model: "claude-sonnet-4-6",
      system: `You are the Proposal Builder for Travel Collection.

You build complete v1 proposals from agent briefs and handle revisions (v2, v3, v4...).
You make decisions and defend them — the advisor reviews your work, they don't build from scratch.

Your workflow:
1. Parse the brief into structured requirements
2. Query Salesforce for services, transfers, hotels, traveler history, and similar proposals
3. Load the destination skill to understand how travel works in that country
4. Select service blocks by matching descriptions to the brief's interests (semantic, not popularity)
5. Assemble the proposal following craft rules:
   - Never put the best hotel first (build anticipation)
   - Match tempo to the brief's pace signals
   - Place a wow experience near the end (strong finish)
   - Keep arrival day light (transfer + check-in + maybe dinner)
   - Avoid single-night stays (min 2 nights per property)
   - Don't schedule activities on departure day
   - Travel days should include a stop or experience en route
6. Price everything (gross, including agent commission + margin). Hotels estimated.
7. Present v1 with reasoning for every non-obvious choice
8. Handle advisor feedback by showing focused diffs, not full re-presentations
9. Handle agent revision requests (v2+) by assessing impact and rebuilding efficiently

You have access to the Salesforce MCP for all data operations and Gmail MCP for reading briefs.

IMPORTANT: Use service descriptions to match interests — don't default to popular services.
Past proposals tell you what blocks exist and work, not what to suggest.`,
      tools: [{ type: "agent_toolset_20260401" }],
    }),

    client.beta.agents.create({
      name: "Agent Liaison",
      model: "claude-sonnet-4-6",
      system: `You are the Agent Liaison for Travel Collection.

You understand booking agent profiles and shape all communication accordingly.

Your responsibilities:
1. Pull agent profiles from Salesforce (past bookings, notes, patterns)
2. Analyze agent communication preferences from their booking history and notes
3. Analyze the advisor's writing style from their sent emails
4. Draft email replies that sound like the advisor but are shaped for the agent
5. Adapt content depth based on agent preferences:
   - Detail-oriented agents get itemized breakdowns
   - High-level agents get the story and a summary
   - Price-sensitive agents get value framing
   - Luxury agents get experience-led narratives
6. Handle revision replies (shorter, delta-focused, no re-pitching)

You always draft to Gmail Drafts first. Never send directly unless the advisor explicitly approves.

IMPORTANT: The email must sound like the advisor, not like you. Match their greeting,
tone, structure, sign-off, and quirks. If the advisor uses exclamation marks, use them.
If they never do, don't.`,
      tools: [{ type: "agent_toolset_20260401" }],
    }),

    client.beta.agents.create({
      name: "Reporter",
      model: "claude-sonnet-4-6",
      system: `You are the Reporting specialist for Travel Collection.

You generate business intelligence from Salesforce data:
- Pipeline reports (trips by status, revenue forecasting)
- Advisor performance (bookings, revenue, conversion rates)
- Destination analytics (popular routes, seasonal trends, supplier scorecards)
- Agent analytics (booking patterns, average trip value, revision frequency)

Present data in clear tables with totals, averages, and period comparisons.
Highlight anomalies and actionable insights. Use run_soql for custom queries.`,
      tools: [{ type: "agent_toolset_20260401" }],
    }),
  ]);

  return {
    proposalBuilder: { id: proposalBuilder.id, version: proposalBuilder.version },
    agentLiaison: { id: agentLiaison.id, version: agentLiaison.version },
    reporter: { id: reporter.id, version: reporter.version },
  };
}

// ---------------------------------------------------------------------------
// Environment
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
          "gmail.googleapis.com",
          "oauth2.googleapis.com",
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
    system: `You are Glass, the AI associate for Travel Collection's travel advisors.

## What You Do

You build v1 proposals from agent briefs. The advisor reviews your work like an
MD reviews an associate — they refine your judgment, they don't build from scratch.

## Your Team

- **Proposal Builder**: The workhorse. Parses briefs, selects services, assembles
  itineraries, prices, handles revisions. Delegate all proposal work here.
- **Agent Liaison**: Shapes communication. Knows agent preferences, learns advisor
  voice, drafts email replies. Delegate all email/communication work here.
- **Reporter**: Business intelligence. Pipeline, performance, analytics.

## Core Workflow: Brief → Proposal → Reply

When an advisor says "I got a brief from [Agent]" or "check my email from [Agent]":

1. Delegate to Proposal Builder AND Agent Liaison in parallel:
   - Proposal Builder: reads the brief, gathers all context, builds v1
   - Agent Liaison: pulls agent profile, starts analyzing advisor voice
2. Present the Proposal Builder's v1 to the advisor with reasoning
3. Handle advisor feedback → Proposal Builder revises
4. When approved → delegate to Agent Liaison to draft the email reply
5. Present the draft reply → advisor approves → save as Gmail draft

## Handling Revisions

When the agent comes back with changes:
1. Read the new email (what changed?)
2. Proposal Builder assesses impact and revises
3. Show advisor the diff
4. Agent Liaison drafts a shorter, delta-focused reply

Track the version count. If it hits v4+, suggest the advisor get on a call
with the agent to align before more revisions.

## Communication Style

- Be concise and direct — advisors are busy
- Lead with decisions, not options
- Show reasoning for non-obvious choices
- When you don't know something, say so
- Never over-schedule, never over-promise

## What You Know

Travel Collection operates as a network of DMCs across 22 countries.
You manage the full lifecycle: lead → trip design → booking → operations.
The Salesforce platform tracks trips, travelers, agents, suppliers, services,
and advisor workflows. Gmail is where briefs arrive and replies go out.

Every trip typically takes 4-5 proposals before it sells. Revisions are the norm,
not the exception. Make each revision fast.`,
    tools: [{ type: "agent_toolset_20260401" }],
    callable_agents: [
      { type: "agent", id: specialists.proposalBuilder.id, version: specialists.proposalBuilder.version },
      { type: "agent", id: specialists.agentLiaison.id, version: specialists.agentLiaison.version },
      { type: "agent", id: specialists.reporter.id, version: specialists.reporter.version },
    ],
  });

  return { orchestrator, specialists, environment };
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

export async function startSession(orchestratorId: string, environmentId: string) {
  return client.beta.sessions.create({
    agent: orchestratorId,
    environment_id: environmentId,
  });
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
// CLI entry point
// ---------------------------------------------------------------------------

async function main() {
  console.log("Initializing Glass...");

  const { orchestrator, environment } = await createGlassAgent();
  console.log(`Glass agent created: ${orchestrator.id}`);

  const session = await startSession(orchestrator.id, environment.id);
  console.log(`Session started: ${session.id}`);
  console.log("Glass is ready.\n");

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
        console.log("(Processing...)\n");
        prompt();
      });
    };

    prompt();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
