#!/usr/bin/env node
// Usage: npm run report [-- runs/<id>] [--no-annotate] [--no-pdf]
// roast.json (written by the site-roast skill) -> validate -> annotate screenshots -> report.html + report.pdf
import fs from "node:fs";
import path from "node:path";
import { annotateRun } from "../lib/annotate/annotate.mjs";
import { parseArgs, readJSON, resolveRun } from "../lib/paths.mjs";
import { buildContext } from "../lib/report/context.mjs";
import { normalizeRoast, validateRoast } from "../lib/report/normalize.mjs";
import { htmlToPdf } from "../lib/report/pdf.mjs";
import { renderReport } from "../lib/report/template.mjs";
import { LOCK } from "../lib/skills/sync.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const run = resolveRun(positional[0]);
const raw = readJSON(path.join(run, "roast.json"));
if (!raw) { console.error(`No roast.json in ${run}. The site-roast skill writes it.`); process.exit(1); }
const roast = normalizeRoast(raw);
const errors = validateRoast(roast);
if (errors.length) { console.error("roast.json is invalid:\n  " + errors.join("\n  ")); process.exit(1); }

if (!flags["no-annotate"]) {
  const res = await annotateRun(run, roast);
  if (res.unresolved.length) {
    console.warn(`${res.unresolved.length} marker(s) couldn't be placed (fix their selector/text, or use a box):`);
    for (const u of res.unresolved) console.warn(`  #${u.n} ${u.page} @ ${u.viewport}: ${JSON.stringify(u.target)}`);
  }
}

const html = path.join(run, "report.html");
fs.writeFileSync(html, renderReport(buildContext(run, roast, { lock: readJSON(LOCK, {}) })));
console.log(`report.html -> ${html}`);
if (!flags["no-pdf"]) {
  await htmlToPdf(html, path.join(run, "report.pdf"));
  console.log(`report.pdf  -> ${path.join(run, "report.pdf")}`);
}
