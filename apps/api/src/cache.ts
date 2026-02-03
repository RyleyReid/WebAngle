import { PrismaClient } from "@prisma/client";
import type { AnalysisResult } from "@webangle/types";

const TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

const prisma = new PrismaClient();

function hashUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.origin + u.pathname.replace(/\/$/, "") || u.origin + "/";
  } catch {
    return url;
  }
}

export async function getCached(keyUrl: string): Promise<AnalysisResult | null> {
  const key = hashUrl(keyUrl);
  const row = await prisma.analysis.findUnique({
    where: { urlKey: key },
    select: { result: true, createdAt: true },
  });
  if (!row) return null;
  const age = Date.now() - row.createdAt.getTime();
  if (age > TTL_MS) {
    await prisma.analysis.delete({ where: { urlKey: key } });
    return null;
  }
  const result = JSON.parse(row.result) as AnalysisResult;
  return {
    ...result,
    meta: { ...result.meta, cacheHit: true },
  };
}

export async function setCached(keyUrl: string, result: AnalysisResult): Promise<void> {
  const key = hashUrl(keyUrl);
  const resultJson = JSON.stringify(result);
  await prisma.analysis.upsert({
    where: { urlKey: key },
    create: {
      urlKey: key,
      url: keyUrl,
      result: resultJson,
      createdAt: new Date(),
    },
    update: {
      url: keyUrl,
      result: resultJson,
      createdAt: new Date(),
    },
  });
}
