"use client";

import { useEffect } from "react";

function loadScript(source) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `/${source}`;
    script.async = false;
    script.dataset.yaviyaNext = "true";
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Impossible de charger ${source}`));
    document.body.appendChild(script);
  });
}

export default function LegacyScripts({ scripts }) {
  useEffect(() => {
    const key = scripts.join("|");
    if (window.__YAVIYA_NEXT_SCRIPT_SET__ === key) return;
    window.__YAVIYA_NEXT_SCRIPT_SET__ = key;

    scripts
      .reduce(
        (pending, source) => pending.then(() => loadScript(source)),
        Promise.resolve(),
      )
      .catch((error) => {
        window.__YAVIYA_NEXT_SCRIPT_SET__ = "";
        console.error(error);
      });
  }, [scripts]);

  return null;
}
