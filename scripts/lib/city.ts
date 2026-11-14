// The contribution graph as a city across the water: one tower a week, one window a day, Sunday on the top
// floor as GitHub's graph puts it on the top row, each window lit by that day's contributions in GitHub's
// own shading. A busier week builds a taller tower (empty floors above the seven days). Behind them stands
// Helsinki from the harbour (harbour.ts).
//
// Every window starts dark. Huginn (raven.ts) makes one slow pass over the towers and relieves himself on
// each week that saw a contribution, about one tower every DROP_EVERY seconds; where a dropping lands, that
// week's days splatter down the facade in GitHub's shading. Masts and spires blink their warning lights.
//
// The dark card is the city at night; the light card is the same city by day, the splats green like the
// graph's cells. As everywhere, the final frame is the default and animation only runs from hidden, so
// reduced motion shows the whole splattered city and no raven.

import type { Calendar } from "./data.ts";
import { BLOCKS, FAR, GROUND, LANDMARKS, SPAN } from "./harbour.ts";
import { raven } from "./raven.ts";
import { esc, FONT, FRAME_CSS, frame, type Palette, REDUCED_MOTION } from "./theme.ts";

export interface CityColors {
  /** Window colours: unlit, then GitHub's four levels. */
  windows: [string, string, string, string, string];
  tower: string;
  backdrop: string;
  water: string;
  night: boolean;
}

export const CITY_DARK: CityColors = {
  windows: ["#132013", "#006600", "#00aa00", "#00dd00", "#00ff00"],
  tower: "#0a120a",
  backdrop: "#072a0c",
  water: "#001a00",
  night: true,
};

export const CITY_LIGHT: CityColors = {
  windows: ["#eef6ee", "#c6e8c6", "#7fc97f", "#2e9d3e", "#0b5d1e"],
  tower: "#ffffff",
  backdrop: "#d5e8d5",
  water: "#e3f3e3",
  night: false,
};

export const CITY_W = 840;
const H = 286;
const GUTTER = 6;
const PAD = 20;
const INNER = CITY_W - 2 * PAD;
const SHORE = 204;
const WATER = 30;
/** Floor pitch, and the most empty floors a busy week adds on top of its seven. */
const FLOOR = 8;
const EXTRA = 5;
/** Seconds between droppings (one per tower), when Huginn sets off, and how far off-card he starts. */
const DROP_EVERY = 0.7;
const RUN_START = 1.5;
const RUN_MARGIN = 30;
const RAVEN_SCALE = 0.75;
/** Where a dropping leaves the raven, relative to his centre at scale 1: under the tail. */
const VENT: [number, number] = [-3, 1];
/** A falling dropping: a teardrop, its point up. */
const DROP = "M0 -3.8Q2.2 0 0 1.9Q-2.2 0 0 -3.8Z";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;

const f = (n: number) => Number(n.toFixed(1));
const num = (n: number) => new Intl.NumberFormat("en-US").format(n);
const dateOf = (start: string, i: number) => new Date(Date.parse(`${start}T00:00:00Z`) + i * DAY_MS);
const day = (d: Date) => `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;

export interface CityStats {
  total: number;
  longest: number;
  busiest?: { date: string; count: number };
}

/** The year's total, its longest run of days with a contribution, and its busiest day (the first, on a tie). */
export function cityStats(cal: Calendar): CityStats {
  let longest = 0;
  let run = 0;
  let best = -1;
  cal.counts.forEach((c, i) => {
    run = c > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
    if (c > 0 && (best === -1 || c > cal.counts[best])) best = i;
  });
  return {
    total: cal.total,
    longest,
    busiest: best === -1 ? undefined : { date: day(dateOf(cal.start, best)), count: cal.counts[best] },
  };
}

/** Deterministic pseudo-random numbers (mulberry32), so the same data always draws the same city. */
function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A splat over a window centred on (cx, cy): a lumpy blob about `rx` by `ry` and a droplet or two flung
 * sideways, as one path.
 */
function splat(cx: number, cy: number, rx: number, ry: number, rand: () => number): string {
  const n = 9;
  const pts = Array.from({ length: n }, (_, i): [number, number] => {
    const a = (i / n) * 2 * Math.PI + rand() * 0.4;
    const k = 0.78 + rand() * 0.42;
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k];
  });
  const mid = (a: [number, number], b: [number, number]) => `${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2)}`;
  let d = `M${mid(pts[n - 1], pts[0])}`;
  for (let i = 0; i < n; i++) d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${mid(pts[i], pts[(i + 1) % n])}`;
  d += "Z";
  for (let j = 1 + Math.floor(rand() * 2); j > 0; j--) {
    const a = (rand() < 0.5 ? 0 : Math.PI) + (rand() - 0.5) * 1.2;
    const r = 0.45 + rand() * 0.35;
    const x = cx + Math.cos(a) * rx * (1.2 + rand() * 0.3);
    const y = cy + Math.sin(a) * ry * 1.2;
    d += `M${f(x - r)} ${f(y)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
  }
  return d;
}

/** How far above a tower's top its roof reaches at the middle, where a dropping lands. */
const PEAK = [0, 3, 6, 10, 14];

/** A roof on a tower `w` wide whose top is at (x, y): flat, a parapet, a gable, a mast or a spire. */
function roof(kind: number, x: number, y: number, w: number): string {
  const m = x + w / 2;
  switch (kind) {
    case 1:
      return `M${f(x + 2)} ${y}V${y - 3}H${f(x + w - 2)}V${y}Z`;
    case 2:
      return `M${x} ${y}L${f(m)} ${y - 6}L${f(x + w)} ${y}Z`;
    case 3:
      return `M${f(m - 0.6)} ${y}V${y - 10}H${f(m + 0.6)}V${y}Z`;
    case 4:
      return `M${f(x + 2)} ${y}L${f(m)} ${y - 14}L${f(x + w - 2)} ${y}Z`;
    default:
      return "";
  }
}

export function renderCity(cal: Calendar | undefined, p: Palette, c: CityColors): string {
  const days = cal?.counts.length ?? 0;
  const weeks = Math.max(53, Math.ceil(days / 7));
  const step = INNER / weeks;
  const tw = f(step * 0.8);
  const levelAt = (i: number) => (cal && i < days ? (cal.levels[i] ?? 0) : 0);
  const weekTotal = (w: number) => (cal ? cal.counts.slice(w * 7, w * 7 + 7).reduce((a, b) => a + b, 0) : 0);
  const totals = Array.from({ length: weeks }, (_, w) => weekTotal(w));
  const maxWeek = Math.max(1, ...totals);
  const busiestWeek = totals.indexOf(Math.max(...totals));
  const rand = rng(53);
  const mess = rng(7);

  // Huginn's one pass: slow enough to cross a tower every DROP_EVERY seconds.
  const cross = ((INNER + 2 * RUN_MARGIN) / step) * DROP_EVERY;
  const huginn = raven(
    { near: p.text, far: p.dim },
    { width: INNER, y0: 72, y1: 64, scale: RAVEN_SCALE, cycle: cross, start: RUN_START, across: 100, margin: RUN_MARGIN, once: true },
  );

  const towers: string[] = [];
  const roofs: string[] = [];
  const empty: string[] = [];
  // Splats grouped by week; each lands on its own, top floor first, once the week's dropping hits.
  const lit: string[] = [];
  const drops: string[] = [];
  const fall: string[] = [];
  const lights: string[] = [];
  for (let w = 0; w < weeks; w++) {
    const x = f(PAD + w * step + (step - tw) / 2);
    const extra = Math.round(EXTRA * Math.sqrt(totals[w] / maxWeek));
    const floors = 7 + extra;
    const top = SHORE - floors * FLOOR - 3;
    towers.push(`M${x} ${SHORE}V${top}H${f(x + tw)}V${SHORE}Z`);
    const kind = w === busiestWeek && totals[w] > 0 ? 3 : Math.floor(rand() * 5);
    roofs.push(roof(kind, x, top, tw));
    const mid = f(x + tw / 2);
    // Warning lights on the masts and spires (the busiest week's mast has the beacon).
    if ((kind === 3 || kind === 4) && w !== busiestWeek) {
      const period = (1.3 + mess() * 1.2).toFixed(2);
      lights.push(`<circle class="beacon" cx="${mid}" cy="${top - PEAK[kind] - 0.6}" r="1.2" fill="${p.accent}" style="animation-duration:${period}s;animation-delay:${(mess() * 2).toFixed(2)}s"/>`);
    }
    const winX = f(x + 2);
    const winW = f(tw - 4);
    // Every window starts dark; the lit ones are splattered on later.
    for (let k = 0; k < floors; k++) empty.push(`M${winX} ${SHORE - (k + 1) * FLOOR}h${winW}v5h-${winW}Z`);
    const days7 = Array.from({ length: 7 }, (_, d) => w * 7 + d).filter((i) => i < days && levelAt(i) > 0);
    if (!days7.length) continue;

    // Release when the vent is over the tower's middle, and fall (accelerating) to its roof.
    const cx = w * step + step / 2;
    const s = ((cx - VENT[0] * RAVEN_SCALE + RUN_MARGIN) / (INNER + 2 * RUN_MARGIN)) * cross;
    const from = huginn.at(s)[1] + VENT[1] * RAVEN_SCALE;
    const to = top - PEAK[kind];
    const drop = Math.max(0, to - from);
    const dur = 0.1 * Math.sqrt(drop);
    const release = RUN_START + s;
    const hit = release + dur;
    fall.push(`@keyframes d${w} { 0% { transform: translateY(${f(-drop)}px); opacity: 1; } 99% { opacity: 1; } 100% { transform: translateY(0); opacity: 0; } }`);
    // Positioned by the group: a CSS transform on the path itself would replace a transform attribute.
    drops.push(`<g transform="translate(${mid} ${f(to)})"><path class="drop" d="${DROP}" style="animation:d${w} ${dur.toFixed(2)}s cubic-bezier(.55,.085,.68,.53) ${release.toFixed(2)}s forwards"/></g>`);

    const splats = days7.map((i) => {
      // Sunday (d = 0) on the top day floor, Saturday at street level.
      const d = i - w * 7;
      const y = SHORE - (7 - d) * FLOOR;
      return `<path class="sp" d="${splat(winX + winW / 2, y + 2.5, winW / 2 + 0.6, 3, mess)}" fill="${c.windows[levelAt(i)]}" style="animation-delay:${(hit + 0.04 + d * 0.06).toFixed(2)}s"/>`;
    });
    lit.push(`<g class="wk">${splats.join("")}</g>`);
  }
  const beaconX = f(PAD + busiestWeek * step + step / 2);
  const beaconY = SHORE - (7 + Math.round(EXTRA * Math.sqrt(totals[busiestWeek] / maxWeek))) * FLOOR - 3 - 11;

  // Month labels under the water, at the first week that holds the 1st of a month.
  const months: string[] = [];
  if (cal) {
    let lastX = -Infinity;
    for (let i = 0; i < days; i++) {
      const d = dateOf(cal.start, i);
      if (d.getUTCDate() !== 1) continue;
      const x = PAD + Math.floor(i / 7) * step;
      if (x - lastX < 34) continue;
      lastX = x;
      months.push(`<text x="${f(x)}" y="${SHORE + WATER + 15}" font-size="10" fill="${p.dim}">${MONTHS[d.getUTCMonth()]}</text>`);
    }
  }

  // Helsinki behind, its landmarks spread across the card and drawn 1.6× tall (as skyline.ts exaggerates
  // the aurora's) so they rise over the towers.
  const k = INNER / (SPAN.to - SPAN.from);
  const backdrop = `<g clip-path="url(#behind)"><g transform="translate(${f(PAD - SPAN.from * k)} ${f(SHORE - GROUND * k * 1.6)}) scale(${k.toFixed(4)} ${(k * 1.6).toFixed(4)})"><path d="${FAR}${BLOCKS}${LANDMARKS}" fill="${c.backdrop}"/></g></g>`;

  const sky = rng(9);
  const stars = c.night
    ? Array.from(
        { length: 40 },
        (_, i) =>
          `<circle cx="${f(PAD + sky() * INNER)}" cy="${f(56 + sky() * 60)}" r="${(0.5 + sky() * 0.6).toFixed(2)}" fill="${p.text}" opacity="${(0.3 + sky() * 0.4).toFixed(2)}"${i % 4 === 0 ? ` class="twinkle" style="animation-delay:${(sky() * 3).toFixed(2)}s"` : ""}/>`,
      ).join("")
    : "";

  const stats = cal ? cityStats(cal) : undefined;
  const summary = stats
    ? `${num(stats.total)} contributions · longest streak ${stats.longest} day${stats.longest === 1 ? "" : "s"}${stats.busiest ? ` · busiest ${stats.busiest.date} (${stats.busiest.count})` : ""}`
    : "—";
  const range = cal ? `${day(dateOf(cal.start, 0))} ${dateOf(cal.start, 0).getUTCFullYear()} – ${day(dateOf(cal.start, days - 1))} ${dateOf(cal.start, days - 1).getUTCFullYear()}` : "last 12 months";
  const legendX = CITY_W - PAD - 5 * 13 - 34;
  const legend = c.windows
    .map((col, i) => `<rect x="${legendX + i * 13}" y="${H - 21}" width="10" height="7" fill="${col}" stroke="${p.border}" stroke-width=".6"/>`)
    .join("");

  const title = stats
    ? `My GitHub contributions over the last year, drawn as a city ${c.night ? "at night" : "by day"} in front of Helsinki: one tower a week, one window a day. Huginn the raven flies over and poops on each tower, splattering that week's windows in the shade of each day's contributions. ${summary.replaceAll(" · ", ", ")}.`
    : "My GitHub contributions over the last year, drawn as a city: one tower a week, one window a day, for Huginn the raven to poop on.";

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${CITY_W + 2 * GUTTER}" height="${H + 2 * GUTTER}" viewBox="0 0 ${CITY_W + 2 * GUTTER} ${H + 2 * GUTTER}" role="img" aria-labelledby="title">
<title id="title">${esc(title)}</title>
<style>
  text { font-family: ${FONT}; white-space: pre; }
  @keyframes twinkle { 50% { opacity: .08; } }
  @keyframes blink { 50% { opacity: .15; } }
  @keyframes splat { 0% { opacity: 0; transform: scale(.2, .5); } 45% { opacity: 1; transform: scale(1.4, .8); } 100% { opacity: 1; transform: scale(1); } }
  .sp { transform-box: fill-box; transform-origin: 50% 0; animation: splat .3s ease-out both; }
  .drop { opacity: 0; }
  ${fall.join("\n  ")}
  .twinkle { animation: twinkle 2.8s ease-in-out infinite; }
  .beacon { animation: blink 1.6s step-end 3s infinite; }
  ${huginn.css}
  ${FRAME_CSS}
  ${REDUCED_MOTION}
</style>
<defs>
  <clipPath id="screen"><rect width="${CITY_W}" height="${H}"/></clipPath>
  <clipPath id="behind"><rect x="${PAD}" width="${INNER}" height="${SHORE}"/></clipPath>
  <linearGradient id="fade" x1="0" y1="${SHORE}" x2="0" y2="${SHORE + WATER}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <mask id="water"><rect y="${SHORE}" width="${CITY_W}" height="${WATER}" fill="url(#fade)"/></mask>
  ${c.night ? `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : ""}
</defs>
<g transform="translate(${GUTTER} ${GUTTER})">
<g clip-path="url(#screen)">
  <rect width="${CITY_W}" height="${H}" fill="${p.bg}"/>
  <text x="${PAD}" y="36" font-size="18" font-weight="700" fill="${p.text}"><tspan fill="${p.dim}">▸ </tspan>contributions</text>
  <text x="${CITY_W - PAD}" y="36" font-size="11" fill="${p.dim}" text-anchor="end">${esc(range)}</text>
  ${stars}
  ${backdrop}
  <g transform="translate(${PAD} 0)">${huginn.svg}</g>
  <rect x="${PAD}" y="${SHORE}" width="${INNER}" height="${WATER}" fill="${c.water}"/>
  <g id="city">
    <path d="${towers.join("")}" fill="${c.tower}" stroke="${p.border}" stroke-width=".8"/>
    <path d="${roofs.join("")}" fill="${c.tower}" stroke="${p.border}" stroke-width=".8"/>
    <path d="${empty.join("")}" fill="${c.windows[0]}"/>
    <g${c.night ? ' filter="url(#glow)"' : ""}>${lit.join("")}</g>
  </g>
  <g mask="url(#water)"><use href="#city" xlink:href="#city" transform="translate(0 ${2 * SHORE}) scale(1 -1)"/></g>
  <path d="M${PAD} ${SHORE}H${CITY_W - PAD}" stroke="${p.border}"/>
  <g class="motion-only" fill="${p.text}">${drops.join("")}</g>
  <g${c.night ? ' filter="url(#glow)"' : ""}>${lights.join("")}</g>
  ${cal ? `<circle class="beacon" cx="${beaconX}" cy="${beaconY}" r="1.8" fill="${p.accent}"/>` : ""}
  ${months.join("\n  ")}
  <text x="${PAD}" y="${H - 14}" font-size="11.5" fill="${p.text}">${esc(summary)}</text>
  <text x="${legendX - 6}" y="${H - 14}" font-size="10" fill="${p.dim}" text-anchor="end">less</text>
  ${legend}
  <text x="${legendX + 5 * 13 + 2}" y="${H - 14}" font-size="10" fill="${p.dim}">more</text>
</g>
</g>
${frame(p, { w: CITY_W, h: H, gutter: GUTTER, arm: 18, weight: 2.5, border: 1.5 })}
</svg>
`;
}
