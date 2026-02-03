import http from "node:http";
import type { AnalyzeRequest } from "@webangle/types";
import { runAnalysis } from "./analyze.js";

const PORT = Number(process.env.PORT) || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

async function parseBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function send(res: http.ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/analyze") {
    send(res, 404, { error: "Not found. Use POST /analyze with body { url: string }." });
    return;
  }

  const body = (await parseBody(req)) as AnalyzeRequest | null;
  const url = body?.url;
  if (!url || typeof url !== "string") {
    send(res, 400, { error: "Missing or invalid body. Expected { url: string }." });
    return;
  }

  if (!OPENAI_API_KEY) {
    send(res, 500, { error: "OPENAI_API_KEY is not set." });
    return;
  }

  try {
    const result = await runAnalysis(
      { url },
      { openaiApiKey: OPENAI_API_KEY }
    );
    send(res, 200, result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    console.error("Analyze error:", err);
    send(res, 500, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`WebAngle API listening on http://localhost:${PORT}`);
  console.log("POST /analyze with { \"url\": \"https://example.com\" }");
});
