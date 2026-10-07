// Passive security review: only what any visitor's browser already receives. No probing for
// hidden files, no fuzzing, no logins.
import path from "node:path";
import { readJSON } from "../../paths.mjs";
import { classifyHost } from "./known-hosts.mjs";

const HEADER_CHECKS = [
  { id: "hsts", label: "Strict-Transport-Security (HSTS)", test: (h) => h["strict-transport-security"] },
  { id: "csp", label: "Content-Security-Policy", test: (h) => h["content-security-policy"] },
  { id: "framing", label: "Clickjacking protection (X-Frame-Options or CSP frame-ancestors)",
    test: (h) => h["x-frame-options"] || (/frame-ancestors/.test(h["content-security-policy"] ?? "") && "frame-ancestors") },
  { id: "nosniff", label: "X-Content-Type-Options", test: (h) => h["x-content-type-options"] },
  { id: "referrer", label: "Referrer-Policy", test: (h) => h["referrer-policy"] },
  { id: "permissions", label: "Permissions-Policy", test: (h) => h["permissions-policy"] },
];

export async function securityChecks(run, site, cookies) {
  const pages = site.pages.map((p) => ({
    slug: p.slug,
    meta: readJSON(path.join(run, "pages", p.slug, "meta.json"), {}),
    network: readJSON(path.join(run, "pages", p.slug, "network.json"), {}),
    bugs: readJSON(path.join(run, "pages", p.slug, "bugs.json"), {}),
  }));
  const home = pages[0];
  const h = home?.meta.responseHeaders ?? {};
  const host = new URL(site.origin).hostname;

  let httpsRedirect = null;
  try {
    const r = await fetch(`http://${new URL(site.origin).host}/`, { redirect: "manual", signal: AbortSignal.timeout(10000) });
    httpsRedirect = { status: r.status, location: r.headers.get("location"), ok: [301, 302, 307, 308].includes(r.status) && /^https:/.test(r.headers.get("location") ?? "") };
  } catch (e) {
    httpsRedirect = { status: null, error: e.cause?.code ?? e.message, ok: null };
  }

  const requests = pages.flatMap((p) => (p.network.requests ?? []).map((r) => ({ ...r, page: p.slug })));
  const thirdParty = {};
  for (const r of requests.filter((r) => !r.firstParty && r.host)) {
    const c = classifyHost(r.host);
    const key = `${c.category}|${c.name}`;
    thirdParty[key] ??= { ...c, hosts: new Set(), requests: 0 };
    thirdParty[key].hosts.add(r.host);
    thirdParty[key].requests++;
  }
  const referenced = [...new Set(pages.flatMap((p) => p.network.referencedHosts ?? []))].filter((x) => x !== host);
  const backends = referenced.map((x) => ({ host: x, ...classifyHost(x) }))
    .filter((x) => ["backend", "payments", "cms"].includes(x.category));
  const endpoints = [...new Map(requests.filter((r) => ["xhr", "fetch", "eventsource", "websocket"].includes(r.type))
    .map((r) => { const u = new URL(r.url); return [`${r.method} ${u.host}${u.pathname}`, { method: r.method, url: `${u.host}${u.pathname}`, status: r.status, page: r.page }]; })).values()];

  const secrets = [...new Map(pages.flatMap((p) => p.network.secrets ?? []).map((s) => [`${s.type}|${s.value}`, s])).values()];
  const mixedContent = requests.filter((r) => r.url.startsWith("http:") && site.origin.startsWith("https:")).map((r) => ({ url: r.url, page: r.page }));
  const firstPartyCookies = (cookies ?? []).map((c) => ({
    name: c.name, domain: c.domain, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite,
    thirdParty: !host.endsWith(c.domain.replace(/^\./, "")),
  }));

  return {
    headers: HEADER_CHECKS.map((c) => ({ id: c.id, label: c.label, pass: !!c.test(h), value: String(c.test(h) || "").slice(0, 140) || null })),
    disclosure: { server: h.server ?? null, poweredBy: h["x-powered-by"] ?? null },
    https: site.origin.startsWith("https:"),
    httpsRedirect,
    cookies: firstPartyCookies,
    mixedContent: mixedContent.slice(0, 20),
    secrets,
    blankNoOpener: pages.reduce((n, p) => n + (p.bugs.blankNoOpener?.length ?? 0), 0),
    thirdParties: Object.values(thirdParty).map((t) => ({ ...t, hosts: [...t.hosts] })).sort((a, b) => b.requests - a.requests),
    backends: [...new Map(backends.map((b) => [b.name, b])).values()],
    endpoints: endpoints.slice(0, 40),
    forms: pages.flatMap((p) => (p.bugs.forms ?? []).map((f) => ({ ...f, page: p.slug })))
      .filter((f, i, all) => all.findIndex((g) => g.selector === f.selector && g.fields.length === f.fields.length) === i),
  };
}
