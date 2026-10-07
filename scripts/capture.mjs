#!/usr/bin/env node
// Usage: npm run capture -- <url> [--max=15] [--all]
// Crawl + deterministic scan in one go: everything the site-roast skill needs before judging.
import path from "node:path";
import { crawlSite } from "../lib/crawl/crawler.mjs";
import { RUNS_DIR, parseArgs } from "../lib/paths.mjs";
import { scanRun } from "../lib/scan/scanner.mjs";

const { flags, positional: [url] } = parseArgs(process.argv.slice(2));
if (!url) { console.error("usage: capture <url> [--max=15] [--all]"); process.exit(1); }
const out = path.resolve(flags.out ?? path.join(RUNS_DIR, `${new URL(url).hostname}-${new Date().toISOString().slice(0, 10)}`));
const site = await crawlSite(url, { out, max: Number(flags.max ?? 15), includeApp: !!flags.all });
console.log("");
scanRun(out);
console.log(`\nrun: ${path.relative(process.cwd(), out)}  (${site.pages.length} pages)`);
