// What kind of site is this? Drives which report sections apply.
import fs from "node:fs";
import path from "node:path";
import { readJSON } from "../../paths.mjs";
import { FREE_HOSTING, hostingFromHeaders } from "./known-hosts.mjs";

const CURRENCY = /(?:[$€£]\s?\d|\d\s?(?:USD|EUR|GBP|EGP|SAR|AED|ج\.?م|جنيه)|\/\s?(?:mo|month|yr|year)\b|per month)/i;

export function buildProfile(run, site, { security, extras }) {
  const host = new URL(site.origin).hostname;
  const pages = site.pages.map((p) => {
    const dir = path.join(run, "pages", p.slug);
    return {
      slug: p.slug,
      meta: readJSON(path.join(dir, "meta.json"), {}),
      motion: readJSON(path.join(dir, "motion.json"), {}),
      text: fs.existsSync(path.join(dir, "text.md")) ? fs.readFileSync(path.join(dir, "text.md"), "utf8") : "",
    };
  });
  const allLinks = [...new Set(pages.flatMap((p) => p.meta.links ?? []))];
  const linkMatch = (re) => allLinks.filter((l) => { try { return re.test(new URL(l).pathname); } catch { return false; } });
  const markers = pages[0]?.meta.markers ?? {};
  const stack = Object.entries(markers).filter(([, v]) => v).map(([k]) => k);
  if (pages[0]?.meta.generator) stack.unshift(pages[0].meta.generator);
  if (!stack.length) stack.push("static HTML (no framework markers)");

  const motionTotals = pages.reduce((acc, p) => {
    acc.running += p.motion.running ?? 0;
    acc.reveals += p.motion.scrollReveal?.revealed ?? 0;
    p.motion.libraries?.forEach((l) => acc.libraries.add(l));
    return acc;
  }, { running: 0, reveals: 0, libraries: new Set() });
  const motionLevel = motionTotals.running + motionTotals.reveals === 0 && !motionTotals.libraries.size ? "none"
    : motionTotals.running > 20 || motionTotals.libraries.size > 1 || motionTotals.reveals > 30 ? "rich" : "subtle";

  return {
    host,
    pageCount: pages.length,
    languages: [...new Set(pages.map((p) => p.meta.lang).filter(Boolean))],
    rtl: pages.some((p) => p.meta.dir === "rtl"),
    stack,
    hosting: hostingFromHeaders(host, pages[0]?.meta.responseHeaders),
    customDomain: !FREE_HOSTING.test(host),
    forms: security.forms.length,
    pricingShown: pages.some((p) => CURRENCY.test(p.text)),
    commerce: linkMatch(/\/(cart|checkout|shop|product)s?(\/|$)/i).length > 0,
    auth: linkMatch(/\/(log-?in|sign-?in|sign-?up|register|account)(\/|$)/i).length > 0,
    blog: linkMatch(/\/(blog|news|articles|insights)(\/|$)/i).length > 0,
    motion: { level: motionLevel, running: motionTotals.running, scrollReveals: motionTotals.reveals, libraries: [...motionTotals.libraries] },
    darkMode: extras.dark ? (extras.dark.auto ? "automatic (follows OS)" : extras.dark.toggle ? "toggle" : "none") : "unknown",
    backends: security.backends.map((b) => b.name),
    analytics: security.thirdParties.filter((t) => ["analytics", "ads"].includes(t.category)).map((t) => t.name),
  };
}
