// Public account references. Internal authenticated user IDs remain unchanged.
const definitions = {
  buyer: { prefix: "YVC", digits: 4 },
  seller: { prefix: "YVYS", digits: 4 },
  courier: { prefix: "YVYC", digits: 3 },
};
export function formatAccountIdentifier(role, sequence) {
  const format = definitions[role];
  if (!format || !Number.isSafeInteger(sequence) || sequence < 1)
    throw new Error("Invalid account identifier");
  const value = sequence - 1;
  const number = Math.floor(value / 26)
    .toString()
    .padStart(format.digits, "0");
  const letter = String.fromCharCode(97 + (value % 26));
  return `${format.prefix}-${number}${letter}`;
}
export async function accountIdentifiers(env, userId, accountType = "buyer") {
  if (!definitions[accountType]) throw new Error("Invalid account type");
  const existing = (
    await env.DB.prepare(
      "SELECT id,role FROM account_identifiers WHERE user_id=?",
    )
      .bind(userId)
      .all()
  ).results;
  const wanted = accountType === "buyer" ? ["buyer"] : ["buyer", accountType];
  for (const role of wanted) {
    if (existing.some((row) => row.role === role)) continue;
    // The unique constraint also handles concurrent first visits or submissions.
    await env.DB.prepare(
      "INSERT INTO account_identifiers (user_id,role) VALUES (?,?) ON CONFLICT(user_id,role) DO NOTHING",
    )
      .bind(userId, role)
      .run();
  }
  const rows = (
    await env.DB.prepare(
      "SELECT id,role FROM account_identifiers WHERE user_id=?",
    )
      .bind(userId)
      .all()
  ).results;
  const ids = Object.fromEntries(
    rows.map((row) => [row.role, formatAccountIdentifier(row.role, row.id)]),
  );
  return {
    accountIds: ids,
    customerNumber: ids.buyer,
    sellerNumber: ids.seller || null,
    courierNumber: ids.courier || null,
    accountId: ids[accountType],
  };
}
