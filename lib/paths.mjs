// Repo paths and run-folder helpers.
import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
export const SKILLS_DIR = path.join(ROOT, ".claude", "skills");
export const RUNS_DIR = path.join(ROOT, "runs");

export function readJSON(p, fallback) {
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback;
}

export function writeJSON(p, data) {
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

/** The run folder passed on the CLI, or the newest one under runs/. */
export function resolveRun(arg) {
  if (arg && fs.existsSync(arg)) return path.resolve(arg);
  const dirs = fs.existsSync(RUNS_DIR)
    ? fs.readdirSync(RUNS_DIR).map((d) => path.join(RUNS_DIR, d)).filter((d) => fs.statSync(d).isDirectory())
    : [];
  dirs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  if (!dirs.length) throw new Error("No run found - run `npm run crawl -- <url>` first.");
  return dirs[0];
}

/** Tiny `--key=value` / positional parser shared by the CLIs. */
export function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (const a of argv) {
    if (!a.startsWith("--")) { positional.push(a); continue; }
    const [k, v] = a.slice(2).split("=");
    flags[k] = v ?? true;
  }
  return { flags, positional };
}
