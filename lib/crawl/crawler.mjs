// Breadth-first same-origin crawl, then site-level checks. Homepage first, then nav links, then
// the sitemap, so the page budget goes to the pages that matter most.
import fs from "node:fs";
import path from "node:path";
import { launchBrowser } from "../browser.mjs";
import { writeJSON } from "../paths.mjs";
import { capturePage } from "./capture.mjs";
import { runSiteChecks } from "./site/index.mjs";
import { makeNormalizer, sitemapUrls, slugFor } from "./urls.mjs";

export async function crawlSite(start, { out, max = 15, includeApp = false, siteChecks = true, log = console.log } = {}) {
  const origin = new URL(start).origin;
  const normalize = makeNormalizer(origin, { includeApp });
  fs.mkdirSync(path.join(out, "pages"), { recursive: true });

  const queue = [normalize(start) ?? start];
  const seen = new Set(queue);
  const capturedUrls = new Set();
  const capturedPrints = new Map(); // title+headings fingerprint -> url, catches aliases like /home == /
  const pages = [];
  const skipped = [];
  let cookies = [];
  const fromSitemap = await sitemapUrls(origin, normalize);
  const browser = await launchBrowser();

  try {
    while (queue.length && pages.length < max) {
      const url = queue.shift();
      if (capturedUrls.has(url)) { skipped.push({ url, reason: "already captured via redirect" }); continue; }
      const dir = path.join(out, "pages", slugFor(url));
      try {
        const res = await capturePage(browser, url, dir, { origin });
        const final = normalize(res.finalUrl) ?? url;
        const dupeOf = (final !== url && capturedUrls.has(final) && final) || capturedPrints.get(res.fingerprint);
        if (dupeOf) {
          fs.rmSync(dir, { recursive: true, force: true });
          skipped.push({ url, reason: `duplicate of ${dupeOf}` });
          log(`= ${url} (duplicate of ${dupeOf})`);
          continue;
        }
        capturedUrls.add(final);
        capturedPrints.set(res.fingerprint, url);
        if (!pages.length) cookies = res.cookies;
        pages.push({ url, slug: res.meta.slug, title: res.meta.title, status: res.meta.status });
        log(`✓ ${String(pages.length).padStart(2)} ${res.meta.status} ${url}`);
        for (const l of [...res.links, ...(pages.length === 1 ? fromSitemap : [])]) {
          const n = normalize(l);
          if (n && !seen.has(n)) { seen.add(n); queue.push(n); }
        }
      } catch (e) {
        fs.rmSync(dir, { recursive: true, force: true });
        skipped.push({ url, reason: e.message.split("\n")[0] });
        log(`✗ ${url} - ${e.message.split("\n")[0]}`);
      }
    }
    const site = { start, origin, crawledAt: new Date().toISOString(), pages, skipped, notCrawled: queue.slice(0, 200) };
    writeJSON(path.join(out, "site.json"), site);
    if (siteChecks) await runSiteChecks(browser, out, site, { cookies, log });
    return site;
  } finally {
    await browser.close();
  }
}
