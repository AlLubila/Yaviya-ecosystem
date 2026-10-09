import { access, readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
const folders = [
  "frontend/pages",
  "frontend/src",
  "frontend/styles",
  "frontend/assets/images",
];
const assets = new Map([
  ["market-config.js", "backend/data/market-config.json"],
]);
for (const folder of folders)
  for (const name of await readdir(folder)) {
    assert(!assets.has(name), "Duplicate asset: " + name);
    assets.set(name, folder + "/" + name);
  }
const html = await readFile("frontend/pages/index.html", "utf8");
for (const directory of [
  "frontend/src",
  "backend",
  "backend/worker",
  "scripts",
  "tests",
]) {
  for (const file of (await readdir(directory)).filter((f) =>
    /\.(m?js)$/.test(f),
  )) {
    const result = spawnSync(
      process.execPath,
      ["--check", `${directory}/${file}`],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, `${directory}/${file}: ${result.stderr}`);
  }
}
for (const file of [
  "app/layout.js",
  "app/page.js",
  "app/api/[...path]/route.js",
  "next.config.mjs",
  "scripts/prepare-next-assets.mjs",
])
  await access(file);
for (const page of [
  "index.html",
  "congo.html",
  "aide.html",
  "confidentialite.html",
  "publicite.html",
]) {
  const content = await readFile(assets.get(page), "utf8");
  for (const match of content.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
    const path = match[1].split("?")[0];
    if (/^[a-zA-Z0-9_.-]+\.(?:html|js|css|jpg|png|webp)$/.test(path))
      assert(assets.has(path), "Missing asset: " + path);
  }
}
assert.ok(html.includes("auth-independent.js"));
const packageJson = JSON.parse(await readFile("package.json", "utf8"));
assert.ok(packageJson.dependencies.next);
assert.ok(packageJson.dependencies.react);
assert.equal(packageJson.scripts.build, "next build");
assert.equal(
  JSON.parse(await readFile("vercel.json", "utf8")).framework,
  "nextjs",
);
console.log(
  "Sources originales, routes Next.js et configuration Vercel vérifiées.",
);
