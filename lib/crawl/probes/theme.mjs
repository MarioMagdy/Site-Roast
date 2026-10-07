// Visual system inventory from computed styles: palette (weighted by area / text), type families,
// sizes and weights, radii, shadows, gradients, theme toggles.

export function inventoryTheme() {
  const els = [...document.body.querySelectorAll("*")].filter(isVisible).slice(0, 4000);
  const bump = (obj, k, w) => { if (k) obj[k] = (obj[k] ?? 0) + w; };
  const bg = {}, fg = {}, border = {}, fonts = {}, sizes = {}, weights = {}, radii = {}, shadows = {};
  let gradients = 0;
  const vpArea = innerWidth * innerHeight;
  bump(bg, toHex(getComputedStyle(document.body).backgroundColor) || toHex(getComputedStyle(document.documentElement).backgroundColor), vpArea);
  for (const el of els) {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    bump(bg, toHex(s.backgroundColor), Math.min(r.width * r.height, vpArea));
    if (s.backgroundImage.includes("gradient")) gradients++;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim().length;
    if (own) {
      bump(fg, toHex(s.color), own);
      bump(fonts, s.fontFamily.split(",")[0].replace(/["']/g, "").trim(), own);
      bump(sizes, `${Math.round(parseFloat(s.fontSize))}px`, own);
      bump(weights, s.fontWeight, own);
    }
    if (parseFloat(s.borderTopWidth) > 0 && s.borderTopStyle !== "none") bump(border, toHex(s.borderTopColor), 1);
    if (s.borderRadius !== "0px") bump(radii, s.borderRadius, 1);
    if (s.boxShadow !== "none") bump(shadows, s.boxShadow, 1);
  }
  return {
    background: topEntries(bg, 8),
    text: topEntries(fg, 8),
    border: topEntries(border, 5),
    fonts: topEntries(fonts, 6),
    sizes: Object.keys(sizes).sort((a, b) => parseFloat(a) - parseFloat(b)),
    weights: topEntries(weights, 6),
    radii: topEntries(radii, 8),
    distinctColors: new Set([...Object.keys(bg), ...Object.keys(fg), ...Object.keys(border)]).size,
    distinctShadows: Object.keys(shadows).length,
    gradients,
    colorSchemeMeta: document.querySelector('meta[name="color-scheme"]')?.content ?? null,
    themeToggle: (() => {
      const el = document.querySelector('[aria-label*="theme" i], [aria-label*="dark" i], [title*="theme" i], [class*="theme-toggle"], [class*="dark-mode"], [data-theme-toggle]');
      return el && isVisible(el) ? cssPath(el) : null;
    })(),
    bodyBg: toHex(getComputedStyle(document.body).backgroundColor),
    bodyColor: toHex(getComputedStyle(document.body).color),
  };
}
