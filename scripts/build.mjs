import { mkdir, readdir, copyFile, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
const names = new Set();
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
