// In-page measurement for one candidate element (runs via elementHandle.evaluate; self-contained).
// Returns null when the element isn't really visible to a visitor (zero size, transparent ancestor,
// aria-hidden/inert ancestor, or parked off-screen like a closed off-canvas menu). For text targets
// the box is tightened to the matched words. Coordinates: document space, or viewport space when
// `viewportSpace` (targets inside an opened modal).
export function measureCandidate(el, { text, viewportSpace }) {
  for (let n = el, opacity = 1; n && n.nodeType === 1; n = n.parentElement) {
    const s = getComputedStyle(n);
    opacity *= parseFloat(s.opacity);
    if (s.visibility === "hidden" || s.display === "none" || opacity < 0.05) return null;
    if (!viewportSpace && (n.getAttribute("aria-hidden") === "true" || n.hasAttribute("inert"))) return null;
  }
  let fixed = false;
  for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
    const p = getComputedStyle(n).position;
    if (p === "fixed" || p === "sticky") { fixed = true; break; }
  }
  // Fixed/sticky things (headers, floating buttons) sit where they are at the top of the page in a
  // full-page screenshot, so measure them there.
  if (fixed && !viewportSpace) scrollTo({ top: 0, left: 0, behavior: "instant" });
  if (viewportSpace) el.scrollIntoView({ block: "center", behavior: "instant" });

  let rect = el.getBoundingClientRect();
  if (text) {
    const needle = text.toLowerCase().replace(/\s+/g, " ").trim();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const hay = node.textContent.toLowerCase();
      const i = hay.indexOf(needle);
      if (i === -1) continue;
      const range = document.createRange();
      range.setStart(node, i);
      range.setEnd(node, Math.min(node.textContent.length, i + needle.length));
      const r = range.getBoundingClientRect();
      if (r.width && r.height) rect = r;
      break;
    }
  }
  if (!rect.width || !rect.height) return null;
  const vw = document.documentElement.clientWidth;
  if (rect.right <= 0 || rect.left >= vw) return null; // parked off-canvas
  const sx = viewportSpace ? 0 : scrollX;
  const sy = viewportSpace ? 0 : scrollY;
  if (!viewportSpace && rect.bottom + sy <= 0) return null;
  return { x: rect.left + sx, y: rect.top + sy, w: rect.width, h: rect.height, fixed };
}
