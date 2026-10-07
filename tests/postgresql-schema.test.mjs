import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const corePath = new URL(
  "../supabase/migrations/20261008000100_yaviya_core.sql",
  import.meta.url,
);
const storagePath = new URL(
  "../supabase/migrations/20261008000200_storage.sql",
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
