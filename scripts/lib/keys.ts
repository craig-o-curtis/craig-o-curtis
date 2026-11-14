// The links under the hero as a 3270 terminal's function-key row: F1 PORTFOLIO, F2 LINKEDIN, and so on.
// An SVG behind <img> can hold only one link, so each key is its own small SVG, all the same size so the
// row lines up, and the README wraps each in its own <a>. The keys' brackets lock on one after another.

import { ADVANCE, esc, FONT, FRAME_CSS, frame, type Palette, REDUCED_MOTION } from "./theme.ts";

export interface Key {
  /** File name part: assets/key-<slug>-<theme>.svg. */
  slug: string;
  label: string;
  url: string;
  /** What the key opens, for its alt text. */
  alt: string;
}

const SIZE = 13;
const H = 34;
const GUTTER = 4;
const PAD = 8;

/** One width for every key in the row, from the longest label. */
export function keyWidth(keys: readonly Key[]): number {
  const longest = Math.max(...keys.map((k) => k.label.length));
  return Math.ceil(PAD + 3 * SIZE * ADVANCE + 14 + longest * SIZE * ADVANCE + PAD + 6);
}

export function renderKey(key: Key, n: number, width: number, p: Palette): string {
  const W = width + 2 * GUTTER;
  const HH = H + 2 * GUTTER;
  const fk = `F${n}`;
  const capW = 3 * SIZE * ADVANCE + 6;
  const labelX = PAD + capW + 8;
  const labelW = key.label.length * SIZE * ADVANCE;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${HH}" viewBox="0 0 ${W} ${HH}" role="img" aria-labelledby="title">
<title id="title">${esc(`${fk} ${key.label}: ${key.alt}`)}</title>
<style>
  text { font-family: ${FONT}; white-space: pre; }
  ${FRAME_CSS}
  .lock { animation-delay: ${(0.15 + n * 0.18).toFixed(2)}s; }
  ${REDUCED_MOTION}
</style>
<g transform="translate(${GUTTER} ${GUTTER})">
  <rect width="${width}" height="${H}" fill="${p.bg}"/>
  <rect x="${PAD}" y="7" width="${capW.toFixed(1)}" height="${H - 14}" fill="${p.text}"/>
  <text x="${(PAD + capW / 2).toFixed(1)}" y="${H / 2 + 4.5}" font-size="${SIZE}" font-weight="700" fill="${p.bg}" text-anchor="middle">${fk}</text>
  <text x="${labelX.toFixed(1)}" y="${H / 2 + 4.5}" font-size="${SIZE}" font-weight="700" fill="${p.text}" letter-spacing="0" textLength="${labelW.toFixed(1)}" lengthAdjust="spacingAndGlyphs">${esc(key.label)}</text>
</g>
${frame(p, { w: width, h: H, gutter: GUTTER, arm: 7, weight: 2, border: 1 })}
</svg>
`;
}

/** The README row: one linked, themed image per key, each a quarter of the column. */
export function keysMarkdown(keys: readonly Key[]): string {
  const pct = Math.floor(100 / keys.length) - 1;
  const imgs = keys.map(
    (k, i) =>
      `<a href="${k.url}"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/key-${k.slug}-dark.svg"><img src="assets/key-${k.slug}-light.svg" width="${pct}%" alt="F${i + 1} ${esc(k.label)}: ${esc(k.alt)}"></picture></a>`,
  );
  return `<p align="center">\n  ${imgs.join("\n  ")}\n</p>`;
}
