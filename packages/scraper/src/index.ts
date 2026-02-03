import * as cheerio from "cheerio";
import type { ContactData, ScrapeResult } from "@webangle/types";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi;
const PHONE_REGEX =
  /(\+?\d{1,2}[\s.-]?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;

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

/**
 * Extract same-origin internal link pathnames from HTML.
 * Used to find /contact, /about, etc. for multi-page crawl.
 */
export function extractInternalLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html);
  let base: URL;
  try {
    base = new URL(baseUrl);
  } catch {
    return [];
  }
  const links = new Set<string>();
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const url = new URL(href, base);
      if (url.origin === base.origin) {
        links.add(url.pathname);
      }
    } catch {
      // ignore invalid URLs
    }
  });
  return [...links];
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

export interface ScrapeOptions {
  /** When set, skip fetch and parse this HTML (e.g. from headless render). */
  htmlOverride?: string;
}

/**
 * Parse HTML string into ScrapeResult (contact, meta, scripts, CTAs).
 * Used by both fetch path and htmlOverride path.
 */
function parseHtmlToResult(html: string): ScrapeResult {
  const $ = cheerio.load(html);

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const mailtos = extractMailtos($);
  const emailsFromBody = extractEmails(bodyText);
  const emailsFromHtml = extractEmails(html);
  const emails = [...new Set([...mailtos, ...emailsFromBody, ...emailsFromHtml])].slice(
    0,
    15
  );
  const phonesRaw = extractPhones(bodyText);
  const phones = [...new Set(phonesRaw)].slice(0, 10);
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
  const visibleText = bodyText.slice(0, 500);

  return {
    html,
    contact,
    metaTags,
    scriptSources,
    ctaText: ctaUnique,
    footerSnippet: footer || undefined,
    headerSnippet: header || undefined,
    visibleText: visibleText || undefined,
  };
}

/**
 * Fetch HTML and parse into ScrapeResult (contact, meta, scripts, CTAs).
 * When htmlOverride is provided, skips fetch and parses that HTML instead (e.g. from headless render).
 */
export async function scrape(
  url: string,
  options?: ScrapeOptions
): Promise<ScrapeResult> {
  let html: string;

  if (options?.htmlOverride !== undefined) {
    html = options.htmlOverride;
  } else {
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

    html = await res.text();
  }

  return parseHtmlToResult(html);
}
