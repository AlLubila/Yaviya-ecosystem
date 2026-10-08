import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const corePath = new URL(
  "../supabase/migrations/20261007231856_yaviya_core.sql",
  import.meta.url,
);
const storagePath = new URL(
  "../supabase/migrations/20261007231914_yaviya_storage.sql",
  import.meta.url,
);
const hardeningPath = new URL(
  "../supabase/migrations/20261007232019_advisor_hardening.sql",
  import.meta.url,
);
const runtimePath = new URL(
  "../supabase/migrations/20261007233426_runtime_postgres_adapter.sql",
  import.meta.url,
);
const runtimeIndexesPath = new URL(
  "../supabase/migrations/20261007235502_runtime_fk_indexes.sql",
  import.meta.url,
);

test("PostgreSQL marketplace schema includes protected launch domains", async () => {
  const sql = await readFile(corePath, "utf8");
  const tables = [
    "profiles",
    "stores",
    "categories",
    "products",
    "product_images",
    "orders",
    "order_items",
    "order_participants",
    "deliveries",
    "seller_reviews",
    "courier_reviews",
    "identity_checks",
    "payment_transactions",
    "refunds",
    "ledger_entries",
    "payouts",
    "coupon_events",
  ];
  for (const table of tables) {
    assert.match(sql, new RegExp(`create table public\\.${table} \\(`));
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} enable row level security;`),
    );
  }
  assert.match(sql, /d\.courier_id = new\.courier_id/);
  assert.match(sql, /idempotency_key text not null unique/);
  assert.match(sql, /Financial tables intentionally have no client insert/);
  assert.match(sql, /create schema if not exists private/);
  assert.doesNotMatch(sql, /function public\.(?:is_admin|is_store_member|can_access_order)/);
  assert.match(sql, /revoke all on all tables in schema public from anon, authenticated/);
  assert.match(sql, /private\.is_store_owner\(store_id\)/);
  assert.equal(
    [...sql.matchAll(/\('\S+', '[^']+', '[^']+', \d+\)/g)].length,
    12,
  );
});
test("Supabase Storage separates public catalogue photos from private evidence", async () => {
  const sql = await readFile(storagePath, "utf8");
  assert.match(sql, /'product-images', 'product-images', true/);
  assert.match(sql, /'identity-documents', 'identity-documents', false/);
  assert.match(sql, /'delivery-proofs', 'delivery-proofs', false/);
  assert.doesNotMatch(sql, /create policy identity_public_download/i);
});

test("Supabase advisor hardening adds indexes and optimized policies", async () => {
  const sql = await readFile(hardeningPath, "utf8");
  assert.match(sql, /create index products_owner_idx/);
  assert.match(sql, /product_view_service_only/);
  assert.match(sql, /\(select auth\.uid\(\)\)/);
  assert.match(sql, /store_members_owner_insert/);
  assert.match(sql, /product_images_store_delete/);
});

test("server runtime stays private and uses a least-privileged PostgreSQL role", async () => {
  const sql = await readFile(runtimePath, "utf8");
  assert.match(sql, /create schema if not exists runtime/i);
  assert.match(
    sql,
    /revoke all on schema runtime from public, anon, authenticated/i,
  );
  assert.match(sql, /grant usage on schema runtime to yaviya_runtime/i);
  assert.match(sql, /create table runtime\.auth_users/i);
  assert.match(sql, /create table runtime\.market_orders/i);
  assert.match(sql, /create table runtime\.private_files/i);
  assert.doesNotMatch(sql, /password\s+'/i);
  const indexes = await readFile(runtimeIndexesPath, "utf8");
  assert.match(indexes, /auth_sessions_user_idx/);
  assert.match(indexes, /google_identities_user_idx/);
  assert.match(indexes, /auth_mfa_challenges_user_idx/);
});
