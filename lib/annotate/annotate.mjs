// Draw numbered markers for every finding target on live pages and save cropped, annotated
// screenshots. Writes runs/<id>/annotations/*.jpg and annotations.json (finding n -> crop file).
import fs from "node:fs";
import path from "node:path";
import { launchBrowser } from "../browser.mjs";
import { autoScroll, gotoSettled } from "../crawl/capture.mjs";
import { BREAKPOINTS } from "../crawl/probes/responsive.mjs";
import { writeJSON } from "../paths.mjs";
import { SEVERITIES } from "../report/schema.mjs";
import { measureCandidate } from "./measure.mjs";
import { drawOverlay } from "./overlay.mjs";

const PAD = 140; // context above/below the marked element

async function resolveRect(page, t, { viewportSpace = false } = {}) {
  if (t.box) {
    const [x, y, w, h] = t.box;
    return { x, y, w, h };
  }
  const loc = t.selector ? page.locator(t.selector) : page.getByText(t.text, { exact: false });
  const handles = await loc.elementHandles().catch(() => []);
  let seen = 0;
  for (const h of handles) {
    const rect = await h.evaluate(measureCandidate, { text: t.text ?? null, viewportSpace }).catch(() => null);
    if (rect && seen++ === (t.nth ?? 0)) return rect;
  }
  return null;
}

/** Group nearby marks into crops no taller than ~1.2 viewports. */
function clusters(marks, vh, pageH) {
  const sorted = [...marks].sort((a, b) => a.y - b.y);
  const out = [];
  for (const m of sorted) {
    const last = out.at(-1);
    if (last && m.y + m.h + PAD - last.top <= vh * 1.2) {
      last.bottom = Math.max(last.bottom, m.y + m.h + PAD);
      last.marks.push(m);
    } else {
      out.push({ top: Math.max(0, m.y - PAD), bottom: m.y + m.h + PAD, marks: [m] });
    }
  }
  return out.map((c) => {
    const minH = Math.round(vh * 0.55);
    let { top, bottom } = c;
    if (bottom - top < minH) { const grow = (minH - (bottom - top)) / 2; top = Math.max(0, top - grow); bottom = top + minH; }
    bottom = Math.min(bottom, pageH);
    return { ...c, top: Math.round(top), height: Math.max(1, Math.round(bottom - top)) };
  });
}

export async function annotateRun(run, roast, { log = console.log } = {}) {
  const outDir = path.join(run, "annotations");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const urlOf = new Map(roast.pages.map((p) => [p.slug, p.url]));

  // One browser session per (page, viewport, click-state) so interactions don't leak between groups.
  const groups = new Map();
  for (const f of roast.findings) {
    for (const t of f.targets ?? []) {
      const slug = t.page ?? f.page;
      const viewport = t.viewport ?? "desktop";
      const key = `${slug}|${viewport}|${t.click ?? ""}`;
      if (!groups.has(key)) groups.set(key, { slug, viewport, click: t.click ?? null, items: [] });
      groups.get(key).items.push({ f, t });
    }
  }

  const result = { crops: [], byFinding: {}, unresolved: [] };
  if (!groups.size) { writeJSON(path.join(run, "annotations.json"), result); return result; }
  const browser = await launchBrowser();
  try {
    for (const g of groups.values()) {
      const bp = BREAKPOINTS.find((b) => b.name === g.viewport);
      const ctx = await browser.newContext({ viewport: { width: bp.width, height: bp.height }, bypassCSP: true });
      const page = await ctx.newPage();
      try {
        await gotoSettled(page, urlOf.get(g.slug));
        await autoScroll(page);
        if (g.click) {
          await page.locator(g.click).filter({ visible: true }).first().click({ timeout: 4000 });
          await page.waitForTimeout(800);
        }
        const color = (f) => SEVERITIES[f.severity]?.color ?? "#b42318";
        const shoot = async (file, clip) => page.screenshot({ path: path.join(run, file), type: "jpeg", quality: 82, ...(clip ? { fullPage: true, clip } : {}) });
        const record = (file, ns) => {
          result.crops.push({ file, page: g.slug, viewport: g.viewport, findings: ns, opened: g.click });
          for (const n of ns) (result.byFinding[n] ??= []).push(file);
        };
        let crops = 0;
        if (g.click) {
          // Inside a modal or menu each target gets its own frame: scrolling the modal to one target
          // would move the others.
          for (const { f, t } of g.items) {
            const rect = await resolveRect(page, t, { viewportSpace: true }).catch(() => null);
            if (!rect) { result.unresolved.push({ n: f.n, page: g.slug, viewport: g.viewport, target: t }); continue; }
            await page.evaluate(`(${drawOverlay.toString()})(${JSON.stringify({ marks: [{ ...rect, n: f.n, color: color(f), shape: t.shape ?? "box", note: t.note ?? null }], fixed: true })})`);
            const file = `annotations/${g.slug}-${g.viewport}-open-${++crops}.jpg`;
            await shoot(file);
            record(file, [f.n]);
          }
        } else {
          const marks = [];
          for (const { f, t } of g.items) {
            const rect = await resolveRect(page, t).catch(() => null);
            if (!rect) { result.unresolved.push({ n: f.n, page: g.slug, viewport: g.viewport, target: t }); continue; }
            marks.push({ ...rect, n: f.n, color: color(f), shape: t.shape ?? "box", note: t.note ?? null });
          }
          if (!marks.length) continue;
          await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
          const dims = await page.evaluate(`(${drawOverlay.toString()})(${JSON.stringify({ marks, fixed: false })})`);
          for (const c of clusters(marks, bp.height, dims.height)) {
            const file = `annotations/${g.slug}-${g.viewport}-${++crops}.jpg`;
            await shoot(file, { x: 0, y: c.top, width: bp.width, height: c.height });
            record(file, [...new Set(c.marks.map((m) => m.n))].sort((a, b) => a - b));
          }
        }
        log(`  annotated ${g.slug} @ ${g.viewport}${g.click ? " (after click)" : ""}: ${g.items.length} target(s), ${crops} crop(s)`);
      } catch (e) {
        log(`  ! ${g.slug} @ ${g.viewport}: ${e.message.split("\n")[0]}`);
        for (const { f, t } of g.items) result.unresolved.push({ n: f.n, page: g.slug, viewport: g.viewport, target: t, error: e.message.split("\n")[0] });
      } finally {
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }
  writeJSON(path.join(run, "annotations.json"), result);
  return result;
}
