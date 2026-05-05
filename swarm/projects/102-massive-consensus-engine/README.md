# Massive Consensus Engine

MVP for a multi-LLM consensus and lead-enrichment engine based on [`opencolin/massive-consensus`](https://github.com/opencolin/massive-consensus). It queries four assistants, compares answers and sources, and flags disagreement or hallucination risk.

The useful framing is simple: do not trust one model for high-stakes research. Ask all four, trust answers with sourced agreement, and escalate disagreement to a human reviewer.

## Target User

Sales, research, diligence, and data-enrichment teams that need source-backed answers and visible disagreement flags.

## Core Workflow

1. User provides a research prompt or a batch of companies.
2. Runner checks `account_status`.
3. `ai_chat_completion` fans out across selected models.
4. Normalizer strips HTML/chrome from model answers and parses sources.
5. Consensus layer compares:
   - Answer overlap
   - Source-domain overlap
   - Structured field agreement
   - Missing or low-source responses
6. Report displays model-by-model answers and a consensus summary.
7. Lead-enrichment mode votes per field and flags disagreement.

## MVP Inputs

```json
{
  "prompt": "What does Browserbase do, who founded it, and what evidence supports that?",
  "models": ["chatgpt", "gemini", "perplexity", "copilot"],
  "fastest_n": 3,
  "require_sources": true,
  "output_schema": {
    "company": "string",
    "one_line_pitch": "string",
    "founders": "string[]",
    "hq_city": "string",
    "is_hiring": "yes|no|unknown"
  }
}
```

## MVP Output

```json
{
  "prompt": "What does Browserbase do?",
  "answers": [
    {
      "model": "perplexity",
      "answer": "Browserbase provides browser infrastructure for AI agents.",
      "sources": [{ "url": "https://browserbase.com" }],
      "latency_ms": 18000
    }
  ],
  "consensus": {
    "agreement_level": "partial",
    "agreed_claims": ["Browserbase provides browser infrastructure."],
    "disputed_claims": ["Founder list differs across models."],
    "source_domain_overlap": ["browserbase.com"],
    "needs_human_review": true
  }
}
```

## Massive MCP Usage

- `account_status`: preflight credit budget before fanout.
- `ai_chat_completion`: query multiple assistants through one Massive surface.
- `web_fetch`: verify high-confidence claims against official pages.
- `web_search`: collect independent evidence when model sources disagree.

## Guardrails

- Consensus is not truth; shared model error can still be wrong.
- Show model disagreement before the synthesized answer.
- Cite source-domain overlap separately from answer overlap.
- Treat source-less answers as lower confidence.
- Preserve raw model responses for audit and prompt iteration.

## Next Build Steps

- Promote `ai_chat_compare` into the shared runner as a first-class operation.
- Add structured-field voting for batch enrichment.
- Add timeout controls and fastest-N completion behavior.
- Add disagreement review exports for spreadsheets.
