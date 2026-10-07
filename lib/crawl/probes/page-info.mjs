// Content + structure basics: title, meta, headings, CTAs, links, typography of key elements.

export function pageInfo() {
  const style = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const s = getComputedStyle(el);
    return { font: s.fontFamily, size: s.fontSize, weight: s.fontWeight, color: s.color, bg: s.backgroundColor };
  };
  const imgs = [...document.images];
  const main = document.querySelector("main") ?? document.body;
  return {
    title: document.title,
    metaDescription: document.querySelector('meta[name="description"]')?.content ?? null,
    ogImage: document.querySelector('meta[property="og:image"]')?.content ?? null,
    canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
    hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((l) => l.hreflang),
    jsonLd: document.querySelectorAll('script[type="application/ld+json"]').length,
    viewportMeta: document.querySelector('meta[name="viewport"]')?.content ?? null,
    lang: document.documentElement.lang || null,
    dir: document.documentElement.dir || getComputedStyle(document.documentElement).direction,
    generator: document.querySelector('meta[name="generator"]')?.content ?? null,
    headings: [...document.querySelectorAll("h1,h2,h3")].filter(isVisible).map((h) => `${h.tagName} ${h.innerText.trim().replace(/\s+/g, " ")}`),
    h1Count: [...document.querySelectorAll("h1")].filter(isVisible).length,
    ctas: [...document.querySelectorAll("a,button")].filter(isVisible)
      .filter((e) => e.tagName === "BUTTON" || /btn|button|cta/i.test(`${e.className} ${e.getAttribute("role")}`))
      .map((e) => e.innerText.trim()).filter(Boolean).slice(0, 25),
    links: [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.href))],
    images: imgs.length,
    imagesMissingAlt: imgs.filter((i) => !i.hasAttribute("alt")).length,
    typography: { body: style("body"), h1: style("h1"), h2: style("h2"), button: style("button, a[class*=btn]") },
    text: main.innerText,
    footerText: document.querySelector("footer")?.innerText ?? "",
    inlineCss: [...document.querySelectorAll("style")].map((s) => s.textContent).join("\n"),
    inlineScripts: [...document.querySelectorAll("script:not([src])")].map((s) => s.textContent).join("\n").slice(0, 500000),
    markers: {
      next: !!document.querySelector("#__next, script#__NEXT_DATA__") || !!document.querySelector('script[src*="/_next/"]'),
      nuxt: !!document.querySelector("#__nuxt, #__layout"),
      astro: !!document.querySelector("astro-island, [data-astro-cid]") || /astro/i.test(document.querySelector('meta[name="generator"]')?.content ?? ""),
      wordpress: !!document.querySelector('link[href*="wp-content"], script[src*="wp-content"], script[src*="wp-includes"]'),
      webflow: !!document.querySelector("html[data-wf-site], html[data-wf-page]"),
      framer: !!document.querySelector("[data-framer-name], [data-framer-component-type]"),
      wix: !!document.querySelector('meta[name="generator"][content*="Wix"]'),
      squarespace: !!document.querySelector('script[src*="squarespace"]'),
      shopify: !!(window.Shopify || document.querySelector('script[src*="cdn.shopify.com"]')),
      react: !!document.querySelector("[data-reactroot]") || !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.size,
      tailwind: /\b(?:px|py|mt|mb|text|bg)-[\w[\]]+/.test(document.body.className + [...document.querySelectorAll("div")].slice(0, 50).map((d) => d.className).join(" ")),
    },
    height: document.documentElement.scrollHeight,
  };
}
