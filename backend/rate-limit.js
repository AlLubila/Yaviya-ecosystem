import { createHash } from "node:crypto";
// Atomic distributed fixed-window limiter. Existing DB throttles remain active.
export async function sensitiveRateLimit(request, config = process.env, fetcher = fetch) {
  const path = new URL(request.url).pathname;
  if (request.method !== "POST" || !path.startsWith("/api/auth/")) return null;
  const endpoint = config.UPSTASH_REDIS_REST_URL;
  const token = config.UPSTASH_REDIS_REST_TOKEN;
  if (!endpoint && !token) return null;
  if (!endpoint || !token || new URL(endpoint).protocol !== "https:")
    return Response.json({ error: "Protection de connexion indisponible" }, { status: 503 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = "yaviya:auth:" + createHash("sha256").update(ip).digest("hex");
  try {
    const response = await fetcher(endpoint, {
      method: "POST", signal: AbortSignal.timeout(3000),
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return n", "1", key, "60"]),
    });
    const value = await response.json();
    if (!response.ok || value.error || !Number.isInteger(value.result)) throw Error("limiter unavailable");
    if (value.result > 20) return Response.json({ error: "Trop de requêtes. Réessayez dans une minute." }, { status: 429, headers: { "Retry-After": "60" } });
    return null;
  } catch {
    return Response.json({ error: "Protection de connexion temporairement indisponible" }, { status: 503 });
  }
}
