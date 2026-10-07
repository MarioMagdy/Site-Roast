// Scorecard (cover) and Executive summary.
import { esc, scoreBars, table, tone } from "../components.mjs";
import { GROUPS, SEVERITIES, groupScore, overallScore } from "../schema.mjs";

export function scorecard(ctx) {
  const s = ctx.roast.site;
  const scores = ctx.roast.scores;
  const overall = overallScore(scores);
  const counts = Object.keys(SEVERITIES).map((k) => [k, ctx.findings.filter((f) => f.severity === k).length]);
  const bugs = ctx.findings.filter((f) => f.type === "bug").length;
  const date = new Date(ctx.roast.generatedAt ?? Date.now()).toISOString().slice(0, 10);
  return `
    <div class="kicker">SITE ROAST · ${date} · ${ctx.pages.length} page(s) reviewed</div>
    <h1>${esc(s.name ?? s.url)}</h1>
    <div class="meta">${esc(s.url)}</div>
    ${s.product ? `<div class="meta"><b>Sells:</b> ${esc(s.product)}${s.audience ? ` · <b>To:</b> ${esc(s.audience)}` : ""}</div>` : ""}
    <div class="hero-scores">
      <div class="big"><div class="score" style="color:${tone((overall ?? 0) / 10)}">${overall ?? "?"}</div><div class="meta">overall / 100</div></div>
      ${Object.entries(GROUPS).map(([g, label]) => {
        const v = groupScore(scores, g);
        return v == null ? "" : `<div class="gs"><div class="gsv" style="color:${tone(v)}">${v}</div><div class="meta">${label} / 10</div></div>`;
      }).join("")}
      <div class="gs counts">${counts.map(([k, n]) => `<div><span class="sev" style="background:${SEVERITIES[k].color}">${SEVERITIES[k].label}</span> ${n}</div>`).join("")}<div><span class="sev bugpill">Bugs</span> ${bugs}</div></div>
    </div>
    <div class="verdict">${esc(s.verdict)}</div>
    ${scoreBars(scores)}`;
}

export function summary(ctx, { contents }) {
  const s = ctx.roast.site;
  const p = ctx.profile;
  const yesNo = (v) => (v ? "yes" : "no");
  const profileRows = p ? [
    ["Stack", esc(p.stack.join(", "))], ["Hosting", `${esc(p.hosting ?? "unknown")}${p.customDomain ? "" : " (free subdomain)"}`],
    ["Languages", esc(p.languages.join(", ") || "unknown") + (p.rtl ? " · RTL" : "")], ["Pages reviewed", p.pageCount],
    ["Forms", p.forms], ["Prices shown", yesNo(p.pricingShown)], ["Dark mode", esc(p.darkMode)],
    ["Motion", `${esc(p.motion.level)}${p.motion.libraries.length ? ` (${esc(p.motion.libraries.join(", "))})` : ""}`],
    ["Backends referenced", esc(p.backends.join(", ") || "none seen")], ["Analytics / ads", esc(p.analytics.join(", ") || "none seen")],
    ["Store / login / blog", `${yesNo(p.commerce)} / ${yesNo(p.auth)} / ${yesNo(p.blog)}`],
  ] : [];
  return `
    <div class="cols">
      <div>
        ${s.topFixes?.length ? `<h3>Fix these first</h3><ol class="tight">${s.topFixes.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
        ${s.strengths?.length ? `<h3>What's working</h3><ul class="tight">${s.strengths.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      </div>
      <div>
        ${profileRows.length ? `<h3>Site profile (detected)</h3>${table(["", ""], profileRows, "kv")}` : ""}
      </div>
    </div>
    <h3>What's in this report</h3>
    <div class="contents">${contents.map((c, i) => `<div class="ci${c.applies ? "" : " off"}"><span class="sec-n">${String(i + 1).padStart(2, "0")}</span> ${esc(c.title)}
      <span class="small ${c.applies ? "muted" : "na"}">${c.applies ? (c.count ? `${c.count} finding(s)` : "included") : `not applicable: ${esc(c.reason)}`}</span></div>`).join("")}</div>`;
}
