import type {
  ContactData,
  TechStack,
  PerformanceMetrics,
  SiteClassification,
  UpgradeOpportunity,
} from "@webangle/types";

export interface StyleContext {
  score: number;
  notes: string[];
  fontCount: number;
  colorCount: number;
  usesCssVariables: boolean;
}

export interface AnalysisContext {
  url: string;
  contact: ContactData;
  techStack: TechStack;
  performance: PerformanceMetrics;
  classification: SiteClassification;
  /** Short summary for AI: meta, CTAs, footer/header snippets */
  contentSummary: string;
  /** Present when Playwright was used (render-aware style analysis). */
  style?: StyleContext | null;
}

const SYSTEM_PROMPT = `You are an expert outreach strategist for freelance developers and web agencies. Your job is to turn website teardowns into credible, non-generic pitch angles that a developer could use in cold email or DMs.

Rules:
- Output ONLY valid JSON. No markdown, no code fences, no explanation.
- Select 3–5 upgrade opportunities. Prefer high-confidence, specific issues over vague ones.
- Each opportunity must: (1) name a real weakness, (2) explain business impact in one sentence, (3) suggest a concrete fix a developer could do, (4) provide one outreach-ready pitch angle the sender can copy.
- Pitch angles must sound human and specific to this site—never generic ("we can improve your site") or spammy.
- Confidence: use "high" only when the issue is clearly visible from the data; otherwise "medium".
- IDs: short kebab-case (e.g. "slow-mobile", "missing-cta", "outdated-stack").`;

function buildUserPrompt(ctx: AnalysisContext): string {
  const lines: string[] = [
    `Website: ${ctx.url}`,
    ``,
    `Contact found: emails ${ctx.contact.emails.length}, phones ${ctx.contact.phones.length}, social: ${Object.keys(ctx.contact.socialLinks).join(", ") || "none"}.`,
    `Tech hints: ${ctx.techStack.hints.join(", ")}. Generator: ${ctx.techStack.generator ?? "none"}.${ctx.techStack.framework ? ` Framework: ${ctx.techStack.framework}.` : ""}${ctx.techStack.isDynamic ? " Site is dynamic/SPA." : ""}`,
    `Site type: ${ctx.classification.siteType} (confidence ${ctx.classification.confidence}).`,
    `Performance: mobile score ${ctx.performance.mobileScore != null ? `${ctx.performance.mobileScore}/100` : "no reliable data"}${ctx.performance.lcp != null ? `, LCP ~${ctx.performance.lcp}s` : ""}${ctx.performance.cls != null ? `, CLS ${ctx.performance.cls}` : ""}${ctx.performance.tbt != null ? `, TBT ${ctx.performance.tbt}ms` : ""}.`,
    ...(ctx.style
      ? [
          ``,
          `Style (maintainability / consistency): score ${ctx.style.score}/100, fonts ${ctx.style.fontCount}, colors ${ctx.style.colorCount}, CSS variables ${ctx.style.usesCssVariables ? "yes" : "no"}.${ctx.style.notes.length ? ` Notes: ${ctx.style.notes.join("; ")}.` : ""}`,
        ]
      : []),
    ``,
    `Content/signals summary:`,
    ctx.contentSummary,
    ``,
    `Return a JSON object with a single key "opportunities" (array of objects). Each object has: id (string), title (string), issue (string), businessImpact (string), suggestedFix (string), pitchAngle (string), confidence ("high" | "medium").`,
  ];
  return lines.join("\n");
}

export function getAnalysisPrompt(ctx: AnalysisContext): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(ctx),
  };
}

/** Expected raw shape from OpenAI (opportunities only) */
export interface AIOpportunitiesResponse {
  opportunities: UpgradeOpportunity[];
}
