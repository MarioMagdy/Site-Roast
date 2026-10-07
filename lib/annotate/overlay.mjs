// In-page overlay: numbered outlines drawn over the live DOM, so screenshots line up exactly.
// Runs inside the page (stringified): keep self-contained.

export function drawOverlay({ marks, fixed }) {
  document.getElementById("__site_roast_overlay")?.remove();
  const doc = document.documentElement;
  const layer = document.createElement("div");
  layer.id = "__site_roast_overlay";
  Object.assign(layer.style, {
    position: fixed ? "fixed" : "absolute", left: "0", top: "0", zIndex: "2147483647", pointerEvents: "none",
    width: fixed ? "100vw" : `${doc.scrollWidth}px`, height: fixed ? "100vh" : `${doc.scrollHeight}px`,
  });
  for (const m of marks) {
    const pad = m.shape === "circle" ? 12 : 7;
    const box = document.createElement("div");
    Object.assign(box.style, {
      position: "absolute", boxSizing: "border-box",
      left: `${m.x - pad}px`, top: `${m.y - pad}px`, width: `${m.w + pad * 2}px`, height: `${m.h + pad * 2}px`,
      border: `3px solid ${m.color}`, borderRadius: m.shape === "circle" ? "50%" : "8px",
      boxShadow: "0 0 0 2px rgba(255,255,255,.9), 0 0 0 5px rgba(0,0,0,.08)",
    });
    const badge = document.createElement("div");
    badge.textContent = String(m.n);
    Object.assign(badge.style, {
      position: "absolute", left: `${Math.max(2, m.x - pad - 14)}px`, top: `${Math.max(2, m.y - pad - 14)}px`,
      minWidth: "28px", height: "28px", padding: "0 6px", boxSizing: "border-box", borderRadius: "14px",
      background: m.color, color: "#fff", font: "700 15px/28px Arial, sans-serif", textAlign: "center",
      boxShadow: "0 0 0 2px #fff, 0 2px 6px rgba(0,0,0,.35)",
    });
    layer.append(box, badge);
    if (m.note) {
      const note = document.createElement("div");
      note.textContent = m.note;
      // Prefer the right of the box (covers less content); fall back to above it.
      const est = m.note.length * 7 + 18;
      const width = fixed ? innerWidth : doc.scrollWidth;
      const right = m.x + m.w + pad + 8;
      const beside = right + est < width - 4;
      Object.assign(note.style, {
        position: "absolute",
        left: `${beside ? right : Math.max(2, m.x - pad + 18)}px`,
        top: `${beside ? Math.max(2, m.y - pad) : Math.max(2, m.y - pad - 13)}px`,
        maxWidth: "320px", padding: "3px 8px", borderRadius: "4px", background: m.color, color: "#fff",
        font: "600 12px/18px Arial, sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      });
      layer.append(note);
    }
  }
  doc.append(layer);
  return { width: doc.scrollWidth, height: doc.scrollHeight };
}
