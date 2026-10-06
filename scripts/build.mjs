import {
  mkdir,
  readdir,
  copyFile,
  rm,
  readFile,
  writeFile,
} from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
const config = JSON.parse(
  await readFile("backend/data/market-config.json", "utf8"),
);
await writeFile(
  "dist/market-config.js",
  "window.YAVIYA_MARKET_CONFIG = " + JSON.stringify(config) + ";\n",
);
const names = new Set(["market-config.js"]);
for (const folder of ["pages", "src", "styles", "assets/images"]) {
  for (const name of await readdir("frontend/" + folder)) {
    if (names.has(name))
      throw new Error("Duplicate frontend filename: " + name);
    names.add(name);
    await copyFile("frontend/" + folder + "/" + name, "dist/" + name);
  }
}
console.log(
  "YAVIYA complet compilé : " +
    names.size +
    " fichiers frontend ; API dans api/handler.js.",
);
