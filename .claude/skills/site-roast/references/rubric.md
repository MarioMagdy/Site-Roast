# Site Roast rubric

Score each lens 0-10 per page, then per site. Use the anchors. Don't default to 6 or 7.

| Lens | Weight | 9-10 | 5-6 | 0-2 |
|---|---|---|---|---|
| `aiCopy` | 15 | Specific, voiced, concrete nouns and numbers; no stock phrasing | A few stock phrases ("seamless", "unlock", "not just X - it's Y") among real content | Paragraphs that could sit on any SaaS site; triads, em-dash pivots, "in today's fast-paced world" |
| `aiDesign` | 10 | Clear art direction you could name; nothing looks like a template default | Recognisable kit (shadcn/Tailwind defaults, Inter) but some decisions made | Purple/indigo gradient hero, centred headline + 3 icon cards, glassmorphism, gradient text, generic 3D blobs, emoji bullets |
| `visual` | 15 | Strong hierarchy, consistent spacing rhythm, deliberate type pairing, imagery that shows the product | Competent but flat; some crowding or misalignment; stock imagery | Broken layout, clashing styles, unreadable contrast, mobile broken |
| `readability` | 15 | 5-second test passes; scannable headings; Flesch ≳ 60 for consumer, ≳ 40 for technical B2B | Walls of text in places; some jargon | Can't tell what it is after reading the hero; dense jargon throughout |
| `pitch` | 25 | Names who it's for and the outcome they get; differentiator is specific and credible; proof matches claims | Describes features, not outcomes; differentiation vague | Buzzword salad; the product category itself is unclear |
| `conversion` | 15 | One primary CTA per view, specific label, visible pricing/next step, trust signals near the ask | CTA present but generic ("Get started") or competing CTAs | No clear next step, or a dead/broken CTA |
| `technical` | 5 | Unique title + meta, one H1, alt text, no console errors, no mobile overflow, LCP ≤ 2.5 s / Lighthouse a11y ≥ 90 | A few gaps | Broken pages, missing titles, horizontal scroll on mobile |

`overallScore = round(Σ(score × weight) / 10)`, giving 0-100.

## Severity

- **roast**: actively costs trust, clarity, or conversions. The reader would notice and bounce.
- **fix**: clear improvement with a concrete change.
- **nit**: polish.

## Confidence

- **certain**: visible in the screenshot or quoted verbatim from the copy.
- **likely**: strong signal from a detector plus partial visual support.
- **hunch**: worth checking. Use sparingly and never with severity `roast`.

## Pitch questions (ask on every key page)

1. In one sentence, what does this sell and to whom? Can you answer from the hero alone?
2. What outcome is promised, and is it quantified or shown?
3. Why this over the obvious alternative? Is that stated?
4. Does the visual style fit the buyer? (Enterprise buyers vs indie devs vs consumers expect different things.)
5. Is there proof (logos, numbers, testimonials with names, demos) near the claims it supports?
6. Is the price or next step findable within one click?
