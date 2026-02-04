import { PrismaClient } from "../prisma-client/index.js";
import type { AnalysisResult } from "@webangle/types";

const TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

const prisma = new PrismaClient();

export function normalizeUrlForDb(url: string): string {
  try {
    const u = new URL(url);
    u.search = "";
    u.hash = "";
    const path = u.pathname.replace(/\/$/, "") || "/";
    return `${u.origin}${path}`;
  } catch {
    return url;
  }
}

export type CachedAnalysis = { result: AnalysisResult; websiteId: string };

/** Returns cached result and websiteId if found and not stale; otherwise null. */
export async function getCached(keyUrl: string): Promise<CachedAnalysis | null> {
  const key = normalizeUrlForDb(keyUrl);
  const row = await prisma.website.findUnique({
    where: { url: key },
    select: { id: true, result: true, lastAnalyzedAt: true },
  });
  if (!row || !row.result) return null;
  const age = row.lastAnalyzedAt
    ? Date.now() - row.lastAnalyzedAt.getTime()
    : Infinity;
  if (age > TTL_MS) return null;
  const result = JSON.parse(row.result) as AnalysisResult;
  return {
    result: {
      ...result,
      meta: { ...result.meta, cacheHit: true },
    },
    websiteId: row.id,
  };
}

/** Fetch full analysis by URL (for GET /analyze). No TTL check. */
export async function getAnalysisByUrl(url: string): Promise<AnalysisResult | null> {
  const key = normalizeUrlForDb(url);
  const row = await prisma.website.findUnique({
    where: { url: key },
    select: { result: true },
  });
  if (!row?.result) return null;
  return JSON.parse(row.result) as AnalysisResult;
}

function scoresToInt(v: number | null | undefined): number | null {
  if (v == null || typeof v !== "number") return null;
  const n = Math.round(v);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
}

/**
 * Upsert Website by normalized URL: create or update scores, result, analysisCount, lastAnalyzedAt.
 * Returns websiteId for creating WebsiteSearch.
 */
export async function setCached(keyUrl: string, result: AnalysisResult): Promise<string> {
  const key = normalizeUrlForDb(keyUrl);
  const resultJson = JSON.stringify(result);
  const s = result.meta?.scores;
  const now = new Date();
  const name =
    (result as { meta?: { title?: string } }).meta?.title ?? domainName(key);
  const emailsJson = JSON.stringify(result.contact?.emails ?? []);
  const socialLinksJson = JSON.stringify(result.contact?.socialLinks ?? {});

  const existing = await prisma.website.findUnique({ where: { url: key } });
  if (existing) {
    await prisma.website.update({
      where: { id: existing.id },
      data: {
        name,
        emails: emailsJson,
        socialLinks: socialLinksJson,
        overallScore: scoresToInt(s?.overall),
        performanceScore: scoresToInt(s?.performance),
        styleScore: scoresToInt(s?.style),
        responsiveScore: scoresToInt(s?.responsive),
        contentScore: scoresToInt(s?.content),
        analysisCount: existing.analysisCount + 1,
        lastAnalyzedAt: now,
        result: resultJson,
      },
    });
    return existing.id;
  }
  const created = await prisma.website.create({
    data: {
      url: key,
      name,
      emails: emailsJson,
      socialLinks: socialLinksJson,
      overallScore: scoresToInt(s?.overall),
      performanceScore: scoresToInt(s?.performance),
      styleScore: scoresToInt(s?.style),
      responsiveScore: scoresToInt(s?.responsive),
      contentScore: scoresToInt(s?.content),
      analysisCount: 1,
      lastAnalyzedAt: now,
      result: resultJson,
    },
  });
  return created.id;
}

function domainName(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") || url;
  } catch {
    return url;
  }
}
