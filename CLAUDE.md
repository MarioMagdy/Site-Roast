# Site Roast - agent notes

Give it a URL, get back a per-page PDF roast: AI-slop giveaways in copy and design, visual taste,
readability, and whether the site actually pitches its product.

**Entry point:** the `site-roast` skill (`.claude/skills/site-roast/SKILL.md`). When the user pastes
a website link and asks for a roast, review, audit, or teardown, follow that skill.

## Layout

```
.claude/skills/site-roast/     first-party orchestrator skill + rubric + roast.json schema
.claude/skills/<other>/        VENDORED upstream skills - never edit; see UPSTREAM.md in each
skills.manifest.json           which upstream skills we reuse, from where, and for which lens
skills.lock.json               exact upstream commit per vendored skill (written by sync)
lib/
  paths.mjs, browser.mjs       shared helpers
  crawl/                       urls.mjs (normalise/filter/slug), capture.mjs (one page), crawler.mjs (BFS)
  scan/                        detectors.mjs (adapters for vendored scanners), readability.mjs, scanner.mjs
  report/                      lenses.mjs (lens keys/weights/validation), template.mjs (HTML), pdf.mjs
  skills/sync.mjs              vendoring logic
scripts/                       thin CLIs: capture, crawl, scan, report, sync
test/                          node:test unit tests (npm test)
examples/                      sample outputs (roast.json + report.pdf)
runs/                          per-roast working folders (gitignored)
```

## Rules

- **Reuse, don't rewrite.** Need a new lens or check? First look for an existing open-source skill,
  add it to `skills.manifest.json`, run `npm run sync`. Only write first-party logic for orchestration.
- **Never edit vendored skill folders.** Change the manifest (`ref`, `path`, `include`) and re-sync.
  Only add MIT/Apache/BSD-licensed skills, and record the licence in the manifest.
- **New deterministic scanner?** Add an adapter object to `DETECTORS` in `lib/scan/detectors.mjs`.
- **New lens?** Add it to `LENSES` in `lib/report/lenses.mjs`, the rubric, and the SKILL.md lens table.
- **Every finding needs evidence.** The report validator rejects findings without it.
- **No authorship claims.** "Reads as default AI output", never "AI wrote this".
- Run `npm test` before pushing.
