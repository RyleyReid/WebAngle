import * as cheerio from "cheerio";
import type { ContactData, ScrapeResult } from "@webangle/types";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;

const SOCIAL_DOMAINS: Record<string, string> = {
  "facebook.com": "facebook",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "linkedin.com": "linkedin",
  "instagram.com": "instagram",
  "youtube.com": "youtube",
  "tiktok.com": "tiktok",
};

function extractEmails(text: string): string[] {
  const matches = text.match(EMAIL_REGEX) ?? [];
  return [...new Set(matches)];
}

function extractPhones(text: string): string[] {
  const matches = text.match(PHONE_REGEX) ?? [];
  return [...new Set(matches)].slice(0, 5);
}

function extractSocialLinks($: cheerio.CheerioAPI): Record<string, string> {
  const out: Record<string, string> = {};
  $('a[href]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    for (const [domain, key] of Object.entries(SOCIAL_DOMAINS)) {
      if (href.includes(domain) && !out[key]) {
        out[key] = href;
        break;
      }
    }
  });
  return out;
}

function extractMailtos($: cheerio.CheerioAPI): string[] {
  const emails: string[] = [];
  $('a[href^="mailto:"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const addr = href.replace(/^mailto:/i, "").split(/[?&]/)[0]?.trim();
    if (addr && addr.includes("@")) emails.push(addr);
  });
  return [...new Set(emails)];
}

/** Normalize URL for fetching (add protocol if missing) */
export function normalizeUrl(input: string): string {
  let url = input.trim();
  if (!/^https?:\/\//i.test(url)) {
    url = "https://" + url;
  }
  try {
    const u = new URL(url);
    return u.origin + (u.pathname === "/" ? "" : u.pathname) + u.search;
  } catch {
    return url;
  }
}

/**
 * Fetch HTML and parse into ScrapeResult (contact, meta, scripts, CTAs).
 */
export async function scrape(url: string): Promise<ScrapeResult> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; WebAngle/1.0; +https://webangle.dev)",
    },
    redirect: "follow",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const bodyText = $("body").text().replace(/\s+/g, " ");
  const mailtos = extractMailtos($);
  const emailsFromText = extractEmails(bodyText);
  const emails = [...new Set([...mailtos, ...emailsFromText])].slice(0, 10);
  const phones = extractPhones(bodyText);
  const socialLinks = extractSocialLinks($);

  const contact: ContactData = { emails, phones, socialLinks };

  const metaTags: Record<string, string> = {};
  $("meta").each((_, el) => {
    const name = $(el).attr("name") ?? $(el).attr("property");
    const content = $(el).attr("content");
    if (name && content) metaTags[name] = content;
  });

  const scriptSources: string[] = [];
  $("script[src]").each((_, el) => {
    const src = $(el).attr("src");
    if (src) scriptSources.push(src);
  });

  const ctaText: string[] = [];
  $('a, button, [role="button"]').each((_, el) => {
    const t = $(el).text().trim();
    if (t.length > 2 && t.length < 80) ctaText.push(t);
  });
  const ctaUnique = [...new Set(ctaText)].slice(0, 20);

  const footer = $("footer").first().text().replace(/\s+/g, " ").slice(0, 500);
  const header = $("header").first().text().replace(/\s+/g, " ").slice(0, 300);

  return {
    html,
    contact,
    metaTags,
    scriptSources,
    ctaText: ctaUnique,
    footerSnippet: footer || undefined,
    headerSnippet: header || undefined,
  };
}
