import { readFile, readdir } from "node:fs/promises";
import { createDatabase } from "../backend/database.js";
export async function migrate(db) {
  await db
    .prepare(
      "CREATE TABLE IF NOT EXISTS yaviya_migrations (name TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)",
    )
    .run();
  const directory = new URL("../database/migrations/", import.meta.url);
  for (const file of (await readdir(directory))
    .filter((file) => file.endsWith(".sql"))
    .sort()) {
    if (
      await db
        .prepare("SELECT name FROM yaviya_migrations WHERE name=?")
        .bind(file)
        .first()
    )
      continue;
    const statements = (await readFile(new URL(file, directory), "utf8"))
      .split("--> statement-breakpoint")
      .map((sql) => sql.trim())
      .filter(Boolean);
    await db.batch([
      ...statements.map((sql) => db.prepare(sql)),
      db
        .prepare("INSERT INTO yaviya_migrations (name,applied_at) VALUES (?,?)")
        .bind(file, Date.now()),
    ]);
    console.log(`Migration appliquée : ${file}`);
  }
}
if (
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1]}`).href
) {
  const db = await createDatabase();
  try {
    await migrate(db);
  } finally {
    db.close();
  }
}
