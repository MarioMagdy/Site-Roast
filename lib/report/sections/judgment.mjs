// Designer's judgment and Content, pitch & conversion: narrative sections written by the reviewer,
// backed by the measured visual system and copy facts.
import { categoryFindings, esc, swatches, table, tone } from "../components.mjs";
import { CONTENT_ASPECTS, DESIGN_ASPECTS } from "../schema.mjs";

function aspects(ctx, list, data) {
  return list.filter((a) => data[a.key]).map((a) => {
    const v = a.criterion ? ctx.roast.scores[a.criterion] : null;
    return `<div class="aspect"><div class="ah">${esc(a.label)}${typeof v === "number" ? `<span class="chip" style="color:${tone(v)};border-color:${tone(v)}">${v}/10</span>` : ""}</div><p>${esc(data[a.key])}</p></div>`;
  }).join("");
}

export function design(ctx) {
  const home = ctx.pages[0];
  const t = home?.theme;
  const specimen = t ? `
    <div class="specimen">
      <h3>Measured visual system (homepage)</h3>
      <div class="cols">
        <div>${swatches(t.background, "Backgrounds (by area)")}${swatches(t.text, "Text colours (by amount of text)")}</div>
        <div>
          ${table(["", ""], [
            ["Typefaces", esc(t.fonts.map((f) => `${f.value} ${f.share}%`).join(" · "))],
            ["Type scale", esc(t.sizes.join(" · "))],
            ["Weights", esc(t.weights.map((w) => `${w.value} (${w.share}%)`).join(" · "))],
            ["Corner radii", esc(t.radii.map((r) => r.value).join(" · ") || "none")],
            ["Distinct colours", t.distinctColors], ["Shadows / gradients", `${t.distinctShadows} / ${t.gradients}`],
            ["CSS custom properties", t.css?.customProperties ?? "?"],
          ], "kv")}
        </div>
      </div>
    </div>` : "";
  const themed = ctx.pages.filter((p) => p.theme);
  const fontsByPage = themed.map((p) => [esc(p.title ?? p.slug), esc(p.meta.lang ?? ""), esc(p.theme.fonts.slice(0, 3).map((f) => f.value).join(", ")), esc(p.theme.background[0]?.value ?? ""), esc(p.theme.text[0]?.value ?? "")]);
  // Compare within a language: an Arabic version switching to an Arabic typeface is expected.
  const byLang = {};
  for (const p of themed) (byLang[p.meta.lang ?? "?"] ??= new Set()).add(p.theme.fonts.slice(0, 2).map((f) => f.value).sort().join(","));
  const consistent = Object.values(byLang).every((set) => set.size <= 1);
  return `
    ${aspects(ctx, DESIGN_ASPECTS, ctx.roast.design)}
    ${specimen}
    ${fontsByPage.length > 1 ? `<h3>Consistency check ${consistent ? `<span class="ok">same type system on every page${Object.keys(byLang).length > 1 ? " of each language" : ""}</span>` : `<span class="bad">type system changes between pages</span>`}</h3>${table(["Page", "Lang", "Fonts", "Main background", "Main text"], fontsByPage)}` : ""}
    <h3>Design findings</h3>
    ${categoryFindings(ctx, ["visual", "typography", "layout", "imagery", "aiDesign"])}`;
}

export function content(ctx) {
  const rows = ctx.pages.map((p) => {
    const r = p.scan?.readability;
    const w = p.scan?.writing;
    return [esc(p.title ?? p.slug), p.meta.words ?? "", r?.fleschReadingEase ?? (r?.skipped ? `<span class="muted">n/a (non-Latin)</span>` : ""),
      w ? `${w.score} · ${esc(w.label)}` : "", esc((p.meta.ctas ?? []).slice(0, 3).join(" | "))];
  });
  return `
    ${aspects(ctx, CONTENT_ASPECTS, ctx.roast.content)}
    <h3>Copy facts</h3>
    ${table(["Page", "Words", "Flesch", "AI-writing scan", "First CTAs"], rows)}
    <h3>Content findings</h3>
    ${categoryFindings(ctx, ["pitch", "conversion", "readability", "aiCopy"])}`;
}
