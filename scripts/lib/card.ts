// A project card: name, version pill, two-line tagline, three stats and a body that is either an npm
// downloads sparkline that draws itself in, or a short typed chat exchange.
//
// As in hero.ts, the final frame is the default and animations only run *from* hidden, so a viewer with
// reduced motion sees a complete, still card.

import { ADVANCE, esc, FONT, type Palette, REDUCED_MOTION } from "./theme.ts";

export const CARD_W = 410;
export const CARD_H = 220;
const PAD = 20;
const TAGLINE_SIZE = 12.5;

// The longest tagline line that fits between the paddings at TAGLINE_SIZE.
export const TAGLINE_MAX = Math.floor((CARD_W - 2 * PAD) / (TAGLINE_SIZE * ADVANCE));

export interface Stat {
  value: string;
  label: string;
}

export type CardBody =
  | { kind: "sparkline"; series: number[]; caption: string }
  | { kind: "chat"; ask: string; call: string; answer: string; caption: string };

export interface CardInput {
  title: string;
  pill: string;
  tagline: [string, string];
  stats: Stat[];
  body: CardBody;
  footer: string;
}

const SPARK = { x: PAD, y: 150, w: CARD_W - 2 * PAD, h: 40 };

/** Points for a series scaled into the sparkline box; a flat series sits on the baseline. */
export function sparkPoints(series: number[], box = SPARK): Array<[number, number]> {
  const max = Math.max(...series, 0);
  const step = series.length > 1 ? box.w / (series.length - 1) : 0;
  return series.map((value, i) => {
    const x = box.x + i * step;
    const y = max === 0 ? box.y + box.h : box.y + box.h - (value / max) * box.h;
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  });
}

function sparkline(series: number[], p: Palette): string {
  const pts = sparkPoints(series.length > 1 ? series : [0, ...series, 0]);
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const base = SPARK.y + SPARK.h;
  const area = `${line} L${pts.at(-1)?.[0]} ${base} L${pts[0][0]} ${base} Z`;
  const [lx, ly] = pts.at(-1) ?? [0, 0];
  return `<path class="area" d="${area}" fill="url(#fade)"/>
  <path class="spark" d="${line}" pathLength="1" fill="none" stroke="${p.text}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  <circle class="pulse motion-only" cx="${lx}" cy="${ly}" r="3" fill="none" stroke="${p.accent}"/>
  <circle class="dot" cx="${lx}" cy="${ly}" r="3" fill="${p.accent}"/>`;
}

function chat(body: Extract<CardBody, { kind: "chat" }>, p: Palette): string {
  const size = 12.5;
  const askX = PAD + 5 * size * ADVANCE;
  const askW = body.ask.length * size * ADVANCE;
  return `<text x="${PAD}" y="114" font-size="${size}" fill="${p.dim}">ask›</text>
  <text x="${askX}" y="114" font-size="${size}" fill="${p.text}" textLength="${askW}" lengthAdjust="spacing">${esc(body.ask)}</text>
  <rect class="typing motion-only" x="${askX}" y="98" width="${askW + 10}" height="24" fill="${p.bg}"/>
  <text class="r1" x="${PAD}" y="142" font-size="${size}" fill="${p.dim}">  → <tspan fill="${p.accent}">${esc(body.call)}</tspan></text>
  <text class="r2" x="${PAD}" y="166" font-size="${size}" fill="${p.text}">  ${esc(body.answer)}</text>`;
}

export function renderCard(card: CardInput, p: Palette): string {
  for (const line of card.tagline) {
    if (line.length > TAGLINE_MAX) throw new Error(`tagline too long for the card (${line.length} > ${TAGLINE_MAX}): ${line}`);
  }
  const pillW = card.pill.length * 12 * ADVANCE + 16;
  const colW = (CARD_W - 2 * PAD) / 3;
  const stats = card.stats
    .slice(0, 3)
    .map(
      (s, i) => `<text x="${PAD + i * colW}" y="112" font-size="19" font-weight="700" fill="${p.text}">${esc(s.value)}</text>
  <text x="${PAD + i * colW}" y="130" font-size="11" fill="${p.dim}">${esc(s.label)}</text>`,
    )
    .join("\n  ");
  const askChars = card.body.kind === "chat" ? card.body.ask.length : 1;
  const askW = askChars * 12.5 * ADVANCE;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${CARD_H}" viewBox="0 0 ${CARD_W} ${CARD_H}" role="img" aria-labelledby="title">
<title id="title">${esc(`${card.title} ${card.pill}: ${card.tagline.join(" ")} ${card.stats.map((s) => `${s.value} ${s.label}`).join(", ")}.`)}</title>
<style>
  text { font-family: ${FONT}; white-space: pre; }
  @keyframes appear { from { opacity: 0; } to { opacity: 1; } }
  @keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  @keyframes pulse { from { r: 3px; opacity: .9; } to { r: 11px; opacity: 0; } }
  @keyframes type { from { transform: translateX(0); } to { transform: translateX(${askW + 10}px); } }
  .spark { stroke-dasharray: 1; animation: draw 2.4s ease-out .4s both; }
  .area { animation: appear .8s ease-out 2.2s both; }
  .dot { animation: appear .2s linear 2.7s both; }
  .pulse { animation: pulse 1.8s ease-out 2.9s infinite both; }
  .typing { animation: type ${(askChars * 0.06).toFixed(2)}s steps(${askChars}) .6s both; }
  .r1 { animation: appear .3s ease-out ${(0.9 + askChars * 0.06).toFixed(2)}s both; }
  .r2 { animation: appear .3s ease-out ${(1.6 + askChars * 0.06).toFixed(2)}s both; }
  ${REDUCED_MOTION}
</style>
<defs>
  <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.text}" stop-opacity=".28"/><stop offset="1" stop-color="${p.text}" stop-opacity="0"/></linearGradient>
</defs>
<rect x="1" y="1" width="${CARD_W - 2}" height="${CARD_H - 2}" rx="10" fill="${p.bg}" stroke="${p.border}" stroke-width="1.5"/>
<text x="${PAD}" y="38" font-size="20" font-weight="700" fill="${p.text}"><tspan fill="${p.dim}">▸ </tspan>${esc(card.title)}</text>
<rect x="${CARD_W - PAD - pillW}" y="22" width="${pillW}" height="22" rx="11" fill="${p.faint}" stroke="${p.border}"/>
<text x="${CARD_W - PAD - pillW / 2}" y="37.5" font-size="12" fill="${p.text}" text-anchor="middle">${esc(card.pill)}</text>
<text x="${PAD}" y="62" font-size="${TAGLINE_SIZE}" fill="${p.dim}">${esc(card.tagline[0])}</text>
<text x="${PAD}" y="79" font-size="${TAGLINE_SIZE}" fill="${p.dim}">${esc(card.tagline[1])}</text>
${card.body.kind === "chat" ? "" : stats}
${card.body.kind === "sparkline" ? sparkline(card.body.series, p) : chat(card.body, p)}
<text x="${PAD}" y="${CARD_H - 8}" font-size="10.5" fill="${p.dim}" opacity=".85">${esc(card.body.caption)}</text>
<text x="${CARD_W - PAD}" y="${CARD_H - 8}" font-size="10.5" fill="${p.dim}" opacity=".85" text-anchor="end">${esc(card.footer)}</text>
</svg>
`;
}
