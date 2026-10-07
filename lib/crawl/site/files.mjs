// Well-known public files and soft-404 detection (a missing page that answers 200).

async function probe(url) {
  try {
    const r = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(10000) });
    const ct = r.headers.get("content-type") ?? "";
    const body = (await r.text()).slice(0, 4000);
    return { status: r.status, contentType: ct, looksHtml: /text\/html/.test(ct) || /^\s*<!doctype html/i.test(body), sample: body.slice(0, 160) };
  } catch (e) {
    return { status: null, error: e.cause?.code ?? e.message };
  }
}

export async function wellKnownFiles(origin) {
  const missing = await probe(`${origin}/site-roast-missing-${Date.now().toString(36)}`);
  const soft404 = missing.status === 200;
  const files = {};
  for (const [name, p, expectHtml] of [
    ["robots.txt", "/robots.txt", false], ["sitemap.xml", "/sitemap.xml", false],
    ["security.txt", "/.well-known/security.txt", false], ["llms.txt", "/llms.txt", false],
    ["favicon.ico", "/favicon.ico", false],
  ]) {
    const r = await probe(origin + p);
    files[name] = { ...r, exists: r.status === 200 && (expectHtml || !r.looksHtml) };
  }
  return { soft404, missingPageStatus: missing.status, files };
}
