// Helpers that run INSIDE the page. They are stringified and prepended to each probe, so they
// must be self-contained (no imports, no closures over Node scope).

export function isVisible(el) {
  if (!el || !el.getBoundingClientRect) return false;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return false;
  const s = getComputedStyle(el);
  return s.display !== "none" && s.visibility !== "hidden" && parseFloat(s.opacity) > 0.01;
}

/** Short, mostly-unique CSS path: good enough to re-find an element for annotation. */
export function cssPath(el) {
  if (!el || el.nodeType !== 1) return null;
  const parts = [];
  let node = el;
  while (node && node.nodeType === 1 && parts.length < 4) {
    if (node.id && /^[A-Za-z][\w-]*$/.test(node.id)) { parts.unshift(`#${node.id}`); break; }
    let part = node.tagName.toLowerCase();
    const cls = [...node.classList].filter((c) => /^[A-Za-z][\w-]*$/.test(c) && c.length < 30).slice(0, 2);
    if (cls.length) part += "." + cls.join(".");
    const parent = node.parentElement;
    if (parent) {
      const same = [...parent.children].filter((c) => c.tagName === node.tagName);
      if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
    }
    parts.unshift(part);
    node = parent;
  }
  return parts.join(" > ");
}

export function labelOf(el) {
  return (el.getAttribute("aria-label") || el.innerText || el.value || el.getAttribute("title") || el.getAttribute("alt") || "")
    .trim().replace(/\s+/g, " ").slice(0, 60);
}

export function toHex(c) {
  const m = String(c).match(/rgba?\(([^)]+)\)/);
  if (!m) return c;
  const [r, g, b, a = 1] = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (a === 0) return null;
  const hex = "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
  return a < 1 ? `${hex}@${Math.round(a * 100)}%` : hex;
}

export function topEntries(obj, n) {
  const total = Object.values(obj).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n)
    .map(([value, weight]) => ({ value, share: Math.round((weight / total) * 1000) / 10 }));
}

const HELPERS = [isVisible, cssPath, labelOf, toHex, topEntries].map((f) => f.toString()).join("\n");

/** page.evaluate with the helpers in scope. `fn` must be a plain function taking one JSON arg. */
export function evaluate(page, fn, arg = null) {
  return page.evaluate(`(() => { ${HELPERS}\n return (${fn.toString()})(${JSON.stringify(arg)}); })()`);
}
