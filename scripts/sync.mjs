#!/usr/bin/env node
// Usage: npm run sync [-- <skill-name> ...] [--locked]
//   --locked  re-copy at the commits pinned in skills.lock.json (no upstream updates)
import { parseArgs } from "../lib/paths.mjs";
import { syncSkills } from "../lib/skills/sync.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
const results = syncSkills({ only: positional, locked: !!flags.locked });
console.log(`\n${results.filter((r) => r.changed).length} skill(s) changed upstream.`);
