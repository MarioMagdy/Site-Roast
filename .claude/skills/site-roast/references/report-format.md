# Report format (fixed outline)

Every Site Roast PDF has these sections, in this order. The order and ids come from `SECTIONS`
in `lib/report/schema.mjs`. If a section doesn't apply, it is listed under "What's in this report"
as *not applicable* with the reason, and its pages are skipped.

| # | Section | Always? | Contents |
|---|---|---|---|
| 1 | Scorecard | yes | Name, URL, what it sells and to whom, overall /100, Design / Content / Engineering group scores, severity counts, verdict, all criterion bars |
| 2 | Executive summary | yes | Fix these first, What's working, detected site profile, contents with status per section |
| 3 | Designer's judgment | yes | First impression, art direction, typography, colour & theme, layout, imagery, motion, consistency, brand fit (each with its score), the measured visual system (palette swatches, typefaces, type scale, radii, tokens), cross-page consistency, design findings |
| 4 | Content, pitch & conversion | yes | Positioning, messaging & voice, proof & trust, conversion path, copy facts per page, content findings |
| 5 | Bugs | when any exist | Confirmed bugs (numbered) + raw automated detections |
| 6 | Issue register | yes | Every finding: #, severity, bug/issue, area, page, title, confidence |
| 7 | Page by page (annotated) | yes | Per page: verdict, scores, annotated screenshot crops (desktop wide, mobile/tablet side by side) with numbered markers, the page's findings |
| 8 | Motion & interaction | yes | Animation inventory per page, reduced-motion test, load filmstrips, motion findings |
| 9 | Themes & colour | yes | Palettes, dark-mode test (light vs dark screenshots when supported), contrast failures, colour findings |
| 10 | Responsiveness | yes | Breakpoint strip (390/768/1024/1440), per-page overflow / tap targets / min font, examples, findings |
| 11 | Accessibility | yes | Lighthouse a11y, alt text, unnamed controls, unlabelled fields, tap targets, lang, failed audits, findings |
| 12 | Performance | yes | Lighthouse perf + Core Web Vitals per page, load time, request counts, findings |
| 13 | Security & backend | yes | HTTPS/redirect, security headers, disclosure, secrets, mixed content, cookies, backends & third parties, API calls, forms, findings |
| 14 | SEO & discoverability | yes | Titles/descriptions/H1/canonical/hreflang/JSON-LD per page, site files, soft-404, custom domain, broken links, findings |
| 15 | Language & localisation | when multilingual / RTL | Pages per language, RTL, hreflang, i18n findings |
| 16 | Method & appendix | yes | How evidence was gathered, severity/confidence legend, weights, limits, unplaced markers, skills + versions |

Numbering: findings are numbered once (`#1…#N`) in report order (page order, worst first, then
site-wide by section). The same number appears on the screenshot marker, in the register, and in
the text.
