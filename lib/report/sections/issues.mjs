// Bugs, Issue register, and Page by page (annotated screenshots + findings per page).
import { esc, findingCard, img, num, pill, scoreBars, sevBadge, table } from "../components.mjs";
import { CATEGORIES } from "../schema.mjs";

/** Automated bug signals from the capture, so nothing detected is lost even if the review skipped it. */
export function automatedBugs(ctx) {
  const rows = [];
  for (const p of ctx.pages) {
    const b = p.bugs ?? {};
    const n = p.network ?? {};
    const add = (check, detail) => rows.push({ page: p.title ?? p.slug, check, detail });
    (b.pageErrors ?? []).forEach((e) => add("Uncaught JS error", e));
    (b.consoleErrors ?? []).slice(0, 5).forEach((e) => add("Console error", e));
    (b.brokenImages ?? []).forEach((i) => add("Broken image", i.src));
    (b.missingAnchors ?? []).forEach((a) => add("Link to missing #anchor", a));
    (b.dupIds ?? []).length && add("Duplicate IDs", b.dupIds.join(", "));
    (b.placeholderLinks ?? []).forEach((l) => add("Placeholder link (href=# / javascript:)", l.label || l.selector));
    (n.requests ?? []).filter((r) => r.status >= 400).slice(0, 8).forEach((r) => add(`HTTP ${r.status} on ${r.type}`, r.url));
    (n.failed ?? []).filter((r) => !/ERR_ABORTED/.test(r.error ?? "")).slice(0, 5).forEach((r) => add(`Request failed (${r.error})`, r.url));
  }
  const links = ctx.checks.links;
  (links?.broken ?? []).forEach((l) => rows.push({ page: l.from.join(", "), check: `Broken link (${l.status})`, detail: l.url }));
  (links?.brokenAnchors ?? []).forEach((a) => rows.push({ page: a.from, check: "Link to missing #anchor on another page", detail: a.href }));
  if (ctx.checks.files?.soft404) rows.push({ page: "site", check: "Soft 404", detail: `Missing URLs answer HTTP ${ctx.checks.files.missingPageStatus} instead of 404` });
  // The same signal on every page (shared header/footer/modal) is one row, not eight.
  const merged = new Map();
  for (const r of rows) {
    const key = `${r.check}|${r.detail}`;
    if (merged.has(key)) merged.get(key).pages.add(r.page); else merged.set(key, { ...r, pages: new Set([r.page]) });
  }
  return [...merged.values()].map(({ pages: ps, ...r }) => ({ ...r, page: ps.size === ctx.pages.length && ps.size > 1 ? "all pages" : [...ps].join(", ") }));
}

export function bugs(ctx) {
  const list = ctx.findings.filter((f) => f.type === "bug");
  const auto = automatedBugs(ctx);
  return `
    ${list.length ? table(["#", "Severity", "Where", "Bug"], list.map((f) => [num(f), sevBadge(f.severity), esc(f.page ? ctx.pageTitle(f.page) : "Site-wide"), `<b>${esc(f.title)}</b><div class="muted small">${esc(f.evidence)}</div>`]), "reg") : `<p class="muted">The review confirmed no functional bugs.</p>`}
    ${auto.length ? `<h3>Automated detections (${auto.length})</h3><p class="muted small">Raw signals from the capture. Confirmed ones appear above with a number; the rest are worth a look.</p>
      ${table(["Page", "Check", "Detail"], auto.slice(0, 60).map((r) => [esc(r.page), esc(r.check), `<code>${esc(String(r.detail).slice(0, 160))}</code>`]))}` : ""}`;
}

export function register(ctx) {
  return table(["#", "Severity", "Type", "Area", "Where", "Finding", "Confidence"], ctx.findings.map((f) => [
    num(f), sevBadge(f.severity), f.type === "bug" ? pill("bug", "bugpill") : "issue", esc(CATEGORIES[f.category] ?? f.category),
    esc(f.page ? ctx.pageTitle(f.page) : "Site-wide"), esc(f.title), esc(f.confidence),
  ]), "reg");
}

export function pages(ctx) {
  return ctx.pages.map((p, i) => {
    const own = ctx.findings.filter((f) => f.page === p.slug);
    const crops = ctx.annotations.crops.filter((c) => c.page === p.slug);
    const wide = crops.filter((c) => ["desktop", "laptop"].includes(c.viewport));
    const narrow = crops.filter((c) => ["tablet", "mobile"].includes(c.viewport));
    const shown = new Set(crops.flatMap((c) => c.findings));
    const siteWideHere = ctx.findings.filter((f) => f.page === null && shown.has(f.n));
    const shots = crops.length
      ? `${wide.map((c) => `<figure class="shot">${img(ctx, c.file, "wide")}<figcaption>${esc(c.viewport)}${c.opened ? " · after opening" : ""} · markers ${c.findings.map((n) => `#${n}`).join(" ")}</figcaption></figure>`).join("")}
         ${narrow.length ? `<div class="narrow-row">${narrow.map((c) => `<figure class="shot">${img(ctx, c.file, "narrow")}<figcaption>${esc(c.viewport)}${c.opened ? " · opened" : ""} · ${c.findings.map((n) => `#${n}`).join(" ")}</figcaption></figure>`).join("")}</div>` : ""}`
      : `<div class="shots">${img(ctx, `pages/${p.slug}/fold-desktop.png`, "d")}${img(ctx, `pages/${p.slug}/fold-mobile.png`, "m")}</div>`;
    return `<div class="${i ? "page" : ""} pg">
      <div class="meta">${esc(p.url)}</div>
      <h2>${esc(p.title ?? p.slug)}</h2>
      ${p.verdict ? `<div class="verdict">${esc(p.verdict)}</div>` : ""}
      ${scoreBars(p.scores, { groups: false })}
      ${shots}
      ${own.map((f) => findingCard(f, ctx)).join("") || `<p class="muted">No page-specific findings.</p>`}
      ${siteWideHere.length ? `<div class="refs"><div class="refs-h">Site-wide findings marked on this page</div>${siteWideHere.map((f) => `<div class="ref">${num(f)}${esc(f.title)}</div>`).join("")}</div>` : ""}
    </div>`;
  }).join("");
}
