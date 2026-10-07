// roast.json v2: the single source of truth for criteria, categories, severities and report sections.
// The rubric (.claude/skills/site-roast/references/rubric.md) and schema doc (roast-schema.md) mirror this file.

export const SCHEMA_VERSION = 2;

export const GROUPS = {
  design: "Design",
  content: "Content & pitch",
  engineering: "Engineering",
};

/** Scored criteria (0-10). Weights sum to 100. */
export const CRITERIA = [
  { key: "visual", group: "design", label: "Taste & craft", weight: 10 },
  { key: "typography", group: "design", label: "Typography", weight: 5 },
  { key: "color", group: "design", label: "Colour & theme", weight: 5 },
  { key: "layout", group: "design", label: "Layout & composition", weight: 5 },
  { key: "imagery", group: "design", label: "Imagery & iconography", weight: 4 },
  { key: "motion", group: "design", label: "Motion & interaction", weight: 3 },
  { key: "responsive", group: "design", label: "Responsiveness", weight: 5 },
  { key: "aiDesign", group: "design", label: "Originality (AI design tells)", weight: 6 },
  { key: "pitch", group: "content", label: "Pitch & positioning", weight: 14 },
  { key: "conversion", group: "content", label: "Conversion & trust", weight: 10 },
  { key: "readability", group: "content", label: "Readability & clarity", weight: 8 },
  { key: "aiCopy", group: "content", label: "Voice (AI copy tells)", weight: 8 },
  { key: "accessibility", group: "engineering", label: "Accessibility", weight: 6 },
  { key: "performance", group: "engineering", label: "Performance", weight: 5 },
  { key: "security", group: "engineering", label: "Security & backend", weight: 4 },
  { key: "seo", group: "engineering", label: "SEO & discoverability", weight: 2 },
];

/** Finding categories = criteria + two that are reported but not scored on their own. */
export const CATEGORIES = {
  ...Object.fromEntries(CRITERIA.map((c) => [c.key, c.label])),
  backend: "Backend & integrations",
  i18n: "Language & localisation",
};

export const SEVERITIES = {
  roast: { label: "Roast", color: "#b42318", rank: 0, help: "actively costs trust, clarity or conversions" },
  fix: { label: "Fix", color: "#c4320a", rank: 1, help: "clear improvement with a concrete change" },
  nit: { label: "Nit", color: "#475467", rank: 2, help: "polish" },
};
export const TYPES = { bug: "Bug (something is broken)", issue: "Issue (quality problem)" };
export const CONFIDENCE = ["certain", "likely", "hunch"];
export const VIEWPORTS = ["desktop", "laptop", "tablet", "mobile"];

/** Narrative fields of the Designer's judgment section, in display order. */
export const DESIGN_ASPECTS = [
  { key: "firstImpression", label: "First impression (5-second test)" },
  { key: "artDirection", label: "Art direction", criterion: "visual" },
  { key: "typography", label: "Typography", criterion: "typography" },
  { key: "color", label: "Colour & theme", criterion: "color" },
  { key: "layout", label: "Layout & composition", criterion: "layout" },
  { key: "imagery", label: "Imagery & iconography", criterion: "imagery" },
  { key: "motion", label: "Motion & interaction", criterion: "motion" },
  { key: "consistency", label: "Consistency across pages" },
  { key: "brandFit", label: "Brand fit (does the look suit the buyer and price point?)" },
];

export const CONTENT_ASPECTS = [
  { key: "positioning", label: "Positioning", criterion: "pitch" },
  { key: "messaging", label: "Messaging & voice", criterion: "aiCopy" },
  { key: "proof", label: "Proof & trust" },
  { key: "conversionPath", label: "Conversion path", criterion: "conversion" },
];

/**
 * Fixed report outline. Every report has these sections in this order; a section that doesn't
 * apply is listed in the contents as "not applicable" with a reason instead of disappearing.
 * `categories`: site-wide findings of these categories are printed in full in this section.
 */
export const SECTIONS = [
  { id: "scorecard", title: "Scorecard" },
  { id: "summary", title: "Executive summary" },
  { id: "design", title: "Designer's judgment", categories: ["visual", "typography", "layout", "imagery", "aiDesign"] },
  { id: "content", title: "Content, pitch & conversion", categories: ["pitch", "conversion", "readability", "aiCopy"] },
  { id: "bugs", title: "Bugs", conditional: true },
  { id: "register", title: "Issue register" },
  { id: "pages", title: "Page by page (annotated)" },
  { id: "motion", title: "Motion & interaction", categories: ["motion"] },
  { id: "themes", title: "Themes & colour", categories: ["color"] },
  { id: "responsive", title: "Responsiveness", categories: ["responsive"] },
  { id: "accessibility", title: "Accessibility", categories: ["accessibility"] },
  { id: "performance", title: "Performance", categories: ["performance"] },
  { id: "security", title: "Security & backend", categories: ["security", "backend"] },
  { id: "seo", title: "SEO & discoverability", categories: ["seo"] },
  { id: "i18n", title: "Language & localisation", categories: ["i18n"], conditional: true },
  { id: "method", title: "Method & appendix" },
];

export function sectionForCategory(category) {
  return SECTIONS.find((s) => s.categories?.includes(category))?.id ?? null;
}

/** Weighted 0-100 over the criteria present (each 0-10). */
export function overallScore(scores = {}) {
  const present = CRITERIA.filter((c) => typeof scores[c.key] === "number");
  const w = present.reduce((n, c) => n + c.weight, 0);
  return w ? Math.round((present.reduce((n, c) => n + scores[c.key] * c.weight, 0) / w) * 10) : null;
}

export function groupScore(scores = {}, group) {
  const present = CRITERIA.filter((c) => c.group === group && typeof scores[c.key] === "number");
  const w = present.reduce((n, c) => n + c.weight, 0);
  return w ? Math.round((present.reduce((n, c) => n + scores[c.key] * c.weight, 0) / w) * 10) / 10 : null;
}
