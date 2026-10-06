import worker from "./worker/index.js";
import { authenticatedUser, handleAuth } from "./auth.js";
import { createPrivateFiles } from "./database.js";

export function createApplication(db) {
  const env = { DB: db, IDENTITY_FILES: createPrivateFiles(db) };
  return async (request) => {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith("/api/auth/"))
        return await handleAuth(request, db);
      const user = await authenticatedUser(request, db);
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
