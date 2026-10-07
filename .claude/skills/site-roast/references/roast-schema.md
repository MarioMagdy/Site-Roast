# `roast.json` schema (v2)

Written by the site-roast skill to `runs/<id>/roast.json`. `npm run report` normalizes it
(`lib/report/normalize.mjs`), validates it, annotates screenshots, and renders the fixed report
(`report-format.md`). Allowed keys/values come from `lib/report/schema.mjs`.

```jsonc
{
  "schemaVersion": 2,
  "generatedAt": "2026-10-07T12:00:00Z",

  "site": {
    "url": "https://example.com",
    "name": "Example",
    "product": "What it sells, one line",
    "audience": "Who it's for",
    "verdict": "One paragraph: the roast in plain words.",
    "topFixes": ["Most impactful change first", "..."],      // 3-5
    "strengths": ["Credit where due", "..."]                  // 2-4
  },

  // 0-10 per criterion; omit what you didn't assess. Overall /100 is computed, not written.
  "scores": {
    "visual": 6, "typography": 6, "color": 5, "layout": 5, "imagery": 2, "motion": 6, "responsive": 7, "aiDesign": 3,
    "pitch": 5, "conversion": 6, "readability": 5, "aiCopy": 6,
    "accessibility": 8, "performance": 9, "security": 5, "seo": 7
  },

  // Designer's judgment: a design director's read. 2-5 sentences each; omit what doesn't apply.
  "design": {
    "firstImpression": "...", "artDirection": "...", "typography": "...", "color": "...", "layout": "...",
    "imagery": "...", "motion": "...", "consistency": "...", "brandFit": "..."
  },

  // Content, pitch & conversion narrative.
  "content": { "positioning": "...", "messaging": "...", "proof": "...", "conversionPath": "..." },

  // Technical section summaries (2-4 sentences: verdict + effect on visitors/brand/conversion).
  // Section ids: motion | themes | responsive | accessibility | performance | security | seo | i18n
  // (also allowed: design, content, bugs, ...). Mark a section not applicable only with a reason.
  "sections": {
    "motion": { "summary": "..." },
    "themes": { "summary": "..." },
    "i18n": { "status": "not-applicable", "reason": "English only" }
  },

  "pages": [
    { "slug": "index", "url": "https://example.com", "title": "Homepage", "verdict": "One or two sentences.",
      "scores": { "pitch": 5, "visual": 6 } }                // optional subset
  ],

  "findings": [
    {
      "page": "index",                 // a slug from pages[], or null for site-wide
      "category": "pitch",             // a criterion key, or "backend" | "i18n"
      "type": "issue",                 // "bug" (something broken) | "issue" (default)
      "severity": "roast",             // roast | fix | nit
      "title": "Hero says what it is, not why anyone should care",
      "evidence": "\"The modern platform for teams\": no audience, no outcome, no number.",
      "fix": "Lead with the buyer's outcome, e.g. ...",
      "source": "copywriting, product-marketing",
      "confidence": "certain",         // certain | likely | hunch (a hunch can't be a roast)
      "targets": [                     // optional: what to circle on the screenshot
        { "viewport": "desktop", "text": "The modern platform for teams", "note": "no outcome" },
        { "viewport": "mobile", "selector": "header .hero h1", "shape": "box" }
      ]
    }
  ]
}
```

## Targets

| Field | Meaning |
|---|---|
| `viewport` | `desktop` (1440) · `laptop` (1024) · `tablet` (768) · `mobile` (390). Default `desktop`. |
| `text` | Visible text to find (substring match, first visible hit; `nth` to pick another). Best for copy. |
| `selector` | CSS selector. The evidence files contain ready-made ones (`responsive.json` offenders and small targets, `bugs.json`, `motion.json`). |
| `box` | `[x, y, w, h]` in CSS px of the full page at that viewport. Last resort. |
| `click` | Selector to click first (open a modal, menu, accordion). The screenshot is then the viewport. |
| `shape` | `box` (default) or `circle`. |
| `note` | 2-4 word label printed next to the marker. |
| `page` | Only for site-wide findings (`page: null`): which page to mark it on. |

Findings are numbered automatically in report order; the number is printed on the marker, in the
register, and in the text. v1 files (findings nested under pages, `lens` instead of `category`)
are upgraded automatically.
