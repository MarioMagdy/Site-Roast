#!/usr/bin/env node
// Usage: npm run scan [-- runs/<id>] [--lighthouse]      (default: newest run)
import { parseArgs, resolveRun } from "../lib/paths.mjs";
import { scanRun } from "../lib/scan/scanner.mjs";

const { flags, positional } = parseArgs(process.argv.slice(2));
scanRun(resolveRun(positional[0]), { optIn: flags.lighthouse ? ["lighthouse"] : [] });
