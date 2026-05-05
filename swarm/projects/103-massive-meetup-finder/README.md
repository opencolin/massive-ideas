# Massive Meetup Finder

MVP for a city/topic meetup calendar finder based on [`opencolin/massive-meetup`](https://github.com/opencolin/massive-meetup). It discovers recurring Luma calendars, enriches organizers and events, scores fit, and exports a ranked table.

The existing app focuses on London and San Francisco AI engineers, AI agents, and hackathons, but the product shape works for any city and topic.

## Target User

Developer relations, community, partnerships, recruiting, and founder-led growth teams looking for active local event organizers.

## Core Workflow

1. User enters a city and topic.
2. Discovery fans out across `ai_chat_completion` and `web_search` queries to find Luma URLs.
3. Classifier separates calendars, events, users, and discovery pages.
4. `web_fetch` renders calendar pages as Markdown.
5. Parser extracts organizer, description, upcoming events, past events, and relevant links.
6. Organizer enrichment fetches public `lu.ma/u/<handle>` pages for socials and visible contact info.
7. Scorer ranks calendars by recurrence and topic match.
8. UI displays a sortable table and CSV export.

## MVP Inputs

```json
{
  "city": "San Francisco",
  "topic": "AI agents hackathons",
  "platforms": ["lu.ma"],
  "max_calendars": 20,
  "country": "US"
}
```

## MVP Output

```json
{
  "city": "San Francisco",
  "topic": "AI agents hackathons",
  "calendars": [
    {
      "name": "AI Builders SF",
      "url": "https://lu.ma/example",
      "organizer": "Example Organizer",
      "recurrence_score": 82,
      "topic_score": 76,
      "upcoming_events": 3,
      "past_events": 12,
      "contact": {
        "email": "visible@example.com",
        "confidence": "high",
        "source": "public profile"
      }
    }
  ]
}
```

## Massive MCP Usage

- `account_status`: preflight credit budget for search and enrichment.
- `ai_chat_completion`: use source-grounded answers to discover relevant calendars.
- `web_search`: backstop discovery with localized Google results.
- `web_fetch`: render Luma calendar and organizer pages as Markdown.

## Guardrails

- Use only public calendar, event, and organizer profile pages.
- Label inferred or AI-sourced contact details as low confidence.
- Do not automate outreach; export reviewable contact context only.
- Keep source URLs and search logs visible.
- Avoid treating event count as proof of quality.

## Next Build Steps

- Extend beyond Luma to Meetup, Eventbrite, Partiful, and venue calendars.
- Add streaming progress for long searches.
- Add saved searches and scheduled refresh.
- Add team notes and outreach-status tracking.
