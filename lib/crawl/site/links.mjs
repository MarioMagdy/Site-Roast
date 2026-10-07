// Link checker: internal links (incl. cross-page #anchors) and a sample of outbound links.
import path from "node:path";
import { readJSON } from "../../paths.mjs";

async function status(url, method = "HEAD") {
  try {
    const r = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(10000), headers: { "user-agent": "Mozilla/5.0 (site-roast link check)" } });
    if (method === "HEAD" && [403, 405, 501].includes(r.status)) return status(url, "GET");
    return r.status;
  } catch (e) {
    return e.cause?.code ?? "error";
  }
}

export async function checkLinks(run, site, { soft404 = false, maxInternal = 150, maxExternal = 60 } = {}) {
  const host = new URL(site.origin).hostname;
  const pages = site.pages.map((p) => ({ ...p, meta: readJSON(path.join(run, "pages", p.slug, "meta.json"), {}) }));
  const crawled = new Map(pages.map((p) => [p.url.replace(/\/$/, ""), p]));
  const internal = new Map();
  const external = new Map();
  const anchors = [];
  for (const p of pages) {
    for (const href of p.meta.links ?? []) {
      let u;
      try { u = new URL(href); } catch { continue; }
      if (!/^https?:$/.test(u.protocol)) continue;
      const hash = u.hash; u.hash = "";
      const clean = u.toString().replace(/\/$/, "");
      const bucket = u.hostname === host ? internal : external;
      if (!bucket.has(clean)) bucket.set(clean, new Set());
      bucket.get(clean).add(p.slug);
      if (hash.length > 1 && u.hostname === host && crawled.has(clean) && clean !== p.url.replace(/\/$/, "")) {
        const target = crawled.get(clean);
        if (!(target.meta.ids ?? []).includes(decodeURIComponent(hash.slice(1)))) anchors.push({ from: p.slug, href: href.slice(0, 200) });
      }
    }
  }
  const results = { internal: [], external: [], brokenAnchors: [...new Map(anchors.map((a) => [a.href, a])).values()], soft404 };
  for (const [url, from] of [...internal].filter(([u]) => !crawled.has(u)).slice(0, maxInternal)) {
    results.internal.push({ url, from: [...from], status: await status(url) });
  }
  for (const [url, from] of [...external].slice(0, maxExternal)) {
    results.external.push({ url, from: [...from], status: await status(url) });
  }
  const isBroken = (s) => typeof s !== "number" || s === 404 || s === 410 || s >= 500;
  const unverifiable = (s) => [401, 403, 429, 999].includes(s);
  results.broken = [...results.internal, ...results.external].filter((l) => isBroken(l.status) && !unverifiable(l.status));
  results.unverifiable = [...results.internal, ...results.external].filter((l) => unverifiable(l.status)).length;
  results.checked = results.internal.length + results.external.length;
  return results;
}
