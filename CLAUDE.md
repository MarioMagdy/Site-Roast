# Site Roast - agent notes

Give it a URL, get back a PDF roast with annotated screenshots in a fixed 16-section format: AI-slop
giveaways, design judgment, pitch, responsiveness, accessibility, performance, passive security.

**Entry point:** the `site-roast` skill (`.claude/skills/site-roast/SKILL.md`). When the user pastes
a website link and asks for a roast, review, audit, or teardown, follow that skill.

## Layout

```
.claude/skills/site-roast/     first-party orchestrator skill
  references/                  rubric.md, roast-schema.md (v2 data contract), report-format.md (fixed outline)
.claude/skills/<other>/        VENDORED upstream skills - never edit; see UPSTREAM.md in each
skills.manifest.json           which upstream skills we reuse, from where, and for which lens
skills.lock.json               exact upstream commit per vendored skill (written by sync)
lib/
  paths.mjs, browser.mjs       shared helpers
  crawl/
    urls.mjs, crawler.mjs      URL rules, BFS crawl (then site checks)
    capture.mjs                one page: 4 breakpoints, scroll, screenshots, all probes
    probes/                    in-page probes (page-info, theme, motion, responsive, bugs) + network/secrets
    site/                      site-level: extras (filmstrip, reduced motion, dark mode), security, files, links, profile
  scan/                        detectors.mjs (vendored scanners + Lighthouse), readability.mjs, scanner.mjs
  annotate/                    overlay.mjs (in-page markers), annotate.mjs (resolve targets, crop)
  report/
    schema.mjs                 criteria, categories, severities, SECTIONS (fixed outline)  <- single source of truth
    normalize.mjs              v1->v2 upgrade, numbering, validation
    context.mjs, components.mjs, template.mjs, pdf.mjs
    sections/                  one renderer per section group
  skills/sync.mjs              vendoring logic
scripts/                       thin CLIs: capture, crawl, scan, annotate, report, sync
test/                          node:test unit tests (npm test)
examples/                      demo-site/ (fictional test target) + demo/ (its roast.json, PDF, crops)
runs/                          per-roast working folders (gitignored)
```

## Rules

- **Reuse, don't rewrite.** Need a new lens or check? First look for an existing open-source skill,
  add it to `skills.manifest.json`, run `npm run sync`. Only write first-party logic for orchestration.
- **Never edit vendored skill folders.** Change the manifest (`ref`, `path`, `include`) and re-sync.
  Only add MIT/Apache/BSD-licensed skills, and record the licence in the manifest.
- **New deterministic scanner?** Add an adapter object to `DETECTORS` in `lib/scan/detectors.mjs`.
- **New criterion or section?** Add it to `CRITERIA` / `SECTIONS` in `lib/report/schema.mjs`, a renderer in
  `lib/report/sections/`, and mirror it in `rubric.md`, `roast-schema.md` and `report-format.md`.
- **New evidence?** Add an in-page probe under `lib/crawl/probes/` (self-contained function, run via
  `evaluate()`), or a site-level check under `lib/crawl/site/`, and surface it in the matching section.
- **Security checks stay passive.** Only what a normal visitor's browser receives: no hidden-file
  probing, no form submissions, no logins, no fuzzing.
- **Every finding needs evidence.** The report validator rejects findings without it.
- **No authorship claims.** "Reads as default AI output", never "AI wrote this".
- Run `npm test` before pushing. Try changes against the demo site (`node examples/demo-site/serve.mjs`),
  not someone else's live site.
- This repo is public: never commit `runs/` output, client names, or roasts of real sites.
