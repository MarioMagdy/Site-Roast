// Breadth-first same-origin crawl. Homepage first, then nav links, then the sitemap, so the
// page budget goes to the pages that matter most.
import fs from "node:fs";
import path from "node:path";
import { launchBrowser } from "../browser.mjs";
import { writeJSON } from "../paths.mjs";
import { capturePage } from "./capture.mjs";
import { makeNormalizer, sitemapUrls, slugFor } from "./urls.mjs";

export async function crawlSite(start, { out, max = 15, includeApp = false, log = console.log } = {}) {
  const origin = new URL(start).origin;
  const normalize = makeNormalizer(origin, { includeApp });
  fs.mkdirSync(path.join(out, "pages"), { recursive: true });

  const queue = [normalize(start) ?? start];
  const seen = new Set(queue);
  const capturedUrls = new Set();
  const capturedPrints = new Map(); // title+headings fingerprint -> url, catches aliases like /home == /
  const pages = [];
  const skipped = [];
  const fromSitemap = await sitemapUrls(origin, normalize);
  const browser = await launchBrowser();

  try {
    while (queue.length && pages.length < max) {
      const url = queue.shift();
      const dir = path.join(out, "pages", slugFor(url));
      try {
        const { meta, links, finalUrl, fingerprint } = await capturePage(browser, url, dir);
        const final = normalize(finalUrl) ?? url;
        const dupeOf = (final !== url && capturedUrls.has(final) && final) || capturedPrints.get(fingerprint);
        if (dupeOf) {
          fs.rmSync(dir, { recursive: true, force: true });
          skipped.push({ url, reason: `duplicate of ${dupeOf}` });
          log(`= ${url} (duplicate of ${dupeOf})`);
          continue;
        }
        capturedUrls.add(final);
        capturedPrints.set(fingerprint, url);
        pages.push({ url, slug: meta.slug, title: meta.title, status: meta.status });
        log(`✓ ${String(pages.length).padStart(2)} ${meta.status} ${url}`);
        for (const l of [...links, ...(pages.length === 1 ? fromSitemap : [])]) {
          const n = normalize(l);
          if (n && !seen.has(n)) { seen.add(n); queue.push(n); }
        }
      } catch (e) {
        fs.rmSync(dir, { recursive: true, force: true });
        skipped.push({ url, reason: e.message.split("\n")[0] });
        log(`✗ ${url} - ${e.message.split("\n")[0]}`);
      }
    }
  } finally {
    await browser.close();
  }

  const site = { start, origin, crawledAt: new Date().toISOString(), pages, skipped, notCrawled: queue.slice(0, 200) };
  writeJSON(path.join(out, "site.json"), site);
  return site;
}
