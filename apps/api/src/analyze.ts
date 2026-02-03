import type { AnalysisResult, AnalyzeRequest } from "@webangle/types";
import { scrape, normalizeUrl } from "@webangle/scraper";
import {
  detectTechStack,
  getPageSpeedMetrics,
  classifySite,
} from "@webangle/analyzer";
import { generateOpportunities } from "@webangle/ai";
import { getCached, setCached } from "./cache.js";

export type AnalyzeOptions = {
  openaiApiKey: string;
};

export async function runAnalysis(
  body: AnalyzeRequest,
  options: AnalyzeOptions
): Promise<AnalysisResult> {
  const url = normalizeUrl(body.url);
  const cached = await getCached(url);
  if (cached) return cached;

  const start = Date.now();
  const scrapeResult = await scrape(url);
  const scrapeDurationMs = Date.now() - start;

  const [techStack, performance, classification] = await Promise.all([
    Promise.resolve(detectTechStack(scrapeResult)),
    getPageSpeedMetrics(url),
    Promise.resolve(classifySite(scrapeResult)),
  ]);

  const contentSummary = [
    `Meta: ${JSON.stringify(scrapeResult.metaTags)}`,
    `CTAs: ${scrapeResult.ctaText.slice(0, 10).join(" | ")}`,
    scrapeResult.footerSnippet ? `Footer: ${scrapeResult.footerSnippet}` : "",
    scrapeResult.headerSnippet ? `Header: ${scrapeResult.headerSnippet}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const opportunities = await generateOpportunities(
    {
      url,
      contact: scrapeResult.contact,
      techStack,
      performance,
      classification,
      contentSummary,
    },
    { apiKey: options.openaiApiKey }
  );

  const result: AnalysisResult = {
    url,
    analyzedAt: new Date().toISOString(),
    contact: scrapeResult.contact,
    techStack,
    performance,
    classification,
    opportunities,
    meta: { scrapeDurationMs, cacheHit: false },
  };

  await setCached(url, result);
  return result;
}
