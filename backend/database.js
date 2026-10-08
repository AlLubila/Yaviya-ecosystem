import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

function result(rows, changes = 0, lastRowId = 0) {
  return {
    results: rows,
    success: true,
    meta: { changes, last_row_id: Number(lastRowId) },
  };
}

function safeValue(value) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && /^-?\d+$/.test(value)) {
    const number = Number(value);
    if (Number.isSafeInteger(number)) return number;
  }
  return value;
}

function postgresQuery(source) {
  let index = 0,
    quote = "",
    output = "";
  for (let position = 0; position < source.length; position += 1) {
    const character = source[position];
    if (quote) {
      output += character;
      if (character === quote) {
        if (source[position + 1] === quote) output += source[++position];
        else quote = "";
      }
    } else if (character === "'" || character === '"') {
      quote = character;
      output += character;
    } else if (character === "?") output += `$${++index}`;
    else output += character;
  }
  // PostgreSQL folds unquoted aliases to lower-case; the API contract does not.
  return output.replace(/\bAS\s+([a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)\b/g, 'AS "$1"');
}

function postgresResult(rows) {
  const normalized = rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([column, value]) => [column, safeValue(value)]),
    ),
  );
  const changes = rows.command === "SELECT" ? 0 : Number(rows.count || 0);
  return result(normalized, changes);
}

export async function createPostgresDatabase(config = process.env) {
  const url = config.POSTGRES_URL || config.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL must be configured");
  const endpoint = new URL(url);
  if (!/^postgres(?:ql)?:$/.test(endpoint.protocol) || !endpoint.username)
    throw new Error("Configure a valid PostgreSQL connection URL");
  const { default: postgres } = await import("postgres");
  const client = postgres(url, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 20,
    ssl: "require",
    connection: { application_name: "yaviya-api" },
  });
  const execute = (statement, transaction = client) =>
    transaction.unsafe(postgresQuery(statement.sql), statement.args);
  const scoped = async (callback) =>
    client.begin(async (transaction) => {
      await transaction.unsafe(
        "set local search_path to runtime, public; set local statement_timeout to '8s'",
      );
      return callback(transaction);
    });
  return {
    dialect: "postgres",
    prepare(sql) {
      return {
        sql,
        args: [],
        bind(...args) {
          return { ...this, args };
        },
        async all() {
          return scoped(async (transaction) =>
            postgresResult(await execute(this, transaction)),
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
      if (!statements.length) return [];
      return scoped(async (transaction) => {
        const values = [];
        for (const statement of statements)
          values.push(postgresResult(await execute(statement, transaction)));
        return values;
      });
    },
    close() {
      return client.end({ timeout: 2 });
    },
  };
}

// Adapt the original D1 contract to SQLite/libSQL without changing SQL handlers.
export async function createDatabase(config = process.env) {
  if (config.POSTGRES_URL || config.DATABASE_URL)
    return createPostgresDatabase(config);
  const { createClient } = await import("@libsql/client");
  let url = config.TURSO_DATABASE_URL;
  if (!url) {
    if (config.VERCEL || config.NODE_ENV === "production")
      throw new Error("POSTGRES_URL must be configured");
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
    dialect: "sqlite",
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
