// Readability numbers for page copy. English heuristics: treat them as signals, not verdicts.

const syllables = (w) => Math.max(1, (w.toLowerCase().replace(/e$/, "").match(/[aeiouy]+/g) ?? []).length);

export function readability(text) {
  // Only lines that look like prose; nav labels and button text would skew everything.
  const prose = text.split("\n").filter((l) => l.split(/\s+/).length >= 6).join(" ");
  const sentences = prose.split(/(?<=[.!?])\s+/).filter((s) => /\w/.test(s));
  const words = prose.match(/[A-Za-z'’]+/g) ?? [];
  if (!words.length || !sentences.length) return null;
  const wps = words.length / sentences.length;
  const lens = sentences.map((s) => s.split(/\s+/).length);
  const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
  return {
    fleschReadingEase: Math.round(206.835 - 1.015 * wps - 84.6 * (words.reduce((n, w) => n + syllables(w), 0) / words.length)),
    wordsPerSentence: +wps.toFixed(1),
    sentenceLengthStdDev: +sd.toFixed(1), // low = monotone rhythm, a common machine-copy tell
    longSentences: lens.filter((n) => n > 30).length,
    proseWords: words.length,
  };
}
