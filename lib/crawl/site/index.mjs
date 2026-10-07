// Site-level checks after the crawl. Writes runs/<id>/site/checks.json and profile.json.
import fs from "node:fs";
import path from "node:path";
import { readJSON, writeJSON } from "../../paths.mjs";
import { darkModeCheck, filmstrip, reducedMotionCheck } from "./extras.mjs";
import { wellKnownFiles } from "./files.mjs";
import { checkLinks } from "./links.mjs";
import { buildProfile } from "./profile.mjs";
import { securityChecks } from "./security.mjs";

export async function runSiteChecks(browser, run, site, { cookies = [], log = console.log } = {}) {
  const out = path.join(run, "site");
  fs.mkdirSync(out, { recursive: true });
  const home = site.pages[0];
  if (!home) return null;
  const step = async (name, fn) => {
    try { return await fn(); } catch (e) { log(`  ! ${name}: ${e.message.split("\n")[0]}`); return null; }
  };

  log("site checks: motion, theme, security, files, links");
  const running = (p) => readJSON(path.join(run, "pages", p.slug, "motion.json"), {}).running ?? 0;
  const filmPages = [home, ...site.pages.slice(1).filter((p) => running(p) > 0).sort((a, b) => running(b) - running(a)).slice(0, 2)];
  const filmstrips = [];
  for (const p of filmPages) {
    const frames = await step(`filmstrip ${p.slug}`, () => filmstrip(browser, p.url, path.join(run, "pages", p.slug, "film")));
    if (frames) filmstrips.push({ slug: p.slug, frames: frames.map((f) => ({ ...f, file: `pages/${p.slug}/film/${f.file}` })) });
  }
  const extras = {
    filmstrips,
    reducedMotion: await step("reduced motion", () => reducedMotionCheck(browser, home.url)),
    dark: await step("dark mode", () => darkModeCheck(browser, home.url, path.join(run, "pages", home.slug), out)),
  };
  const security = await step("security", () => securityChecks(run, site, cookies));
  const files = await step("files", () => wellKnownFiles(site.origin));
  const links = await step("links", () => checkLinks(run, site, { soft404: files?.soft404 }));
  const checks = { extras, security, files, links };
  writeJSON(path.join(out, "checks.json"), checks);
  const profile = security ? buildProfile(run, site, { security, extras }) : null;
  writeJSON(path.join(out, "profile.json"), profile);
  return { checks, profile };
}
