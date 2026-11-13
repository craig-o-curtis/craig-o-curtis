// The hero's name in the same blocky half-block lettering as run-cv's RUN-CV logo (which comes from
// ink-big-text's `tiny` font): each letter is two terminal rows of █ ▀ ▄, so four pixel rows of square
// pixels. Only the letters the profile needs are here; add more as `[top row, bottom row]` pairs.

const GLYPHS: Record<string, [string, string]> = {
  A: ["▄▀█", "█▀█"],
  C: ["█▀▀", "█▄▄"],
  G: ["█▀▀", "█▄█"],
  I: ["█", "█"],
  R: ["█▀█", "█▀▄"],
  S: ["█▀▀", "▄▄█"],
  T: ["▀█▀", " █ "],
  U: ["█ █", "█▄█"],
  "-": ["▄▄", "  "],
  " ": [" ", " "],
};

/** Pixel rows (4 of them, true = lit) for `text`, letters one pixel apart as the terminal renders them. */
export function tinyBitmap(text: string): boolean[][] {
  const rows: string[] = ["", ""];
  [...text.toUpperCase()].forEach((ch, i) => {
    const g = GLYPHS[ch];
    if (!g) throw new Error(`no tiny glyph for ${JSON.stringify(ch)}; add it to scripts/lib/tiny.ts`);
    const sep = i === 0 ? "" : " ";
    rows[0] += sep + g[0];
    rows[1] += sep + g[1];
  });
  return rows.flatMap((row) => [[...row].map((c) => c === "█" || c === "▀"), [...row].map((c) => c === "█" || c === "▄")]);
}
