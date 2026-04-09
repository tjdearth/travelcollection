# Brief to Proposal

## Metadata
name: brief-to-proposal
version: 1.0.0
trigger: When the advisor receives an agent brief and needs to build a matching proposal/itinerary

## Instructions

You translate travel agent briefs into complete itinerary proposals. This is the core advisor workflow.

### The Workflow

```
Agent sends brief (Gmail) → Glass parses requirements → Builds matching proposal (Salesforce) → Advisor reviews → Glass drafts reply (Gmail)
```

### Step 1: Parse the Brief

Read the agent's email with read_email or read_thread. Extract every requirement into a structured checklist:

- **Travelers**: Names, ages, any special needs mentioned
- **Dates**: Exact or flexible? Note any hard constraints (school holidays, anniversaries)
- **Destinations**: Specific cities or regions, or open to suggestions?
- **Budget**: Per person or total? Does it include flights?
- **Accommodation style**: Luxury, boutique, family-friendly, villa, apartment?
- **Experiences**: What do they want to do? (wine tours, cooking classes, hiking, history, beach)
- **Pace**: Packed schedule or relaxed with free time?
- **Meals**: All-inclusive? Half board? Foodie experiences?
- **Transfers**: Private, shared, self-drive?
- **Special occasions**: Birthdays, anniversaries, honeymoons?
- **Exclusions**: Anything they explicitly don't want

Present this checklist to the advisor: "Here's what I extracted from the brief. Anything I missed or got wrong?"

### Step 2: Check for Gaps

Compare the brief against what you need to build a complete proposal. Common gaps:

- Budget not specified → ask the advisor for their read on it
- Dates flexible but no range given → clarify window
- "Luxury" without specifics → check traveler history for past hotels they liked
- Group composition unclear → ages matter for experiences and room configs

Flag gaps to the advisor. Don't guess — an incomplete proposal wastes everyone's time.

### Step 3: Match to Inventory

Search Salesforce for matching resources:

1. **search_suppliers** — Find preferred hotels, DMCs, guides at the destination
2. **get_traveler_history** — If the travelers have been with TC before, check what they loved
3. Cross-reference brief requirements with supplier capabilities:
   - Family with kids → suppliers with family programs
   - Foodie couple → culinary experience providers, restaurant reservations
   - Adventure seekers → activity providers with safety certifications

### Step 4: Build the Proposal

Structure the itinerary to hit every point in the brief:

```
[TRIP NAME]
[Destination] | [Dates] | [Pax] travelers

DAY 1 — [Date, Day of Week] — Arrival
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Arrival transfer: [Airport] → [Hotel]
  Hotel: [Property Name] — [Room Type]
         Check-in from [time]
  Evening: [Activity or free time]
  Meals: Dinner at [Restaurant] (B/–/D)

DAY 2 — [Date, Day of Week] — [Theme]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Morning: [Experience] with [Supplier] ([Time]-[Time])
  Afternoon: [Activity]
  Evening: [Plans]
  Meals: (B/L/–)

[... continue for each day ...]

ACCOMMODATION SUMMARY
━━━━━━━━━━━━━━━━━━━━
  [Dates]: [Property], [Room Type] — [Nightly Rate]
  [Dates]: [Property], [Room Type] — [Nightly Rate]

PRICING
━━━━━━━
  Accommodation:    $X,XXX
  Experiences:      $X,XXX
  Transfers:        $X,XXX
  Meals included:   $X,XXX
  ─────────────────────────
  Total:            $XX,XXX
  Per person:       $X,XXX

  Includes: [list]
  Excludes: [list]
  
  Valid until: [date]
```

### Step 5: Validate Against the Brief

Before showing the advisor, run a checklist:

- [ ] Every destination in the brief is covered
- [ ] Dates match exactly
- [ ] Pax count and composition match
- [ ] Budget is within range (or deviation is explained)
- [ ] Every requested experience type is included
- [ ] Accommodation style matches what was asked for
- [ ] Special occasions are acknowledged (anniversary dinner, birthday surprise, etc.)
- [ ] Pace matches the brief (not over-scheduled if they said "relaxed")
- [ ] No scheduling conflicts (travel time between locations is realistic)

If anything doesn't match, flag it: "The brief asked for [X] but I couldn't match it because [Y]. Here's what I did instead."

### Step 6: Create in Salesforce

Once the advisor approves:
1. create_trip — Create the Trip__c record with status "Draft"
2. Note the Trip ID — this generates the proposal link for the agent reply

### Key Principles

- **The brief is the spec.** Every element must be addressed. If the brief says "ocean view," don't suggest a garden room even if it's cheaper.
- **Show your work.** When you make choices (this hotel over that one), explain why in terms of the brief.
- **Flag, don't assume.** If the brief is ambiguous, surface it rather than guessing wrong.
- **Pricing transparency.** Agents need to mark up — give clean, itemized numbers.
