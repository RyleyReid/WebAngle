import OpenAI from "openai";
import type { UpgradeOpportunity } from "@webangle/types";
import {
  getAnalysisPrompt,
  type AnalysisContext,
  type AIOpportunitiesResponse,
} from "./prompt.js";

const MODEL = "gpt-4o-mini";

export type GenerateOpportunitiesOptions = {
  apiKey: string;
};

/**
 * Single AI call: context in, 3–5 upgrade opportunities with pitch angles out.
 */
export async function generateOpportunities(
  context: AnalysisContext,
  options: GenerateOpportunitiesOptions
): Promise<UpgradeOpportunity[]> {
  const openai = new OpenAI({ apiKey: options.apiKey });
  const { system, user } = getAnalysisPrompt(context);

  const completion = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty AI response");
  }

  const parsed = JSON.parse(content) as AIOpportunitiesResponse;
  const opportunities = parsed?.opportunities ?? [];
  if (!Array.isArray(opportunities)) {
    throw new Error("AI response missing opportunities array");
  }

  return opportunities.slice(0, 5).map((o) => ({
    id: String(o.id ?? "").replace(/\s/g, "-") || "opportunity",
    title: String(o.title ?? ""),
    issue: String(o.issue ?? ""),
    businessImpact: String(o.businessImpact ?? ""),
    suggestedFix: String(o.suggestedFix ?? ""),
    pitchAngle: String(o.pitchAngle ?? ""),
    confidence: o.confidence === "high" ? "high" : "medium",
  }));
}

export { getAnalysisPrompt } from "./prompt.js";
export type { AnalysisContext, AIOpportunitiesResponse } from "./prompt.js";
