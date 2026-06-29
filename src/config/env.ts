/**
 * env.ts — Single, typed entry point for all environment variables.
 *
 * Rules:
 *  - Always read from import.meta.env (Vite). Never use process.env directly in app code.
 *  - Every variable has a typed fallback — nothing silently evaluates to "undefined".
 *  - isDev / isProd helpers replace scattered NODE_ENV checks.
 *  - Centralise all derived values (WS URLs, API base) here so the rest of the app
 *    never constructs URLs by hand.
 */

// ---------------------------------------------------------------------------
// Raw env reads
// ---------------------------------------------------------------------------
const raw = {
  BACKEND_URL: import.meta.env.VITE_BACKEND_URL as string | undefined,
  WS_URL: import.meta.env.VITE_WS_URL as string | undefined,
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT as string | undefined,
  ANONYMOUS_MESSAGE_LIMIT: import.meta.env.VITE_ANONYMOUS_MESSAGE_LIMIT as string | undefined,
  AUTOMATION_HEARTBEAT_INTERVAL: import.meta.env.VITE_AUTOMATION_HEARTBEAT_INTERVAL as string | undefined,
  MODE: import.meta.env.MODE as string,
  DEV: import.meta.env.DEV as boolean,
  PROD: import.meta.env.PROD as boolean,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** True when running in Vite dev mode (vite dev). */
export const isDev: boolean = raw.DEV;
/** True when running a production build. */
export const isProd: boolean = raw.PROD;

// ---------------------------------------------------------------------------
// Backend / API
// ---------------------------------------------------------------------------

/**
 * HTTP base URL for all REST API calls.
 * Falls back to localhost for local development.
 */
export const BACKEND_URL: string =
  raw.BACKEND_URL ?? (isDev ? 'http://localhost:8000' : '');

/**
 * WebSocket base URL.
 * Derives from BACKEND_URL if VITE_WS_URL is not explicitly set.
 */
export const WS_URL: string =
  raw.WS_URL ??
  BACKEND_URL.replace(/^https/, 'wss').replace(/^http/, 'ws');

/**
 * Build a full API path, e.g. apiUrl('/api/v1/chat/chats')
 */
export const apiUrl = (path: string): string => `${BACKEND_URL}${path}`;

/**
 * Build a full WebSocket path, e.g. wsUrl('/ws/collaboration/abc')
 */
export const wsUrl = (path: string): string => `${WS_URL}${path}`;

// ---------------------------------------------------------------------------
// Feature flags / limits
// ---------------------------------------------------------------------------

/** Maximum number of messages for anonymous (unauthenticated) users. */
export const ANONYMOUS_MESSAGE_LIMIT: number = raw.ANONYMOUS_MESSAGE_LIMIT
  ? parseInt(raw.ANONYMOUS_MESSAGE_LIMIT, 10)
  : 4;

/** Automation heartbeat interval in milliseconds. */
export const AUTOMATION_HEARTBEAT_INTERVAL: number =
  raw.AUTOMATION_HEARTBEAT_INTERVAL
    ? parseInt(raw.AUTOMATION_HEARTBEAT_INTERVAL, 10)
    : 30_000;

// ---------------------------------------------------------------------------
// Environment name
// ---------------------------------------------------------------------------

export const ENVIRONMENT: string = raw.ENVIRONMENT ?? raw.MODE ?? 'development';

// ---------------------------------------------------------------------------
// Default export (for places that need the full config object)
// ---------------------------------------------------------------------------
const env = {
  isDev,
  isProd,
  BACKEND_URL,
  WS_URL,
  apiUrl,
  wsUrl,
  ANONYMOUS_MESSAGE_LIMIT,
  AUTOMATION_HEARTBEAT_INTERVAL,
  ENVIRONMENT,
} as const;

export default env;
