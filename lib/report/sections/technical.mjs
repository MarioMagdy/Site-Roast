// Motion, Themes & colour, Responsiveness, Accessibility, Performance, Security & backend, SEO, i18n.
// Each section = reviewer summary + automated evidence + findings.
import { categoryFindings, esc, img, passFail, sectionSummary, swatches, table } from "../components.mjs";

const lh = (p) => p.scan?.lighthouse ?? null;
const lhNote = (ctx) => (ctx.pages.some(lh) ? "" : `<p class="muted small">Lighthouse wasn't run for this report (capture with <code>--lighthouse</code> to include lab scores).</p>`);

export function motion(ctx) {
  const rm = ctx.checks.extras?.reducedMotion;
  const rows = ctx.pages.filter((p) => p.motion).map((p) => {
    const m = p.motion;
    return [esc(p.title ?? p.slug), m.running, m.infinite, `${m.interactiveWithTransition}/${m.interactiveTotal}`,
      m.scrollReveal?.revealed ?? 0, esc(m.libraries.join(", ") || "none"), m.videos.filter((v) => v.autoplay).length,
      `${m.css?.keyframes ?? "?"}${m.css?.reducedMotionQuery ? " ✓" : ""}`];
  });
  const strips = (ctx.checks.extras?.filmstrips ?? []).map((s) => `
    <div class="strip-h">${esc(ctx.pageTitle(s.slug))}: first ${(s.frames.at(-1)?.ms / 1000).toFixed(1)} s of loading</div>
    <div class="strip">${s.frames.map((f) => `<figure>${img(ctx, f.file)}<figcaption>${(f.ms / 1000).toFixed(2)} s</figcaption></figure>`).join("")}</div>`).join("");
  return `
    ${sectionSummary(ctx, "motion")}
    ${table(["Page", "Running anims", "Looping", "Hover/focus transitions", "Scroll reveals", "Libraries", "Autoplay video", "@keyframes (✓ = reduced-motion query)"], rows)}
    <p class="small">Reduced-motion preference: ${rm ? (rm.respected === null ? "no running animations to reduce" : rm.respected ? `<span class="ok">respected</span> (${rm.normalRunning} → ${rm.reducedRunning} running)` : `<span class="bad">ignored</span> (${rm.normalRunning} → ${rm.reducedRunning} running animations)`) : "not tested"}</p>
    ${strips}
    ${categoryFindings(ctx, ["motion"])}`;
}

export function themes(ctx) {
  const home = ctx.pages[0];
  const dark = ctx.checks.extras?.dark;
  const t = home?.theme;
  const contrast = ctx.pages.map((p) => [p, (lh(p)?.failed ?? []).find((a) => a.id === "color-contrast")]).filter(([, a]) => a);
  return `
    ${sectionSummary(ctx, "themes")}
    ${t ? `<div class="cols"><div>${swatches(t.background, "Background palette")}${swatches(t.border, "Borders")}</div><div>${swatches(t.text, "Text palette")}</div></div>` : ""}
    <h3>Dark mode</h3>
    <p>${dark ? (dark.auto ? `<span class="ok">Follows the OS setting</span> (${esc(dark.lightBg)} → ${esc(dark.darkBg)})` : dark.toggle ? `<span class="ok">Available via toggle</span>` : `None. The page looks the same with the OS in dark mode (background stays ${esc(dark.lightBg)}).${t?.colorSchemeMeta ? "" : " No <code>color-scheme</code> meta either."}`) : "not tested"}</p>
    ${dark?.image ? `<div class="shots">${img(ctx, `pages/${home.slug}/fold-desktop.png`, "half")}${img(ctx, dark.image, "half")}</div><p class="muted small">Light (left) vs dark (right).</p>` : ""}
    ${contrast.length ? `<h3>Contrast failures (Lighthouse)</h3>${table(["Page", "Audit"], contrast.map(([p, a]) => [esc(p.title ?? p.slug), esc(a.title)]))}` : ""}
    ${categoryFindings(ctx, ["color"])}`;
}

export function responsive(ctx) {
  const home = ctx.pages[0];
  const strip = home ? ["mobile", "tablet", "laptop", "desktop"].map((bp) => {
    const file = `pages/${home.slug}/fold-${bp}.png`;
    return `<figure class="bp bp-${bp}">${img(ctx, file)}<figcaption>${bp}</figcaption></figure>`;
  }).join("") : "";
  const cell = (r) => (r ? `${r.overflow ? `<span class="bad">overflow +${r.overflowBy}px</span>` : `<span class="ok">fits</span>`}<br><span class="small">${r.smallTapTargets} small targets · min ${r.minFontPx}px</span>` : "");
  const rows = ctx.pages.filter((p) => p.responsive).map((p) => [esc(p.title ?? p.slug), ...["mobile", "tablet", "laptop", "desktop"].map((bp) => cell(p.responsive[bp])), passFail(!!p.meta.viewportMeta)]);
  const examples = ctx.pages.flatMap((p) => (p.responsive?.mobile?.smallTapExamples ?? []).slice(0, 3).map((e) => [esc(p.title ?? p.slug), esc(e.label || e.selector), `${e.w}×${e.h}px`]));
  return `
    ${sectionSummary(ctx, "responsive")}
    <div class="bp-strip">${strip}</div>
    ${table(["Page", "Mobile 390", "Tablet 768", "Laptop 1024", "Desktop 1440", "Viewport meta"], rows)}
    ${examples.length ? `<h3>Tap targets under 24×24 px on mobile (examples)</h3>${table(["Page", "Element", "Size"], examples.slice(0, 10))}` : ""}
    ${categoryFindings(ctx, ["responsive"])}`;
}

export function accessibility(ctx) {
  const rows = ctx.pages.map((p) => {
    const l = lh(p);
    const forms = p.bugs?.forms ?? [];
    const unlabelled = forms.flatMap((f) => f.fields.filter((x) => !x.labelled)).length;
    return [esc(p.title ?? p.slug), l?.scores?.accessibility ?? "", p.meta.imagesMissingAlt ?? "", (p.bugs?.unnamedControls ?? []).length, unlabelled, p.responsive?.mobile?.smallTapTargets ?? "", p.meta.lang ? esc(p.meta.lang) : `<span class="bad">missing</span>`,
      esc((l?.failed ?? []).filter((a) => a.category === "accessibility").map((a) => a.id).join(", "))];
  });
  return `
    ${sectionSummary(ctx, "accessibility")}
    ${lhNote(ctx)}
    ${table(["Page", "Lighthouse a11y", "Images w/o alt", "Unnamed controls", "Unlabelled fields", "Small tap targets", "lang", "Failed audits"], rows)}
    ${categoryFindings(ctx, ["accessibility"])}`;
}

export function performance(ctx) {
  const rows = ctx.pages.map((p) => {
    const l = lh(p);
    const reqs = p.network?.requests ?? [];
    return [esc(p.title ?? p.slug), l?.scores?.performance ?? "", esc(l?.vitals?.lcp ?? ""), esc(l?.vitals?.cls ?? ""), esc(l?.vitals?.tbt ?? ""), esc(l?.vitals?.fcp ?? ""),
      p.meta.loadMs ? `${(p.meta.loadMs / 1000).toFixed(1)} s` : "", reqs.length, reqs.filter((r) => !r.firstParty).length];
  });
  return `
    ${sectionSummary(ctx, "performance")}
    ${lhNote(ctx)}
    ${table(["Page", "LH perf", "LCP", "CLS", "TBT", "FCP", "Load (capture)", "Requests", "3rd-party"], rows)}
    <p class="muted small">Lighthouse numbers are lab runs with simulated mobile throttling: directional, not what every visitor sees.</p>
    ${categoryFindings(ctx, ["performance"])}`;
}

export function security(ctx) {
  const s = ctx.checks.security;
  if (!s) return `${sectionSummary(ctx, "security")}<p class="muted">No security evidence in this run.</p>${categoryFindings(ctx, ["security", "backend"])}`;
  const r = s.httpsRedirect;
  return `
    ${sectionSummary(ctx, "security")}
    <p class="muted small">Passive review: only what a normal visitor's browser receives. No probing for hidden files, no form submissions, no logins.</p>
    <div class="cols">
      <div>
        <h3>Transport & headers</h3>
        ${table(["Check", "", "Value"], [
          ["HTTPS", passFail(s.https), ""],
          ["HTTP → HTTPS redirect", passFail(r?.ok), esc(r?.status ? `${r.status} → ${r.location ?? ""}` : r?.error ?? "")],
          ...s.headers.map((h) => [esc(h.label), passFail(h.pass), `<code>${esc(h.value ?? "")}</code>`]),
          ["Server / X-Powered-By", "", esc([s.disclosure.server, s.disclosure.poweredBy].filter(Boolean).join(" · ") || "not disclosed")],
        ])}
      </div>
      <div>
        <h3>Exposure</h3>
        ${table(["Check", "Result"], [
          ["Secrets in client code", s.secrets.length ? s.secrets.map((x) => `<span class="${x.kind === "secret" ? "bad" : "muted"}">${esc(x.type)} <code>${esc(x.value)}</code> (${x.kind})</span>`).join("<br>") : `<span class="ok">none found</span>`],
          ["Mixed content", s.mixedContent.length ? `<span class="bad">${s.mixedContent.length} http:// requests</span>` : `<span class="ok">none</span>`],
          ["target=_blank without noopener", s.blankNoOpener || `<span class="ok">0</span>`],
          ["Cookies on first visit", s.cookies.length ? s.cookies.map((c) => `${esc(c.name)} ${c.secure ? "" : "<span class='bad'>not Secure</span>"} ${c.httpOnly ? "HttpOnly" : ""} ${esc(c.sameSite ?? "")}`).join("<br>") : "none"],
        ])}
      </div>
    </div>
    <h3>Backend & integrations (observable)</h3>
    ${table(["Kind", "Service", "Seen as"], [
      ...s.backends.map((b) => [esc(b.category), esc(b.name), `referenced in code: <code>${esc(b.host)}</code>`]),
      ...s.thirdParties.map((t) => [esc(t.category), esc(t.name), `${t.requests} request(s) on load`]),
      ...s.endpoints.slice(0, 10).map((e) => ["API call", esc(e.url), `${esc(e.method)} → ${e.status}`]),
    ]) || `<p class="muted">No third parties or API calls observed.</p>`}
    ${s.forms.length ? `<h3>Forms</h3>${table(["Page", "Form", "Fields", "Required", "Unlabelled", "Submits via"], s.forms.map((f) => [
      esc(ctx.pageTitle(f.page)), `<code>${esc(f.selector)}</code>`, f.fields.length, f.fields.filter((x) => x.required).length,
      f.fields.filter((x) => !x.labelled).length, esc(f.action ? `${f.method.toUpperCase()} ${f.action}` : "JavaScript")]))}` : ""}
    ${categoryFindings(ctx, ["security", "backend"])}`;
}

export function seo(ctx) {
  const f = ctx.checks.files;
  const rows = ctx.pages.map((p) => {
    const m = p.meta;
    return [esc(p.title ?? p.slug), `${(m.title ?? "").length} ch`, m.metaDescription ? `${m.metaDescription.length} ch` : `<span class="bad">missing</span>`,
      m.h1Count === 1 ? "1" : `<span class="bad">${m.h1Count ?? "?"}</span>`, passFail(!!m.canonical), esc((m.hreflang ?? []).join(" ")), m.jsonLd ?? 0, esc(m.lang ?? "")];
  });
  const fileRows = f ? Object.entries(f.files).map(([name, r]) => [esc(name), passFail(r.exists), esc(r.exists ? `HTTP ${r.status}` : r.status === 200 ? "200 but serves the HTML homepage (soft 404)" : `HTTP ${r.status ?? r.error}`)]) : [];
  const broken = ctx.checks.links?.broken ?? [];
  return `
    ${sectionSummary(ctx, "seo")}
    ${table(["Page", "Title", "Description", "H1s", "Canonical", "hreflang", "JSON-LD", "lang"], rows)}
    <div class="cols"><div>
      <h3>Site files</h3>${table(["File", "", ""], fileRows)}
      ${f ? `<p class="small">Missing pages return: ${f.soft404 ? `<span class="bad">HTTP ${f.missingPageStatus} (soft 404)</span>` : `<span class="ok">HTTP ${f.missingPageStatus}</span>`} · Custom domain: ${passFail(ctx.profile?.customDomain)}</p>` : ""}
    </div><div>
      <h3>Links</h3><p class="small">${ctx.checks.links?.checked ?? 0} links checked · ${broken.length} broken · ${ctx.checks.links?.unverifiable ?? 0} couldn't be verified (bot-blocked)</p>
      ${table(["Link", "Status", "From"], broken.slice(0, 15).map((l) => [`<code>${esc(l.url)}</code>`, esc(l.status), esc(l.from.join(", "))]))}
    </div></div>
    ${categoryFindings(ctx, ["seo"])}`;
}

export function i18n(ctx) {
  const p = ctx.profile;
  const byLang = {};
  for (const pg of ctx.pages) (byLang[pg.meta.lang ?? "?"] ??= []).push(pg.title ?? pg.slug);
  return `
    ${sectionSummary(ctx, "i18n")}
    ${table(["Language", "Pages"], Object.entries(byLang).map(([l, list]) => [esc(l), esc(list.join(" · "))]))}
    <p class="small">RTL layout: ${p?.rtl ? "yes" : "no"} · hreflang on homepage: ${esc((ctx.pages[0]?.meta.hreflang ?? []).join(", ") || "none")}</p>
    ${categoryFindings(ctx, ["i18n"])}`;
}
