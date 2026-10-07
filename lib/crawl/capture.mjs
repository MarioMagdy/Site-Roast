// Capture one page at every breakpoint and write the evidence files the review and report use:
//   page.html, text.md, css/, meta.json, motion.json, theme.json, responsive.json, bugs.json, network.json
//   screenshots: fold-{desktop,laptop,tablet,mobile}.png, desktop.png, mobile.png (full page)
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { writeJSON } from "../paths.mjs";
import { inventoryBugs } from "./probes/bugs.mjs";
import { evaluate } from "./probes/helpers.mjs";
import { inventoryMotion, revealedAfterScroll } from "./probes/motion.mjs";
import { referencedHosts, watchNetwork } from "./probes/network.mjs";
import { pageInfo } from "./probes/page-info.mjs";
import { BREAKPOINTS, measureLayout } from "./probes/responsive.mjs";
import { scanSecrets } from "./probes/secrets.mjs";
import { inventoryTheme } from "./probes/theme.mjs";

export const DESKTOP = BREAKPOINTS.find((b) => b.name === "desktop");
export const MOBILE = BREAKPOINTS.find((b) => b.name === "mobile");

/** Scroll the whole page so lazy content and scroll-reveal animations fire, then return to the top. */
export async function autoScroll(page) {
  await page.evaluate(async () => {
    const step = Math.round(innerHeight * 0.8);
    for (let y = 0, i = 0; y < document.documentElement.scrollHeight && i < 40; y += step, i++) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 150));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

export async function gotoSettled(page, url) {
  const t0 = Date.now();
  const resp = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null)
    ?? await page.goto(url, { waitUntil: "load", timeout: 45000 });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(800);
  return { resp, loadMs };
}

function cssFacts(css) {
  return {
    keyframes: (css.match(/@keyframes\s+[\w-]+/g) ?? []).length,
    reducedMotionQuery: /prefers-reduced-motion/.test(css),
    darkModeQuery: /prefers-color-scheme\s*:\s*dark/.test(css),
    customProperties: new Set(css.match(/--[\w-]+(?=\s*:)/g) ?? []).size,
  };
}

/** @returns {Promise<{meta, links, finalUrl, fingerprint, cookies}>} */
export async function capturePage(browser, url, dir, { origin }) {
  fs.mkdirSync(path.join(dir, "css"), { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: DESKTOP.width, height: DESKTOP.height }, bypassCSP: true });
  const page = await ctx.newPage();
  const net = watchNetwork(page, origin);
  const shot = (name, opts = {}) => page.screenshot({ path: path.join(dir, name), ...opts }).catch(() => {});

  try {
    const { resp, loadMs } = await gotoSettled(page, url);
    const { text, inlineCss, inlineScripts, links, footerText, ...info } = await evaluate(page, pageInfo);
    const motion = await evaluate(page, inventoryMotion); // before scrolling: marks hidden-until-scroll content
    await shot("fold-desktop.png");
    await autoScroll(page);
    motion.scrollReveal = await evaluate(page, revealedAfterScroll);
    const theme = await evaluate(page, inventoryTheme);
    const { ids, ...bugs } = await evaluate(page, inventoryBugs);
    await shot("desktop.png", { fullPage: true });

    const responsive = {};
    for (const bp of [...BREAKPOINTS].reverse()) { // desktop first: already at that size
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.waitForTimeout(400);
      responsive[bp.name] = await evaluate(page, measureLayout);
      if (bp.name !== "desktop") await shot(`fold-${bp.name}.png`);
    }
    await autoScroll(page);
    await shot("mobile.png", { fullPage: true });
    fs.writeFileSync(path.join(dir, "page.html"), await page.content());
    await net.settle();

    const css = [...net.data.stylesheets, inlineCss].join("\n");
    net.data.stylesheets.forEach((t, i) => fs.writeFileSync(path.join(dir, "css", `${String(i + 1).padStart(2, "0")}.css`), t));
    if (inlineCss.trim()) fs.writeFileSync(path.join(dir, "css", "inline.css"), inlineCss);
    const facts = cssFacts(css);

    fs.writeFileSync(path.join(dir, "text.md"), text);
    const meta = {
      url, finalUrl: page.url(), slug: path.basename(dir), status: resp?.status() ?? null, loadMs,
      responseHeaders: resp?.headers() ?? {},
      mobileOverflow: responsive.mobile?.overflow ?? null,
      words: text.split(/\s+/).filter(Boolean).length,
      consoleErrors: net.data.consoleErrors, failedRequests: net.data.failed.map((f) => f.url).slice(0, 20),
      footerText: footerText.slice(0, 2000), links, ids,
      ...info,
    };
    writeJSON(path.join(dir, "meta.json"), meta);
    writeJSON(path.join(dir, "motion.json"), { ...motion, css: { keyframes: facts.keyframes, reducedMotionQuery: facts.reducedMotionQuery } });
    writeJSON(path.join(dir, "theme.json"), { ...theme, css: { darkModeQuery: facts.darkModeQuery, customProperties: facts.customProperties } });
    writeJSON(path.join(dir, "responsive.json"), responsive);
    writeJSON(path.join(dir, "bugs.json"), { ...bugs, pageErrors: net.data.pageErrors, consoleErrors: net.data.consoleErrors });
    const { stylesheets, ...network } = net.data;
    network.secrets.push(...scanSecrets(inlineScripts, `${url} (inline)`));
    network.referencedHosts = [...new Set([...network.referencedHosts, ...referencedHosts(inlineScripts)])];
    network.requests = network.requests.slice(0, 400);
    writeJSON(path.join(dir, "network.json"), network);

    // Fingerprint on structure, not raw text: live widgets (counters, random IDs) change text per load.
    const fingerprint = crypto.createHash("sha1").update(JSON.stringify([info.title, info.headings])).digest("hex");
    return { meta, links, finalUrl: page.url(), fingerprint, cookies: await ctx.cookies() };
  } finally {
    await ctx.close();
  }
}
