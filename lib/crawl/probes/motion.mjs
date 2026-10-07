// Motion inventory: running animations, transitions on interactive elements, animation libraries,
// autoplay video, and scroll-reveal content (hidden until you scroll).

export function inventoryMotion() {
  const anims = document.getAnimations().map((a) => {
    const t = a.effect?.getTiming?.() ?? {};
    return {
      kind: a.constructor.name,
      name: a.animationName || a.transitionProperty || "",
      duration: typeof t.duration === "number" ? Math.round(t.duration) : null,
      infinite: t.iterations === Infinity,
      target: a.effect?.target ? cssPath(a.effect.target) : null,
      state: a.playState,
    };
  });
  const w = window;
  const libs = [];
  const has = (cond, name) => cond && libs.push(name);
  has(w.gsap || w.TweenMax, "GSAP");
  has(w.ScrollTrigger, "GSAP ScrollTrigger");
  has(w.AOS || document.querySelector("[data-aos]"), "AOS");
  has(w.Lenis || document.documentElement.classList.contains("lenis"), "Lenis smooth scroll");
  has(document.querySelector("[data-scroll-container]"), "Locomotive Scroll");
  has(w.lottie || document.querySelector("lottie-player, dotlottie-player"), "Lottie");
  has(w.Swiper || document.querySelector(".swiper"), "Swiper carousel");
  has(w.Splide || document.querySelector(".splide"), "Splide carousel");
  has(document.querySelector("[data-framer-appear-id]"), "Framer appear effects");
  has(w.THREE, "Three.js");
  has(document.querySelector("canvas"), "canvas");
  has(document.querySelector("[style*='will-change']"), "will-change hints");
  const interactive = [...document.querySelectorAll("a,button")].filter(isVisible).slice(0, 400);
  const withTransition = interactive.filter((el) =>
    getComputedStyle(el).transitionDuration.split(",").some((d) => parseFloat(d) > 0)).length;
  const videos = [...document.querySelectorAll("video")].map((v) => ({
    autoplay: v.autoplay, muted: v.muted, loop: v.loop, controls: v.controls, selector: cssPath(v),
  }));
  // Mark content that is invisible below the fold; the capture scrolls, then checks what appeared.
  let hiddenBelowFold = 0;
  for (const el of document.body.querySelectorAll("section *, main *, [data-aos], [class*='reveal'], [class*='fade']")) {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight || !r.width || !el.innerText?.trim()) continue;
    const s = getComputedStyle(el);
    if (s.display === "none") continue;
    if (parseFloat(s.opacity) < 0.05 || s.visibility === "hidden") {
      if (!el.parentElement?.closest("[data-sr-hidden]")) { el.setAttribute("data-sr-hidden", ""); hiddenBelowFold++; }
    }
  }
  return {
    animations: anims.length,
    running: anims.filter((a) => a.state === "running").length,
    infinite: anims.filter((a) => a.infinite).length,
    samples: anims.slice(0, 12),
    libraries: libs,
    interactiveWithTransition: withTransition,
    interactiveTotal: interactive.length,
    videos,
    hiddenBelowFold,
  };
}

/** After scrolling: how many of the marked elements became visible (= scroll-triggered reveals). */
export function revealedAfterScroll() {
  const marked = [...document.querySelectorAll("[data-sr-hidden]")];
  const revealed = marked.filter((el) => parseFloat(getComputedStyle(el).opacity) > 0.5);
  return {
    revealed: revealed.length,
    stillHidden: marked.length - revealed.length,
    examples: revealed.slice(0, 5).map((el) => cssPath(el)),
  };
}

export function runningAnimations() {
  return document.getAnimations().filter((a) => a.playState === "running").length;
}
