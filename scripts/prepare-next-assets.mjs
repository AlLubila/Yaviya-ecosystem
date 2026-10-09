import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";

await rm("public", { recursive: true, force: true });
await mkdir("public", { recursive: true });
await cp("frontend/src", "public", { recursive: true });
await cp("frontend/assets/images", "public", { recursive: true });

const config = JSON.parse(
  await readFile("backend/data/market-config.json", "utf8"),
);
await writeFile(
  "public/market-config.js",
  `window.YAVIYA_MARKET_CONFIG = ${JSON.stringify(config)};\n`,
);

console.log("Ressources publiques Next.js préparées.");
