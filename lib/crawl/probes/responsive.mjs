// Layout checks at one viewport: horizontal overflow (and the culprits), tap-target size, tiny text, nav toggle.

export const BREAKPOINTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "laptop", width: 1024, height: 768 },
  { name: "desktop", width: 1440, height: 900 },
];

export function measureLayout() {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  const overflow = sw > vw + 1;
  const offenders = [];
  if (overflow) {
    for (const el of document.body.querySelectorAll("*")) {
      const r = el.getBoundingClientRect();
      if (r.width && r.right > vw + 1 && isVisible(el) && !offenders.some((o) => o.el.contains(el))) {
        offenders.push({ el, right: r.right });
        if (offenders.length >= 6) break;
      }
    }
  }
  // WCAG 2.5.8 (AA) asks for 24x24 CSS px; inline links inside running text are exempt.
  const targets = [...document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[role=button],summary')]
    .filter(isVisible).filter((el) => !(el.tagName === "A" && el.closest("p, li p, td")));
  const small = targets.map((el) => ({ el, r: el.getBoundingClientRect() })).filter(({ r }) => r.width < 24 || r.height < 24);
  let minFont = Infinity;
  let tiny = 0;
  for (const el of document.body.querySelectorAll("*")) {
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    if (!isVisible(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    minFont = Math.min(minFont, fs);
    if (fs < 12) tiny++;
  }
  return {
    width: vw, overflow, overflowBy: Math.max(0, sw - vw),
    offenders: offenders.map((o) => ({ selector: cssPath(o.el), right: Math.round(o.right) })),
    tapTargets: targets.length,
    smallTapTargets: small.length,
    smallTapExamples: small.slice(0, 6).map(({ el, r }) => ({ selector: cssPath(el), label: labelOf(el), w: Math.round(r.width), h: Math.round(r.height) })),
    minFontPx: Number.isFinite(minFont) ? minFont : null,
    tinyTextElements: tiny,
    navToggle: [...document.querySelectorAll('[aria-expanded][aria-controls], button[aria-label*="menu" i], [class*="hamburger"], [class*="menu-toggle"], [class*="nav-toggle"]')].some(isVisible),
  };
}
