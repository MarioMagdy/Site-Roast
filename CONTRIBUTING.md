# Contributing

Thanks for helping. A few rules keep this project useful and honest.

## Setup

```bash
npm install
npx playwright install chromium   # or point CHROME_PATH at an existing Chrome/Chromium
npm test
```

To try a full run without touching anyone's site, use the bundled demo:

```bash
node examples/demo-site/serve.mjs 4173 &
npm run capture -- http://localhost:4173 --max=5
```

## Ground rules

- **Reuse before you write.** If a check or judgement already exists as an open-source agent skill,
  add it to `skills.manifest.json` (repo, path, licence, lens) and run `npm run sync`. Only
  MIT/Apache/BSD-licensed skills, please.
- **Never edit a vendored skill folder** (anything in `.claude/skills/` except `site-roast/`). Fix it
  upstream, or change `ref`/`path`/`include` in the manifest and re-sync.
- **Security checks stay passive**: only what a normal visitor's browser receives. No hidden-file
  probing, form submissions, logins or fuzzing. PRs that add active scanning will be declined.
- **Every finding needs evidence.** The validator enforces it; don't loosen it.

## Where things go

| You want to… | Change |
|---|---|
| Measure something new on each page | a self-contained probe in `lib/crawl/probes/` (runs in the page via `evaluate()`) |
| Check something once per site | `lib/crawl/site/` and wire it into `lib/crawl/site/index.mjs` |
| Run a deterministic scanner | an adapter in `DETECTORS` in `lib/scan/detectors.mjs` |
| Add a scored criterion or report section | `CRITERIA` / `SECTIONS` in `lib/report/schema.mjs`, a renderer in `lib/report/sections/`, and the docs in `.claude/skills/site-roast/references/` |
| Change how the agent reviews | `.claude/skills/site-roast/SKILL.md` |

## Before you open a PR

- `npm test` passes, and new logic has a test in `test/`.
- If you changed the report, attach a screenshot of the affected PDF pages (render the demo).
- Keep commits focused; describe *why* in the message.
