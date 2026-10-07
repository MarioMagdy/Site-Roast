# `roast.json` schema

Written by the site-roast skill to `runs/<id>/roast.json`, consumed by `scripts/build-report.mjs`.

```jsonc
{
  "generatedAt": "2026-10-07T12:00:00Z",
  "site": {
    "url": "https://example.com",
    "name": "Example",
    "product": "Transactional email API",          // one line, from step 2
    "audience": "developers at startups",
    "verdict": "One paragraph. The roast in plain words.",
    "overallScore": 64,                            // 0-100, weighted per rubric.md
    "scores": { "aiCopy": 7, "aiDesign": 5, "visual": 8, "readability": 6, "pitch": 6, "conversion": 7, "technical": 9 },
    "topFixes": ["Most impactful change first", "..."],
    "strengths": ["Credit where due", "..."]
  },
  "pages": [
    {
      "slug": "index",                             // folder name under pages/
      "url": "https://example.com",
      "title": "Homepage",
      "verdict": "One or two sentences.",
      "scores": { "aiCopy": 7, "aiDesign": 5, "visual": 8, "readability": 6, "pitch": 6, "conversion": 7, "technical": 9 },
      "findings": [
        {
          "lens": "pitch",                         // aiCopy | aiDesign | visual | readability | pitch | conversion | technical
          "severity": "roast",                     // roast | fix | nit
          "title": "Hero says what it is, not why anyone should care",
          "evidence": "\"The modern platform for teams\" - no audience, no outcome, no number.",
          "fix": "Lead with the outcome for the buyer, e.g. \"Ship invoices in 30 seconds, not 30 minutes\".",
          "source": "copywriting, product-marketing",
          "confidence": "certain"                  // certain | likely | hunch
        }
      ]
    }
  ]
}
```

A page's `scores` may omit lenses that don't apply (e.g. `pitch` on a legal page).
