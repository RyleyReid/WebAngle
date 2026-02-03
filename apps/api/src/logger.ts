/**
 * Structured logger for the analyze pipeline.
 * Set LOG_LEVEL=debug|info|warn|error (default: debug so logs show in terminal).
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

const currentLevel: Level =
  process.env.LOG_LEVEL && process.env.LOG_LEVEL in LEVELS
    ? (process.env.LOG_LEVEL as Level)
    : "debug";

function shouldLog(level: Level): boolean {
  return LEVELS[level] >= LEVELS[currentLevel];
}

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, (_, v) => (v === undefined ? "<undefined>" : v), 2);
  } catch {
    return String(obj);
  }
}

const PREFIX = "[WebAngle]";

function log(level: Level, step: string, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;
  const timestamp = new Date().toISOString();
  const msg = `${PREFIX} ${timestamp} [${level.toUpperCase()}] [${step}] ${message}`;
  const out = data !== undefined ? `${msg}\n${safeStringify(data)}` : msg;
  // Use console.log for debug/info so output always appears in terminal (stdout)
  switch (level) {
    case "debug":
    case "info":
      console.log(out);
      break;
    case "warn":
      console.warn(out);
      break;
    case "error":
      console.error(out);
      break;
  }
}

export const logger = {
  debug(step: string, message: string, data?: unknown): void {
    log("debug", step, message, data);
  },
  info(step: string, message: string, data?: unknown): void {
    log("info", step, message, data);
  },
  warn(step: string, message: string, data?: unknown): void {
    log("warn", step, message, data);
  },
  error(step: string, message: string, data?: unknown): void {
    log("error", step, message, data);
  },
};
