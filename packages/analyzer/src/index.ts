import type {
  TechHint,
  TechStack,
  PerformanceMetrics,
  SiteType,
  SiteClassification,
} from "@webangle/types";
import type { ScrapeResult } from "@webangle/types";

/** PageSpeed Insights API response (simplified) */
interface PageSpeedCategory {
  score?: number;
}

interface PageSpeedAudit {
  numericValue?: number;
  displayValue?: string;
}

interface PageSpeedResult {
  lighthouseResult?: {
    categories?: {
      performance?: PageSpeedCategory;
    };
    audits?: {
      "largest-contentful-paint"?: PageSpeedAudit;
      "cumulative-layout-shift"?: PageSpeedAudit;
      "total-blocking-time"?: PageSpeedAudit;
      "interactive"?: PageSpeedAudit;
    };
  };
}

const TECH_PATTERNS: Array<{ hint: TechHint; test: (r: ScrapeResult) => boolean }> = [
  {
    hint: "wordpress",
    test: (r) =>
      /wp-content|wp-includes|wordpress/i.test(r.html) ||
      /wordpress/i.test(r.metaTags["generator"] ?? ""),
  },
  {
    hint: "webflow",
    test: (r) =>
      r.scriptSources.some((s) => /webflow/i.test(s)) ||
      /webflow/i.test(r.html),
  },
  {
    hint: "shopify",
    test: (r) =>
      r.scriptSources.some((s) => /shopify|cdn.shopify/i.test(s)) ||
      /shopify/i.test(r.html),
  },
  {
    hint: "wix",
    test: (r) =>
      r.scriptSources.some((s) => /wix|parastorage/i.test(s)) ||
      /wix\.com/i.test(r.html),
  },
  {
    hint: "react",
    test: (r) =>
      r.scriptSources.some((s) => /react|chunk|main\.(js|ts)/i.test(s)) ||
      /__NEXT_DATA__|react/i.test(r.html),
  },
  {
    hint: "static",
    test: (r) =>
      r.scriptSources.length < 3 &&
      !r.scriptSources.some((s) => /wp-|shopify|webflow|wix/i.test(s)),
  },
];

export function detectTechStack(scrape: ScrapeResult): TechStack {
  const hints: TechHint[] = [];
  for (const { hint, test } of TECH_PATTERNS) {
    if (test(scrape)) hints.push(hint);
  }
  if (hints.length === 0) hints.push("unknown");
  return {
    hints: [...new Set(hints)],
    generator: scrape.metaTags["generator"],
    scriptSources: scrape.scriptSources.slice(0, 30),
  };
}

export async function getPageSpeedMetrics(url: string): Promise<PerformanceMetrics> {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;
  const res = await fetch(apiUrl);
  if (!res.ok) {
    return { mobileScore: 0 };
  }
  const data = (await res.json()) as PageSpeedResult;
  const lh = data.lighthouseResult;
  const score = lh?.categories?.performance?.score;
  const audits = lh?.audits ?? {};
  const lcp = audits["largest-contentful-paint"]?.numericValue;
  const cls = audits["cumulative-layout-shift"]?.numericValue;
  const tbt = audits["total-blocking-time"]?.numericValue;
  const interactive = audits["interactive"]?.numericValue;

  return {
    mobileScore: score != null ? Math.round(score * 100) : 0,
    lcp: lcp != null ? lcp / 1000 : undefined,
    cls: cls != null ? Math.round(cls * 1000) / 1000 : undefined,
    tbt: tbt != null ? Math.round(tbt) : undefined,
    loadTimeApprox: interactive != null ? Math.round(interactive / 1000) : undefined,
  };
}

const SITE_TYPE_KEYWORDS: Partial<Record<SiteType, string[]>> = {
  "local-service": ["contact us", "get a quote", "call now", "service area", "hours"],
  ecommerce: ["add to cart", "buy now", "shop", "checkout", "cart"],
  saas: ["sign up", "login", "pricing", "dashboard", "start free trial"],
  brochure: ["about us", "our services", "learn more", "read more"],
  informational: ["blog", "articles", "news", "resources"],
};

export function classifySite(scrape: ScrapeResult): SiteClassification {
  const text = [
    scrape.footerSnippet ?? "",
    scrape.headerSnippet ?? "",
    scrape.ctaText.join(" "),
    Object.values(scrape.metaTags).join(" "),
  ]
    .join(" ")
    .toLowerCase();

  let best: { type: SiteType; score: number } = { type: "other", score: 0 };
  for (const [siteType, keywords] of Object.entries(SITE_TYPE_KEYWORDS)) {
    if (!keywords) continue;
    const score = keywords.filter((k) => text.includes(k)).length;
    if (score > best.score) {
      best = { type: siteType as SiteType, score };
    }
  }

  const confidence = best.score >= 2 ? 0.8 : best.score === 1 ? 0.5 : 0.3;
  return {
    siteType: best.type,
    confidence,
  };
}
