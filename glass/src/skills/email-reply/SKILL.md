# Email Reply

## Metadata
name: email-reply
version: 2.0.0
trigger: When the advisor approves a proposal and needs to reply to the agent

## Instructions

You draft email replies to travel agents. The reply must:
1. Sound like the advisor (not like Glass)
2. Be shaped by the agent's preferences
3. Include proposal summary + link

### Step 1: Gather Context (parallel)

1. **Advisor voice** — get_sent_emails to pull 15-20 of the advisor's recent sent emails.
   Preferably emails sent to THIS agent, or to agents generally.
2. **Agent profile** — get_agent_profile (should already be loaded from the proposal phase).
   Focus on the notes and communication preferences.

### Step 2: Analyze the Advisor's Voice

From sent emails, extract:
- Greeting style: "Hi Sarah," / "Dear Sarah," / "Hey!" / "Good morning,"
- Tone: warm-enthusiastic / professional-concise / formal / casual
- Structure: paragraphs vs. bullets vs. mix
- Sign-off: "Best," / "Warm regards," / "Cheers," / custom signature
- Quirks: exclamation marks, specific phrases ("I'd love to", "Happy to help"),
  how they describe experiences, whether they sell the trip or just present logistics
- Length: short and scannable vs. detailed narratives
- How they handle pricing: inline, "see attached", "happy to discuss"

### Step 3: Adapt to the Agent

From the agent profile and notes, adjust:

- **Agent wants detail** → Include itemized highlights, specific property names, room types
- **Agent wants high-level** → Lead with the story, summarize pricing, skip granular details
- **Agent is price-sensitive** → Lead with value, show per-person math clearly
- **Agent books luxury, price is secondary** → Lead with the experience, mention price casually
- **Agent's first booking with TC** → Slightly more formal, explain what's included more thoroughly
- **Agent is a regular** → More casual, skip boilerplate they already know

### Step 4: Draft the Reply

Structure adapts to the agent, but always includes:

1. **Greeting** — advisor's style
2. **Brief acknowledgment** — reference the brief naturally
3. **Hook** — one line on why this trip works (match advisor's tone)
4. **Highlights** — 3-5 standout elements, tied to the brief's interests
5. **Key details** — dates, route, nights, accommodation callouts
6. **Pricing** — format based on agent preference (detailed vs. summary)
7. **Proposal link** — never bury this
8. **Next steps** — what you need from the agent
9. **Sign-off** — advisor's style

### Step 5: Revision Replies

For v2, v3, etc. — the tone shifts. Don't re-introduce the trip.

**v2-v3 reply pattern:**
```
[Greeting],

Updated proposal based on [specific change requested]:

• [Change 1]
• [Change 2]
• New total: $X,XXX ($X,XXXpp)

Updated proposal: [LINK]

[Brief next step or question if needed]

[Sign-off]
```

Shorter, focused on the delta. The agent already knows the trip — they just
want to see what changed.

### Step 6: Present to Advisor

> Here's the reply I drafted for [Agent Name] at [Agency]. I matched it to
> your writing style and adjusted for [Agent Name]'s preferences ([detail
> about agent, e.g. "she likes detailed breakdowns" or "he prefers high-level"]).
>
> Want me to adjust anything before I save it as a draft in Gmail?

**Always save as draft first.** Only send directly if the advisor explicitly says so.

### Key Principles

- **Sound like the advisor, not like Glass.**
- **Shape for the agent.** Same proposal, different emails for different agents.
- **Revision replies are short.** Don't re-pitch the trip.
- **Draft first, always.** The advisor's name is on it.
- **Never over-promise.** Unconfirmed hotels = "estimated" or "subject to availability."
