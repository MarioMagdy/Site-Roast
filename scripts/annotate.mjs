#!/usr/bin/env node
// Usage: npm run annotate [-- runs/<id>]
// Draws numbered markers for every finding target in roast.json -> runs/<id>/annotations/.
import path from "node:path";
import { annotateRun } from "../lib/annotate/annotate.mjs";
import { parseArgs, readJSON, resolveRun } from "../lib/paths.mjs";
import { normalizeRoast } from "../lib/report/normalize.mjs";

const run = resolveRun(parseArgs(process.argv.slice(2)).positional[0]);
const raw = readJSON(path.join(run, "roast.json"));
if (!raw) { console.error(`No roast.json in ${run}`); process.exit(1); }
const res = await annotateRun(run, normalizeRoast(raw));
console.log(`${res.crops.length} annotated crop(s); ${res.unresolved.length} marker(s) not placed`);
for (const u of res.unresolved) console.log(`  #${u.n} ${u.page} @ ${u.viewport}: ${JSON.stringify(u.target)}${u.error ? ` (${u.error})` : ""}`);
