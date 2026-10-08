import { sensitiveRateLimit } from "./rate-limit.js";
import worker from "./worker/index.js";
import { authenticatedUser, handleAuth } from "./auth.js";
import { createPrivateFiles } from "./database.js";

export function createApplication(db) {
  const env = { DB: db, IDENTITY_FILES: createPrivateFiles(db) };
  return async (request) => {
    try {
      const url = new URL(request.url);
      const limited = await sensitiveRateLimit(request);
      if (limited) return limited;
      if (url.pathname.startsWith("/api/auth/"))
        return await handleAuth(request, db);
      const user = await authenticatedUser(request, db);
      if (user && db.dialect === "postgres") {
        const admin = await db.prepare("SELECT user_id FROM admin_access WHERE user_id=?").bind(user.id).first();
        if (admin) {
          const mfa = await db.prepare("SELECT enabled FROM auth_mfa WHERE user_id=?").bind(user.id).first();
          if (!mfa?.enabled) return Response.json({ error: "Activez la double authentification dans Sécurité · 2FA avant d’accéder à l’administration.", code: "ADMIN_MFA_REQUIRED" }, { status: 403 });
        }
      }
      const headers = new Headers(request.headers);
      // Never trust an identity supplied by the browser or another proxy.
      for (const key of [
        "yaviya-user-id",
        "yaviya-user-email",
        "oai-authenticated-user-id",
        "oai-authenticated-user-email",
      ])
        headers.delete(key);
      if (user) headers.set("yaviya-user-id", user.id);
      // Administrator access is provisioned explicitly, never granted by signup/email.
      return await worker.fetch(new Request(request, { headers }), env);
    } catch (error) {
      console.error("YAVIYA request failed", error.message);
      return Response.json(
        { error: "Service temporairement indisponible" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  };
}
