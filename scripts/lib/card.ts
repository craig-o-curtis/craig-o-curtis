// A project card: name, pill, two-line tagline, up to three stats and a body, one of:
//  - matrix:   a test matrix whose cells light up column by column, then a cursor keeps sweeping it;
//  - timeline: every release on a month axis, majors labelled, ticks landing left to right;
//  - chat:     a short typed exchange with a docs assistant;
//  - scene:    a small night sky (aurora, stars, Helsinki across the water) over a list of what the
//              sites draw on the GPU.
//
// As in hero.ts, the final frame is the default and animations only run *from* hidden, so a viewer with
// reduced motion sees a complete, still card.

import { raven } from "./raven.ts";
import { HELSINKI } from "./skyline.ts";
import { ADVANCE, esc, FONT, FRAME_CSS, frame, type Palette, REDUCED_MOTION } from "./theme.ts";

export const CARD_W = 410;
export const CARD_H = 220;
const GUTTER = 6;
const PAD = 20;
const INNER = CARD_W - 2 * PAD;
const TAGLINE_SIZE = 12.5;
const FOOT_SIZE = 10.5;

// The longest tagline line that fits between the paddings at TAGLINE_SIZE.
export const TAGLINE_MAX = Math.floor(INNER / (TAGLINE_SIZE * ADVANCE));

export interface Stat {
  value: string;
  label: string;
}

export interface Tick {
  date: string;
  /** Set on a major release (`x.0.0`), which gets a tall tick and a `v<major>` label. */
  major?: number;
}

export type CardBody =
  | { kind: "matrix"; rows: string[]; cols: string[]; caption: string }
  | { kind: "timeline"; releases: Tick[]; caption: string }
  | { kind: "chat"; ask: string; call: string; answer: string; caption: string }
  | { kind: "scene"; rows: Array<[string, string]>; caption: string };

export interface CardInput {
  title: string;
  pill: string;
  tagline: [string, string];
  stats: Stat[];
  body: CardBody;
  footer: string;
}

interface Part {
  svg: string;
  css: string;
}

const delay = (s: number) => `style="animation-delay:${s.toFixed(2)}s"`;

function matrix(body: Extract<CardBody, { kind: "matrix" }>, p: Palette): Part {
  const { rows, cols } = body;
  if (rows.length === 0 || cols.length === 0) return { svg: "", css: "" };
  const labelW = 46;
  const x0 = PAD + labelW;
  const step = (INNER - labelW) / cols.length;
  const cellW = step - 4;
  const cellH = 10;
  const rowStep = 13;
  const top = 194 - rows.length * rowStep;
  const out: string[] = [];
  cols.forEach((c, i) => {
    out.push(`<text x="${(x0 + i * step + cellW / 2).toFixed(1)}" y="${top - 5}" font-size="8.5" fill="${p.dim}" text-anchor="middle">${esc(c)}</text>`);
  });
  rows.forEach((r, j) => {
    const y = top + j * rowStep;
    out.push(`<text x="${PAD}" y="${y + 8.5}" font-size="9.5" fill="${p.dim}">${esc(r)}</text>`);
    cols.forEach((_, i) => {
      out.push(
        `<rect class="cell" x="${(x0 + i * step).toFixed(1)}" y="${y}" width="${cellW.toFixed(1)}" height="${cellH}" fill="${p.text}" opacity=".8" ${delay(0.5 + (i * rows.length + j) * 0.035)}/>`,
      );
    });
  });
  const filled = 0.5 + cols.length * rows.length * 0.035 + 0.3;
  out.push(
    `<rect class="sweep motion-only" x="${(x0 - 2).toFixed(1)}" y="${top - 2}" width="${(cellW + 4).toFixed(1)}" height="${rows.length * rowStep + 1}" fill="none" stroke="${p.accent}" stroke-width="1.5"/>`,
  );
  return {
    svg: out.join("\n  "),
    css: `@keyframes sweep { from { transform: translateX(0); } to { transform: translateX(${(cols.length * step).toFixed(1)}px); } }
  .cell { animation: appear .25s ease-out both; }
  .sweep { animation: sweep ${(cols.length * 0.35).toFixed(2)}s steps(${cols.length}) ${filled.toFixed(2)}s infinite both; }`,
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function timeline(body: Extract<CardBody, { kind: "timeline" }>, p: Palette): Part {
  const axisY = 178;
  const out = [`<line class="axis" x1="${PAD}" y1="${axisY}" x2="${PAD + INNER}" y2="${axisY}" stroke="${p.border}" stroke-width="1.5" pathLength="1"/>`];
  const ticks = body.releases.map((r) => ({ t: Date.parse(r.date), major: r.major })).filter((r) => !Number.isNaN(r.t)).sort((a, b) => a.t - b.t);
  const css = `@keyframes draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
  @keyframes pulse { from { r: 3px; opacity: .9; } to { r: 11px; opacity: 0; } }
  .axis { stroke-dasharray: 1; animation: draw 1s ease-out .3s both; }
  .tick { animation: appear .2s ease-out both; }
  .pulse { animation: pulse 1.8s ease-out 2.6s infinite both; }`;
  if (ticks.length === 0) return { svg: out.join("\n  "), css };

  const first = new Date(ticks[0].t);
  const last = new Date(ticks[ticks.length - 1].t);
  const start = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1);
  const end = Date.UTC(last.getUTCFullYear(), last.getUTCMonth() + 1, 1);
  const x = (t: number) => PAD + ((t - start) / (end - start)) * INNER;

  for (let m = new Date(start); m.getTime() < end; m = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1))) {
    const a = x(m.getTime());
    const b = x(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1));
    out.push(`<line x1="${a.toFixed(1)}" y1="${axisY}" x2="${a.toFixed(1)}" y2="${axisY + 4}" stroke="${p.border}"/>`);
    out.push(`<text x="${((a + b) / 2).toFixed(1)}" y="${axisY + 14}" font-size="9" fill="${p.dim}" text-anchor="middle">${MONTHS[m.getUTCMonth()]}</text>`);
  }
  for (const { t, major } of ticks) {
    const tx = x(t).toFixed(1);
    const d = delay(0.5 + ((t - start) / (end - start)) * 1.6);
    if (major) {
      out.push(`<g class="tick" ${d}><line x1="${tx}" y1="${axisY - 24}" x2="${tx}" y2="${axisY}" stroke="${p.text}" stroke-width="2"/><text x="${tx}" y="${axisY - 28}" font-size="10" font-weight="700" fill="${p.accent}" text-anchor="middle">v${major}</text></g>`);
    } else {
      out.push(`<line class="tick" x1="${tx}" y1="${axisY - 9}" x2="${tx}" y2="${axisY}" stroke="${p.dim}" stroke-width="1.5" ${d}/>`);
    }
  }
  const lx = x(ticks[ticks.length - 1].t).toFixed(1);
  out.push(`<circle class="pulse motion-only" cx="${lx}" cy="${axisY}" r="3" fill="none" stroke="${p.accent}"/>`);
  out.push(`<circle class="tick" cx="${lx}" cy="${axisY}" r="3" fill="${p.accent}" ${delay(2.2)}/>`);
  return { svg: out.join("\n  "), css };
}

function chat(body: Extract<CardBody, { kind: "chat" }>, p: Palette): Part {
  const size = 12.5;
  const askX = PAD + 5 * size * ADVANCE;
  const askW = body.ask.length * size * ADVANCE;
  const n = body.ask.length;
  return {
    svg: `<text x="${PAD}" y="114" font-size="${size}" fill="${p.dim}">ask›</text>
  <text x="${askX}" y="114" font-size="${size}" fill="${p.text}" textLength="${askW}" lengthAdjust="spacing">${esc(body.ask)}</text>
  <rect class="typing motion-only" x="${askX}" y="98" width="${askW + 10}" height="24" fill="${p.bg}"/>
  <text class="r1" x="${PAD}" y="142" font-size="${size}" fill="${p.dim}">  → <tspan fill="${p.accent}">${esc(body.call)}</tspan></text>
  <text class="r2" x="${PAD}" y="166" font-size="${size}" fill="${p.text}">  ${esc(body.answer)}</text>`,
    css: `@keyframes type { from { transform: translateX(0); } to { transform: translateX(${askW + 10}px); } }
  .typing { animation: type ${(n * 0.06).toFixed(2)}s steps(${n}) .6s both; }
  .r1 { animation: appear .3s ease-out ${(0.9 + n * 0.06).toFixed(2)}s both; }
  .r2 { animation: appear .3s ease-out ${(1.6 + n * 0.06).toFixed(2)}s both; }`,
  };
}

/** Deterministic pseudo-random numbers (mulberry32), so a rebuild with the same data writes the same SVG. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCENE = { x: PAD, y: 90, w: INNER, h: 50 };

/** An aurora curtain: a periodic wavy band drawn over `w + period`, so sliding it by one period loops seamlessly. */
function curtain(period: number, base: number, amp: [number, number], phase: number): string {
  const pts: string[] = [];
  for (let x = 0; x <= SCENE.w + period; x += 5) {
    const k = (2 * Math.PI * x) / period;
    const y = base - 26 + amp[0] * Math.sin(k) + amp[1] * Math.sin(2 * k + phase);
    pts.push(`L${x} ${y.toFixed(1)}`);
  }
  return `M0 ${base} ${pts.join(" ")} L${SCENE.w + period} ${base} Z`;
}

function scene(body: Extract<CardBody, { kind: "scene" }>, p: Palette): Part {
  const { w, h } = SCENE;
  const rand = rng(7);
  const stars: string[] = [];
  for (let i = 0; i < 46; i++) {
    const cls = i % 3 === 0 ? ` class="twinkle" ${delay(rand() * 3)}` : "";
    stars.push(
      `<circle cx="${(rand() * w).toFixed(1)}" cy="${(rand() * h * 0.7).toFixed(1)}" r="${(0.5 + rand() * 0.7).toFixed(2)}" fill="${p.text}" opacity="${(0.45 + rand() * 0.45).toFixed(2)}"${cls}/>`,
    );
  }
  const pA = w / 2;
  const pB = w / 3;
  // Helsinki across the water from Suomenlinna (skyline.ts), standing on a strip of sea, with a few
  // lit windows and their reflections.
  const shore = 44;
  const sx = w / HELSINKI.length;
  const steps = HELSINKI.map((v, i) => `L${(i * sx).toFixed(1)} ${shore - v} L${((i + 1) * sx).toFixed(1)} ${shore - v}`).join(" ");
  const ridge = `M0 ${shore} ${steps} L${w} ${shore} Z`;
  const lit = rng(11);
  const windows: string[] = [];
  HELSINKI.forEach((v, i) => {
    if (v < 3 || lit() > 0.16) return;
    const x = (i * sx).toFixed(1);
    const y = shore - 1.5 - lit() * (v - 2.5);
    windows.push(`<rect x="${x}" y="${y.toFixed(1)}" width="1.2" height="1.2" fill="${p.accent}"/>`);
    windows.push(`<rect x="${x}" y="${(2 * shore - y + 1).toFixed(1)}" width="1.2" height="2.5" fill="${p.accent}" opacity=".35"/>`);
  });
  const lights = windows.join("");
  const huginn = raven({ near: p.text, far: p.dim }, { width: w, y0: 22, y1: 12, scale: 0.6, cycle: 18, start: 3 });
  const rows = body.rows
    .map(
      ([path, what], i) =>
        `<text class="row" x="${PAD}" y="${158 + i * 16}" font-size="11" fill="${p.dim}" ${delay(0.8 + i * 0.35)}><tspan fill="${p.text}">${esc(path.padEnd(11))}</tspan>${esc(what)}</text>`,
    )
    .join("\n  ");
  return {
    svg: `<defs>
    <clipPath id="sky"><rect width="${w}" height="${h}"/></clipPath>
    <linearGradient id="aurora" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.text}" stop-opacity="0"/><stop offset=".7" stop-color="${p.text}" stop-opacity=".32"/><stop offset="1" stop-color="${p.text}" stop-opacity=".6"/></linearGradient>
    <linearGradient id="aurora2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.accent}" stop-opacity="0"/><stop offset="1" stop-color="${p.accent}" stop-opacity=".3"/></linearGradient>
    <pattern id="rays" width="3" height="10" patternUnits="userSpaceOnUse"><rect width="1" height="10" fill="${p.bg}" opacity=".35"/></pattern>
  </defs>
  <g transform="translate(${SCENE.x} ${SCENE.y})">
    <rect width="${w}" height="${h}" fill="${p.bar}" stroke="${p.faint}"/>
    <g clip-path="url(#sky)">
      ${stars.join("\n      ")}
      <circle cx="${w - 34}" cy="13" r="6" fill="${p.dim}"/><circle cx="${w - 31.5}" cy="11.5" r="5.5" fill="${p.bar}"/>
      <g class="drift-b"><path d="${curtain(pB, 44, [5, 3], 2.1)}" fill="url(#aurora2)"/></g>
      <g class="shimmer"><g class="drift-a"><path d="${curtain(pA, 44, [8, 4], 1.3)}" fill="url(#aurora)"/><path d="${curtain(pA, 44, [8, 4], 1.3)}" fill="url(#rays)"/></g></g>
      ${huginn.svg}
      <rect y="${shore}" width="${w}" height="${h - shore}" fill="${p.bg}" opacity=".6"/>
      <path d="${ridge}" fill="${p.bg}" stroke="${p.border}" stroke-linejoin="miter"/>
      ${lights}
    </g>
  </g>
  ${rows}`,
    css: `@keyframes drift-a { from { transform: translateX(0); } to { transform: translateX(-${pA.toFixed(1)}px); } }
  @keyframes drift-b { from { transform: translateX(-${pB.toFixed(1)}px); } to { transform: translateX(0); } }
  @keyframes shimmer { from { opacity: .65; } to { opacity: 1; } }
  @keyframes twinkle { 50% { opacity: .1; } }
  .drift-a { animation: drift-a 16s linear infinite; }
  .drift-b { animation: drift-b 26s linear infinite; }
  .shimmer { animation: shimmer 3.2s ease-in-out infinite alternate; }
  .twinkle { animation: twinkle 2.6s ease-in-out infinite; }
  ${huginn.css}
  .row { animation: appear .4s ease-out both; }`,
  };
}

function body(b: CardBody, p: Palette): Part {
  switch (b.kind) {
    case "matrix":
      return matrix(b, p);
    case "timeline":
      return timeline(b, p);
    case "chat":
      return chat(b, p);
    case "scene":
      return scene(b, p);
  }
}

export function renderCard(card: CardInput, p: Palette): string {
  for (const line of card.tagline) {
    if (line.length > TAGLINE_MAX) throw new Error(`tagline too long for the card (${line.length} > ${TAGLINE_MAX}): ${line}`);
  }
  const footChars = card.body.caption.length + card.footer.length + 2;
  if (footChars * FOOT_SIZE * ADVANCE > INNER) throw new Error(`caption and footer overlap: ${card.body.caption} | ${card.footer}`);
  const pillW = card.pill.length * 12 * ADVANCE + 16;
  const colW = INNER / 3;
  const stats = card.stats
    .slice(0, 3)
    .map(
      (s, i) => `<text x="${PAD + i * colW}" y="112" font-size="19" font-weight="700" fill="${p.text}">${esc(s.value)}</text>
  <text x="${PAD + i * colW}" y="130" font-size="11" fill="${p.dim}">${esc(s.label)}</text>`,
    )
    .join("\n  ");
  const part = body(card.body, p);
  const W = CARD_W + 2 * GUTTER;
  const H = CARD_H + 2 * GUTTER;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title">
<title id="title">${esc(`${card.title} ${card.pill}: ${card.tagline.join(" ")} ${card.stats.map((s) => `${s.value} ${s.label}`).join(", ")}.`)}</title>
<style>
  text { font-family: ${FONT}; white-space: pre; }
  @keyframes appear { from { opacity: 0; } }
  ${part.css}
  ${FRAME_CSS}
  ${REDUCED_MOTION}
</style>
<g transform="translate(${GUTTER} ${GUTTER})">
  <rect width="${CARD_W}" height="${CARD_H}" fill="${p.bg}"/>
  <text x="${PAD}" y="38" font-size="20" font-weight="700" fill="${p.text}"><tspan fill="${p.dim}">▸ </tspan>${esc(card.title)}</text>
  <rect x="${CARD_W - PAD - pillW}" y="22" width="${pillW}" height="22" fill="${p.faint}" stroke="${p.border}"/>
  <text x="${CARD_W - PAD - pillW / 2}" y="37.5" font-size="12" fill="${p.text}" text-anchor="middle">${esc(card.pill)}</text>
  <text x="${PAD}" y="62" font-size="${TAGLINE_SIZE}" fill="${p.dim}">${esc(card.tagline[0])}</text>
  <text x="${PAD}" y="79" font-size="${TAGLINE_SIZE}" fill="${p.dim}">${esc(card.tagline[1])}</text>
  ${stats}
  ${part.svg}
  <text x="${PAD}" y="${CARD_H - 8}" font-size="${FOOT_SIZE}" fill="${p.dim}" opacity=".85">${esc(card.body.caption)}</text>
  <text x="${CARD_W - PAD}" y="${CARD_H - 8}" font-size="${FOOT_SIZE}" fill="${p.dim}" opacity=".85" text-anchor="end">${esc(card.footer)}</text>
</g>
${frame(p, { w: CARD_W, h: CARD_H, gutter: GUTTER, arm: 16, weight: 2.5, border: 1.5 })}
</svg>
`;
}
