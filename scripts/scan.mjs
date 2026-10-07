#!/usr/bin/env node
// Usage: npm run scan [-- runs/<id>]      (default: newest run)
import { parseArgs, resolveRun } from "../lib/paths.mjs";
import { scanRun } from "../lib/scan/scanner.mjs";

scanRun(resolveRun(parseArgs(process.argv.slice(2)).positional[0]));
