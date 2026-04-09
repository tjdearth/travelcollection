# Destination Skill Generator

## Metadata
name: destination-generator
version: 1.0.0
trigger: When Glass needs to generate or update a destination-specific assembly skill

## Instructions

You generate destination skills by analyzing past delivered trips. These skills
encode how travel actually works in a specific country or region — NOT what
experiences to recommend, but how to assemble a trip operationally.

### How to Generate a Destination Skill

1. Run get_destination_patterns for the destination
2. Run get_similar_proposals with limit: 15-20 to see full trip structures
3. Analyze the patterns to answer these questions:

**Travel Model**
- Is there a guide + driver for the full trip? (Morocco, India, Vietnam)
- Is it point-to-point with discrete transfers? (Japan, Western Europe)
- Is it self-drive? (Iceland, Scotland, Portugal countryside)
- Mixed? (Italy: driver for countryside, walkable in cities)

Evidence: Look at transfer records. If every trip has a "Driver" or "Guide"
service for every day → guide+driver model. If transfers are city-to-city
with specific routes → point-to-point.

**How to Price the Logistics**
- Guide + driver model → per-day rate (guide + driver + vehicle). Don't add individual transfers.
- Point-to-point → individual transfer line items per route.
- Self-drive → car rental per day + fuel estimate.

**Typical Trip Structure**
- How many nights in each location? (Are there common splits like 3+3 or 4+3?)
- What's the common routing? (Marrakech → Atlas → Desert or Tokyo → Hakone → Kyoto?)
- Are there gateway cities with short stays? (1 night in Casablanca, 1 night in Osaka)

**Seasonal Windows**
- Which months have trips? Which don't?
- Any peak/shoulder/off-season pricing patterns?
- Weather-driven constraints? (Monsoon, extreme heat, ski season)

**Operational Quirks**
- Country-specific logistics (Japan: reserve train seats. Morocco: medina access on foot only.)
- Meal patterns (Morocco: most meals with guide. Italy: lunch often independent.)
- Tipping/gratuity norms
- Visa or entry requirements
- Common add-ons that should always be suggested

### Output Format

Generate a SKILL.md file at: `skills/destinations/[country]/SKILL.md`

```markdown
# [Country/Region]

## Metadata
name: destination-[country]
version: 1.0.0
generated_from: [X] delivered trips, [date range]
trigger: When assembling a proposal for [country/region]

## Travel Model
[guide_and_driver | point_to_point | self_drive | mixed]

[2-3 sentences explaining how travel works here, derived from data]

## Assembly Rules

### Logistics Pricing
[How to price the transport/guide layer]

### Typical Structure  
[Common routing, night splits, gateway cities]

### Day Building
[How to structure a day in this destination — full day with guide
vs. discrete blocks vs. flexible]

### Seasonal Constraints
[When to go, when not to, what changes by season]

### Operational Notes
[Country-specific things Glass must know]

## Derived From
- [X] completed trips analyzed
- Date range: [earliest] to [latest]
- Average trip: [X] nights, [X] pax, $[X] total
- Most common services: [top 5]
- Most common hotels: [top 3]
- Most common routes: [top 3 transfer patterns]
```

### Validation

After generating a skill, validate it:
1. Take 3 past briefs for this destination
2. Assemble proposals using only the generated skill's rules
3. Compare to what was actually delivered
4. If the diff is consistently small → skill is ready
5. If the diff is large → identify what rule is missing or wrong, update, re-validate

### Maintenance

Destination skills should be regenerated periodically (quarterly) or when:
- A new supplier/service is added at a destination
- An advisor flags that Glass is consistently getting something wrong for this destination
- Seasonal patterns change (new hotel opens, supplier stops operating)

### Key Principles

- **Derive from data, not assumptions.** Every rule must be supported by patterns in delivered trips.
- **Encode operations, not creativity.** The skill says "you need a guide every day in Morocco."
  It does NOT say "suggest a cooking class." That's the advisor's judgment + brief matching.
- **Flag low-confidence rules.** If you only have 5 trips for a destination, say so.
  The skill is provisional until you have 15+ trips to validate against.
