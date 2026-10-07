// Adapters around deterministic scanners: most ship inside vendored skills, Lighthouse is an
// optional npm dependency. Each adapter:
//   { name, skill, optIn?, run(pageDir, { url }) -> result | null, summarize(result) -> summary-row fields }
// Adapters with `optIn` run only when that flag is passed (e.g. `npm run scan -- --lighthouse`).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { SKILLS_DIR } from "../paths.mjs";
import { chromePath } from "../browser.mjs";

const require = createRequire(import.meta.url);

function exec(cmd, args, opts = {}) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", maxBuffer: 64 << 20, stdio: ["ignore", "pipe", "ignore"], ...opts });
  } catch (e) {
    return e.stdout || null; // some scanners exit non-zero when they find something; output is still valid
  }
}
const runNode = (script, args) => (fs.existsSync(script) ? exec(process.execPath, [script, ...args]) : null);
const json = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };
const has = (bin) => exec("sh", ["-c", `command -v ${bin}`]) !== null;

// Collapse "file:line: message" lines into { message: count } so noisy checks stay readable.
const tally = (lines = []) => lines.reduce((acc, l) => {
  const msg = l.replace(/^.*?:\d+:\s*/, "");
  acc[msg] = (acc[msg] ?? 0) + 1;
  return acc;
}, {});

export const DETECTORS = [
  {
    name: "writing",
    skill: "ai-writing-detector",
    run: (dir) => json(runNode(path.join(SKILLS_DIR, "ai-writing-detector/scripts/detect.js"),
      ["--file", path.join(dir, "text.md"), "--context", "marketing"])),
    summarize: (r) => ({ writingScore: r?.score ?? null, writingLabel: r?.label ?? null, writingIssues: r?.issues?.length ?? null }),
  },
  {
    name: "design",
    skill: "avoid-ai-design",
    run: (dir) => json(runNode(path.join(SKILLS_DIR, "avoid-ai-design/scripts/detect.mjs"), ["--json", dir])),
    // CSS bundles ship rules for the whole site, so count distinct tells, not hits.
    summarize: (r) => ({
      designTells: Array.isArray(r?.findings) ? [...new Set(r.findings.map((f) => `${f.severity} ${f.id} ${f.name}`))].sort() : null,
    }),
  },
  {
    name: "htmlQuality",
    skill: "web-quality-audit",
    run: (dir) => {
      const script = path.join(SKILLS_DIR, "web-quality-audit/scripts/analyze.sh");
      if (!fs.existsSync(script) || !has("bash") || !has("jq")) return null;
      const r = json(exec("bash", [script, path.join(dir, "page.html")]));
      return r?.success ? { issues: tally(r.issues), warnings: tally(r.warnings) } : null;
    },
    summarize: (r) => ({ htmlIssues: r ? Object.keys(r.issues) : null }),
  },
  {
    name: "lighthouse",
    skill: "web-quality-audit, core-web-vitals",
    optIn: "lighthouse",
    run: (dir, { url }) => {
      let cli;
      try { cli = require.resolve("lighthouse/cli/index.js"); } catch { return null; } // optional dependency
      const out = path.join(dir, "lighthouse.json");
      const args = [cli, url, "--output=json", `--output-path=${out}`, "--quiet",
        "--only-categories=performance,accessibility,seo,best-practices",
        "--chrome-flags=--headless=new --no-sandbox"];
      exec(process.execPath, args, { env: { ...process.env, ...(chromePath() ? { CHROME_PATH: chromePath() } : {}) }, timeout: 180000 });
      const lh = json(fs.existsSync(out) ? fs.readFileSync(out, "utf8") : null);
      if (!lh?.categories) return null;
      const metric = (id) => lh.audits[id]?.displayValue?.replace(/ /g, " ") ?? null;
      // Keep the scan small: scores, vitals, failed audits. The full report stays in lighthouse.json.
      return {
        scores: Object.fromEntries(Object.entries(lh.categories).map(([k, v]) => [k, Math.round(v.score * 100)])),
        vitals: { lcp: metric("largest-contentful-paint"), cls: metric("cumulative-layout-shift"),
          tbt: metric("total-blocking-time"), fcp: metric("first-contentful-paint"), si: metric("speed-index") },
        failed: Object.values(lh.audits).filter((a) => a.score !== null && a.score < 0.5 && a.scoreDisplayMode !== "informative")
          .map((a) => ({ id: a.id, title: a.title, value: a.displayValue?.replace(/ /g, " ") ?? null })).slice(0, 40),
        formFactor: lh.configSettings?.formFactor ?? null,
      };
    },
    summarize: (r) => ({ lighthouse: r?.scores ?? null, lcp: r?.vitals?.lcp ?? null }),
  },
];
