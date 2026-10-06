import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import handler from "../api/handler.js";
import { createDatabase } from "../backend/database.js";
import { migrate } from "./migrate.mjs";
const db = await createDatabase();
await migrate(db);
db.close();
const root = resolve(process.argv.includes("--dist") ? "dist" : "frontend");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const server = createServer(async (req, res) => {
  if (req.url.startsWith("/api/")) return handler(req, res);
  const pathname = new URL(req.url, "http://localhost").pathname;
  const file = resolve(
    root,
    "." + (pathname === "/" ? "/index.html" : decodeURIComponent(pathname)),
  );
  if (!file.startsWith(root + sep)) {
    res.statusCode = 403;
    res.end();
    return;
  }
  try {
    const body = await readFile(file);
    res.setHeader(
      "Content-Type",
      types[extname(file)] || "application/octet-stream",
    );
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end("Page introuvable");
  }
});
server.listen(3000, "127.0.0.1", () =>
  console.log("YAVIYA indépendant : http://127.0.0.1:3000"),
);
