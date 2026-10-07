// Section registry: fixed order from schema.SECTIONS, a renderer per id, and the applicability rule.
import { SECTIONS } from "../schema.mjs";
import { automatedBugs, bugs, pages, register } from "./issues.mjs";
import { content, design } from "./judgment.mjs";
import { method } from "./method.mjs";
import { scorecard, summary } from "./overview.mjs";
import { accessibility, i18n, motion, performance, responsive, security, seo, themes } from "./technical.mjs";

const RENDER = { scorecard, summary, design, content, bugs, register, pages, motion, themes, responsive, accessibility, performance, security, seo, i18n, method };

function applicability(ctx, section) {
  const declared = ctx.roast.sections[section.id];
  if (declared?.status === "not-applicable") return { applies: false, reason: declared.reason ?? "marked not applicable by the reviewer" };
  if (section.id === "bugs") {
    const any = ctx.findings.some((f) => f.type === "bug") || automatedBugs(ctx).length > 0;
    return any ? { applies: true } : { applies: false, reason: "no functional bugs found by the review or automated checks" };
  }
  if (section.id === "i18n") {
    const multi = (ctx.profile?.languages?.length ?? 0) > 1 || ctx.profile?.rtl || ctx.findings.some((f) => f.category === "i18n");
    return multi ? { applies: true } : { applies: false, reason: "single-language site" };
  }
  return { applies: true };
}

export function plan(ctx) {
  return SECTIONS.map((s) => {
    const a = applicability(ctx, s);
    const count = s.categories ? ctx.findings.filter((f) => s.categories.includes(f.category)).length
      : s.id === "bugs" ? ctx.findings.filter((f) => f.type === "bug").length
      : s.id === "register" || s.id === "pages" ? ctx.findings.length : 0;
    return { ...s, ...a, count };
  });
}

export function renderSection(ctx, section, contents) {
  return RENDER[section.id](ctx, { contents });
}
