import assert from "node:assert/strict";
import { test } from "node:test";
import { overallScore, validateRoast } from "../lib/report/lenses.mjs";
import { renderReport } from "../lib/report/template.mjs";
import { readability } from "../lib/scan/readability.mjs";

const roast = {
  site: { url: "https://ex.com", verdict: "v", scores: { pitch: 4, visual: 8 } },
  pages: [{ slug: "index", url: "https://ex.com", findings: [
    { lens: "pitch", severity: "roast", title: "<b>vague</b>", evidence: "\"The future of work\"" },
  ] }],
};

test("overall score is the weighted mean over present lenses", () => {
  assert.equal(overallScore({ pitch: 4, visual: 8 }), Math.round(((4 * 25 + 8 * 15) / 40) * 10));
  assert.equal(overallScore({}), null);
});

test("validation rejects unknown lenses and evidence-free findings", () => {
  assert.deepEqual(validateRoast(roast), []);
  const bad = structuredClone(roast);
  bad.pages[0].findings.push({ lens: "vibes", severity: "fix", title: "x" });
  assert.equal(validateRoast(bad).length, 2);
});

test("report escapes model-written text", () => {
  const html = renderReport(roast, { run: "/nonexistent" });
  assert.match(html, /&lt;b&gt;vague&lt;\/b&gt;/);
});

test("readability ignores nav fragments", () => {
  assert.equal(readability("Home\nPricing\nLogin"), null);
  assert.ok(readability("This is a simple sentence that people can read easily. Here is another one for luck.").fleschReadingEase > 50);
});

test("optional detectors only run when opted in", async () => {
  const { DETECTORS } = await import("../lib/scan/detectors.mjs");
  assert.deepEqual(DETECTORS.filter((d) => d.optIn).map((d) => d.optIn), ["lighthouse"]);
  for (const d of DETECTORS) assert.equal(typeof d.summarize(null), "object");
});
