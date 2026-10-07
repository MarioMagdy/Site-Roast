// Capture one page: rendered DOM, visible copy, stylesheets, screenshots (desktop + mobile), metadata.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const DESKTOP = { width: 1440, height: 900 };
export const MOBILE = { width: 390, height: 844 };

// Runs in the page. Keep it self-contained (no closures over Node scope).
function extractPageInfo() {
  const vis = (el) => { const s = getComputedStyle(el); return s.display !== "none" && s.visibility !== "hidden"; };
  const style = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    return { font: s.fontFamily, size: s.fontSize, weight: s.fontWeight, color: s.color, bg: s.backgroundColor };
  };
  const imgs = [...document.images];
  const main = document.querySelector("main") ?? document.body;
  return {
    title: document.title,
    metaDescription: document.querySelector('meta[name="description"]')?.content ?? null,
    ogImage: document.querySelector('meta[property="og:image"]')?.content ?? null,
    lang: document.documentElement.lang || null,
    generator: document.querySelector('meta[name="generator"]')?.content ?? null,
    headings: [...document.querySelectorAll("h1,h2,h3")].filter(vis).map((h) => `${h.tagName} ${h.innerText.trim().replace(/\s+/g, " ")}`),
    ctas: [...document.querySelectorAll("a,button")].filter(vis)
      .filter((e) => e.tagName === "BUTTON" || /btn|button|cta/i.test(`${e.className} ${e.getAttribute("role")}`))
      .map((e) => e.innerText.trim()).filter(Boolean).slice(0, 25),
    links: [...document.querySelectorAll("a[href]")].map((a) => a.href),
    images: imgs.length,
    imagesMissingAlt: imgs.filter((i) => !i.hasAttribute("alt")).length,
    typography: { body: style("body"), h1: style("h1"), h2: style("h2"), button: style("button, a[class*=btn]") },
    text: main.innerText,
    inlineCss: [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n"),
    height: document.documentElement.scrollHeight,
  };
}

/**
 * @returns {Promise<{meta, links, finalUrl, fingerprint}>}
 */
export async function capturePage(browser, url, dir) {
  fs.mkdirSync(path.join(dir, "css"), { recursive: true });
  const ctx = await browser.newContext({ viewport: DESKTOP });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  let cssN = 0;
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 300)));
  page.on("requestfailed", (r) => failedRequests.push(r.url()));
  page.on("response", async (r) => {
    if (r.request().resourceType() !== "stylesheet") return;
    try { fs.writeFileSync(path.join(dir, "css", `${String(++cssN).padStart(2, "0")}.css`), await r.text()); } catch {}
  });

  try {
    const t0 = Date.now();
    const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null)
      ?? await page.goto(url, { waitUntil: "load", timeout: 45000 });
    const loadMs = Date.now() - t0;
    await page.waitForTimeout(800);

    const { text, inlineCss, links, ...info } = await page.evaluate(extractPageInfo);
    fs.writeFileSync(path.join(dir, "page.html"), await page.content());
    fs.writeFileSync(path.join(dir, "text.md"), text);
    if (inlineCss.trim()) fs.writeFileSync(path.join(dir, "css", "inline.css"), inlineCss);

    await page.screenshot({ path: path.join(dir, "fold-desktop.png") });
    await page.screenshot({ path: path.join(dir, "desktop.png"), fullPage: true }).catch(() => {});
    await page.setViewportSize(MOBILE);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(dir, "fold-mobile.png") });
    await page.screenshot({ path: path.join(dir, "mobile.png"), fullPage: true }).catch(() => {});
    const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

    const meta = {
      url, slug: path.basename(dir), status: resp?.status() ?? null, loadMs, mobileOverflow,
      words: text.split(/\s+/).filter(Boolean).length, consoleErrors, failedRequests: failedRequests.slice(0, 20), ...info,
    };
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2));
    // Fingerprint on structure, not raw text: live widgets (counters, random IDs) change text per load.
    const fingerprint = crypto.createHash("sha1").update(JSON.stringify([info.title, info.headings])).digest("hex");
    return { meta, links, finalUrl: page.url(), fingerprint };
  } finally {
    await ctx.close();
  }
}
