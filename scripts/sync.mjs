#!/usr/bin/env node
// Usage: npm run sync [-- <skill-name> ...]
import { syncSkills } from "../lib/skills/sync.mjs";

const results = syncSkills({ only: process.argv.slice(2) });
console.log(`\n${results.filter((r) => r.changed).length} skill(s) changed upstream.`);
