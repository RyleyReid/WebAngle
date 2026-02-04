import "dotenv/config";
import http from "node:http";
import type { AnalyzeRequest } from "@webangle/types";
import { verifyToken } from "@clerk/backend";
import { runAnalysis } from "./analyze.js";
import { logger } from "./logger.js";
import { getAnalysisByUrl } from "./cache.js";
import {
  listWebsites,
  createWebsiteSearch,
  deleteWebsite,
} from "./user-websites.js";

const PORT = Number(process.env.PORT) || 3001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";

async function parseBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return null;
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

async function getAuthUserId(req: http.IncomingMessage): Promise<string | null> {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token || !CLERK_SECRET_KEY) return null;
  try {
    const verified = await verifyToken(token, {
      secretKey: CLERK_SECRET_KEY,
    });
    return verified.sub ?? null;
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const path = req.url?.split("?")[0];
  const method = req.method ?? "";
  const search = new URL(req.url ?? "", `http://localhost`).searchParams;

  // GET /analyze?url=... — fetch cached analysis (auth required)
  if (method === "GET" && path === "/analyze") {
    const userId = await getAuthUserId(req);
    if (!userId) {
      send(res, 401, { error: "Unauthorized. Sign in required." });
      return;
    }
    const urlParam = search.get("url");
    if (!urlParam) {
      send(res, 400, { error: "Missing url query parameter." });
      return;
    }
    try {
      const result = await getAnalysisByUrl(urlParam);
      if (!result) {
        send(res, 404, { error: "Analysis not found. Run analysis first." });
        return;
      }
      send(res, 200, result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Fetch failed";
      logger.error("server", "GET /analyze failed", {
        error: msg,
        stack: err instanceof Error ? err.stack : undefined,
      });
      send(res, 500, { error: msg });
    }
    return;
  }

  // GET /websites — list user's websites
  if (method === "GET" && path === "/websites") {
    const userId = await getAuthUserId(req);
    if (!userId) {
      send(res, 401, { error: "Unauthorized. Sign in required." });
      return;
    }
    try {
      const rows = await listWebsites(userId);
      send(res, 200, { websites: rows });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "List failed";
      logger.error("server", "GET /websites failed", {
        error: msg,
        stack: err instanceof Error ? err.stack : undefined,
      });
      send(res, 500, { error: msg });
    }
    return;
  }

  // DELETE /websites — delete user-website record (body: { id })
  if (method === "DELETE" && path === "/websites") {
    const userId = await getAuthUserId(req);
    if (!userId) {
      send(res, 401, { error: "Unauthorized. Sign in required." });
      return;
    }
    const body = (await parseBody(req)) as { id?: string } | null;
    const id = body?.id;
    if (!id || typeof id !== "string") {
      send(res, 400, { error: "Missing or invalid body. Expected { id: string }." });
      return;
    }
    try {
      const deleted = await deleteWebsite(userId, id);
      if (!deleted) {
        send(res, 404, { error: "Record not found or already deleted." });
        return;
      }
      send(res, 200, { ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      logger.error("server", "DELETE /websites failed", {
        error: msg,
        stack: err instanceof Error ? err.stack : undefined,
      });
      send(res, 500, { error: msg });
    }
    return;
  }

  // POST /analyze — run analysis (auth required, saves to user websites)
  if (method === "POST" && path === "/analyze") {
    const userId = await getAuthUserId(req);
    if (!userId) {
      send(res, 401, { error: "Unauthorized. Sign in required." });
      return;
    }

    const body = (await parseBody(req)) as AnalyzeRequest | null;
    const urlParam = body?.url;
    if (!urlParam || typeof urlParam !== "string") {
      logger.warn("server", "Invalid request body", { body: body ?? null });
      send(res, 400, { error: "Missing or invalid body. Expected { url: string }." });
      return;
    }

    logger.info("server", "POST /analyze received", { url: urlParam });

    if (!OPENAI_API_KEY) {
      logger.error("server", "OPENAI_API_KEY is not set", {});
      send(res, 500, { error: "OPENAI_API_KEY is not set." });
      return;
    }

    try {
      const { result, analysisId, websiteId } = await runAnalysis(
        { url: urlParam },
        { openaiApiKey: OPENAI_API_KEY }
      );
      await createWebsiteSearch(userId, websiteId, analysisId);
      logger.info("server", "Analysis completed, sending 200", {
        url: result.url,
        opportunitiesCount: result.opportunities?.length ?? 0,
      });
      send(res, 200, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      logger.error("server", "Analysis failed", {
        url: urlParam,
        error: message,
        stack: err instanceof Error ? err.stack : undefined,
      });
      send(res, 500, { error: message });
    }
    return;
  }

  send(res, 404, {
    error:
      "Not found. Use POST /analyze, GET /websites, or DELETE /websites with Authorization: Bearer <token>.",
  });
});

server.listen(PORT, () => {
  console.log(`WebAngle API listening on http://localhost:${PORT}`);
  console.log("Auth required. Use Authorization: Bearer <Clerk session token>.");
});
