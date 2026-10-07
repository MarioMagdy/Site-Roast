// Vendor upstream skills from skills.manifest.json into .claude/skills/<name>/, pinned in skills.lock.json.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ROOT, SKILLS_DIR, readJSON, writeJSON } from "../paths.mjs";

export const MANIFEST = path.join(ROOT, "skills.manifest.json");
export const LOCK = path.join(ROOT, "skills.lock.json");
const RESERVED = new Set(["site-roast"]); // our own skills live next to the vendored ones

const git = (args, cwd) => execFileSync("git", args, { cwd, stdio: ["ignore", "pipe", "pipe"] }).toString().trim();

function checkout(tmp, repo, ref) {
  const dir = path.join(tmp, `${repo}@${ref}`.replace(/[^\w.-]+/g, "_"));
  if (fs.existsSync(dir)) return { dir, sha: git(["rev-parse", "HEAD"], dir) };
  const url = `https://github.com/${repo}.git`;
  if (ref === "HEAD") {
    git(["clone", "--quiet", "--depth", "1", url, dir]);
  } else {
    git(["init", "--quiet", dir]);
    git(["fetch", "--quiet", "--depth", "1", url, ref], dir);
    git(["checkout", "--quiet", "FETCH_HEAD"], dir);
  }
  return { dir, sha: git(["rev-parse", "HEAD"], dir) };
}

function copySkill(entry, src, repoDir, sha) {
  const dest = path.join(SKILLS_DIR, entry.name);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  for (const f of entry.include ?? fs.readdirSync(src)) {
    if (fs.existsSync(path.join(src, f))) fs.cpSync(path.join(src, f), path.join(dest, f), { recursive: true });
  }
  // The licence travels with the copy even when the skill folder has none of its own.
  if (!fs.readdirSync(dest).some((f) => /^licen[cs]e/i.test(f))) {
    const lic = fs.readdirSync(repoDir).find((f) => /^licen[cs]e/i.test(f));
    if (lic) fs.copyFileSync(path.join(repoDir, lic), path.join(dest, "LICENSE"));
  }
  fs.writeFileSync(path.join(dest, "UPSTREAM.md"),
    "Vendored by Site Roast. Do not edit here; change upstream or skills.manifest.json, then `npm run sync`.\n\n" +
    `- source: https://github.com/${entry.repo}/tree/${sha}/${entry.path}\n- license: ${entry.license}\n- lens: ${entry.lens}\n`);
}

/** Sync all (or `only`) manifest skills. Returns [{name, sha, changed}]. */
export function syncSkills({ only = [], log = console.log } = {}) {
  const { skills } = readJSON(MANIFEST);
  const lock = readJSON(LOCK, {});
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "site-roast-sync-"));
  const results = [];
  try {
    for (const entry of skills) {
      if (only.length && !only.includes(entry.name)) continue;
      if (RESERVED.has(entry.name)) throw new Error(`"${entry.name}" is reserved for a first-party skill`);
      const { dir, sha } = checkout(tmp, entry.repo, entry.ref ?? "HEAD");
      const src = path.join(dir, entry.path);
      if (!fs.existsSync(path.join(src, "SKILL.md"))) throw new Error(`${entry.name}: no SKILL.md at ${entry.repo}/${entry.path}`);
      copySkill(entry, src, dir, sha);
      const changed = lock[entry.name]?.sha !== sha;
      lock[entry.name] = { repo: entry.repo, path: entry.path, sha, license: entry.license, synced: new Date().toISOString().slice(0, 10) };
      results.push({ name: entry.name, sha, changed });
      log(`${changed ? "↑" : "="} ${entry.name.padEnd(22)} ${entry.repo}@${sha.slice(0, 10)}`);
    }
    // Drop lock entries for skills removed from the manifest (and their folders).
    for (const name of Object.keys(lock)) {
      if (!skills.some((s) => s.name === name)) {
        delete lock[name];
        fs.rmSync(path.join(SKILLS_DIR, name), { recursive: true, force: true });
        log(`- ${name} (removed from manifest)`);
      }
    }
    writeJSON(LOCK, lock);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return results;
}
