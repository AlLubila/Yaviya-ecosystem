const reply = (v, status = 200) =>
  Response.json(v, { status, headers: { "Cache-Control": "no-store" } });
export async function handleFeedback(request, env) {
  const userId = request.headers.get("yaviya-user-id");
  if (!userId) return reply({ error: "Sign in required" }, 401);
  try {
    if (request.method === "GET") {
      const result = await env.DB.prepare(
        "SELECT question,resolved FROM faq_feedback WHERE user_id=?",
      )
        .bind(userId)
        .all();
      return reply(result.results);
    }
    if (request.method !== "POST")
      return reply({ error: "Method not allowed" }, 405);
    if (request.headers.get("origin") !== new URL(request.url).origin)
      return reply({ error: "Origin rejected" }, 403);
    const data = await request.json();
    if (
      ![
        "order",
        "tracking",
        "payment",
        "delivery",
        "returns",
        "seller",
        "verified",
        "contact",
        "coins",
        "escrow",
        "photos",
        "fees",
        "receipt",
        "reviews",
        "security",
        "unavailable",
        "courier",
      ].includes(data.question) ||
      typeof data.resolved !== "boolean"
    )
      return reply({ error: "Invalid feedback" }, 400);
    await env.DB.prepare(
      "INSERT INTO faq_feedback (id,user_id,question,resolved,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET resolved=excluded.resolved,updated_at=excluded.updated_at",
    )
      .bind(
        userId + ":" + data.question,
        userId,
        data.question,
        data.resolved ? 1 : 0,
        Date.now(),
      )
      .run();
    return reply({ ok: true });
  } catch (e) {
    console.error("FAQ feedback unavailable", e);
    return reply({ error: "Feedback unavailable" }, 503);
  }
}
