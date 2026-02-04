/**
 * Shared types for WebAngle — outreach intelligence output schema
 */

/** Public contact data extracted from the site */
export interface ContactData {
  emails: string[];
  phones: string[];
  socialLinks: Record<string, string>;
}

/** Detected tech stack (heuristic) */
export type TechHint =
  | "wordpress"
  | "webflow"
  | "shopify"
  | "wix"
  | "react"
  | "static"
  | "js-rendered"
  | "unknown";

export interface TechStack {
  hints: TechHint[];
  generator?: string;
  scriptSources: string[];
  /** e.g. "React-based" when SPA signals detected */
  framework?: string;
  isDynamic?: boolean;
}

/** Performance metrics from PageSpeed (or similar). mobileScore is null when no reliable data (quota, failure, etc.). */
export interface PerformanceMetrics {
  mobileScore: number | null;
  lcp?: number;
  cls?: number;
  tbt?: number;
  loadTimeApprox?: number;
}

/** Site type / industry classification */
export type SiteType =
  | "local-service"
  | "ecommerce"
  | "saas"
  | "brochure"
  | "informational"
  | "other";

export interface SiteClassification {
  siteType: SiteType;
  industry?: string;
  confidence: number;
}

/** Single upgrade opportunity from AI */
export interface UpgradeOpportunity {
  id: string;
  title: string;
  /** What's weak on the site */
  issue: string;
  /** Why it matters to the business */
  businessImpact: string;
  /** How a developer could fix it */
  suggestedFix: string;
  /** Outreach-ready pitch angle */
  pitchAngle: string;
  confidence: "high" | "medium";
}

/** Full analysis result — API response shape */
export interface AnalysisResult {
  url: string;
  analyzedAt: string; // ISO timestamp
  contact: ContactData;
  techStack: TechStack;
  performance: PerformanceMetrics;
  classification: SiteClassification;
  opportunities: UpgradeOpportunity[];
  /** Raw scrape / signal summary for debugging */
  meta?: {
    scrapeDurationMs?: number;
    cacheHit?: boolean;
    /** Composite score (performance + style + classification); never 0. */
    overallScore?: number;
    /** Normalized scores used for the overall score. */
    scores?: {
      performance: number;
      style: number;
      responsive: number;
      content: number;
      overall: number;
    };
  };
}

/** Request body for POST /analyze */
export interface AnalyzeRequest {
  url: string;
}

/** Normalized scrape output from @webangle/scraper */
export interface ScrapeResult {
  html: string;
  contact: ContactData;
  metaTags: Record<string, string>;
  scriptSources: string[];
  ctaText: string[];
  footerSnippet?: string;
  headerSnippet?: string;
  /** First ~400–500 chars of body text for AI context */
  visibleText?: string;
}
