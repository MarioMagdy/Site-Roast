// roast.json -> self-contained print HTML. Image paths are relative to the run folder.
import fs from "node:fs";
import path from "node:path";
import { LENSES, SEVERITIES, overallScore } from "./lenses.mjs";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const tone = (v) => (v >= 8 ? "#067647" : v >= 5 ? "#b54708" : "#b42318");

const CSS = `
  @page { size: A4; margin: 16mm 14mm; }
  * { box-sizing: border-box; }
  body { font: 10.5pt/1.5 Georgia, "Times New Roman", serif; color: #1d2939; margin: 0; }
  h1, h2, h3, h4, .sev, .bars, .meta, .src { font-family: "Helvetica Neue", Arial, sans-serif; }
  h1 { font-size: 26pt; margin: 0 0 4px; letter-spacing: -0.5px; }
  h2 { font-size: 16pt; margin: 0 0 2px; }
  h3 { font-size: 10pt; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: .06em; color: #667085; }
  h4 { page-break-after: avoid; font-size: 10pt; margin: 14px 0 6px; border-bottom: 1px solid #eaecf0; padding-bottom: 3px; }
  .meta { color: #667085; font-size: 9pt; }
  .score { font: 700 54pt/1 "Helvetica Neue", Arial, sans-serif; }
  .verdict { font-size: 12pt; border-left: 3px solid #1d2939; padding-left: 12px; margin: 14px 0; }
  .bars { width: 100%; border-collapse: collapse; font-size: 9pt; } .bars td { padding: 3px 6px 3px 0; }
  .bar { width: 55%; } .bar span { display: block; height: 8px; border-radius: 4px; }
  .n { text-align: right; font-weight: 700; width: 48px; }
  .page { page-break-before: always; }
  .shots { display: flex; gap: 10px; align-items: flex-start; margin: 10px 0; }
  .shots img { border: 1px solid #d0d5dd; border-radius: 4px; } .shots .d { width: 74%; } .shots .m { width: 23%; }
  .f { margin: 0 0 9px; page-break-inside: avoid; }
  .sev { display: inline-block; color: #fff; font-size: 7.5pt; font-weight: 700; padding: 1px 6px; border-radius: 3px; margin-right: 6px; text-transform: uppercase; }
  .ev { color: #475467; font-style: italic; } .fx { margin-top: 2px; } .src { font-size: 7.5pt; color: #98a2b3; }
  ul, ol { padding-left: 18px; margin: 4px 0; }
  table.skills { font-size: 8pt; border-collapse: collapse; width: 100%; }
  table.skills td { border-bottom: 1px solid #eaecf0; padding: 3px 4px; font-family: monospace; }`;

function scoreBars(scores = {}) {
  const rows = LENSES.filter((l) => typeof scores[l.key] === "number").map((l) => `
    <tr><td>${l.label}</td><td class="bar"><span style="width:${scores[l.key] * 10}%;background:${tone(scores[l.key])}"></span></td>
    <td class="n" style="color:${tone(scores[l.key])}">${scores[l.key]}/10</td></tr>`);
  return `<table class="bars">${rows.join("")}</table>`;
}

function findingList(findings = []) {
  return LENSES.map((l) => {
    const list = findings.filter((f) => f.lens === l.key)
      .sort((a, b) => (SEVERITIES[a.severity]?.rank ?? 9) - (SEVERITIES[b.severity]?.rank ?? 9));
    if (!list.length) return "";
    return `<h4>${l.label}</h4>` + list.map((f) => {
      const sev = SEVERITIES[f.severity] ?? SEVERITIES.nit;
      return `<div class="f"><span class="sev" style="background:${sev.color}">${sev.label}</span><b>${esc(f.title)}</b>
        ${f.evidence ? `<div class="ev">${esc(f.evidence)}</div>` : ""}
        ${f.fix ? `<div class="fx"><b>Fix:</b> ${esc(f.fix)}</div>` : ""}
        <div class="src">${esc(f.source ?? "")}${f.confidence ? ` · ${esc(f.confidence)}` : ""}</div></div>`;
    }).join("");
  }).join("");
}

function shots(run, slug) {
  const rel = (f) => (fs.existsSync(path.join(run, "pages", slug, f)) ? `pages/${slug}/${f}` : null);
  const d = rel("fold-desktop.png"), m = rel("fold-mobile.png");
  return d || m ? `<div class="shots">${d ? `<img class="d" src="${d}">` : ""}${m ? `<img class="m" src="${m}">` : ""}</div>` : "";
}

export function renderReport(roast, { run, lock = {} }) {
  const s = roast.site;
  const score = s.overallScore ?? overallScore(s.scores);
  const date = new Date(roast.generatedAt ?? Date.now()).toISOString().slice(0, 10);

  const cover = `<section>
    <div class="meta">SITE ROAST · ${date} · ${roast.pages.length} page(s)</div>
    <h1>${esc(s.name ?? s.url)}</h1>
    <div class="meta">${esc(s.url)}${s.product ? ` · ${esc(s.product)}` : ""}${s.audience ? ` · for ${esc(s.audience)}` : ""}</div>
    <div style="display:flex;gap:28px;align-items:center;margin-top:18px">
      <div><div class="score" style="color:${tone((score ?? 0) / 10)}">${score ?? "?"}</div><div class="meta">out of 100</div></div>
      <div style="flex:1">${scoreBars(s.scores)}</div>
    </div>
    <div class="verdict">${esc(s.verdict)}</div>
    ${s.topFixes?.length ? `<h3>Fix these first</h3><ol>${s.topFixes.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
    ${s.strengths?.length ? `<h3>What's working</h3><ul>${s.strengths.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
  </section>`;

  const pages = roast.pages.map((p) => `<section class="page">
    <div class="meta">${esc(p.url)}</div>
    <h2>${esc(p.title ?? p.slug)}</h2>
    ${p.verdict ? `<div class="verdict">${esc(p.verdict)}</div>` : ""}
    ${scoreBars(p.scores)}
    ${shots(run, p.slug)}
    ${findingList(p.findings)}
  </section>`).join("");

  const method = `<section class="page">
    <h2>Method</h2>
    <p>Each page was rendered in Chromium at 1440px and 390px. Deterministic detectors ran on the copy and the shipped CSS. Reviewers then judged the screenshots and copy through each lens, using the open-source skills listed below. Severity: <b>Roast</b> = actively costs trust or conversions; <b>Fix</b> = clear improvement; <b>Nit</b> = polish.</p>
    <p><b>About "AI tells":</b> a tell means the page uses a default that generative tools overproduce. It is not proof the site was AI-made, and no finding here is an authorship claim.</p>
    <h3>Skills used</h3>
    <table class="skills">${Object.entries(lock).map(([n, l]) => `<tr><td>${esc(n)}</td><td>${esc(l.repo)}@${esc(l.sha.slice(0, 10))}</td><td>${esc(l.license)}</td></tr>`).join("")}</table>
  </section>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Site Roast - ${esc(s.name ?? s.url)}</title><style>${CSS}</style></head><body>${cover}${pages}${method}</body></html>`;
}
