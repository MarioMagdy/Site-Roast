// Adapters around the deterministic scanners shipped inside vendored skills.
// Each adapter: { name, skill, run(pageDir) -> result | null }. Add new ones to DETECTORS.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { SKILLS_DIR } from "../paths.mjs";

function runNode(script, args) {
  if (!fs.existsSync(script)) return null;
  try {
    return execFileSync(process.execPath, [script, ...args], { encoding: "utf8", maxBuffer: 64 << 20 });
  } catch (e) {
    return e.stdout || null; // some scanners exit non-zero when they find something; output is still valid
  }
}
const json = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

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
];
