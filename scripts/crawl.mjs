#!/usr/bin/env node
// Usage: npm run crawl -- <url> [--max=15] [--all] [--out=runs/<id>]
import path from "node:path";
import { crawlSite } from "../lib/crawl/crawler.mjs";
import { RUNS_DIR, parseArgs } from "../lib/paths.mjs";

const { flags, positional: [url] } = parseArgs(process.argv.slice(2));
if (!url) { console.error("usage: crawl <url> [--max=15] [--all] [--out=dir]"); process.exit(1); }
const out = path.resolve(flags.out ?? path.join(RUNS_DIR, `${new URL(url).hostname}-${new Date().toISOString().slice(0, 10)}`));
const site = await crawlSite(url, { out, max: Number(flags.max ?? 15), includeApp: !!flags.all });
console.log(`\n${site.pages.length} page(s) -> ${path.relative(process.cwd(), out)}` +
  (site.notCrawled.length ? `  (${site.notCrawled.length} more found; raise --max to include)` : ""));
