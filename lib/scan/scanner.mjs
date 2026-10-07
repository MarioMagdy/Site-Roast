// Deterministic pass over a crawl: detectors + readability per page.
import fs from "node:fs";
import path from "node:path";
import { readJSON, writeJSON } from "../paths.mjs";
import { DETECTORS } from "./detectors.mjs";
import { readability } from "./readability.mjs";

export function scanRun(run, { optIn = [], log = console.log } = {}) {
  const site = readJSON(path.join(run, "site.json"));
  if (!site) throw new Error(`No site.json in ${run}`);
  const summary = [];
  for (const p of site.pages) {
    const dir = path.join(run, "pages", p.slug);
    const scan = { url: p.url, readability: readability(fs.readFileSync(path.join(dir, "text.md"), "utf8")) };
    const row = { slug: p.slug, url: p.url, flesch: scan.readability?.fleschReadingEase ?? null };
    for (const d of DETECTORS) {
      if (d.optIn && !optIn.includes(d.optIn)) continue;
      scan[d.name] = d.run(dir, { url: p.url });
      Object.assign(row, d.summarize(scan[d.name]));
    }
    writeJSON(path.join(dir, "scan.json"), scan);
    summary.push(row);
    log(`${p.slug.padEnd(28)} writing=${row.writingScore ?? "?"} (${row.writingLabel ?? "-"})  design-tells=${row.designTells?.length ?? "?"}  flesch=${row.flesch ?? "-"}` +
      (row.lighthouse ? `  lh ${Object.entries(row.lighthouse).map(([k, v]) => `${k}=${v}`).join(" ")} lcp=${row.lcp}` : ""));
  }
  writeJSON(path.join(run, "scan-summary.json"), summary);
  return summary;
}
