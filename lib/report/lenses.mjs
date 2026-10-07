// The review lenses. Single source of truth for keys, labels, and weights.
// Keep in sync with .claude/skills/site-roast/references/rubric.md.
export const LENSES = [
  { key: "aiCopy", label: "AI copy tells", weight: 15 },
  { key: "aiDesign", label: "AI design tells", weight: 10 },
  { key: "visual", label: "Visual quality & taste", weight: 15 },
  { key: "readability", label: "Readability & clarity", weight: 15 },
  { key: "pitch", label: "Pitch & positioning", weight: 25 },
  { key: "conversion", label: "Conversion & trust", weight: 15 },
  { key: "technical", label: "Technical hygiene", weight: 5 },
];

export const SEVERITIES = {
  roast: { label: "Roast", color: "#b42318", rank: 0 },
  fix: { label: "Fix", color: "#b54708", rank: 1 },
  nit: { label: "Nit", color: "#475467", rank: 2 },
};

/** Weighted 0-100 score over the lenses present in `scores` (each 0-10). */
export function overallScore(scores = {}) {
  const present = LENSES.filter((l) => typeof scores[l.key] === "number");
  const w = present.reduce((n, l) => n + l.weight, 0);
  return w ? Math.round((present.reduce((n, l) => n + scores[l.key] * l.weight, 0) / w) * 10) : null;
}

/** Light validation so a malformed roast.json fails loudly instead of rendering a blank report. */
export function validateRoast(roast) {
  const errors = [];
  if (!roast?.site?.url) errors.push("site.url missing");
  if (!Array.isArray(roast?.pages) || !roast.pages.length) errors.push("pages[] missing or empty");
  const keys = new Set(LENSES.map((l) => l.key));
  for (const p of roast?.pages ?? []) {
    for (const [i, f] of (p.findings ?? []).entries()) {
      if (!keys.has(f.lens)) errors.push(`${p.slug} finding ${i}: unknown lens "${f.lens}"`);
      if (!SEVERITIES[f.severity]) errors.push(`${p.slug} finding ${i}: unknown severity "${f.severity}"`);
      if (!f.evidence) errors.push(`${p.slug} finding ${i}: no evidence (every finding needs a quote or visual detail)`);
    }
  }
  return errors;
}
