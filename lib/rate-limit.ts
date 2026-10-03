import "server-only";
import { getSupabase } from "./supabase";

/**
 * In-memory limiter. Good for a single server and as a fallback.
 * On serverless each instance has its own memory, so the admin login
 * also uses the Supabase-backed limiter below.
 */
const buckets = new Map<string, number[]>();

export function memoryLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear();
  return true;
}

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/** True when this IP may try to log in. */
export async function loginAllowed(ip: string): Promise<boolean> {
  const db = getSupabase();
  if (db) {
    try {
      const since = new Date(Date.now() - LOGIN_WINDOW_MS).toISOString();
      const { count, error } = await db
        .from("login_attempts")
        .select("id", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("created_at", since);
      if (!error && typeof count === "number") return count < LOGIN_LIMIT;
    } catch {
      // fall through to memory
    }
  }
  const hits = (buckets.get(`login:${ip}`) ?? []).filter((t) => Date.now() - t < LOGIN_WINDOW_MS);
  return hits.length < LOGIN_LIMIT;
}

export async function recordFailedLogin(ip: string) {
  memoryLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  const db = getSupabase();
  if (!db) return;
  try {
    await db.from("login_attempts").insert({ ip });
    // Keep the table small.
    const old = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await db.from("login_attempts").delete().lt("created_at", old);
  } catch {
    // best effort
  }
}
