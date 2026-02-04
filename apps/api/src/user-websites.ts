import { PrismaClient } from "../prisma-client/index.js";

const prisma = new PrismaClient();

/** Flattened row for the websites table: search id (for delete), name, URL, emails, socials, scores. */
export interface WebsiteRow {
  id: string;
  name: string;
  url: string;
  emails: string[];
  socials: Record<string, string>;
  overall: number | null;
  performance: number | null;
  style: number | null;
  responsive: number | null;
  content: number | null;
  createdAt: string;
}

function parseEmails(val: unknown): string[] {
  if (Array.isArray(val) && val.every((x) => typeof x === "string")) return val;
  if (typeof val === "string") {
    try {
      const a = JSON.parse(val);
      return Array.isArray(a) ? a.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseSocialLinks(val: unknown): Record<string, string> {
  if (val && typeof val === "object" && !Array.isArray(val))
    return val as Record<string, string>;
  if (typeof val === "string") {
    try {
      const o = JSON.parse(val);
      return o && typeof o === "object" && !Array.isArray(o) ? o : {};
    } catch {
      return {};
    }
  }
  return {};
}

export async function listWebsites(clerkUserId: string): Promise<WebsiteRow[]> {
  const rows = await prisma.websiteSearch.findMany({
    where: { userId: clerkUserId },
    orderBy: { createdAt: "desc" },
    include: { website: true },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.website.name ?? domainName(row.website.url),
    url: row.website.url,
    emails: parseEmails(row.website.emails),
    socials: parseSocialLinks(row.website.socialLinks),
    overall: row.website.overallScore ?? null,
    performance: row.website.performanceScore ?? null,
    style: row.website.styleScore ?? null,
    responsive: row.website.responsiveScore ?? null,
    content: row.website.contentScore ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

function domainName(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") || url;
  } catch {
    return url;
  }
}

/** Create a search record linking the user to the website for this analysis run. */
export async function createWebsiteSearch(
  clerkUserId: string,
  websiteId: string,
  analysisId: string
): Promise<void> {
  await prisma.websiteSearch.create({
    data: {
      userId: clerkUserId,
      websiteId,
      analysisId,
    },
  });
}

/** Delete user's search record by search id. Only the search is removed; Website remains. */
export async function deleteWebsite(clerkUserId: string, searchId: string): Promise<boolean> {
  const row = await prisma.websiteSearch.findFirst({
    where: { id: searchId, userId: clerkUserId },
  });
  if (!row) return false;
  await prisma.websiteSearch.delete({ where: { id: searchId } });
  return true;
}
