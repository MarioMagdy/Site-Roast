import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeRoast, validateRoast } from "../lib/report/normalize.mjs";
import { CRITERIA, SECTIONS, overallScore } from "../lib/report/schema.mjs";
import { buildContext } from "../lib/report/context.mjs";
import { renderReport } from "../lib/report/template.mjs";
import { plan } from "../lib/report/sections/index.mjs";
import { readability } from "../lib/scan/readability.mjs";

const roast = () => ({
  schemaVersion: 2,
  site: { url: "https://ex.com", name: "Ex", verdict: "v" },
  scores: { pitch: 4, visual: 8 },
  pages: [{ slug: "index", url: "https://ex.com", title: "Home" }, { slug: "about", url: "https://ex.com/about", title: "About" }],
  findings: [
    { page: null, category: "color", severity: "fix", title: "site-wide", evidence: "e" },
    { page: "about", category: "pitch", severity: "nit", title: "about nit", evidence: "e" },
    { page: "index", category: "pitch", severity: "fix", title: "<b>vague</b>", evidence: "\"The future of work\"" },
    { page: "index", category: "visual", severity: "roast", title: "worst", evidence: "e", confidence: "certain",
      target: { viewport: "mobile", selector: "h1" } },
  ],
});

test("criteria weights sum to 100", () => {
  assert.equal(CRITERIA.reduce((n, c) => n + c.weight, 0), 100);
});

test("overall score is the weighted mean over present criteria", () => {
  assert.equal(overallScore({ pitch: 4, visual: 8 }), Math.round(((4 * 14 + 8 * 10) / 24) * 10));
  assert.equal(overallScore({}), null);
});

test("findings are numbered in report order: page order, worst first, site-wide last", () => {
  const r = normalizeRoast(roast());
  assert.deepEqual(r.findings.map((f) => f.title), ["worst", "<b>vague</b>", "about nit", "site-wide"]);
  assert.deepEqual(r.findings.map((f) => f.n), [1, 2, 3, 4]);
  assert.equal(r.findings[0].targets.length, 1); // `target` shorthand -> targets[]
  assert.deepEqual(validateRoast(r), []);
});

test("validation catches bad categories, missing evidence, unknown pages, roast hunches, bad targets", () => {
  const bad = roast();
  bad.findings.push(
    { page: "index", category: "vibes", severity: "fix", title: "x", evidence: "e" },
    { page: "nope", category: "pitch", severity: "fix", title: "y" },
    { page: "index", category: "pitch", severity: "roast", confidence: "hunch", title: "z", evidence: "e" },
    { page: "index", category: "pitch", severity: "nit", title: "w", evidence: "e", target: { viewport: "watch" } },
  );
  const errors = validateRoast(normalizeRoast(bad)).join("\n");
  for (const s of ["unknown category", "no evidence", "not in pages", "hunch", "viewport", "selector, text or box"]) assert.match(errors, new RegExp(s));
});

test("v1 roast.json still renders", () => {
  const v1 = { site: { url: "https://ex.com", verdict: "v", scores: { technical: 7, pitch: 5 } },
    pages: [{ slug: "index", url: "https://ex.com", findings: [{ lens: "technical", severity: "fix", title: "t", evidence: "e" }] }] };
  const r = normalizeRoast(v1);
  assert.equal(r.findings[0].category, "seo");
  assert.equal(r.scores.seo, 7);
  assert.deepEqual(validateRoast(r), []);
});

test("report has the fixed outline; inapplicable sections are listed, not rendered", () => {
  const ctx = buildContext("/nonexistent", normalizeRoast(roast()));
  const p = plan(ctx);
  assert.deepEqual(p.map((s) => s.id), SECTIONS.map((s) => s.id));
  assert.equal(p.find((s) => s.id === "i18n").applies, false);
  assert.equal(p.find((s) => s.id === "bugs").applies, false);
  const html = renderReport(ctx);
  assert.match(html, /&lt;b&gt;vague&lt;\/b&gt;/); // model-written text is escaped
  assert.match(html, /not applicable: single-language site/);
  assert.doesNotMatch(html, /id="i18n"/);
});

test("readability ignores nav fragments and skips non-Latin copy", () => {
  assert.equal(readability("Home\nPricing\nLogin"), null);
  assert.ok(readability("This is a simple sentence that people can read easily. Here is another one for luck.").fleschReadingEase > 50);
  assert.ok(readability("ابنِ ثقة حقيقية في التحدث بالإنجليزية. تعلّم كيف تعبّر عن أفكارك بوضوح وبلا تردد في اجتماعات العمل.").skipped);
});

test("optional detectors only run when opted in", async () => {
  const { DETECTORS } = await import("../lib/scan/detectors.mjs");
  assert.deepEqual(DETECTORS.filter((d) => d.optIn).map((d) => d.optIn), ["lighthouse"]);
  for (const d of DETECTORS) assert.equal(typeof d.summarize(null), "object");
});
