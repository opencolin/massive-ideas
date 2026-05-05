# Prototype

This prototype brings the existing Next.js meetup finder into the shared idea catalog.

## Data Model

```ts
type MeetupSearchRequest = {
  city: string;
  topic: string;
  country?: string;
  platforms: Array<"lu.ma" | "meetup" | "eventbrite" | "partiful">;
  max_calendars: number;
};

type DiscoveredUrl = {
  url: string;
  source_tool: "ai_chat_completion" | "web_search";
  query: string;
  classification: "calendar" | "event" | "user" | "discovery" | "unknown";
  confidence: number;
};

type CalendarProfile = {
  name: string;
  url: string;
  organizer?: OrganizerProfile;
  description?: string;
  upcoming_events: EventSummary[];
  past_events: EventSummary[];
  recurrence_score: number;
  topic_score: number;
  total_score: number;
  evidence: Source[];
};

type OrganizerProfile = {
  name?: string;
  handle?: string;
  profile_url?: string;
  socials: string[];
  email?: string;
  email_confidence?: "high" | "medium" | "low";
};
```

## Pipeline

1. Generate varied discovery queries for city/topic/platform.
2. Run source-grounded `ai_chat_completion` prompts.
3. Run localized `web_search` queries.
4. Dedupe URLs and normalize platform-specific handles.
5. Classify each URL.
6. Fetch candidate calendar pages with `web_fetch`.
7. Parse titles, descriptions, event lists, organizer handles, and links.
8. Fetch organizer profiles when public.
9. Score recurrence and topic match.
10. Render results table and CSV export.

## CLI Shape

```bash
massive-ideas run \
  --idea 103 \
  --mode live \
  --input meetup-search.json \
  --out runs/meetups/sf-ai-agents.json
```

Dedicated app follow-on:

```bash
npm run dev
# Open http://localhost:3000
```

## Scoring

Recurrence score:

- Event count.
- Regular naming patterns such as weekly, monthly, demo night, or hackathon.
- Recent upcoming event.
- Multiple past events.

Topic score:

- Topic terms in calendar title.
- Topic terms in event titles.
- Topic terms in description.
- AI-source query match.

## Implementation Notes

The source repo uses Next.js, TypeScript, server actions, SQLite caching, and a sortable results table. This shared starter kit keeps the idea runnable through the generic CLI, while the existing app is the reference for a dedicated UI.
