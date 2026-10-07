import test from "node:test";
import assert from "node:assert/strict";
import { approvedIdentity } from "../backend/worker/identity-complete.js";
import config from "../backend/data/market-config.json" with { type: "json" };
test("professional access requires approved identity, country and photo; licence C is courier-only", () => {
  const valid = {
    kind: "seller",
    status: "approved",
    issuing_country: "CD",
    document_mime: "image/jpeg",
    document_type: "identity",
  };
  assert.equal(approvedIdentity(valid, "seller"), true);
  for (const patch of [
    { status: "pending" },
    { issuing_country: "" },
    { issuing_country: "ZZ" },
    { document_mime: "" },
    { document_mime: "application/pdf" },
    { document_type: "licence-c" },
  ])
    assert.equal(approvedIdentity({ ...valid, ...patch }, "seller"), false);
  assert.equal(
    approvedIdentity(
      { ...valid, kind: "courier", document_type: "licence-c" },
      "courier",
    ),
    true,
  );
  assert.equal(approvedIdentity(valid, "courier"), false);
  assert.equal(config.identityCountries.length, 250);
  assert.equal(new Set(config.identityCountries.map((c) => c.code)).size, 250);
  for (const code of ["CD", "CG", "PL", "FR", "US", "CN", "ZA", "SS", "XK"])
    assert.ok(config.identityCountries.some((c) => c.code === code));
});
