---
name: site-roast
description: Roast a website from a URL - crawl every page, flag AI-generated giveaways in copy and design, judge it like a design director (taste, typography, colour/theme, layout, imagery, motion, responsiveness) plus pitch, conversion, accessibility, performance, security and backend, and deliver a PDF with annotated screenshots in a fixed report format. Use when the user gives a website link and asks to roast, audit, review, critique, judge, tear down, or "check for AI slop". Orchestrates the vendored skills in .claude/skills/ rather than re-implementing them.
argument-hint: "<url> [--max=15] [--all] [--lighthouse]"
---

# Site Roast

You are the orchestrator and the design director. The specialist judgement lives in the vendored
skills next to this one (`skills.manifest.json`, pinned in `skills.lock.json`). Your job: feed them
evidence, keep findings honest, point at the problems on the screenshots, and fill the fixed report.

**Voice:** a sharp, funny, fair senior reviewer. Roast the page, never the person.
Every jab needs evidence (a quote, a number, a visible detail). No evidence, no finding.

**The output is always the same shape**: see `references/report-format.md`. Sixteen sections in a
fixed order; a section that doesn't apply is listed as "not applicable" with a reason, never silently
dropped. The data contract is `references/roast-schema.md` (enforced by `lib/report/normalize.mjs`).

## 0. Freshness

If `skills.lock.json` `synced` dates are older than 14 days, run `npm run sync` first and mention
skills that changed. If `node_modules/` is missing, `npm install`.

## 1. Capture (deterministic)

```bash
npm run capture -- <url> --max=15 --lighthouse   # ~1 min/page with Lighthouse; drop it for a fast pass
```

This writes `runs/<host>-<date>/`:

| File | What's in it | Feeds |
|---|---|---|
| `site/profile.json` | stack, hosting, languages, forms, pricing shown, dark mode, motion level, backends, analytics | summary, which sections apply |
| `site/checks.json` | filmstrips, reduced-motion test, dark-mode test, security headers, cookies, secrets scan, third parties, backends, endpoints, forms, robots/sitemap/llms.txt, soft-404, link check | motion, themes, security, seo, bugs |
| `pages/<slug>/fold-{mobile,tablet,laptop,desktop}.png`, `desktop.png`, `mobile.png`, `film/` | screenshots at 4 breakpoints, full pages, load filmstrip | everything visual |
| `pages/<slug>/meta.json` | title, meta, headings, CTAs, links, lang/dir, headers | content, seo |
| `pages/<slug>/theme.json` | measured palette, fonts, type scale, radii, shadows, gradients, tokens | design, themes |
| `pages/<slug>/motion.json` | animations, loops, transitions, scroll reveals, libraries, autoplay video | motion |
| `pages/<slug>/responsive.json` | overflow (+ culprit selectors), small tap targets, min font size per breakpoint | responsive, a11y |
| `pages/<slug>/bugs.json` | JS errors, console errors, broken images, dead anchors, duplicate IDs, unnamed controls, forms | bugs, a11y |
| `pages/<slug>/network.json` | requests, failures, secrets, hosts referenced in code | security, backend, perf |
| `pages/<slug>/scan.json` | AI-writing + AI-design scanners, readability, HTML checks, Lighthouse | content, design, a11y, perf |

If the site blocks the crawler or renders nothing, stop and tell the user. Don't roast a captcha.

## 2. Understand the business first

Read `.claude/skills/product-marketing/SKILL.md`, `site/profile.json`, and the homepage, pricing and
about pages. Write down **what it sells, to whom, the main promise, the price point, and the
competitor category**. Every taste, pitch and conversion call is judged against this. A playful
brand isn't punished for being playful; an enterprise tool is judged by enterprise expectations.

## 3. Review in five passes

Criteria, weights and scoring anchors: `references/rubric.md`. Read a skill's SKILL.md (and the
reference files it points to) before applying it.

**A. Designer's judgment** (fills `design.*`, design criteria scores, design findings). Look at every
`fold-*.png`, the full `desktop.png` of the homepage, the breakpoint strip and the filmstrip. Judge as
a design director would: first impression in 5 seconds, art direction, typography, colour & theme,
layout & composition, imagery, motion, consistency across pages, and brand fit for the buyer and price.
Skills: `design-taste-frontend` (the bar), `impeccable` (critique/audit), `redesign-existing-projects`
(audit checklist), `avoid-ai-design` + `hallmark` + `frontend-design` (AI-default clusters).
Use `theme.json` to back colour/type claims with measured values.

**B. Content, pitch & conversion** (fills `content.*`, criteria pitch/conversion/readability/aiCopy).
Skills: `product-marketing`, `copywriting`, `marketing-psychology`, `cro`, `copy-editing`,
`avoid-ai-writing`, `humanizer`; deterministic copy hits in `scan.json.writing` are candidates only.

**C. Page by page.** Every page gets a one-line verdict and its own findings. More than ~5 pages: give
each page (or group of near-identical pages, e.g. language mirrors) to a subagent with the business
summary, the page folder, the rubric and the finding schema. Do the homepage yourself. Check every
subagent finding quotes real evidence before merging.

**D. Technical sections** (one `sections.<id>.summary` each, 2-4 sentences: the verdict and how it
affects visitors, brand and conversion):
- `motion`: `motion.json`, filmstrip, reduced-motion test. No motion is a finding only if the site
  needs feedback or life it doesn't have. Purposeless loops, slow entrances (>600 ms), motion that
  hides content until scroll, or ignoring reduced-motion are findings.
- `themes`: palette roles, contrast, dark mode, how the theme affects readability, brand perception
  and conversion. Use `theme.json` + the dark-mode check.
- `responsive`: breakpoint folds, overflow culprits, tap targets, tablet layouts (often the weakest).
- `accessibility`, `performance`: Lighthouse (lab numbers: say so; never roast on one noisy metric),
  `accessibility`, `performance`, `core-web-vitals`, `web-quality-audit` skills.
- `security`: headers, HTTPS, cookies, secrets, third parties, backends/endpoints, forms
  (`pre-launch-audit`, `web-quality-audit`). **Passive only:** never probe for hidden files, submit
  forms, try logins, or fuzz. A `service_role`/secret key in client code is always a Roast.
- `seo`: `seo-audit`, `ai-seo`, site files, soft-404, broken links.
- `i18n` (only if more than one language or RTL): parity between versions, untranslated strings, CTAs.

**E. Bugs.** Walk the automated detections (`bugs.json`, `network.json`, `site/checks.json` links)
and confirm the real ones as findings with `"type": "bug"`. A bug is something *broken* (error, dead
link, form that loses data, overflow that hides content); a quality problem is an `issue`.

Rules for every finding:
- **Point at it.** If it's visible, add `targets` so the report circles it: prefer `text` (exact
  visible copy) or a `selector` taken from the evidence files (`responsive.json`, `bugs.json` and
  `motion.json` contain ready-made selectors). Use `viewport: "mobile"` for mobile issues, `click`
  to open a modal/menu first, `shape: "circle"` for small things, `note` for a 2-4 word label.
- **Code tells need visual confirmation.** The design scanner reads the whole CSS bundle. Only report
  a code tell as `certain` if you can see it on the page.
- **Never claim authorship.** "Reads as default AI output", never "AI made this".
- **Site-wide issues once** (`page: null`, with a `targets[].page` for the marker), not on every page.

## 4. Write `runs/<id>/roast.json`

Schema with a full example: `references/roast-schema.md`. Score every criterion you assessed (0-10,
rubric anchors). 3-5 `topFixes` sorted by impact and 2-4 honest `strengths`, because a roast with no
credit reads as spite. Mark a section `not-applicable` only with a reason.

## 5. Build the report

```bash
npm run report        # validate -> annotate screenshots -> runs/<id>/report.html + report.pdf
```

- Validation fails → fix `roast.json`. Don't loosen the validator.
- "marker(s) couldn't be placed" → fix that target's `text`/`selector` (or give a `box`) and re-run.
- Render a few PDF pages to PNG and look at them: markers on the right elements, nothing cut off.

Then give the user the PDF path, the overall score, and the top 3 fixes in chat.
