/**
 * Simple in-memory rate limiting so a shared demo link can't burn through API credits.
 *
 * Two layers:
 *   - Per IP: RATE_LIMIT_PER_IP requests per RATE_LIMIT_WINDOW_MINUTES (sliding window).
 *   - Global: DAILY_GENERATION_CAP requests per UTC day across all visitors.
 *
 * Caveat: memory is per server instance. On Vercel each warm function instance keeps its own
 * counters, so treat these as soft limits. For a hard guarantee, back this with Redis
 * (e.g. Upstash) and set a monthly spend limit in the Anthropic Console.
 */

function envInt(name: string, fallback: number) {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const PER_IP = envInt("RATE_LIMIT_PER_IP", 10);
const WINDOW_MS = envInt("RATE_LIMIT_WINDOW_MINUTES", 10) * 60_000;
const DAILY_CAP = envInt("DAILY_GENERATION_CAP", 300);

const hitsByIp = new Map<string, number[]>();
let daily = { day: "", count: 0 };

export type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterSec: number; message: string };

export function checkRateLimit(ip: string, now = Date.now()): RateLimitResult {
  const today = new Date(now).toISOString().slice(0, 10);
  if (daily.day !== today) daily = { day: today, count: 0 };
  if (daily.count >= DAILY_CAP) {
    const tomorrow = Date.parse(`${today}T00:00:00Z`) + 86_400_000;
    return {
      ok: false,
      retryAfterSec: Math.ceil((tomorrow - now) / 1000),
      message: "This demo has reached its daily generation limit. Please try again tomorrow.",
    };
  }

  const recent = (hitsByIp.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= PER_IP) {
    const retryAfterSec = Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
    hitsByIp.set(ip, recent);
    return {
      ok: false,
      retryAfterSec,
      message: `You've hit the demo limit of ${PER_IP} generations per ${WINDOW_MS / 60_000} minutes. Try again in ${Math.max(1, Math.ceil(retryAfterSec / 60))} min.`,
    };
  }

  recent.push(now);
  hitsByIp.set(ip, recent);
  daily.count += 1;

  // Keep memory bounded on long-lived instances.
  if (hitsByIp.size > 5000) {
    for (const [key, times] of hitsByIp) {
      if (!times.some((t) => now - t < WINDOW_MS)) hitsByIp.delete(key);
    }
  }

  return { ok: true, remaining: PER_IP - recent.length };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}
