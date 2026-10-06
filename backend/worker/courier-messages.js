import { accountIdentifiers } from "./account-identifiers.js";
const json = (v, status = 200) =>
  Response.json(v, { status, headers: { "Cache-Control": "no-store" } });
export async function handleCourierMessages(request, env) {
  const url = new URL(request.url),
    user = request.headers.get("yaviya-user-id");
  if (!user) return json({ error: "Sign in required" }, 401);
  if (request.method !== "GET" && request.headers.get("origin") !== url.origin)
    return json({ error: "Origin rejected" }, 403);
  try {
    const country = user.startsWith("cg:") ? "CG" : "CD",
      base = user.startsWith("cg:") ? user.slice(3) : user;
    const admin = await env.DB.prepare(
        "SELECT user_id FROM admin_access WHERE id=?",
      )
        .bind("owner")
        .first(),
      isAdmin = admin?.user_id === base;
    const profile = await env.DB.prepare(
      "SELECT account_type FROM customers WHERE user_id=?",
    )
      .bind(user)
      .first();
    if (!isAdmin && profile?.account_type !== "courier")
      return json({ error: "Courier or administrator access required" }, 403);
    const threadQuery =
      "SELECT c.user_id AS userId,c.name,i.company_name AS companyName,i.status FROM customers c LEFT JOIN identity_checks i ON i.user_id=c.user_id WHERE c.account_type=? AND " +
      (country === "CG"
        ? "c.user_id LIKE 'cg:%'"
        : "c.user_id NOT LIKE 'cg:%'") +
      " ORDER BY c.name LIMIT 200";
    const actingAdmin = isAdmin && url.searchParams.get("view") !== "courier";
    if (!actingAdmin && profile?.account_type !== "courier")
      return json({ error: "Create a courier account first" }, 403);
    const threads = actingAdmin
      ? (await env.DB.prepare(threadQuery).bind("courier").all()).results
      : [];
    for (const thread of threads) {
      const ids = await accountIdentifiers(env, thread.userId, "courier");
      thread.publicId = ids.accountId;
    }
    if (request.method === "GET") {
      const target = actingAdmin ? url.searchParams.get("courierUserId") : user;
      if (!target)
        return json({
          isAdmin: actingAdmin,
          threads,
          messages: [],
          courierUserId: null,
        });
      if (actingAdmin && !threads.some((t) => t.userId === target))
        return json({ error: "Courier not found in this country" }, 404);
      const messages = (
        await env.DB.prepare(
          "SELECT id,sender,message,created_at AS createdAt FROM courier_messages WHERE country=? AND courier_user_id=? ORDER BY created_at DESC,rowid DESC LIMIT 100",
        )
          .bind(country, target)
          .all()
      ).results.reverse();
      return json({
        isAdmin: actingAdmin,
        threads,
        messages,
        courierUserId: target,
      });
    }
    if (request.method !== "POST")
      return json({ error: "Method not allowed" }, 405);
    const d = await request.json(),
      target = actingAdmin ? d.courierUserId : user;
    if (actingAdmin && !threads.some((t) => t.userId === target))
      return json({ error: "Courier not found in this country" }, 404);
    if (
      typeof d.message !== "string" ||
      !d.message.trim() ||
      d.message.length > 2000
    )
      return json({ error: "Enter a message of 1–2000 characters" }, 400);
    if (
      isAdmin &&
      d.asCourier === true &&
      (target !== user || profile?.account_type !== "courier")
    )
      return json(
        { error: "Only your own courier account may send as courier" },
        403,
      );
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO courier_messages (id,courier_user_id,country,sender,message,created_at) VALUES (?,?,?,?,?,?)",
    )
      .bind(
        id,
        target,
        country,
        actingAdmin ? "admin" : "courier",
        d.message.trim(),
        Date.now(),
      )
      .run();
    return json({ ok: true, id });
  } catch (e) {
    console.error("Courier messaging unavailable", e);
    return json({ error: "Messaging unavailable. Please retry." }, 503);
  }
}
