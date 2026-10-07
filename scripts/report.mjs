#!/usr/bin/env node
// Usage: npm run report [-- runs/<id>] [--no-pdf]
// Reads runs/<id>/roast.json (written by the site-roast skill) -> report.html + report.pdf.
import fs from "node:fs";
import path from "node:path";
import { htmlToPdf } from "../lib/report/pdf.mjs";
import { validateRoast } from "../lib/report/lenses.mjs";
import { renderReport } from "../lib/report/template.mjs";
import { parseArgs, readJSON, resolveRun } from "../lib/paths.mjs";
import { LOCK } from "../lib/skills/sync.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const run = resolveRun(positional[0]);
const roast = readJSON(path.join(run, "roast.json"));
if (!roast) { console.error(`No roast.json in ${run}. The site-roast skill writes it.`); process.exit(1); }
const errors = validateRoast(roast);
if (errors.length) { console.error("roast.json is invalid:\n  " + errors.join("\n  ")); process.exit(1); }

const html = path.join(run, "report.html");
fs.writeFileSync(html, renderReport(roast, { run, lock: readJSON(LOCK, {}) }));
console.log(`report.html -> ${html}`);
if (!flags["no-pdf"]) {
  await htmlToPdf(html, path.join(run, "report.pdf"));
  console.log(`report.pdf  -> ${path.join(run, "report.pdf")}`);
}
