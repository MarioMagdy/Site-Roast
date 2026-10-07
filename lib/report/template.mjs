// Report shell: CSS + the fixed section outline. Sections that don't apply are listed in the
// contents with a reason and skipped here.
import { esc } from "./components.mjs";
import { plan, renderSection } from "./sections/index.mjs";

const CSS = `
  @page { size: A4; margin: 15mm 13mm; }
  * { box-sizing: border-box; }
  body { font: 10pt/1.5 Georgia, "Times New Roman", serif; color: #1d2939; margin: 0; }
  h1, h2, h3, .kicker, .meta, .sev, .num, .pill, .bars, .t, .fmeta, .chip, figcaption, .strip-h, .refs, .sec-n, .gs, .small { font-family: "Helvetica Neue", Arial, sans-serif; }
  h1 { font-size: 28pt; margin: 4px 0; letter-spacing: -.5px; }
  h2 { font-size: 15pt; margin: 0 0 4px; }
  h3 { font-size: 9.5pt; margin: 16px 0 6px; text-transform: uppercase; letter-spacing: .06em; color: #475467; }
  section.sec { page-break-before: always; }
  section.sec:first-child { page-break-before: auto; }
  .sec-head { border-bottom: 2px solid #1d2939; margin-bottom: 10px; padding-bottom: 4px; display: flex; align-items: baseline; gap: 10px; }
  .sec-n { font-size: 9pt; color: #98a2b3; font-weight: 700; }
  .sec-head h2 { font-size: 17pt; margin: 0; }
  .kicker { font-size: 8.5pt; letter-spacing: .08em; color: #667085; }
  .meta { color: #667085; font-size: 8.5pt; }
  .muted { color: #667085; } .small { font-size: 8.5pt; }
  .ok { color: #067647; font-weight: 600; } .bad { color: #b42318; font-weight: 600; } .na { color: #98a2b3; }
  .hero-scores { display: flex; gap: 22px; align-items: flex-end; margin: 16px 0 6px; }
  .score { font: 700 54pt/1 "Helvetica Neue", Arial, sans-serif; }
  .gsv { font: 700 24pt/1 "Helvetica Neue", Arial, sans-serif; }
  .counts { font-size: 8.5pt; display: grid; grid-template-columns: auto auto; gap: 4px 12px; margin-left: auto; }
  .verdict { font-size: 11pt; border-left: 3px solid #1d2939; padding-left: 12px; margin: 12px 0; }
  .lead { font-size: 10.5pt; background: #f9fafb; border-left: 3px solid #98a2b3; padding: 8px 12px; margin: 6px 0 10px; }
  .bars { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin: 6px 0; }
  .bars td { padding: 2px 6px 2px 0; } .bars .lbl { padding-left: 10px; width: 34%; } .bars tr.grp td { font-weight: 700; padding-top: 6px; }
  .bar { width: 56%; } .bar span { display: block; height: 7px; border-radius: 4px; } .n { text-align: right; font-weight: 700; width: 40px; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
  ol.tight, ul.tight { padding-left: 18px; margin: 4px 0; } .tight li { margin-bottom: 3px; }
  table.t { width: 100%; border-collapse: collapse; font-size: 8pt; margin: 4px 0 8px; page-break-inside: auto; }
  table.t th { text-align: left; color: #475467; font-weight: 600; border-bottom: 1px solid #d0d5dd; padding: 3px 5px; }
  table.t td { border-bottom: 1px solid #eaecf0; padding: 3px 5px; vertical-align: top; }
  table.t tr { page-break-inside: avoid; }
  table.kv td:first-child { color: #475467; width: 38%; }
  code { font-family: Menlo, Consolas, monospace; font-size: 7.5pt; word-break: break-all; }
  .sev, .num, .pill { display: inline-block; color: #fff; font-size: 7pt; font-weight: 700; padding: 1px 6px; border-radius: 3px; text-transform: uppercase; margin-right: 5px; vertical-align: 1px; }
  .num { border-radius: 9px; min-width: 18px; text-align: center; font-size: 8pt; padding: 1px 5px; }
  .pill { background: #eaecf0; color: #344054; } .bugpill { background: #6941c6 !important; color: #fff; }
  .f { margin: 0 0 10px; page-break-inside: avoid; }
  .fh b { font-size: 10.5pt; } .fmeta { font-size: 7.5pt; color: #98a2b3; margin: 1px 0 2px 0; }
  .ev { color: #475467; font-style: italic; unicode-bidi: plaintext; } .fx { margin-top: 2px; unicode-bidi: plaintext; }
  .contents { display: grid; grid-template-columns: 1fr 1fr; gap: 3px 18px; font-family: "Helvetica Neue", Arial, sans-serif; font-size: 9pt; }
  .ci { border-bottom: 1px solid #eaecf0; padding: 3px 0; } .ci.off { color: #98a2b3; } .ci .small { float: right; }
  .refs { columns: 2; column-gap: 18px; } .refs .ref { break-inside: avoid; } .refs-h { column-span: all; }
  .refs { border-top: 1px dashed #d0d5dd; margin-top: 8px; padding-top: 6px; font-size: 8.5pt; }
  .refs-h { color: #667085; font-size: 7.5pt; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 3px; } .ref { margin-bottom: 2px; }
  .aspect { margin-bottom: 8px; page-break-inside: avoid; } .aspect p { margin: 2px 0 0; }
  .ah { font: 700 9.5pt "Helvetica Neue", Arial, sans-serif; }
  .chip { font-size: 7.5pt; border: 1px solid; border-radius: 9px; padding: 0 6px; margin-left: 6px; }
  .specimen { background: #f9fafb; padding: 6px 12px 10px; border-radius: 6px; margin: 10px 0; page-break-inside: avoid; }
  .sw-title { font: 600 8pt "Helvetica Neue", Arial, sans-serif; color: #475467; margin: 6px 0 3px; }
  .sws { display: flex; flex-wrap: wrap; gap: 6px; }
  .sw { display: flex; flex-direction: column; align-items: center; width: 62px; font-family: Arial, sans-serif; }
  .sw span { width: 46px; height: 30px; border-radius: 5px; border: 1px solid #d0d5dd; }
  .sw code { font-size: 6.5pt; } .sw small { font-size: 6.5pt; color: #98a2b3; }
  figure { margin: 0; } figcaption { font-size: 7.5pt; color: #667085; margin-top: 2px; }
  .shot { margin: 8px 0; page-break-inside: avoid; } .shot img.wide { width: 100%; border: 1px solid #d0d5dd; border-radius: 4px; }
  .narrow-row { display: flex; gap: 10px; flex-wrap: wrap; } .narrow-row .shot { width: 31%; } .narrow-row img { width: 100%; border: 1px solid #d0d5dd; border-radius: 4px; }
  .shots { display: flex; gap: 10px; align-items: flex-start; margin: 8px 0; }
  .shots img { border: 1px solid #d0d5dd; border-radius: 4px; } .shots .d { width: 74%; } .shots .m { width: 23%; } .shots .half { width: 49%; }
  .bp-strip { display: flex; gap: 8px; align-items: flex-end; margin: 6px 0 10px; }
  .bp img { width: 100%; border: 1px solid #d0d5dd; border-radius: 3px; }
  .bp-mobile { width: 13%; } .bp-tablet { width: 20%; } .bp-laptop { width: 28%; } .bp-desktop { width: 39%; }
  .strip-h { font-size: 8pt; color: #475467; margin-top: 8px; }
  .strip { display: flex; gap: 6px; } .strip figure { width: 20%; } .strip img { width: 100%; border: 1px solid #d0d5dd; border-radius: 3px; }
  .pg + .pg { page-break-before: always; } .pg h2 { margin-top: 2px; }
  table.reg td:nth-child(6) { width: 40%; }`;

export function renderReport(ctx) {
  const contents = plan(ctx);
  const included = contents.filter((s) => s.applies);
  const body = included.map((s, i) => `
    <section class="sec" id="${s.id}">
      ${s.id === "scorecard" ? "" : `<div class="sec-head"><span class="sec-n">${String(i + 1).padStart(2, "0")}</span><h2>${esc(s.title)}</h2></div>`}
      ${renderSection(ctx, s, contents)}
    </section>`).join("");
  const name = ctx.roast.site.name ?? ctx.roast.site.url;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Site Roast - ${esc(name)}</title><style>${CSS}</style></head><body>${body}</body></html>`;
}
