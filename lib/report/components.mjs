// Small HTML building blocks shared by the report sections.
import fs from "node:fs";
import path from "node:path";
import { CATEGORIES, CRITERIA, GROUPS, SEVERITIES, groupScore } from "./schema.mjs";

export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const tone = (v) => (v == null ? "#98a2b3" : v >= 8 ? "#067647" : v >= 5 ? "#b54708" : "#b42318");

export function img(ctx, rel, cls = "", alt = "") {
  return rel && fs.existsSync(path.join(ctx.run, rel)) ? `<img class="${cls}" src="${esc(rel)}" alt="${esc(alt)}">` : "";
}

export const sevBadge = (sev) => {
  const s = SEVERITIES[sev] ?? SEVERITIES.nit;
  return `<span class="sev" style="background:${s.color}">${s.label}</span>`;
};
export const num = (f) => `<span class="num" style="background:${(SEVERITIES[f.severity] ?? SEVERITIES.nit).color}">${f.n}</span>`;
export const pill = (text, cls = "") => `<span class="pill ${cls}">${esc(text)}</span>`;
export const passFail = (ok) => (ok === null || ok === undefined ? `<span class="na">n/a</span>` : ok ? `<span class="ok">✓</span>` : `<span class="bad">✗</span>`);

export function scoreBars(scores = {}, { groups = true } = {}) {
  const rows = [];
  for (const [g, label] of Object.entries(GROUPS)) {
    const crit = CRITERIA.filter((c) => c.group === g && typeof scores[c.key] === "number");
    if (!crit.length) continue;
    if (groups) {
      const gs = groupScore(scores, g);
      rows.push(`<tr class="grp"><td>${label}</td><td></td><td class="n" style="color:${tone(gs)}">${gs}</td></tr>`);
    }
    for (const c of crit) {
      rows.push(`<tr><td class="lbl">${c.label}</td><td class="bar"><span style="width:${scores[c.key] * 10}%;background:${tone(scores[c.key])}"></span></td><td class="n" style="color:${tone(scores[c.key])}">${scores[c.key]}</td></tr>`);
    }
  }
  return rows.length ? `<table class="bars">${rows.join("")}</table>` : "";
}

export function findingCard(f, ctx, { showPage = false } = {}) {
  const page = showPage && f.page ? ctx.pageTitle(f.page) : null;
  return `<div class="f">
    <div class="fh">${num(f)}${sevBadge(f.severity)}${f.type === "bug" ? pill("bug", "bugpill") : ""}<b>${esc(f.title)}</b></div>
    <div class="fmeta">${esc(CATEGORIES[f.category] ?? f.category)}${page ? ` · ${esc(page)}` : ""} · ${esc(f.confidence)}${f.source ? ` · ${esc(f.source)}` : ""}</div>
    ${f.evidence ? `<div class="ev">${esc(f.evidence)}</div>` : ""}
    ${f.fix ? `<div class="fx"><b>Fix:</b> ${esc(f.fix)}</div>` : ""}
  </div>`;
}

/** Full cards for site-wide findings of these categories + one-line refs to page-level ones. */
export function categoryFindings(ctx, categories) {
  const site = ctx.findings.filter((f) => f.page === null && categories.includes(f.category));
  const pageLevel = ctx.findings.filter((f) => f.page !== null && categories.includes(f.category));
  let html = site.map((f) => findingCard(f, ctx)).join("");
  if (pageLevel.length) {
    html += `<div class="refs"><div class="refs-h">Also in this area (details under Page by page)</div>${pageLevel.map((f) =>
      `<div class="ref">${num(f)}${esc(f.title)} <span class="muted">· ${esc(ctx.pageTitle(f.page))}</span></div>`).join("")}</div>`;
  }
  return html || `<p class="muted">No findings in this area.</p>`;
}

export function table(headers, rows, cls = "") {
  if (!rows.length) return "";
  return `<table class="t ${cls}"><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${
    rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

export function swatches(list = [], title = "") {
  if (!list.length) return "";
  return `<div class="sw-group">${title ? `<div class="sw-title">${esc(title)}</div>` : ""}<div class="sws">${list.map((c) => {
    const hex = String(c.value).split("@")[0];
    return `<div class="sw"><span style="background:${esc(hex)}${String(c.value).includes("@") ? ";opacity:.7" : ""}"></span><code>${esc(c.value)}</code><small>${c.share}%</small></div>`;
  }).join("")}</div></div>`;
}

export const sectionSummary = (ctx, id) => {
  const s = ctx.roast.sections[id];
  return s?.summary ? `<div class="lead">${esc(s.summary)}</div>` : "";
};
