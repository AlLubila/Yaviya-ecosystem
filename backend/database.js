import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

function result(rows, changes = 0, lastRowId = 0) {
  return {
    results: rows,
    success: true,
    meta: { changes, last_row_id: Number(lastRowId) },
  };
}

// Adapt the original D1 contract to SQLite/libSQL without changing SQL handlers.
export async function createDatabase(config = process.env) {
  const { createClient } = await import("@libsql/client");
  let url = config.TURSO_DATABASE_URL;
  if (!url) {
    if (config.VERCEL || config.NODE_ENV === "production")
      throw new Error(
        "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be configured",
      );
    const path = config.SQLITE_PATH || ".local/yaviya.sqlite";
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    url = path === ":memory:" ? "file::memory:" : `file:${path}`;
  } else {
    const endpoint = new URL(url.replace(/^libsql:/, "https:"));
    if (
      endpoint.protocol !== "https:" ||
      endpoint.username ||
      endpoint.password ||
      !config.TURSO_AUTH_TOKEN
    )
      throw new Error("Configure a HTTPS database URL and TURSO_AUTH_TOKEN");
  }
  const client = createClient({ url, authToken: config.TURSO_AUTH_TOKEN });
  const convert = (value) =>
    result(
      value.rows.map((row) =>
        Object.fromEntries(
          value.columns.map((column) => [column, row[column]]),
        ),
      ),
      value.rowsAffected,
      value.lastInsertRowid || 0,
    );
  const parameters = (args) =>
    args.map((value) => (typeof value === "boolean" ? Number(value) : value));
  return {
    prepare(sql) {
      return {
        sql,
        args: [],
        bind(...args) {
          return { ...this, args };
        },
        async all() {
          return convert(
            await client.execute({
              sql: this.sql,
              args: parameters(this.args),
            }),
          );
        },
        async first(column) {
          const row = (await this.all()).results[0] || null;
          return column ? (row?.[column] ?? null) : row;
        },
        async run() {
          return this.all();
        },
      };
    },
    async batch(statements) {
      return statements.length
        ? (
            await client.batch(
              statements.map(({ sql, args }) => ({
                sql,
                args: parameters(args),
              })),
              "write",
            )
          ).map(convert)
        : [];
    },
    close() {
      client.close();
    },
  };
}

// Private uploads stay behind the original authorization checks. No public URLs.
export function createPrivateFiles(db) {
  return {
    async put(key, data, options = {}) {
      const bytes = Buffer.from(
        data instanceof ArrayBuffer ? new Uint8Array(data) : data,
      );
      await db
        .prepare(
          "INSERT INTO private_files (key,body,content_type) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET body=excluded.body,content_type=excluded.content_type",
        )
        .bind(
          key,
          bytes,
          options.httpMetadata?.contentType || "application/octet-stream",
        )
        .run();
    },
    async get(key) {
      const row = await db
        .prepare("SELECT body,content_type FROM private_files WHERE key=?")
        .bind(key)
        .first();
      return row
        ? {
            body: new Uint8Array(row.body),
            httpMetadata: { contentType: row.content_type },
          }
        : null;
    },
    async delete(key) {
      await db.prepare("DELETE FROM private_files WHERE key=?").bind(key).run();
    },
  };
}
