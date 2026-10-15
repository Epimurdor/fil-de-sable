import { headers } from "next/headers";

// Limiteur de débit en mémoire (fenêtre glissante). Suffisant pour une instance unique ;
// en déploiement multi-instances / serverless, remplacer le store par Redis (ex. @upstash/ratelimit).

export type RateLimitRule = { limit: number; windowMs: number };
export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

const MAX_KEYS = 10_000;

const globalForRateLimit = globalThis as unknown as { rateLimitStore?: Map<string, number[]> };
const store = globalForRateLimit.rateLimitStore ?? new Map<string, number[]>();
globalForRateLimit.rateLimitStore = store;

function recentHits(key: string, windowMs: number, now: number): number[] {
  const hits = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length) store.set(key, hits);
  else store.delete(key);
  return hits;
}

// Purge des clés expirées pour borner la mémoire (une attaque peut multiplier les clés).
function sweep(now: number, windowMs: number) {
  if (store.size < MAX_KEYS) return;
  for (const [key, hits] of store) {
    if (!hits.some((t) => now - t < windowMs)) store.delete(key);
  }
  // Toujours trop de clés : on sacrifie les plus anciennes plutôt que la mémoire.
  for (const key of store.keys()) {
    if (store.size < MAX_KEYS) break;
    store.delete(key);
  }
}

function blocked(hits: number[], rule: RateLimitRule, now: number): RateLimitResult {
  const retryAfterMs = rule.windowMs - (now - hits[hits.length - rule.limit]);
  return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
}

// Vérifie sans consommer.
export function peekRateLimit(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const hits = recentHits(key, rule.windowMs, now);
  return hits.length >= rule.limit ? blocked(hits, rule, now) : { ok: true };
}

// Vérifie et consomme une unité si la limite n'est pas atteinte.
export function consumeRateLimit(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  sweep(now, rule.windowMs);
  const hits = recentHits(key, rule.windowMs, now);
  if (hits.length >= rule.limit) return blocked(hits, rule, now);
  hits.push(now);
  store.set(key, hits);
  return { ok: true };
}

export function clearRateLimit(key: string): void {
  store.delete(key);
}

// IP cliente telle que transmise par le reverse proxy (Vercel, Nginx…). Le proxy doit écraser
// X-Forwarded-For : sans proxy de confiance devant l'app, cet en-tête est falsifiable.
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return (forwarded || h.get("x-real-ip")?.trim() || "unknown").slice(0, 64);
}

export function tooManyAttemptsMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return retryAfterSeconds < 60
    ? `Trop de tentatives. Réessaie dans ${retryAfterSeconds} s.`
    : `Trop de tentatives. Réessaie dans ${minutes} min.`;
}
