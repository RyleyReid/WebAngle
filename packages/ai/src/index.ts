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
  if (!Array.isArray(opportunities) || opportunities.length === 0) {
    throw new Error("AI response missing required opportunity");
  }

  const [top] = opportunities;

  return [
    {
      id: String(top.id ?? "").replace(/\s/g, "-") || "opportunity",
      title: String(top.title ?? ""),
      issue: String(top.issue ?? ""),
      businessImpact: String(top.businessImpact ?? ""),
      suggestedFix: String(top.suggestedFix ?? ""),
      pitchAngle: String(top.pitchAngle ?? ""),
      confidence: top.confidence === "high" ? "high" : "medium",
    },
  ];
}

export { getAnalysisPrompt } from "./prompt.js";
export type { AnalysisContext, AIOpportunitiesResponse } from "./prompt.js";
