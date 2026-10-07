// URL normalisation, filtering, and folder slugs for the crawler.

const ASSET = /\.(pdf|zip|png|jpe?g|gif|webp|svg|mp4|mp3|xml|json|txt|ico|woff2?)$/i;
// App/auth pages aren't the marketing site; the crawler includes them only with --all.
const APP = /\/(log-?in|sign-?in|sign-?up|register|logout|auth|account|dashboard|cart|checkout|app)(\/|$)/i;

/** Returns normalize(href) -> canonical same-origin page URL, or null if it should be skipped. */
export function makeNormalizer(origin, { includeApp = false } = {}) {
  return (href) => {
    try {
      const u = new URL(href, origin);
      if (u.origin !== origin || ASSET.test(u.pathname) || (!includeApp && APP.test(u.pathname))) return null;
      u.hash = "";
      u.search = "";
      return u.toString().replace(/\/$/, "") || origin;
    } catch {
      return null;
    }
  };
}

export function slugFor(url) {
  const u = new URL(url);
  const p = (u.pathname.replace(/\/+$/, "") || "/index").replace(/^\//, "");
  return (p + (u.search ? "-" + u.search.slice(1) : "")).replace(/[^\w.-]+/g, "_").slice(0, 80) || "index";
}

export async function sitemapUrls(origin, normalize) {
  try {
    const r = await fetch(origin + "/sitemap.xml", { signal: AbortSignal.timeout(10000) });
    if (!r.ok) return [];
    return [...(await r.text()).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => normalize(m[1])).filter(Boolean);
  } catch {
    return [];
  }
}
