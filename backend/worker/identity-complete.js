import config from "../data/market-config.json" with { type: "json" };
export function approvedIdentity(check, kind) {
  return (
    check?.status === "approved" &&
    check.kind === kind &&
    config.identityCountries.some(
      (c) => c.code === (check.issuing_country ?? check.issuingCountry),
    ) &&
    ["image/jpeg", "image/png"].includes(
      check.document_mime ?? check.documentMime,
    ) &&
    ((check.document_type ?? check.documentType) !== "licence-c" ||
      kind === "courier")
  );
}
