// ARCHIVED: not on the profile. The contribution city's first act, kept to bring back later. To swap it in,
// pass `huginn` instead of `lights` to renderCity in build-profile.ts and put HUGINN_ALT in the README's
// city <img alt>.
//
// Every window starts dark. Huginn (raven.ts) makes one slow pass over the towers and relieves himself on
// each week that saw a contribution, about one tower every DROP_EVERY seconds; where a dropping lands, that
// week's days splatter down the facade in GitHub's shading. Once he is gone, a commuter train runs through
// and the splats slide down the glass tower by tower, in the order they landed, and drop away at street
// level. A short pause on the clean city, and he comes back.

import { type Director, f, INNER, PAD, rng } from "./city.ts";
import { raven } from "./raven.ts";

/** The README's alt text for the city card with this act. */
export const HUGINN_ALT =
  "My GitHub contributions over the last year, drawn as a street of flats, malls, an old manor and towers along the tracks, in a valley between two pine-topped rock hills: a column of windows a week, one window a day. Huginn the raven flies over and poops on each roof, splattering that week's windows in the shade of each day's contributions; then the splats slide down the glass, building by building, and he comes back for more.";

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

export const huginn: Director = ({ p, c, columns, step }) => {
  const mess = rng(7);
  const ooze = rng(11);

  // Huginn's pass: slow enough to cross a week every DROP_EVERY seconds. Where he is at any moment is
  // fixed before the loop's length is, since the pass doesn't depend on it.
  const cross = ((INNER + 2 * RUN_MARGIN) / step) * DROP_EVERY;
  const flight = { width: INNER, y0: 66, y1: 58, scale: RAVEN_SCALE, start: RUN_START, margin: RUN_MARGIN };
  const path = raven({ near: p.text, far: p.dim }, { ...flight, cycle: cross, across: 100 });

  const lit: Week[] = [];
  for (const col of columns) {
    if (!col.lit.length) continue;
    // Release when the vent is over the column's middle, and fall (accelerating) to the roof there.
    const s = ((col.mid - PAD - VENT[0] * RAVEN_SCALE + RUN_MARGIN) / (INNER + 2 * RUN_MARGIN)) * cross;
    const from = path.at(s)[1] + VENT[1] * RAVEN_SCALE;
    const drop = Math.max(0, col.roof - from);
    const dur = 0.1 * Math.sqrt(drop);
    const release = RUN_START + s;
    const splats = col.lit.map((win) => ({
      d: win.d,
      path: splat(win.x + win.w / 2, win.y + win.h / 2, win.w / 2 + 0.6, 2.7, mess),
      fill: c.windows[win.level],
    }));
    lit.push({ w: col.w, mid: col.mid, to: col.roof, drop, dur, release, hit: release + dur, splats });
  }

  // The loop: his pass, then the slides tower by tower, then the pause. Everything below repeats on it.
  const gone = RUN_START + cross;
  const slideAt = (k: number) => gone + SLIDE_GAP + k * SLIDE_EVERY;
  const clearAt = (k: number) => slideAt(k) + JITTER + DRIP + 0.1;
  const trainAt = gone + TRAIN_AFTER;
  const cycle = Number((Math.max(lit.length ? clearAt(lit.length - 1) : gone, trainAt + TRAIN_S) + PAUSE).toFixed(2));
  const pct = (t: number) => `${((t / cycle) * 100).toFixed(3)}%`;
  const bird = raven({ near: p.text, far: p.dim }, { ...flight, cycle, across: (cross / cycle) * 100 });

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

  const css = `@keyframes splat { 0% { opacity: 0; transform: scale(.2, .5); } ${pct(0.135)} { opacity: 1; transform: scale(1.4, .8); } ${pct(0.3)}, ${pct(cycle - PAUSE)} { opacity: 1; transform: scale(1); } ${pct(cycle - PAUSE + 0.01)}, 100% { opacity: 0; transform: scale(1); } }
  @keyframes drip { 0% { transform: none; animation-timing-function: ease-in-out; } ${pct(CREEP)} { transform: translateY(3px) scale(.9, 1.3); animation-timing-function: cubic-bezier(.5, 0, .9, .55); } ${pct(DRIP)}, ${pct(DRIP + HOLD)} { transform: translateY(${SLIDE_PX}px) scale(.7, 1.8); } ${pct(DRIP + HOLD + 0.01)}, 100% { transform: none; } }
  .wk { animation: ${cycle}s linear infinite both; }
  .dr { transform-box: fill-box; transform-origin: 50% 0; animation: drip ${cycle}s infinite; }
  .sp { transform-box: fill-box; transform-origin: 50% 0; animation: splat ${cycle}s ease-out infinite both; }
  .drop { opacity: 0; }
  ${shown.join("\n  ")}
  ${fall.join("\n  ")}
  ${bird.css}`;

  return {
    story:
      "Huginn the raven flies over and poops on each tower, splattering that week's windows in the shade of each day's contributions; then the splats slide off, tower by tower, and he comes back.",
    cycle,
    css,
    windows: groups.join(""),
    sky: `<g transform="translate(${PAD} 0)">${bird.svg}</g>
  <g class="motion-only" fill="${p.text}">${drops.join("")}</g>`,
    train: { at: trainAt, dur: TRAIN_S, east: false },
  };
};
