// Site-level visual captures: load filmstrips, reduced-motion behaviour, dark mode.
import fs from "node:fs";
import path from "node:path";
import { readJSON } from "../../paths.mjs";
import { DESKTOP, gotoSettled } from "../capture.mjs";
import { evaluate } from "../probes/helpers.mjs";
import { runningAnimations } from "../probes/motion.mjs";

const FRAMES_MS = [150, 500, 1000, 2000, 3500];

/** Screenshots of the fold while the page loads: shows entrance animations, FOUC, layout shift. */
export async function filmstrip(browser, url, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const ctx = await browser.newContext({ viewport: { width: DESKTOP.width, height: DESKTOP.height } });
  const page = await ctx.newPage();
  const frames = [];
  try {
    // Raw CDP screenshots: page.screenshot() waits for web fonts, which would hide exactly the
    // flash-of-unstyled-text and entrance states this is meant to show.
    const cdp = await ctx.newCDPSession(page);
    const t0 = Date.now();
    await page.goto(url, { waitUntil: "commit", timeout: 45000 });
    for (const [i, at] of FRAMES_MS.entries()) {
      const wait = at - (Date.now() - t0);
      if (wait > 0) await page.waitForTimeout(wait);
      const file = `film-${i}.jpg`;
      const ms = Date.now() - t0;
      try {
        const { data } = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 60 });
        fs.writeFileSync(path.join(dir, file), Buffer.from(data, "base64"));
        frames.push({ file, ms });
      } catch {}
    }
  } finally {
    await ctx.close();
  }
  return frames;
}

async function countRunning(browser, url, reducedMotion) {
  const ctx = await browser.newContext({ viewport: { width: DESKTOP.width, height: DESKTOP.height }, reducedMotion, bypassCSP: true });
  try {
    const page = await ctx.newPage();
    await gotoSettled(page, url);
    await page.waitForTimeout(1000);
    return await evaluate(page, runningAnimations);
  } finally {
    await ctx.close();
  }
}

export async function reducedMotionCheck(browser, url) {
  const normal = await countRunning(browser, url, "no-preference");
  const reduced = await countRunning(browser, url, "reduce");
  return { normalRunning: normal, reducedRunning: reduced, respected: normal === 0 ? null : reduced < normal };
}

/** Does the site have a dark theme? Tries the OS preference first, then a visible theme toggle. */
export async function darkModeCheck(browser, url, pageDir, outDir) {
  const light = readJSON(path.join(pageDir, "theme.json"), {});
  const ctx = await browser.newContext({ viewport: { width: DESKTOP.width, height: DESKTOP.height }, colorScheme: "dark", bypassCSP: true });
  const result = { lightBg: light.bodyBg ?? null, darkBg: null, auto: false, toggle: null, image: null };
  try {
    const page = await ctx.newPage();
    await gotoSettled(page, url);
    const bgOf = () => evaluate(page, () => toHex(getComputedStyle(document.body).backgroundColor) || toHex(getComputedStyle(document.documentElement).backgroundColor));
    result.darkBg = await bgOf();
    result.auto = !!result.darkBg && result.darkBg !== result.lightBg;
    if (!result.auto && light.themeToggle) {
      // Clicking a theme switch is an ordinary visitor action; nothing is submitted.
      await page.click(light.themeToggle, { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(700);
      const after = await bgOf();
      result.toggle = !!after && after !== result.darkBg;
      if (result.toggle) result.darkBg = after;
    }
    if (result.auto || result.toggle) {
      fs.mkdirSync(outDir, { recursive: true });
      await page.screenshot({ path: path.join(outDir, "fold-dark.png") });
      result.image = "site/fold-dark.png";
    }
  } finally {
    await ctx.close();
  }
  return result;
}

