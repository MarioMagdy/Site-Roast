// In-page overlay: numbered outlines drawn over the live DOM, so screenshots line up exactly.
// Runs inside the page (stringified): keep self-contained.
//
// Layout: every mark gets an outline and a numbered badge on its top-left corner. Optional notes
// are placed at whichever of above / right / below / left overlaps the fewest other badges, notes
// and outlines (and stays on the page), so dense areas stay readable.

export function drawOverlay({ marks, fixed }) {
  document.getElementById("__site_roast_overlay")?.remove();
  const doc = document.documentElement;
  const W = fixed ? innerWidth : doc.scrollWidth;
  const H = fixed ? innerHeight : doc.scrollHeight;
  const layer = document.createElement("div");
  layer.id = "__site_roast_overlay";
  Object.assign(layer.style, {
    position: fixed ? "fixed" : "absolute", left: "0", top: "0", zIndex: "2147483647", pointerEvents: "none",
    width: `${W}px`, height: `${H}px`,
  });
  const area = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  const boxes = marks.map((m) => {
    const pad = m.shape === "circle" ? 12 : 7;
    return { x: m.x - pad, y: m.y - pad, w: m.w + pad * 2, h: m.h + pad * 2 };
  });
  const badges = boxes.map((b) => ({ x: Math.max(2, b.x - 14), y: Math.max(2, b.y - 14), w: 28, h: 28 }));
  const placed = [...badges];

  marks.forEach((m, i) => {
    const b = boxes[i];
    const outline = document.createElement("div");
    Object.assign(outline.style, {
      position: "absolute", boxSizing: "border-box", left: `${b.x}px`, top: `${b.y}px`, width: `${b.w}px`, height: `${b.h}px`,
      border: `3px solid ${m.color}`, borderRadius: m.shape === "circle" ? "50%" : "8px",
      boxShadow: "0 0 0 2px rgba(255,255,255,.9), 0 0 0 5px rgba(0,0,0,.08)",
    });
    layer.append(outline);
  });

  marks.forEach((m, i) => {
    if (!m.note) return;
    const b = boxes[i];
    const w = Math.round(m.note.length * 6.8 + 18);
    const h = 24;
    const candidates = [
      { x: b.x + 18, y: b.y - h - 4 },          // above, right of the badge
      { x: b.x + b.w + 8, y: b.y },             // right
      { x: b.x + 18, y: b.y + b.h + 6 },        // below
      { x: b.x - w - 8, y: b.y },               // left
    ].map((c, order) => {
      const r = { ...c, w, h };
      const off = r.x < 2 || r.y < 2 || r.x + w > W - 2 || r.y + h > H - 2;
      const hitsLabels = placed.reduce((n, p) => n + area(r, p), 0);
      const hitsBoxes = boxes.reduce((n, o, j) => n + (j === i ? 0 : area(r, o)), 0);
      return { r, score: (off ? 1e9 : 0) + hitsLabels * 10 + hitsBoxes + order };
    }).sort((a, z) => a.score - z.score);
    const r = candidates[0].r;
    placed.push(r);
    const note = document.createElement("div");
    note.textContent = m.note;
    Object.assign(note.style, {
      position: "absolute", left: `${r.x}px`, top: `${r.y}px`, height: `${h}px`, maxWidth: `${w + 40}px`,
      padding: "0 8px", boxSizing: "border-box", borderRadius: "4px", background: m.color, color: "#fff",
      font: "600 12px/24px Arial, sans-serif", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      boxShadow: "0 1px 4px rgba(0,0,0,.3)",
    });
    layer.append(note);
  });

  // Badges last so they sit on top of everything.
  marks.forEach((m, i) => {
    const p = badges[i];
    const badge = document.createElement("div");
    badge.textContent = String(m.n);
    Object.assign(badge.style, {
      position: "absolute", left: `${p.x}px`, top: `${p.y}px`, minWidth: "28px", height: "28px", padding: "0 6px",
      boxSizing: "border-box", borderRadius: "14px", background: m.color, color: "#fff",
      font: "700 15px/28px Arial, sans-serif", textAlign: "center", boxShadow: "0 0 0 2px #fff, 0 2px 6px rgba(0,0,0,.35)",
    });
    layer.append(badge);
  });

  doc.append(layer);
  return { width: doc.scrollWidth, height: doc.scrollHeight };
}
