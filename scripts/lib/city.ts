// The contribution graph as a street along the tracks: a column of windows a week, one window a day,
// Sunday on the top floor as GitHub's graph puts it on the top row, each window lit by that day's
// contributions in GitHub's own shading. The columns are grouped into the buildings of home (street.ts):
// blocks of flats, the malls, an old manor and the towers, each with its own roofline. Behind them, a
// valley between two pine-topped rock hills (valley.ts). Masts and spires blink their warning lights, and
// a commuter train runs along the tracks.
//
// This file draws the scene; what happens in it is an act, passed in: how the lit windows come and go,
// when the train runs, the sky, anything else that moves. The acts:
//
//   city-lights.ts  the evening commute: the train runs through the year and each week's windows light
//                   up as it passes (the one on the profile)
//   city-huginn.ts  Huginn the raven poops on the towers (archived; swap it in at build-profile.ts)
//
// The dark card is the city at night; the light card is the same city by day. As everywhere, the final
// frame is the default and animation only runs from hidden, so reduced motion shows the whole lit city.

import type { Calendar } from "./data.ts";
import { esc, FONT, FRAME_CSS, frame, type Palette, REDUCED_MOTION } from "./theme.ts";
import { dress, layout } from "./street.ts";
import { FAR, NEAR, WIDTH as VALLEY_W } from "./valley.ts";

export interface CityColors {
  /** Window colours: unlit, then GitHub's four levels. */
  windows: [string, string, string, string, string];
  tower: string;
  /** The skyline behind: nearer, then the offices further off (and the cut-outs in the nearer one). */
  backdrop: string;
  far: string;
  /** The street and the tracks along the foot. */
  ground: string;
  night: boolean;
}

export const CITY_DARK: CityColors = {
  windows: ["#132013", "#006600", "#00aa00", "#00dd00", "#00ff00"],
  tower: "#0a120a",
  backdrop: "#072a0c",
  far: "#041b07",
  ground: "#001a00",
  night: true,
};

export const CITY_LIGHT: CityColors = {
  windows: ["#eef6ee", "#c6e8c6", "#7fc97f", "#2e9d3e", "#0b5d1e"],
  tower: "#ffffff",
  backdrop: "#d5e8d5",
  far: "#e6f1e6",
  ground: "#e3f3e3",
  night: false,
};

export const CITY_W = 840;
const H = 330;
const GUTTER = 6;
export const PAD = 20;
export const INNER = CITY_W - 2 * PAD;
/** Street level, and the depth of the street and tracks below it. */
export const SHORE = 246;
const WATER = 30;
/** Floor pitch, and a window's height within it. */
const FLOOR = 7;
const WIN_H = 4.5;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 86_400_000;

export const f = (n: number) => Number(n.toFixed(1));
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
export function rng(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A three-car commuter train facing left, its wheels on the rail at `rail`, starting at x = 0. */
const CAR = 52;
const CARS = 3;
export const TRAIN_W = CARS * CAR + (CARS - 1) * 2;
function train(rail: number): { body: string; windows: string; gear: string } {
  const top = rail - 11;
  const bot = rail - 1.5;
  let body = "";
  let windows = "";
  for (let i = 0; i < CARS; i++) {
    const x = i * (CAR + 2);
    if (i === 0) body += `M${x + 8} ${top}H${x + CAR}V${bot}H${x}V${top + 6}Q${x + 1} ${top} ${x + 8} ${top}Z`;
    else if (i === CARS - 1) body += `M${x} ${top}H${x + CAR - 8}Q${x + CAR - 1} ${top} ${x + CAR} ${top + 6}V${bot}H${x}Z`;
    else body += `M${x} ${top}H${x + CAR}V${bot}H${x}Z`;
    // A window band broken by two pairs of doors.
    for (const [a, b] of [[i === 0 ? 7 : 4, 15], [20, 32], [37, i === CARS - 1 ? 45 : 48]]) windows += `M${x + a} ${top + 2.2}h${b - a}v3h${a - b}Z`;
  }
  const mid = CAR + 2 + CAR / 2;
  const gear =
    `M${mid - 5} ${top}L${mid} ${top - 4}L${mid + 5} ${top}M${mid - 3} ${top - 4}H${mid + 3}` +
    Array.from({ length: CARS * 2 }, (_, k) => `M${Math.floor(k / 2) * (CAR + 2) + (k % 2 ? CAR - 10 : 4)} ${rail - 1}h6`).join("");
  return { body, windows, gear };
}

/** Where the train is off-card at either end of its run: its left edge's x. */
export const TRAIN_WEST = -TRAIN_W - 10;
export const TRAIN_EAST = CITY_W + 10;

/** One day's window: its day index in the calendar, its floor from the top (Sunday 0), level and box. */
export interface Window {
  i: number;
  d: number;
  level: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One week's column of windows. */
export interface Column {
  w: number;
  /** The column's centre line, and the top of whatever stands on its building there. */
  mid: number;
  roof: number;
  /** Its days that saw a contribution, Sunday first. */
  lit: Window[];
}

/** What an act is handed: the year, the colours, and every week's column, west to east. */
export interface Stage {
  cal?: Calendar;
  p: Palette;
  c: CityColors;
  columns: Column[];
  step: number;
}

/** What an act puts on the stage. Everything in it loops on `cycle`. */
export interface Act {
  /** What happens, in a sentence, for the card's title. */
  story: string;
  cycle: number;
  css: string;
  /** Over the facades, glowing at night and clipped to above the street: the lit windows. */
  windows: string;
  /** In the sky, behind the stars and the hills: a tint over the sky, the moon. */
  behind?: string;
  /** Gradients and the like that `behind` refers to. */
  defs?: string;
  /** Over everything but the labels: a raven, his droppings. */
  sky?: string;
  /** When the train sets off, how long it takes to cross the card, and which way it runs. */
  train: { at: number; dur: number; east: boolean };
}

export type Director = (stage: Stage) => Act;

export function renderCity(cal: Calendar | undefined, p: Palette, c: CityColors, direct: Director): string {
  const days = cal?.counts.length ?? 0;
  const weeks = Math.max(53, Math.ceil(days / 7));
  const step = INNER / weeks;
  const levelAt = (i: number) => (cal && i < days ? (cal.levels[i] ?? 0) : 0);
  const blink = rng(7);

  const bodies: string[] = [];
  const roofs: string[] = [];
  const trims: string[] = [];
  const marks: string[] = [];
  const stripes: string[] = [];
  const crowns: string[] = [];
  const empty: string[] = [];
  const lights: string[] = [];
  const columns: Column[] = [];
  let w = 0;
  for (const b of layout(weeks)) {
    const x = PAD + w * step + 0.8;
    const top = SHORE - b.floors * FLOOR - 3;
    const dressed = dress(b, f(x), f(b.weeks * step - 1.6), SHORE, top);
    bodies.push(dressed.body);
    roofs.push(dressed.roof);
    trims.push(dressed.trim);
    marks.push(dressed.marks);
    stripes.push(dressed.stripes);
    if (dressed.crown) crowns.push(dressed.crown);
    for (const [lx, ly] of dressed.lights) {
      lights.push(`<circle class="beacon" cx="${lx}" cy="${ly}" r="1.3" fill="${p.accent}" style="animation-duration:${(1.6 + blink() * 0.9).toFixed(2)}s;animation-delay:${(blink() * 2).toFixed(2)}s"/>`);
    }
    for (const end = w + b.weeks; w < end; w++) {
      const winX = f(PAD + w * step + 2.2);
      const winW = f(step - 4.4);
      const mid = f(PAD + w * step + step / 2);
      // Every window is drawn unlit; the act lights the ones that saw a contribution.
      for (let k = 0; k < b.floors; k++) empty.push(`M${winX} ${SHORE - (k + 1) * FLOOR}h${winW}v${WIN_H}h-${winW}Z`);
      const lit: Window[] = [];
      for (let d = 0; d < 7; d++) {
        const i = w * 7 + d;
        if (i >= days || levelAt(i) === 0) continue;
        // Sunday (d = 0) on the top floor, Saturday six floors down.
        lit.push({ i, d, level: levelAt(i), x: winX, y: SHORE - (b.floors - d) * FLOOR, w: winW, h: WIN_H });
      }
      columns.push({ w, mid, roof: f(dressed.landing(mid)), lit });
    }
  }

  const act = direct({ cal, p, c, columns, step });
  const pct = (t: number) => `${((t / act.cycle) * 100).toFixed(3)}%`;

  // Month labels under the tracks, at the first week that holds the 1st of a month.
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

  // Home behind, drawn to the card's width.
  const k = INNER / VALLEY_W;
  const backdrop = `<g clip-path="url(#behind)"><g transform="translate(${PAD} ${SHORE}) scale(${k.toFixed(4)} ${(k * 1.15).toFixed(4)})">
    <path d="${FAR}" fill="${c.far}"/>
    <path d="${NEAR}" fill="${c.backdrop}"/>
  </g></g>`;

  // The street along the foot: a rail, its sleepers, and the train that runs along it. The train is
  // drawn facing west; running east, it is mirrored in place.
  const RAIL = SHORE + 21;
  const t = train(RAIL);
  const tracks = `<path d="M${PAD} ${RAIL}H${CITY_W - PAD}" stroke="${p.border}" stroke-width=".9"/>
  <path d="M${PAD} ${RAIL + 1.8}H${CITY_W - PAD}" stroke="${p.dim}" stroke-width="1.4" stroke-dasharray="1.5 3.5" opacity=".55"/>`;
  const { at, dur, east } = act.train;
  const [from, to] = east ? [TRAIN_WEST, TRAIN_EAST] : [TRAIN_EAST, TRAIN_WEST];
  const commuter = `<g class="train motion-only"><g${east ? ` transform="matrix(-1 0 0 1 ${TRAIN_W} 0)"` : ""}>
    <path d="${t.gear}" fill="none" stroke="${p.border}" stroke-width=".9"/>
    <path d="${t.body}" fill="${c.tower}" stroke="${p.border}" stroke-width=".8"/>
    <path d="${t.windows}" fill="${c.night ? c.windows[3] : p.faint}"${c.night ? ' filter="url(#glow)"' : ""}/>
  </g></g>`;

  const sky = rng(9);
  // The stars are one group (`.stars`), for an act to fade.
  const stars = c.night
    ? Array.from(
        { length: 40 },
        (_, i) =>
          `<circle cx="${f(PAD + sky() * INNER)}" cy="${f(56 + sky() * 60)}" r="${(0.5 + sky() * 0.6).toFixed(2)}" fill="${p.text}" opacity="${(0.3 + sky() * 0.4).toFixed(2)}"${i % 4 === 0 ? ` class="twinkle" style="animation-delay:${(sky() * 3).toFixed(2)}s"` : ""}/>`,
      ).join("")
    : "";
  const starfield = stars ? `<g class="stars">${stars}</g>` : "";

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
    ? `My GitHub contributions over the last year, drawn as a city ${c.night ? "at night" : "by day"} along the tracks, in a valley between two pine-topped rock hills: one tower a week, one window a day. ${act.story} ${summary.replaceAll(" · ", ", ")}.`
    : "My GitHub contributions over the last year, drawn as a city: one tower a week, one window a day.";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CITY_W + 2 * GUTTER}" height="${H + 2 * GUTTER}" viewBox="0 0 ${CITY_W + 2 * GUTTER} ${H + 2 * GUTTER}" role="img" aria-labelledby="title">
<title id="title">${esc(title)}</title>
<style>
  text { font-family: ${FONT}; white-space: pre; }
  @keyframes twinkle { 50% { opacity: .08; } }
  @keyframes blink { 50% { opacity: .15; } }
  @keyframes train { 0%, ${pct(at)} { transform: translateX(${from}px); } ${pct(at + dur)}, 100% { transform: translateX(${to}px); } }
  @keyframes led { 0%, 100% { stroke: ${c.windows[3]}; } 33% { stroke: ${p.accent}; } 66% { stroke: ${c.windows[4]}; } }
  ${act.css}
  .train { transform: translateX(${from}px); animation: train ${act.cycle}s linear infinite; }
  .crown { animation: led 9s ease-in-out infinite; }
  .twinkle { animation: twinkle 2.8s ease-in-out infinite; }
  .beacon { animation: blink 1.6s step-end 3s infinite; }
  ${FRAME_CSS}
  ${REDUCED_MOTION}
</style>
<defs>
  <clipPath id="screen"><rect width="${CITY_W}" height="${H}"/></clipPath>
  <clipPath id="behind"><rect x="${PAD}" width="${INNER}" height="${SHORE}"/></clipPath>
  <clipPath id="street"><rect x="${PAD}" y="${SHORE}" width="${INNER}" height="${WATER}"/></clipPath>
  <clipPath id="above"><rect x="${PAD}" width="${INNER}" height="${SHORE}"/></clipPath>
  ${act.defs ?? ""}
  ${c.night ? `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : ""}
</defs>
<g transform="translate(${GUTTER} ${GUTTER})">
<g clip-path="url(#screen)">
  <rect width="${CITY_W}" height="${H}" fill="${p.bg}"/>
  <text x="${PAD}" y="36" font-size="18" font-weight="700" fill="${p.text}"><tspan fill="${p.dim}">▸ </tspan>contributions</text>
  <text x="${CITY_W - PAD}" y="36" font-size="11" fill="${p.dim}" text-anchor="end">${esc(range)}</text>
  ${act.behind ? `<g clip-path="url(#behind)">${act.behind}</g>` : ""}
  ${starfield}
  ${backdrop}
  <rect x="${PAD}" y="${SHORE}" width="${INNER}" height="${WATER}" fill="${c.ground}"/>
  ${tracks}
  <g>
    <path d="${trims.join("")}" fill="none" stroke="${p.border}" stroke-width=".8"/>
    <path d="${bodies.join("")}" fill="${c.tower}" stroke="${p.border}" stroke-width=".8"/>
    <path d="${roofs.join("")}" fill="${c.tower}" stroke="${p.border}" stroke-width=".8"/>
    <path d="${empty.join("")}" fill="${c.windows[0]}"/>
    <path d="${marks.join("")}" fill="${c.windows[0]}"/>
    <path d="${stripes.join("")}" fill="${p.dim}" opacity=".7"/>
    ${c.night ? crowns.map((d) => `<path class="crown" d="${d}" fill="none" stroke="${c.windows[3]}" stroke-width="1.6" stroke-linecap="round" filter="url(#glow)"/>`).join("") : ""}
    <g clip-path="url(#above)"><g${c.night ? ' filter="url(#glow)"' : ""}>${act.windows}</g></g>
  </g>
  <path d="M${PAD} ${SHORE}H${CITY_W - PAD}" stroke="${p.border}"/>
  <g clip-path="url(#street)">${commuter}</g>
  ${act.sky ?? ""}
  <g${c.night ? ' filter="url(#glow)"' : ""}>${lights.join("")}</g>
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
