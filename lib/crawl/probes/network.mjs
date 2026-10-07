// Node-side listeners for one page: every request, failures, JS exceptions, console errors,
// and a secrets scan over first-party scripts.
import { scanSecrets } from "./secrets.mjs";

/** Hosts that first-party code talks to (fetch targets, form endpoints) even if not called on load. */
export function referencedHosts(text) {
  const hosts = new Set();
  for (const m of text.matchAll(/https?:\/\/([a-z0-9.-]+\.[a-z]{2,})(?=[/:'"`?\s])/gi)) hosts.add(m[1].toLowerCase());
  return [...hosts];
}

export function watchNetwork(page, origin) {
  const host = new URL(origin).hostname;
  const out = { requests: [], failed: [], pageErrors: [], consoleErrors: [], consoleWarnings: [], secrets: [], referencedHosts: [], stylesheets: [] };
  const pending = [];

  page.on("pageerror", (e) => out.pageErrors.push(String(e.message || e).slice(0, 300)));
  page.on("console", (m) => {
    if (m.type() === "error") out.consoleErrors.push(m.text().slice(0, 300));
    else if (m.type() === "warning") out.consoleWarnings.push(m.text().slice(0, 200));
  });
  page.on("requestfailed", (r) => out.failed.push({ url: r.url().slice(0, 300), type: r.resourceType(), error: r.failure()?.errorText ?? null }));
  page.on("response", (r) => {
    const req = r.request();
    const url = r.url();
    if (url.startsWith("data:")) return;
    let reqHost = "";
    try { reqHost = new URL(url).hostname; } catch {}
    out.requests.push({ url: url.slice(0, 300), host: reqHost, type: req.resourceType(), method: req.method(), status: r.status(), firstParty: reqHost === host });
    if (req.resourceType() === "stylesheet") pending.push(r.text().then((t) => out.stylesheets.push(t)).catch(() => {}));
    if (req.resourceType() === "script" && reqHost === host) {
      pending.push(r.text().then((t) => {
        out.secrets.push(...scanSecrets(t, url.slice(0, 200)));
        out.referencedHosts.push(...referencedHosts(t));
      }).catch(() => {}));
    }
  });

  return {
    data: out,
    settle: () => Promise.allSettled(pending),
  };
}
