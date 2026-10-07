# Site Roast rubric

Score each criterion 0-10 for the site (and per page where useful). Use the anchors and don't
default to 6 or 7. Keys and weights live in `lib/report/schema.mjs` (`CRITERIA`); keep this file in sync.
Overall = weighted mean × 10 (0-100). Group scores (Design / Content / Engineering) are weighted means.

## Design (43)

| Key | W | 9-10 | 5-6 | 0-2 |
|---|---|---|---|---|
| `visual` Taste & craft | 10 | A clear art direction you could name; every detail looks decided; feels premium for its price point | Competent and tidy but generic or flat; some crowding or misalignment | Broken, clashing, or amateur; you'd distrust the business |
| `typography` | 5 | Deliberate pairing, clear scale, comfortable measure (45-75 ch), consistent weights | Default stack (Inter/system) used tidily; scale a bit muddled | Clashing families, unreadable sizes, cramped or endless lines |
| `color` Colour & theme | 5 | Restrained palette with clear roles, accessible contrast, theme fits brand; dark mode if the audience expects it | Workable palette, a few contrast misses, roles fuzzy | Clashing, low contrast throughout, colour fights the content |
| `layout` Layout & composition | 5 | Strong grid and rhythm, hierarchy obvious, sections composed differently for their job | Everything the same shape (eyebrow, H2, cards) all the way down | Broken alignment, overlaps, crowding, no hierarchy |
| `imagery` Imagery & iconography | 4 | Real product/people/place imagery that proves claims; one icon style | Stock or decorative imagery; mixed icon styles | No imagery where trust needs it, broken images, clip-art |
| `motion` Motion & interaction | 3 | Purposeful and quick (UI 150-300 ms, entrances < 600 ms), clear hover/focus/press states, respects reduced motion, no layout shift | Default fades everywhere, or almost none where feedback is needed | Janky, distracting loops, content hidden until scroll, ignores reduced motion |
| `responsive` Responsiveness | 5 | Designed per breakpoint (not just stacked), no overflow, 24 px+ targets, readable sizes on mobile | Stacks fine on mobile, clumsy at tablet | Horizontal scroll, overlapping or cut-off content on mobile |
| `aiDesign` Originality (AI design tells) | 6 | Nothing looks like a template default | Recognisable kit, but some real decisions | The full first- or second-order AI cluster (gradient hero + 3 cards, or cream/serif/eyebrows/01-02-03) |

## Content & pitch (40)

| Key | W | 9-10 | 5-6 | 0-2 |
|---|---|---|---|---|
| `pitch` Pitch & positioning | 14 | Names who it's for and the outcome they get; differentiator specific and credible; proof matches claims; price/next step findable | Features not outcomes; vague differentiation; thin proof | Buzzword salad; you can't tell what it sells |
| `conversion` Conversion & trust | 10 | One primary CTA per view with a specific label; trust signals next to the ask; low-friction forms | CTA present but generic or competing; trust signals missing or far away | No clear next step, dead CTA, or a form that loses data |
| `readability` Readability & clarity | 8 | 5-second test passes; scannable; reading level fits the audience | Walls of text in places, some jargon | Can't tell what it is after the hero; dense jargon |
| `aiCopy` Voice (AI copy tells) | 8 | Specific, voiced, concrete nouns and numbers | A few stock phrases among real content | Paragraphs that could sit on any site; triads, "not just X, it's Y", inflated claims |

## Engineering (17)

| Key | W | 9-10 | 5-6 | 0-2 |
|---|---|---|---|---|
| `accessibility` | 6 | Lighthouse a11y ≥ 95, labelled controls and fields, contrast passes, visible focus | ~85: contrast or label gaps | < 70, unlabelled forms, keyboard traps |
| `performance` | 5 | LCP ≤ 2.5 s, CLS ≤ 0.1, TBT ≤ 200 ms (lab) | LCP 2.5-4 s or heavy third parties | LCP > 6 s, big layout shifts |
| `security` Security & backend | 4 | HTTPS + redirect, HSTS, framing protection/CSP, secure cookies, no secrets, sensible third parties, robust form handling | HTTPS but most headers missing (typical static site) | No HTTPS, secret keys in client code, mixed content, forms that leak or drop data |
| `seo` SEO & discoverability | 2 | Unique titles/descriptions, one H1, canonical, sitemap, real 404s, structured data, custom domain | A few gaps | Missing titles, noindex by accident, broken pages |

## Severity

- **roast**: actively costs trust, clarity or conversions. The visitor would notice and bounce.
- **fix**: clear improvement with a concrete change.
- **nit**: polish.

## Type

- **bug**: something is broken (JS error, dead link or anchor, form that drops data, overflow hiding content, broken image).
- **issue**: everything else (quality, taste, clarity, missing things).

## Confidence

- **certain**: visible in the screenshot, quoted verbatim, or measured.
- **likely**: strong signal plus partial support (e.g. read in the code but not triggered).
- **hunch**: worth checking. Use sparingly and never with severity `roast`.

## Pitch questions (ask on every key page)

1. In one sentence, what does this sell and to whom? Can you answer from the hero alone?
2. What outcome is promised, and is it quantified or shown?
3. Why this over the obvious alternative? Is that stated?
4. Does the visual style fit the buyer and the price point?
5. Is there proof (logos, numbers, named testimonials, demos, photos of the real thing) near the claims?
6. Is the price or next step findable within one click?
