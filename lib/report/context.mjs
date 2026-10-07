// Everything a section needs: the normalized roast plus the evidence files from the run folder.
import path from "node:path";
import { readJSON } from "../paths.mjs";

export function buildContext(run, roast, { lock = {} } = {}) {
  const pages = roast.pages.map((p) => {
    const j = (name) => readJSON(path.join(run, "pages", p.slug, name), null);
    return {
      ...p,
      meta: j("meta.json") ?? {}, scan: j("scan.json") ?? {}, motion: j("motion.json"), theme: j("theme.json"),
      responsive: j("responsive.json"), bugs: j("bugs.json"), network: j("network.json"),
    };
  });
  const bySlug = new Map(pages.map((p) => [p.slug, p]));
  return {
    run, roast, lock, pages,
    findings: roast.findings,
    checks: readJSON(path.join(run, "site", "checks.json"), {}),
    profile: readJSON(path.join(run, "site", "profile.json"), null),
    annotations: readJSON(path.join(run, "annotations.json"), { crops: [], byFinding: {}, unresolved: [] }),
    page: (slug) => bySlug.get(slug),
    pageTitle: (slug) => bySlug.get(slug)?.title ?? slug,
  };
}
