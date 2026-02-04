import type {
  AnalysisResult,
  AnalyzeRequest,
  ContactData,
  ScrapeResult,
} from "@webangle/types";
import { scrape, normalizeUrl, extractInternalLinks } from "@webangle/scraper";
import { renderPage } from "@webangle/renderer";
import {
  detectTechStack,
  getPageSpeedMetrics,
  classifySite,
} from "@webangle/analyzer";
import { generateOpportunities } from "@webangle/ai";
import { scoreStyles } from "@webangle/style-analyzer";
import type { StyleSignals } from "@webangle/style-analyzer";
import { randomUUID } from "node:crypto";
import { getCached, setCached } from "./cache.js";
import { logger } from "./logger.js";

export type RunAnalysisResult = {
  result: AnalysisResult;
  analysisId: string;
  websiteId: string;
};

/** Detect HTML shell only (SPA before hydration). */
function isHtmlShell(homepage: ScrapeResult): boolean {
  const visible = homepage.visibleText ?? "";
  return (
    visible.length < 200 ||
    /enable\s+JavaScript|enable JavaScript to run this app/i.test(visible)
  );
}

/** Same-origin paths we crawl for contact + content (opinionated, not recursive). */
const IMPORTANT_PATHS = [
  "/contact",
  "/about",
  "/about-us",
  "/services",
  "/pricing",
  "/work",
  "/portfolio",
];

export type AnalyzeOptions = {
  openaiApiKey: string;
};

type PageData = ScrapeResult & { url: string };

function mergeContacts(pages: PageData[]): ContactData {
  const emails = new Set<string>();
  const phones = new Set<string>();
  const socialLinks: Record<string, string> = {};

  for (const page of pages) {
    page.contact.emails.forEach((e) => emails.add(e));
    page.contact.phones.forEach((p) => phones.add(p));
    Object.assign(socialLinks, page.contact.socialLinks);
  }

  return {
    emails: [...emails],
    phones: [...phones],
    socialLinks,
  };
}

/** Treat 0 or missing as "no reliable data"; use fallback so one bad metric doesn't poison overall score. */
function normalizeScore(
  value: number | null | undefined,
  fallback = 70
): number {
  if (typeof value !== "number") return fallback;
  if (value <= 0) return fallback;
  return value;
}

function scoreResponsive(r: {
  hasViewportMeta: boolean;
  hasHorizontalOverflow: boolean;
}): number {
  let score = 100;
  if (!r.hasViewportMeta) score -= 30;
  if (r.hasHorizontalOverflow) score -= 40;
  return Math.max(score, 50);
}

function summarizeScrape(url: string, s: ScrapeResult): Record<string, unknown> {
  return {
    url,
    htmlLength: s.html?.length ?? 0,
    emails: s.contact?.emails?.length ?? 0,
    phones: s.contact?.phones?.length ?? 0,
    socialKeys: Object.keys(s.contact?.socialLinks ?? {}),
    ctaCount: s.ctaText?.length ?? 0,
    visibleTextLength: s.visibleText?.length ?? 0,
    hasTitle: !!s.metaTags?.title,
  };
}

export async function runAnalysis(
  body: AnalyzeRequest,
  options: AnalyzeOptions
): Promise<RunAnalysisResult> {
  const rawUrl = body.url;
  const url = normalizeUrl(rawUrl);
  const analysisId = randomUUID();

  logger.info("analyze:start", "Analysis started", {
    rawUrl,
    normalizedUrl: url,
    analysisId,
  });

  const cached = await getCached(url);
  if (cached) {
    logger.info("analyze:cache", "Cache hit, returning cached result", {
      url,
      opportunitiesCount: cached.result.opportunities?.length ?? 0,
    });
    return {
      result: cached.result,
      analysisId,
      websiteId: cached.websiteId,
    };
  }
  logger.debug("analyze:cache", "Cache miss, running full analysis", { url });

  const start = Date.now();

  // 1. Homepage (fetch first)
  let homepage: ScrapeResult;
  try {
    logger.debug("analyze:scrape:homepage", "Fetching homepage", { url });
    homepage = await scrape(url);
    logger.info("analyze:scrape:homepage", "Homepage scrape completed", {
      ...summarizeScrape(url, homepage),
      durationMs: Date.now() - start,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error("analyze:scrape:homepage", "Homepage scrape failed", {
      url,
      error: message,
      stack,
    });
    throw err;
  }

  logger.warn("DEBUG_RENDER_CHECK", "Render detection values", {
    visibleTextLength: homepage.visibleText?.length ?? 0,
    includesEnableJs: (homepage.visibleText ?? "").includes("enable JavaScript"),
  });

  // 2. Conditional render: if HTML shell only (SPA), run headless and re-scrape; extract style signals when we render
  let renderUsed = false;
  let styleSignals: StyleSignals | null = null;
  let styleScore: ReturnType<typeof scoreStyles> | null = null;
  let responsiveScore: number | null = null;

  const needsRender = isHtmlShell(homepage);
  if (needsRender) {
    logger.info("analyze:render", "Detected JS-only site, rendering page", {
      url,
      visibleTextLength: homepage.visibleText?.length ?? 0,
      visibleSnippet: (homepage.visibleText ?? "").slice(0, 80),
    });
    try {
      const renderStart = Date.now();
      const rendered = await renderPage(url);
      renderUsed = true;
      styleSignals = rendered.styleSignals;
      styleScore = scoreStyles(rendered.styleSignals);
      responsiveScore = scoreResponsive(rendered.responsiveSignals);
      logger.info("analyze:render", "Render completed", {
        url,
        htmlLength: rendered.html.length,
        textLength: rendered.text.length,
        styleScore: styleScore.score,
        responsiveScore,
        durationMs: Date.now() - renderStart,
      });
      homepage = await scrape(url, { htmlOverride: rendered.html });
      logger.info("analyze:scrape:homepage", "Re-scraped from rendered HTML", {
        ...summarizeScrape(url, homepage),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn("analyze:render", "Render failed, using HTML shell", {
        url,
        error: message,
      });
      // homepage stays as-is (shell)
    }
  }

  const homepagePage: PageData = { url, ...homepage };

  // 2. Internal links
  const allInternalPaths = extractInternalLinks(homepage.html, url);
  logger.debug("analyze:internal-links", "Internal links extracted", {
    total: allInternalPaths.length,
    paths: allInternalPaths.slice(0, 30),
  });

  const internalPaths = allInternalPaths
    .filter((p) =>
      IMPORTANT_PATHS.some((key) => p === key || p.startsWith(key + "/"))
    )
    .slice(0, 5);

  logger.info("analyze:internal-links", "Filtered to important paths", {
    IMPORTANT_PATHS,
    matched: internalPaths,
    count: internalPaths.length,
  });

  const extraUrls = internalPaths.map((p) => new URL(p, url).toString());
  const extraScrapes = await Promise.all(
    extraUrls.map(async (u) => {
      try {
        const result = await scrape(u);
        logger.debug("analyze:scrape:extra", "Extra page scraped", {
          ...summarizeScrape(u, result),
        });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.warn("analyze:scrape:extra", "Extra page scrape failed", {
          url: u,
          error: message,
        });
        return null;
      }
    })
  );

  const extraPages: PageData[] = extraScrapes
    .map((s, i) => (s ? { url: extraUrls[i], ...s } : null))
    .filter((p): p is PageData => p !== null);

  logger.info("analyze:scrape:extra", "Extra pages summary", {
    requested: extraUrls.length,
    succeeded: extraPages.length,
    failed: extraUrls.length - extraPages.length,
  });

  const pages = [homepagePage, ...extraPages];
  const contact = mergeContacts(pages);
  const scrapeDurationMs = Date.now() - start;

  logger.info("analyze:merge", "Contacts merged", {
    pageCount: pages.length,
    totalEmails: contact.emails.length,
    totalPhones: contact.phones.length,
    socialKeys: Object.keys(contact.socialLinks),
    scrapeDurationMs,
  });

  const [techStack, performance, classification] = await Promise.all([
    Promise.resolve(detectTechStack(homepage, { renderUsed })),
    getPageSpeedMetrics(url),
    Promise.resolve(classifySite(homepage)),
  ]);

  logger.debug("analyze:signals", "Tech and classification", {
    techHints: techStack.hints,
    framework: techStack.framework,
    isDynamic: techStack.isDynamic,
    siteType: classification.siteType,
    confidence: classification.confidence,
    mobileScore: performance.mobileScore,
  });

  // 3. Multi-page context for AI
  const contentSummary = pages
    .map((p) => {
      const title = p.metaTags?.title ?? "";
      const ctas = (p.ctaText ?? []).slice(0, 5).join(" | ");
      const snippet = (p.visibleText ?? "").slice(0, 400);
      return `URL: ${p.url}\nTitle: ${title}\nCTAs: ${ctas}\nSnippet: ${snippet}`;
    })
    .join("\n---\n");

  logger.debug("analyze:content-summary", "Content summary for AI", {
    contentSummaryLength: contentSummary.length,
    snippet: contentSummary.slice(0, 300) + (contentSummary.length > 300 ? "…" : ""),
  });

  const styleContext =
    styleSignals && styleScore
      ? {
          score: styleScore.score,
          notes: styleScore.notes,
          fontCount: styleSignals.fontCount,
          colorCount: styleSignals.colorCount,
          usesCssVariables: styleSignals.usesCssVariables,
        }
      : null;

  const perfScore = normalizeScore(performance.mobileScore, 70);
  const styleFinal = normalizeScore(styleScore?.score, 70);
  const responsiveFinal = normalizeScore(responsiveScore, 70);
  const contentScoreRaw = Math.round(classification.confidence * 100);
  const contentScore = normalizeScore(contentScoreRaw, 70);

  const emptyRawScores = [
    performance.mobileScore == null && "performance",
    styleScore?.score == null && "style",
    responsiveScore == null && "responsive",
  ].filter(Boolean) as string[];
  if (emptyRawScores.length > 0) {
    logger.warn("analyze:score", "Empty score values (using fallback)", {
      url,
      emptyRawScores,
    });
  }

  const overallScore = Math.max(
    Math.round(
      perfScore * 0.4 +
        styleFinal * 0.25 +
        responsiveFinal * 0.15 +
        contentScore * 0.2
    ),
    1
  );

  logger.debug("analyze:score", "Score normalization", {
    raw: {
      mobile: performance.mobileScore,
      style: styleScore?.score,
      responsive: responsiveScore,
      content: contentScoreRaw,
    },
    normalized: {
      mobile: perfScore,
      style: styleFinal,
      responsive: responsiveFinal,
      content: contentScore,
    },
    overallScore,
  });

  let opportunities: AnalysisResult["opportunities"];
  try {
    opportunities = await generateOpportunities(
      {
        url,
        contact,
        techStack,
        performance,
        classification,
        contentSummary,
        style: styleContext,
      },
      { apiKey: options.openaiApiKey }
    );
    logger.info("analyze:ai", "AI opportunities generated", {
      count: opportunities.length,
      ids: opportunities.map((o) => o.id),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error("analyze:ai", "AI generation failed", {
      url,
      error: message,
      stack,
    });
    throw err;
  }

  const result: AnalysisResult = {
    url,
    analyzedAt: new Date().toISOString(),
    contact,
    techStack,
    performance,
    classification,
    opportunities,
    meta: {
      scrapeDurationMs,
      cacheHit: false,
      overallScore,
      scores: {
        performance: perfScore,
        style: styleFinal,
        responsive: responsiveFinal,
        content: contentScore,
        overall: overallScore,
      },
    },
  };

  const websiteId = await setCached(url, result);
  logger.info("analyze:done", "Analysis completed and cached", {
    url,
    totalDurationMs: Date.now() - start,
    opportunitiesCount: result.opportunities.length,
  });

  return { result, analysisId, websiteId };
}
