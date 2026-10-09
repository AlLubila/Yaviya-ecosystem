import { readFile } from "node:fs/promises";
import { join } from "node:path";
import LegacyScripts from "./legacy-scripts";

function bodyFrom(document) {
  const match = document.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) throw new Error("Document HTML sans élément body");
  return match[1].replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

export default async function LegacyPage({ file, scripts = [] }) {
  const document = await readFile(
    join(process.cwd(), "frontend", "pages", file),
    "utf8",
  );

  return (
    <>
      <div
        className="next-page-shell"
        dangerouslySetInnerHTML={{ __html: bodyFrom(document) }}
      />
      <LegacyScripts scripts={scripts} />
    </>
  );
}
