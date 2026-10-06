import { createDatabase } from "../backend/database.js";
import { createApplication } from "../backend/application.js";
let application;
async function getApplication() {
  if (!application)
    application = createDatabase()
      .then(createApplication)
      .catch((error) => {
        application = null;
        throw error;
      });
  return application;
}
export default async function handler(req, res) {
  try {
    const url = new URL(
      req.url,
      `${process.env.VERCEL ? "https" : "http"}://${req.headers.host}`,
    );
    const route = url.searchParams.get("route");
    if (route) {
      url.pathname = `/api/${route}`;
      url.searchParams.delete("route");
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers))
      if (value != null)
        headers.set(key, Array.isArray(value) ? value.join(", ") : value);
    const method = req.method || "GET";
    let body;
    if (!["GET", "HEAD"].includes(method)) {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 9 * 1024 * 1024) {
          res.statusCode = 413;
          res.end("Fichier trop volumineux");
          return;
        }
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }
    const response = await (
      await getApplication()
    )(new Request(url, { method, headers, body }));
    res.statusCode = response.status;
    for (const [key, value] of response.headers)
      if (key !== "set-cookie") res.setHeader(key, value);
    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.setHeader("Set-Cookie", cookies);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error("YAVIYA configuration error", error.message);
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.end(
      JSON.stringify({
        error:
          "Le service de compte est temporairement indisponible. Réessayez plus tard.",
      }),
    );
  }
}
