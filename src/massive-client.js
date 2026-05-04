const DEFAULT_BASE_URL = "https://render.joinmassive.com";
const USER_AGENT = "massive-ideas/0.1.0 (+https://github.com/opencolin/massive-ideas)";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toSearchParams(params) {
  const out = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      for (const item of value) out.append(key, String(item));
    } else {
      out.set(key, String(value));
    }
  }
  return out;
}

function stripHtml(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr|section)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function extractLinks(html, maxResults) {
  const links = [];
  const seen = new Set();
  const hrefRe = /href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = hrefRe.exec(html)) !== null && links.length < maxResults) {
    let url = match[1];
    if (url.startsWith("/url?")) {
      const params = new URLSearchParams(url.slice(5));
      url = params.get("q") ?? params.get("url") ?? url;
    }
    if (!/^https?:\/\//i.test(url)) continue;
    const domain = domainOf(url);
    if (!domain || domain.includes("google.") || domain.includes("gstatic.")) continue;
    const normalized = url.replace(/[#?].*$/, "");
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    links.push({
      position: links.length + 1,
      title: stripHtml(match[2]).slice(0, 140) || domain,
      url,
      snippet: ""
    });
  }

  return links;
}

export class MassiveHttpClient {
  constructor({ token = process.env.MASSIVE_TOKEN, baseUrl = process.env.MASSIVE_API_BASE_URL ?? DEFAULT_BASE_URL } = {}) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  async request(path, params) {
    if (!this.token) {
      throw new Error("MASSIVE_TOKEN is required for live mode. Use --mode mock for offline runs.");
    }

    const url = new URL(path, this.baseUrl);
    url.search = toSearchParams(params).toString();
    let response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "User-Agent": USER_AGENT,
        "X-Source": "massive-ideas/0.1.0"
      }
    });

    if (response.status === 503) {
      await sleep(5000);
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "User-Agent": USER_AGENT,
          "X-Source": "massive-ideas/0.1.0"
        }
      });
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Massive HTTP ${response.status}: ${body.slice(0, 300)}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) return response.json();
    return response.text();
  }

  async accountStatus() {
    const users = await this.request("/users", {});
    const first = Array.isArray(users) ? users[0] : users;
    return {
      credits_remaining: first?.credits ?? null,
      raw: users
    };
  }

  async webFetch({ url, format = "markdown", country, city, device }) {
    const text = await this.request("/browser", { url, format, country, city, device });
    return {
      text,
      structuredContent: {
        url,
        format,
        country,
        city,
        device,
        bytes: Buffer.byteLength(String(text), "utf8")
      },
      sources: [{ kind: "fetched_page", url, title: domainOf(url) }]
    };
  }

  async webSearch({ query, country, city, maxResults = 10 }) {
    const html = await this.request("/search", {
      terms: query,
      country,
      city,
      awaiting: ["ai", "answers"]
    });
    return {
      query,
      organic: extractLinks(html, maxResults),
      ai_overview: null,
      people_also_ask: [],
      raw_html_bytes: Buffer.byteLength(String(html), "utf8")
    };
  }

  async aiChatCompletion({ prompt, model = "chatgpt", country, city }) {
    const body = await this.request("/ai", {
      prompt: prompt.slice(0, 2047),
      model,
      country,
      city,
      format: "json"
    });
    const completion = stripHtml(body?.completion ?? body?.text ?? "");
    const sources = extractLinks(body?.sources ?? "", 12).map((source) => ({
      title: source.title,
      url: source.url
    }));
    return {
      completion,
      sources,
      model: body?.model ?? model,
      subqueries: body?.subqueries
    };
  }
}

export class MockMassiveClient {
  constructor({ now = new Date("2026-05-04T12:00:00.000Z") } = {}) {
    this.now = now;
  }

  async accountStatus() {
    return {
      credits_remaining: 100000,
      mock: true
    };
  }

  async webSearch({ query, country = "US", city = "San Francisco", maxResults = 5 }) {
    const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "research";
    const organic = Array.from({ length: Math.min(maxResults, 5) }, (_, index) => ({
      position: index + 1,
      title: `${query} source ${index + 1}`,
      url: `https://example.com/${slug}/source-${index + 1}`,
      snippet: `Mock ${city}, ${country} search evidence for ${query}.`
    }));

    return {
      query,
      organic,
      ai_overview: {
        text: `Mock overview for ${query}. Verify with fetched sources before treating this as fact.`,
        sources: organic.slice(0, 2).map(({ url }) => ({ domain: domainOf(url), url }))
      },
      people_also_ask: [
        { question: `What evidence matters for ${query}?`, answer: "Fresh official pages and independent third-party sources." }
      ],
      mock: true
    };
  }

  async webFetch({ url, format = "markdown", country = "US", city = "San Francisco", device = "desktop" }) {
    const domain = domainOf(url) || "example.com";
    const text = [
      `# Mock fetch for ${domain}`,
      "",
      `Fetched ${url} as ${format} for ${city}, ${country} on ${device}.`,
      "This deterministic fixture stands in for Massive web_fetch output during local development.",
      "Use --mode live with MASSIVE_TOKEN to fetch real pages."
    ].join("\n");

    return {
      text,
      structuredContent: {
        url,
        format,
        country,
        city,
        device,
        bytes: Buffer.byteLength(text, "utf8")
      },
      sources: [{ kind: "fetched_page", url, title: domain }],
      mock: true
    };
  }

  async aiChatCompletion({ prompt, model = "chatgpt", country = "US", city = "San Francisco" }) {
    const topic = prompt.match(/Idea:\s*(.+)/)?.[1]?.trim() ?? "Massive MCP workflow";
    return {
      completion: [
        `Mock ${model} synthesis for ${topic}.`,
        `Target context: ${city}, ${country}.`,
        "The MVP should collect public evidence, preserve sources, separate facts from inference, score confidence, and export a reviewable report.",
        "Switch to --mode live to ask the real Massive ai_chat_completion endpoint."
      ].join("\n"),
      sources: [
        { title: "Massive docs", url: "https://docs.joinmassive.com/web-render/ai" },
        { title: "Massive dashboard", url: "https://dashboard.joinmassive.com/developer/api-keys" }
      ],
      model,
      mock: true
    };
  }
}

export function createMassiveClient({ mode = "mock" } = {}) {
  if (mode === "live") return new MassiveHttpClient();
  if (mode === "mock") return new MockMassiveClient();
  throw new Error(`Unknown Massive client mode '${mode}'. Expected 'mock' or 'live'.`);
}
