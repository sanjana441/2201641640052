/**
 * Logging Middleware
 * -------------------
 * - Stores logs in localStorage (key: shortener_logs_v1)
 * - Optionally POSTs logs to a remote server (if LOGS_API_URL + ACCESS_TOKEN set)
 * - Safe to use in any client React project
 *
 * Exports:
 *   log(level, action, meta)
 *   getLogs()
 *   clearLogs()
 */

const LOG_KEY = "shortener_logs_v1";

// Optional: server config (via environment or hardcoded for evaluation)
const LOGS_API_URL =
  typeof process !== "undefined" && process.env && process.env.REACT_APP_LOGS_API_URL
    ? process.env.REACT_APP_LOGS_API_URL
    : null;

const ACCESS_TOKEN =
  typeof process !== "undefined" && process.env && process.env.REACT_APP_LOGS_ACCESS_TOKEN
    ? process.env.REACT_APP_LOGS_ACCESS_TOKEN
    : null;

function nowISO() {
  return new Date().toISOString();
}

/**
 * Main log function
 * @param {string} level - "info" | "error" | "debug" | "warn"
 * @param {string} action - short identifier for what happened ("create_shortlink", "redirect_error", etc.)
 * @param {object} meta - additional data
 */
export async function log(level, action, meta = {}) {
  const entry = { ts: nowISO(), level, action, meta };

  // Try sending to remote server if configured
  if (LOGS_API_URL) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (ACCESS_TOKEN) headers["Authorization"] = `Bearer ${ACCESS_TOKEN}`;

      await fetch(LOGS_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(entry),
      });
    } catch (err) {
      console.error("Logger: failed to send to server", err);
      entry.meta.serverError = String(err);
    }
  }

  // Always keep a local copy
  _appendLocal(entry);

  // Developer console feedback
  if (level === "error") console.error(`[${entry.ts}] ${action}`, meta);
  else console.log(`[${entry.ts}] ${action}`, meta);

  return entry;
}

// Append entry to localStorage
function _appendLocal(entry) {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    localStorage.setItem(LOG_KEY, JSON.stringify(arr.slice(-2000))); // keep bounded
  } catch (e) {
    console.error("Logger localStorage error", e);
  }
}

// Retrieve logs
export function getLogs() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

// Clear logs
export function clearLogs() {
  localStorage.removeItem(LOG_KEY);
}
