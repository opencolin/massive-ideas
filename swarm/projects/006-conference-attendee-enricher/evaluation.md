# Evaluation

## Success Criteria

The MVP is successful when a user can provide one conference URL and receive a useful first-pass outreach sheet within 10 minutes, with every enriched row tied back to public source evidence.

## Test Conferences

Use 5 to 8 public conferences across page styles:

| Type | Why |
| --- | --- |
| Large SaaS event | Rich sponsor tiers, many exhibitors |
| Developer conference | Speaker-heavy, technical sessions |
| Security conference | Useful ICP and category signals |
| Healthcare conference | Compliance-sensitive pages and varied organization names |
| Regional startup event | Smaller pages, weaker markup |
| International event | Tests country/city rendering and language variance |

Do not use private attendee portals or pages requiring login.

## Metrics

### Discovery

- Sponsor/exhibitor page recall: percentage of obvious public sponsor/exhibitor pages found.
- Speaker/agenda page recall: percentage of obvious public speaker or agenda pages found.
- Block rate: percentage of target pages that fail due to captcha, rendering, or access issues.
- Time to first export: wall-clock time from URL input to CSV.

### Extraction

Sample 50 rows per conference and manually label:

- Entity precision: extracted row is a real sponsor, exhibitor, speaker, partner, or session participant.
- Entity type accuracy: `company` vs `person` is correct.
- Employer accuracy: speaker employer is correct when present.
- Tier/title accuracy: sponsor tier or speaker title is correct when present.
- Source support rate: snippet and URL directly support the row.

Target MVP thresholds:

- Entity precision: 90%+
- Entity type accuracy: 95%+
- Employer accuracy: 85%+
- Source support rate: 95%+

### Enrichment

For rows with inferred domains and scored fit:

- Domain precision: inferred domain is correct.
- Signal usefulness: signals are specific enough to explain the row.
- Fit score calibration: high scores match the ICP better than low scores.
- Outreach angle usefulness: angle is specific, concise, and source-supported.

Target MVP thresholds:

- Domain precision: 85%+
- Signal usefulness: 80%+
- Fit score pairwise accuracy: 75%+ on sampled high-vs-low comparisons.
- Outreach angle usefulness: 75%+

## Golden Fixture Tests

Build local fixtures before using live pages:

| Fixture | Expected Result |
| --- | --- |
| `sponsors.html` | Extract sponsor companies, tier labels, booth numbers, category text |
| `speakers.html` | Extract person rows plus employer company rows when employer is explicit |
| `agenda.html` | Extract companies and topics from session metadata |
| `ambiguous-companies.html` | Avoid guessing domains for same-name companies |
| `sponsor-media-partners.html` | Keep low ICP scores for media/community partners when ICP targets buyers |

Assertions:

- JSON schema validates.
- Duplicate normalized company names collapse into one company row.
- Person rows preserve the original speaker source URL.
- Every row has `conference_source_url` and `source_snippet`.
- No email, phone, or private attendee fields are generated.

## Live Run Review Checklist

For each conference run:

- Are the discovered URLs official conference URLs?
- Did the crawler miss an obvious sponsor, exhibitor, speaker, or agenda page?
- Are rows traceable to public pages?
- Are low-confidence domains left blank instead of guessed?
- Are scores explainable from the ICP and signals?
- Are non-buyer entities such as media partners, venues, and agencies down-scored when appropriate?

## Failure Modes

- JS-rendered pages return navigation text but not cards: retry `web_fetch` with rendering wait or scroll settings.
- Captcha is solved but content remains blocked: mark URL blocked and continue with SERP snippets.
- Infinite agenda filters create too many URLs: cap by path pattern and prefer pages with dense entity text.
- The same company appears as sponsor, exhibitor, and speaker employer: merge company row while retaining multiple source URLs.
- Speaker name is confused with company name: require title/employer context for person rows.
- Domain inference picks a similarly named company: require official website or strong search-result evidence.

## Manual Evaluation Template

```csv
conference,row_id,field,error_type,notes
example-ai-summit,17,domain,wrong_domain,"Picked VectorForge Labs instead of VectorForge AI"
example-ai-summit,22,fit_score,over_scored,"Media partner scored 88 despite ICP targeting buyers"
example-ai-summit,31,source_snippet,unsupported,"Snippet only has session title, not company"
```

## Go/No-Go

Ship the MVP if:

- At least 5 live conferences complete without manual intervention.
- Average entity precision is at least 90%.
- Domain precision is at least 85% on rows where a domain is emitted.
- The export is useful enough that a GTM user can identify top 25 accounts without reading the raw pages.

Do not ship if:

- The tool routinely invents domains or employers.
- Captcha/block handling stops whole runs instead of degrading gracefully.
- Rows lack source evidence.
- The output encourages outreach to private attendee identities not present on public pages.
