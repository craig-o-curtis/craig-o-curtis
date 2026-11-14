// The contribution graph as a street along the tracks: a column of windows a week, one window a day,
// Sunday on the top floor as GitHub's graph puts it on the top row, each window lit by that day's
// contributions in GitHub's own shading. The columns are grouped into the buildings of home (street.ts):
// blocks of flats, the malls, an old manor and the towers, each with its own roofline. Behind them, a
// valley between two pine-topped rock hills (valley.ts).
//
// It runs as a loop. Every window starts dark. Huginn (raven.ts) makes one slow pass over the towers and
// relieves himself on each week that saw a contribution, about one tower every DROP_EVERY seconds; where a
// dropping lands, that week's days splatter down the facade in GitHub's shading. Once he is gone, a
// commuter train runs through and the splats slide down the glass tower by tower, in the order they
// landed, and drop away at street level. A short pause on the clean city, and he comes back. Masts and
// spires blink their warning lights throughout.
//
// The dark card is the city at night; the light card is the same city by day, the splats green like the
// graph's cells. As everywhere, the final frame is the default and animation only runs from hidden, so
// reduced motion shows the whole splattered city, and no raven or train.

import type { Calendar } from "./data.ts";
import { raven } from "./raven.ts";
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
const PAD = 20;
const INNER = CITY_W - 2 * PAD;
/** Street level, and the depth of the street and tracks below it. */
const SHORE = 246;
const WATER = 30;
/** Floor pitch, and a window's height within it. */
const FLOOR = 7;
const WIN_H = 4.5;
/** Seconds between droppings (one per tower), when Huginn sets off, and how far off-card he starts. */
const DROP_EVERY = 0.7;
const RUN_START = 1.5;
const RUN_MARGIN = 30;
const RAVEN_SCALE = 0.75;
/** Where a dropping leaves the raven, relative to his centre at scale 1: under the tail. */
const VENT: [number, number] = [-3, 1];
/** After he has gone: a beat, then one tower's splats start to slide every SLIDE_EVERY seconds. */
const SLIDE_GAP = 0.8;
const SLIDE_EVERY = 0.16;
/** Each splat's own start within its tower's slide, at most this late, so the floors don't move as one. */
const JITTER = 0.35;
/** A slide: a slow creep, then a fall past the street; how long it then waits out of sight. */
const CREEP = 0.7;
const DRIP = 2.1;
const HOLD = JITTER + 0.3;
/** How far a splat slides: from the top day floor to below the street. */
const SLIDE_PX = 170;
/** The clean city after the last splat has gone, before he comes back. */
const PAUSE = 2.5;
/** The commuter train's crossing, right to left, starting this long after he leaves. */
const TRAIN_AFTER = 0.2;
const TRAIN_S = 6.5;
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

/** A three-car commuter train facing left, its wheels on the rail at `rail`, starting at x = 0. */
const CAR = 52;
const CARS = 3;
const TRAIN_W = CARS * CAR + (CARS - 1) * 2;
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

interface Week {
  w: number;
  mid: number;
  to: number;
  drop: number;
  dur: number;
  release: number;
  hit: number;
  splats: { d: number; path: string; fill: string }[];
}

export function renderCity(cal: Calendar | undefined, p: Palette, c: CityColors): string {
  const days = cal?.counts.length ?? 0;
  const weeks = Math.max(53, Math.ceil(days / 7));
  const step = INNER / weeks;
  const levelAt = (i: number) => (cal && i < days ? (cal.levels[i] ?? 0) : 0);
  const mess = rng(7);
  const ooze = rng(11);

  // Huginn's pass: slow enough to cross a week every DROP_EVERY seconds. Where he is at any moment is
  // fixed before the loop's length is, since the pass doesn't depend on it.
  const cross = ((INNER + 2 * RUN_MARGIN) / step) * DROP_EVERY;
  const flight = { width: INNER, y0: 66, y1: 58, scale: RAVEN_SCALE, start: RUN_START, margin: RUN_MARGIN };
  const path = raven({ near: p.text, far: p.dim }, { ...flight, cycle: cross, across: 100 });

  const bodies: string[] = [];
  const roofs: string[] = [];
  const trims: string[] = [];
  const marks: string[] = [];
  const stripes: string[] = [];
  const crowns: string[] = [];
  const empty: string[] = [];
  const lights: string[] = [];
  const lit: Week[] = [];
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
      lights.push(`<circle class="beacon" cx="${lx}" cy="${ly}" r="1.3" fill="${p.accent}" style="animation-duration:${(1.6 + mess() * 0.9).toFixed(2)}s;animation-delay:${(mess() * 2).toFixed(2)}s"/>`);
    }
    for (const end = w + b.weeks; w < end; w++) {
      const winX = f(PAD + w * step + 2.2);
      const winW = f(step - 4.4);
      const mid = f(PAD + w * step + step / 2);
      // Every window starts dark; the lit ones are splattered on later.
      for (let k = 0; k < b.floors; k++) empty.push(`M${winX} ${SHORE - (k + 1) * FLOOR}h${winW}v${WIN_H}h-${winW}Z`);
      const days7 = Array.from({ length: 7 }, (_, d) => w * 7 + d).filter((i) => i < days && levelAt(i) > 0);
      if (!days7.length) continue;

      // Release when the vent is over the column's middle, and fall (accelerating) to the roof there.
      const s = ((mid - PAD - VENT[0] * RAVEN_SCALE + RUN_MARGIN) / (INNER + 2 * RUN_MARGIN)) * cross;
      const from = path.at(s)[1] + VENT[1] * RAVEN_SCALE;
      const to = f(dressed.landing(mid));
      const drop = Math.max(0, to - from);
      const dur = 0.1 * Math.sqrt(drop);
      const release = RUN_START + s;
      const splats = days7.map((i) => {
        // Sunday (d = 0) on the top floor, Saturday six floors down.
        const d = i - w * 7;
        const y = SHORE - (b.floors - d) * FLOOR;
        return { d, path: splat(winX + winW / 2, y + WIN_H / 2, winW / 2 + 0.6, 2.7, mess), fill: c.windows[levelAt(i)] };
      });
      lit.push({ w, mid, to, drop, dur, release, hit: release + dur, splats });
    }
  }

  // The loop: his pass, then the slides tower by tower, then the pause. Everything below repeats on it.
  const gone = RUN_START + cross;
  const slideAt = (k: number) => gone + SLIDE_GAP + k * SLIDE_EVERY;
  const clearAt = (k: number) => slideAt(k) + JITTER + DRIP + 0.1;
  const trainAt = gone + TRAIN_AFTER;
  const cycle = Number((Math.max(lit.length ? clearAt(lit.length - 1) : gone, trainAt + TRAIN_S) + PAUSE).toFixed(2));
  const pct = (t: number) => `${((t / cycle) * 100).toFixed(3)}%`;
  const huginn = raven({ near: p.text, far: p.dim }, { ...flight, cycle, across: (cross / cycle) * 100 });

  // Each week: its dropping falls, its splats land (each on its own, top floor first), the week shows from
  // the first landing until its last splat has slid out of sight, and each splat slides on its own, a
  // little after its neighbours.
  const fall: string[] = [];
  const shown: string[] = [];
  const drops: string[] = [];
  const groups: string[] = [];
  lit.forEach((wk, k) => {
    fall.push(
      `@keyframes d${wk.w} { 0% { transform: translateY(${f(-wk.drop)}px); opacity: 1; animation-timing-function: cubic-bezier(.55,.085,.68,.53); } ${pct(wk.dur)} { transform: translateY(0); opacity: 1; } ${pct(wk.dur + 0.01)}, 100% { transform: translateY(0); opacity: 0; } }`,
    );
    // Positioned by the group: a CSS transform on the path itself would replace a transform attribute.
    drops.push(`<g transform="translate(${wk.mid} ${f(wk.to)})"><path class="drop" d="${DROP}" style="animation:d${wk.w} ${cycle}s linear ${wk.release.toFixed(2)}s infinite"/></g>`);
    shown.push(`@keyframes w${wk.w} { 0%, ${pct(wk.hit)} { opacity: 0; } ${pct(wk.hit + 0.01)}, ${pct(clearAt(k))} { opacity: 1; } ${pct(clearAt(k) + 0.01)}, 100% { opacity: 0; } }`);
    const splats = wk.splats.map(
      (sp) =>
        `<g class="dr" style="animation-delay:${(slideAt(k) + ooze() * JITTER).toFixed(2)}s"><path class="sp" d="${sp.path}" fill="${sp.fill}" style="animation-delay:${(wk.hit + 0.04 + sp.d * 0.06).toFixed(2)}s"/></g>`,
    );
    groups.push(`<g class="wk" style="animation-name:w${wk.w}">${splats.join("")}</g>`);
  });


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

  // The street along the foot: a rail, its sleepers, and the train that runs along it.
  const RAIL = SHORE + 21;
  const t = train(RAIL);
  const tracks = `<path d="M${PAD} ${RAIL}H${CITY_W - PAD}" stroke="${p.border}" stroke-width=".9"/>
  <path d="M${PAD} ${RAIL + 1.8}H${CITY_W - PAD}" stroke="${p.dim}" stroke-width="1.4" stroke-dasharray="1.5 3.5" opacity=".55"/>`;
  const commuter = `<g class="train motion-only">
    <path d="${t.gear}" fill="none" stroke="${p.border}" stroke-width=".9"/>
    <path d="${t.body}" fill="${c.tower}" stroke="${p.border}" stroke-width=".8"/>
    <path d="${t.windows}" fill="${c.night ? c.windows[3] : p.faint}"${c.night ? ' filter="url(#glow)"' : ""}/>
  </g>`;

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
    ? `My GitHub contributions over the last year, drawn as a city ${c.night ? "at night" : "by day"} along the tracks, in a valley between two pine-topped rock hills: one tower a week, one window a day. Huginn the raven flies over and poops on each tower, splattering that week's windows in the shade of each day's contributions; then the splats slide off, tower by tower, and he comes back. ${summary.replaceAll(" · ", ", ")}.`
    : "My GitHub contributions over the last year, drawn as a city: one tower a week, one window a day, for Huginn the raven to poop on.";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CITY_W + 2 * GUTTER}" height="${H + 2 * GUTTER}" viewBox="0 0 ${CITY_W + 2 * GUTTER} ${H + 2 * GUTTER}" role="img" aria-labelledby="title">
<title id="title">${esc(title)}</title>
<style>
  text { font-family: ${FONT}; white-space: pre; }
  @keyframes twinkle { 50% { opacity: .08; } }
  @keyframes blink { 50% { opacity: .15; } }
  @keyframes splat { 0% { opacity: 0; transform: scale(.2, .5); } ${pct(0.135)} { opacity: 1; transform: scale(1.4, .8); } ${pct(0.3)}, ${pct(cycle - PAUSE)} { opacity: 1; transform: scale(1); } ${pct(cycle - PAUSE + 0.01)}, 100% { opacity: 0; transform: scale(1); } }
  @keyframes drip { 0% { transform: none; animation-timing-function: ease-in-out; } ${pct(CREEP)} { transform: translateY(3px) scale(.9, 1.3); animation-timing-function: cubic-bezier(.5, 0, .9, .55); } ${pct(DRIP)}, ${pct(DRIP + HOLD)} { transform: translateY(${SLIDE_PX}px) scale(.7, 1.8); } ${pct(DRIP + HOLD + 0.01)}, 100% { transform: none; } }
  @keyframes train { 0%, ${pct(trainAt)} { transform: translateX(${CITY_W + 10}px); } ${pct(trainAt + TRAIN_S)}, 100% { transform: translateX(${-TRAIN_W - 10}px); } }
  @keyframes led { 0%, 100% { stroke: ${c.windows[3]}; } 33% { stroke: ${p.accent}; } 66% { stroke: ${c.windows[4]}; } }
  .wk { animation: ${cycle}s linear infinite both; }
  .dr { transform-box: fill-box; transform-origin: 50% 0; animation: drip ${cycle}s infinite; }
  .sp { transform-box: fill-box; transform-origin: 50% 0; animation: splat ${cycle}s ease-out infinite both; }
  .drop { opacity: 0; }
  ${shown.join("\n  ")}
  ${fall.join("\n  ")}
  .train { transform: translateX(${CITY_W + 10}px); animation: train ${cycle}s linear infinite; }
  .crown { animation: led 9s ease-in-out infinite; }
  .twinkle { animation: twinkle 2.8s ease-in-out infinite; }
  .beacon { animation: blink 1.6s step-end 3s infinite; }
  ${huginn.css}
  ${FRAME_CSS}
  ${REDUCED_MOTION}
</style>
<defs>
  <clipPath id="screen"><rect width="${CITY_W}" height="${H}"/></clipPath>
  <clipPath id="behind"><rect x="${PAD}" width="${INNER}" height="${SHORE}"/></clipPath>
  <clipPath id="street"><rect x="${PAD}" y="${SHORE}" width="${INNER}" height="${WATER}"/></clipPath>
  <clipPath id="above"><rect x="${PAD}" width="${INNER}" height="${SHORE}"/></clipPath>
  ${c.night ? `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : ""}
</defs>
<g transform="translate(${GUTTER} ${GUTTER})">
<g clip-path="url(#screen)">
  <rect width="${CITY_W}" height="${H}" fill="${p.bg}"/>
  <text x="${PAD}" y="36" font-size="18" font-weight="700" fill="${p.text}"><tspan fill="${p.dim}">▸ </tspan>contributions</text>
  <text x="${CITY_W - PAD}" y="36" font-size="11" fill="${p.dim}" text-anchor="end">${esc(range)}</text>
  ${stars}
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
    <g clip-path="url(#above)"><g${c.night ? ' filter="url(#glow)"' : ""}>${groups.join("")}</g></g>
  </g>
  <path d="M${PAD} ${SHORE}H${CITY_W - PAD}" stroke="${p.border}"/>
  <g clip-path="url(#street)">${commuter}</g>
  <g transform="translate(${PAD} 0)">${huginn.svg}</g>
  <g class="motion-only" fill="${p.text}">${drops.join("")}</g>
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
