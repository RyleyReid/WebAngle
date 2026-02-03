import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AnalysisResult } from "@webangle/types";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** DB file in api package data dir; create parent if needed */
const DB_DIR = process.env.WEBANGLE_DB_DIR ?? path.join(__dirname, "..", "data");
const DB_PATH = path.join(DB_DIR, "cache.db");

const TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

function openDb(): Database.Database {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  const database = new Database(DB_PATH);
  database.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      url_key TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);
  return database;
}

let dbInstance: Database.Database | null = null;

function db(): Database.Database {
  if (!dbInstance) {
    dbInstance = openDb();
  }
  return dbInstance;
}

function hashUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.origin + u.pathname.replace(/\/$/, "") || u.origin + "/";
  } catch {
    return url;
  }
}

export function getCached(keyUrl: string): AnalysisResult | null {
  const key = hashUrl(keyUrl);
  const stmt = db().prepare(
    "SELECT result, created_at FROM analyses WHERE url_key = ?"
  );
  const row = stmt.get(key) as { result: string; created_at: number } | undefined;
  if (!row) return null;
  if (Date.now() - row.created_at > TTL_MS) {
    db().prepare("DELETE FROM analyses WHERE url_key = ?").run(key);
    return null;
  }
  const result = JSON.parse(row.result) as AnalysisResult;
  return {
    ...result,
    meta: { ...result.meta, cacheHit: true },
  };
}

export function setCached(keyUrl: string, result: AnalysisResult): void {
  const key = hashUrl(keyUrl);
  const created_at = Date.now();
  const resultJson = JSON.stringify(result);
  db()
    .prepare(
      "INSERT INTO analyses (url_key, url, result, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(url_key) DO UPDATE SET url = ?, result = ?, created_at = ?"
    )
    .run(key, keyUrl, resultJson, created_at, keyUrl, resultJson, created_at);
}
