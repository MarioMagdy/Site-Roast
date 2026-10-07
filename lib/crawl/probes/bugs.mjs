// Functional problems visible from the DOM: broken images, dead in-page anchors, duplicate IDs,
// unnamed controls, placeholder links, target=_blank without noopener, and a forms inventory.

export function inventoryBugs() {
  const vis = (el) => isVisible(el);
  const brokenImages = [...document.images]
    .filter((i) => (i.currentSrc || i.src) && i.complete && i.naturalWidth === 0 && i.loading !== "lazy")
    .map((i) => ({ selector: cssPath(i), src: (i.currentSrc || i.src).slice(0, 200) }));
  const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
  const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))].slice(0, 20);
  const missingAnchors = [...new Set([...document.querySelectorAll('a[href^="#"]')]
    .map((a) => a.getAttribute("href")).filter((h) => h.length > 1 && !h.startsWith("#!")))]
    .filter((h) => { try { return !document.getElementById(decodeURIComponent(h.slice(1))); } catch { return false; } });
  const placeholderLinks = [...document.querySelectorAll("a")].filter(vis)
    .filter((a) => { const h = a.getAttribute("href"); return h === null || h === "#" || /^javascript:/i.test(h); })
    .filter((a) => !a.getAttribute("role") && !a.hasAttribute("aria-controls"))
    .map((a) => ({ selector: cssPath(a), label: labelOf(a) })).slice(0, 15);
  const unnamed = [...document.querySelectorAll("a[href], button, [role=button]")].filter(vis)
    .filter((el) => !labelOf(el) && !el.querySelector("img[alt]:not([alt=''])") && !el.getAttribute("aria-labelledby"))
    .map((el) => ({ selector: cssPath(el) })).slice(0, 15);
  const blankNoOpener = [...document.querySelectorAll('a[target="_blank"]')]
    .filter((a) => !/noopener|noreferrer/i.test(a.rel)).map((a) => ({ selector: cssPath(a), href: a.href.slice(0, 120) })).slice(0, 15);
  const forms = [...document.forms].map((f) => ({
    selector: cssPath(f),
    visible: vis(f),
    action: f.getAttribute("action"),
    method: (f.getAttribute("method") || "get").toLowerCase(),
    fields: [...f.elements].filter((e) => e.name && e.type !== "hidden" && e.type !== "submit").reduce((acc, e) => {
      if (acc.some((x) => x.name === e.name)) return acc; // radio groups
      acc.push({ name: e.name, type: e.type, required: e.required,
        labelled: !!(e.labels?.length || e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || e.closest("fieldset")?.querySelector("legend")) });
      return acc;
    }, []),
  }));
  return {
    brokenImages, dupIds, missingAnchors, placeholderLinks, unnamedControls: unnamed, blankNoOpener, forms,
    iframes: [...document.querySelectorAll("iframe")].map((f) => f.src.slice(0, 200)).filter(Boolean),
    ids: ids.slice(0, 3000),
  };
}
