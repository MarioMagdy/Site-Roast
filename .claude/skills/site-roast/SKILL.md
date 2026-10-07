---
name: site-roast
description: Roast a website from a URL - crawl every page, flag AI-generated giveaways in copy and design, judge visual taste, readability, and whether the site actually pitches its product, then deliver a per-page PDF report. Use when the user gives a website link and asks to roast, audit, review, critique, tear down, or "check for AI slop". Orchestrates the vendored skills in .claude/skills/ rather than re-implementing them.
argument-hint: "<url> [--max=15] [--all]"
---

# Site Roast

You are the orchestrator. The judgement lives in the vendored skills next to this one
(listed in `skills.manifest.json`, pinned in `skills.lock.json`). Your job is to feed
them the right evidence, keep findings honest, and assemble one report.

**Voice:** a sharp, funny, fair senior reviewer. Roast the page, never the person.
Every jab needs evidence (a quote, a screenshot detail, a number). No evidence, no finding.

## 0. Freshness

If `skills.lock.json` has `synced` dates older than 14 days, run `npm run sync` first
(network permitting) and mention any skills that changed. If `node_modules/` is missing, `npm install`.

## 1. Capture (deterministic)

```bash
npm run capture -- <url> --max=15    # crawl + scan in one step; add --all to include login/app pages
# or step by step: npm run crawl -- <url> ... then npm run scan
```

Output: `runs/<host>-<date>/` with `site.json`, `scan-summary.json`, and per page
`pages/<slug>/{fold-desktop,fold-mobile,desktop,mobile}.png, text.md, meta.json, scan.json, css/`.
If the site blocks the crawler or renders nothing, stop and tell the user. Don't roast a captcha.

## 2. Understand the business first

Before judging anything, read `.claude/skills/product-marketing/SKILL.md` and use the homepage,
pricing, and about pages to write down: **what it sells, to whom, the main promise, the price
point, and the main competitor category**. Every pitch, conversion, and taste call is judged
against this, so a playful brand isn't punished for being playful.

## 3. Review every page through the lenses

Full rubric with scoring anchors: `references/rubric.md` (lens keys and weights are defined in code in
`lib/report/lenses.mjs`; keep the two in sync). Each lens names the skill(s) to load.
Read the skill's SKILL.md (and the reference files it points to) before applying it.

| Lens key | What it asks | Skills to apply |
|---|---|---|
| `aiCopy` | Does the copy read like default LLM output? | `scan.json.writing` (deterministic), `avoid-ai-writing`, `humanizer` |
| `aiDesign` | Does the UI look like the default AI-generated website? | `scan.json.design` (code tells), `avoid-ai-design` catalogue, `hallmark` gates, `frontend-design` clusters |
| `visual` | Taste and craft: hierarchy, type, spacing, colour, imagery, mobile | `impeccable` (audit / critique mode) |
| `readability` | Can a skimmer get it in 5 seconds? Jargon, density, rhythm | `scan.json.readability`, `copy-editing` |
| `pitch` | Is the value proposition clear, specific, credible, and aimed at the right buyer? | `product-marketing`, `copywriting`, `marketing-psychology` |
| `conversion` | Is the next step obvious, trusted, low-friction? | `cro` |
| `technical` | Titles, meta, headings, alt text, console errors, mobile overflow, load time, LLM legibility | `meta.json`, `seo-audit`, `ai-seo`, `web-design-guidelines` |

How to work:

- **Look at the screenshots.** Read `fold-desktop.png` and `fold-mobile.png` for every page and
  `desktop.png` for the homepage at least. Design and taste calls come from pixels, not CSS.
- **Code tells need visual confirmation.** `scan.json.design` scans the *shipped* CSS bundle, which
  carries rules for the whole site. Only report a code tell as `certain` if you can see it on the
  page; otherwise drop it or mark it `hunch`.
- **Deterministic copy hits are candidates.** Apply the context exceptions in `avoid-ai-writing`
  (marketing register, quoted testimonials, legal text) before reporting them.
- **Never claim authorship.** Say "reads as default AI copy", never "this was written by AI".
- **Fan out on big sites.** With more than ~5 pages, give each page (or group of similar pages) to a
  subagent with: the business summary from step 2, the page folder path, the lens table, and the
  finding schema. Do the homepage yourself. Check that subagent findings quote real evidence before merging.
- **Site-wide issues once.** Something on every page (nav, footer, font choice) goes on the first page
  where it appears, plus the site summary. Don't repeat it on every page.

## 4. Write `runs/<id>/roast.json`

Schema and an example: `references/roast-schema.md`. Scores are 0-10 per lens using the rubric
anchors. `overallScore` (0-100) is the weighted mean from the rubric. Give 3-5 `topFixes` sorted by
impact and 2-4 honest `strengths`, because a roast with no credit reads as spite.

## 5. Build the report

```bash
npm run report        # validates roast.json, then -> runs/<id>/report.html + report.pdf
```

If validation fails (unknown lens, finding without evidence), fix `roast.json` and re-run. Don't loosen the validator.

Open the PDF (or render one page to PNG) and check that it looks right. Then give the user the PDF path, the
overall score, and the top 3 fixes in chat.
