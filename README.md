# Site Roast

An agent workflow that takes a website URL and returns a **PDF roast with annotated screenshots**
(numbered markers circling each problem) in a **fixed 16-section format**: scorecard, executive summary,
designer's judgment, content & pitch, bugs, issue register, page-by-page, motion, themes & colour,
responsiveness, accessibility, performance, security & backend, SEO, localisation, method.
See [`report-format.md`](.claude/skills/site-roast/references/report-format.md). It covers:

- **AI copy tells**: stock LLM phrasing, triads, "not just X, it's Y", chatbot leftovers
- **AI design tells**: purple-gradient heroes, Inter + three icon cards, glassmorphism, the "tasteful AI" second-order defaults
- **Visual quality & taste**: hierarchy, typography, spacing, imagery, mobile
- **Readability**: 5-second test, jargon, density, sentence rhythm
- **Pitch & positioning**: does it say who it's for, what they get, and why this over the alternative?
- **Conversion & trust**: CTA clarity, proof near claims, friction
- **Design judgment**: art direction, typography, colour & theme (incl. dark mode), layout, imagery, motion, consistency, brand fit
- **Responsiveness** at 390 / 768 / 1024 / 1440, **accessibility**, **performance** (Lighthouse)
- **Security & backend** (passive): headers, cookies, secrets in client code, third parties, backends, forms
- **SEO & discoverability**, **bugs** (JS errors, broken links/images, dead anchors) and **localisation**

It doesn't reinvent the judging. It **orchestrates existing open-source agent skills** (vendored and
pinned, updated weekly) and adds a crawler, deterministic scanners, a scoring rubric, and a PDF builder.

See [`examples/resend.com/report.pdf`](examples/resend.com/report.pdf) for a sample.

## Use it

In Claude Code, from this repo:

```
roast https://example.com
```

The `site-roast` skill runs the whole pipeline. Manually:

```bash
npm install
npm run capture -- https://example.com --max=15 --lighthouse   # evidence -> runs/<host>-<date>/
# ... agent reviews with the skills, writes runs/<id>/roast.json (schema v2) ...
npm run report      # validate -> annotate screenshots -> runs/<id>/report.pdf
```

## Skills it reuses

| Lens | Skill | Upstream |
|---|---|---|
| AI copy | ai-writing-detector, avoid-ai-writing | [conorbronsdon/avoid-ai-writing](https://github.com/conorbronsdon/avoid-ai-writing) (MIT) |
| AI copy | humanizer | [blader/humanizer](https://github.com/blader/humanizer) (MIT) |
| AI design | avoid-ai-design | [funboy322/avoid-ai-design](https://github.com/funboy322/avoid-ai-design) (MIT) |
| AI design | hallmark | [nutlope/hallmark](https://github.com/nutlope/hallmark) (MIT) |
| AI design | frontend-design | [anthropics/skills](https://github.com/anthropics/skills) (Apache-2.0) |
| AI design / visual | design-taste-frontend (Taste Skill), redesign-existing-projects | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (MIT) |
| Visual | impeccable | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0) |
| Technical | web-design-guidelines | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) (MIT) |
| Technical | web-quality-audit, accessibility, performance, core-web-vitals | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) (MIT) |
| Technical | pre-launch-audit | [bzsasson/pre-launch-audit-skill](https://github.com/bzsasson/pre-launch-audit-skill) (MIT) |
| Pitch / CRO / readability / SEO | product-marketing, cro, copywriting, copy-editing, marketing-psychology, seo-audit, ai-seo | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) (MIT) |

Exact commits are in `skills.lock.json`. Each vendored folder keeps its licence and an `UPSTREAM.md`.

## Keeping skills fresh

- `npm run sync` pulls the latest of everything in `skills.manifest.json`; `npm run sync -- cro` pulls one skill.
- `.github/workflows/sync-skills.yml` does this every Monday and opens a PR, so upstream changes get reviewed before they land.
- Pin a skill by setting `"ref"` to a tag or commit in the manifest.
- Add a skill: append it to the manifest (repo, path, licence, lens), `npm run sync`, and reference it in the lens table in `.claude/skills/site-roast/SKILL.md`.

## Notes

- A "tell" means the page uses a default that generative tools overproduce. The report never claims a site *was* AI-made.
- The design scanner reads the shipped CSS bundle, which includes rules for the whole site, so the skill only reports code tells it can also see in the screenshots.
- Not included: [website-audit-skill](https://github.com/appariciojunior/website-audit-skill) is a close fit, but it has no licence, so it can't be vendored. Add it if the author licenses it.
- Lighthouse is an optional dependency. Its numbers are lab runs (simulated mobile throttling), so treat them as directional.
- Requires Node 18+ and Playwright's Chromium (`npx playwright install chromium`, or set `CHROME_PATH`).
