// Method & appendix: how the evidence was gathered, what was not checked, skills and versions.
import { esc, table } from "../components.mjs";
import { CRITERIA, SCHEMA_VERSION, SEVERITIES } from "../schema.mjs";

export function method(ctx) {
  const un = ctx.annotations.unresolved ?? [];
  return `
    <p>Each page was rendered in Chromium at 390, 768, 1024 and 1440 px, scrolled top to bottom, and measured: computed colours and type, animations, layout overflow, tap targets, DOM bugs, network requests and response headers. Deterministic scanners ran on the copy and the shipped CSS. A reviewer then judged the screenshots and copy using the open-source skills below and wrote every finding with evidence. Numbered markers on screenshots match the # in the issue register.</p>
    <h3>Severity & confidence</h3>
    ${table(["", "Meaning"], [
      ...Object.values(SEVERITIES).map((s) => [`<span class="sev" style="background:${s.color}">${s.label}</span>`, esc(s.help)]),
      ["certain / likely / hunch", "visible or quoted verbatim / strong signal plus partial support / worth checking (never a Roast)"],
    ])}
    <h3>Scoring</h3>
    <p class="small">Each criterion is scored 0-10 against the rubric. Overall = weighted mean × 10. Weights: ${esc(CRITERIA.map((c) => `${c.label} ${c.weight}`).join(" · "))}.</p>
    <h3>Limits</h3>
    <ul class="tight small">
      <li>"AI tells" mean the page uses defaults that generative tools overproduce. They are not proof of how the site was made, and no finding here is an authorship claim.</li>
      <li>Security is passive: headers, cookies, client code and requests a normal visit produces. No vulnerability scanning was done.</li>
      <li>Backend behaviour is inferred from what the browser can see (endpoints referenced or called). Server code wasn't reviewed.</li>
      <li>Lighthouse numbers, when present, are lab measurements with simulated throttling.</li>
    </ul>
    ${un.length ? `<h3>Markers that couldn't be placed</h3>${table(["#", "Page", "Viewport", "Target"], un.map((u) => [u.n, esc(u.page), esc(u.viewport), `<code>${esc(u.target.selector ?? u.target.text ?? JSON.stringify(u.target.box))}</code>`]))}` : ""}
    <h3>Skills used</h3>
    ${table(["Skill", "Upstream", "Licence"], Object.entries(ctx.lock).map(([n, l]) => [esc(n), `<code>${esc(l.repo)}@${esc(l.sha.slice(0, 10))}</code>`, esc(l.license)]), "skills")}
    <p class="muted small">Report schema v${SCHEMA_VERSION}.</p>`;
}
