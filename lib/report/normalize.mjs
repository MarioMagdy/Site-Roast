// Upgrade roast.json to v2, number the findings, and validate. Annotate and report both call this,
// so finding numbers (#1, #2, ...) are identical in screenshots, tables and text.
import { CATEGORIES, CONFIDENCE, CRITERIA, SCHEMA_VERSION, SECTIONS, SEVERITIES, TYPES, VIEWPORTS } from "./schema.mjs";

const V1_LENS = { technical: "seo" };

function upgradeV1(roast) {
  if ((roast.schemaVersion ?? 1) >= 2) return roast;
  const findings = [];
  for (const p of roast.pages ?? []) {
    for (const f of p.findings ?? []) findings.push({ ...f, page: p.slug, category: V1_LENS[f.lens] ?? f.lens });
  }
  const scores = { ...(roast.site?.scores ?? {}) };
  if ("technical" in scores) { scores.seo = scores.technical; delete scores.technical; }
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: roast.generatedAt,
    site: roast.site,
    scores,
    pages: (roast.pages ?? []).map(({ findings: _f, scores: s = {}, ...p }) => {
      const ps = { ...s };
      if ("technical" in ps) { ps.seo = ps.technical; delete ps.technical; }
      return { ...p, scores: ps };
    }),
    findings,
  };
}

export function normalizeRoast(raw) {
  const roast = structuredClone(upgradeV1(raw));
  roast.scores ??= roast.site?.scores ?? {};
  roast.sections ??= {};
  roast.design ??= {};
  roast.content ??= {};
  const pageOrder = new Map((roast.pages ?? []).map((p, i) => [p.slug, i]));
  const findings = (roast.findings ?? []).map((f) => ({
    type: "issue",
    confidence: "likely",
    ...f,
    page: f.page ?? null,
    targets: f.targets ?? (f.target ? [f.target] : []),
  }));
  // Report order: page findings in page order, then site-wide; within each, worst first.
  const sectionIndex = (f) => SECTIONS.findIndex((s) => s.categories?.includes(f.category));
  findings.sort((a, b) =>
    (a.page === null) - (b.page === null)
    || (pageOrder.get(a.page) ?? 0) - (pageOrder.get(b.page) ?? 0)
    || (a.page === null ? sectionIndex(a) - sectionIndex(b) : 0)
    || (SEVERITIES[a.severity]?.rank ?? 9) - (SEVERITIES[b.severity]?.rank ?? 9));
  findings.forEach((f, i) => { f.n = i + 1; });
  roast.findings = findings;
  return roast;
}

export function validateRoast(roast) {
  const errors = [];
  if (!roast?.site?.url) errors.push("site.url missing");
  if (!Array.isArray(roast?.pages) || !roast.pages.length) errors.push("pages[] missing or empty");
  const slugs = new Set((roast?.pages ?? []).map((p) => p.slug));
  const criteria = new Set(CRITERIA.map((c) => c.key));
  const checkScores = (scores, where) => {
    for (const [k, v] of Object.entries(scores ?? {})) {
      if (!criteria.has(k)) errors.push(`${where}: unknown criterion "${k}"`);
      else if (v !== null && (typeof v !== "number" || v < 0 || v > 10)) errors.push(`${where}: ${k} must be 0-10`);
    }
  };
  checkScores(roast?.scores, "scores");
  for (const p of roast?.pages ?? []) checkScores(p.scores, `page ${p.slug}`);
  for (const [id, s] of Object.entries(roast?.sections ?? {})) {
    if (!SECTIONS.some((x) => x.id === id)) errors.push(`sections.${id}: unknown section`);
    if (s.status && !["assessed", "not-applicable"].includes(s.status)) errors.push(`sections.${id}: status must be assessed|not-applicable`);
  }
  for (const f of roast?.findings ?? []) {
    const at = `finding #${f.n} "${String(f.title ?? "").slice(0, 40)}"`;
    if (!f.title) errors.push(`${at}: no title`);
    if (!CATEGORIES[f.category]) errors.push(`${at}: unknown category "${f.category}"`);
    if (!SEVERITIES[f.severity]) errors.push(`${at}: unknown severity "${f.severity}"`);
    if (!TYPES[f.type]) errors.push(`${at}: type must be bug|issue`);
    if (!CONFIDENCE.includes(f.confidence)) errors.push(`${at}: confidence must be ${CONFIDENCE.join("|")}`);
    if (!f.evidence) errors.push(`${at}: no evidence (every finding needs a quote, number or visible detail)`);
    if (f.page !== null && !slugs.has(f.page)) errors.push(`${at}: page "${f.page}" is not in pages[]`);
    if (f.severity === "roast" && f.confidence === "hunch") errors.push(`${at}: a hunch can't be a roast`);
    for (const t of f.targets) {
      if (!VIEWPORTS.includes(t.viewport ?? "desktop")) errors.push(`${at}: target viewport must be ${VIEWPORTS.join("|")}`);
      if (!t.selector && !t.text && !t.box) errors.push(`${at}: target needs selector, text or box`);
      if (f.page === null && !t.page) errors.push(`${at}: site-wide finding targets need a "page"`);
    }
  }
  return errors;
}
