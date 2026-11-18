// The contribution city's act on the profile: the evening commute. The city starts dark. A commuter train
// runs through the year, west to east, and as it passes each week its windows light up one by one, a
// moment apart, as people get home: brighter on busier days. Once the train is gone the whole year stands
// lit for a while, then the lights go out building by building, and after a beat of dark the next train
// comes through.
//
// The sky keeps time with it, within each card's own colours. At night the train comes in at dusk: a glow
// along the hills fades as the stars come out, the moon rises behind the east hill, crosses, and sets
// behind the west one as the lights go out and the dawn glow comes back. By day the sun sinks behind the
// west hill as the train comes in and rises again as the lights go out. (A tint over the pale day sky only
// boxes it in and washes out the hills, so by day the sun alone keeps time.)

import { type Director, f, rng, TRAIN_EAST, TRAIN_W, TRAIN_WEST } from "./city.ts";

/** The README's alt text for the city card with this act. */
export const LIGHTS_ALT =
  "My GitHub contributions over the last year, drawn as a street of flats, malls, an old manor and towers along the tracks, in a valley between two pine-topped rock hills: a column of windows a week, one window a day. A commuter train runs through the year from left to right, and each week's windows light up as it passes, brighter on busier days.";

/** When the train sets off (the dark city before it), and how long it takes to cross the card. */
const TRAIN_AT = 1;
const TRAIN_S = 9;
/** A window starts to light this long after the train's nose has passed it, plus up to WALK more, and fades up over GLOW. */
const WALK_MIN = 0.15;
const WALK = 0.9;
const GLOW = 0.45;
/** The whole city lit, from the train leaving the card to the first light going out. */
const LIT = 4;
/** The lights go out week by week over this long, each fading over FADE. Then the dark, before the next train. */
const OUT = 2.5;
const FADE = 0.5;
const DARK = 1;
/** Dusk takes this long to deepen into night; dawn comes up over this long, as the lights go out. */
const DUSK = 3.5;
const DAWN = 3.5;
/** The moon's path: from behind the east hill, over the top of its arc, to behind the west one. */
const MOON_RISE: [number, number] = [775, 140];
const MOON_SET: [number, number] = [65, 140];
const MOON_TOP = 58;
const MOON_R = 8;
/** The sun, over the west hill by day, and how far it sinks to be behind it. */
const SUN: [number, number] = [75, 62];
const SUN_SET = 135;
const SUN_R = 10;

export const lights: Director = ({ p, c, columns }) => {
  const walk = rng(13);
  const bed = rng(17);
  const cycle = TRAIN_AT + TRAIN_S + LIT + OUT + FADE + DARK;
  const pct = (t: number) => `${((t / cycle) * 100).toFixed(3)}%`;
  /** When the train's nose (its east end, running east) passes x. */
  const passes = (x: number) => TRAIN_AT + ((x - TRAIN_W - TRAIN_WEST) / (TRAIN_EAST - TRAIN_WEST)) * TRAIN_S;
  const out = TRAIN_AT + TRAIN_S + LIT;

  // Each week shows from its first window lighting until its lights go out (`w<n>`). Within it each
  // window comes on at its own moment: a shared animation (`on`) delayed to that moment, which
  // stays dark for its last WALK of every loop so a window never shows before its own time.
  const shown: string[] = [];
  const groups: string[] = [];
  for (const col of columns) {
    if (!col.lit.length) continue;
    const pass = passes(col.mid);
    const wins = col.lit.map((win) => ({ win, at: pass + WALK_MIN + walk() * WALK }));
    const first = Math.min(...wins.map((w) => w.at));
    const off = out + bed() * OUT;
    shown.push(`@keyframes w${col.w} { 0%, ${pct(first)} { opacity: 0; } ${pct(first + 0.01)}, ${pct(off)} { opacity: 1; } ${pct(off + FADE)}, 100% { opacity: 0; } }`);
    const paths = wins.map(
      ({ win, at }) =>
        `<path class="on" d="M${win.x} ${win.y}h${win.w}v${win.h}h-${win.w}Z" fill="${c.windows[win.level]}" style="animation-delay:${at.toFixed(2)}s"/>`,
    );
    groups.push(`<g class="wk" style="animation-name:w${col.w}">${paths.join("")}</g>`);
  }

  const tail = `${pct(cycle - WALK - 0.1)} { opacity: 1; } ${pct(cycle - WALK - 0.09)}, 100% { opacity: 0; }`;
  // The sky. Its resting state, the one shown with reduced motion, is the city fully lit: night, or evening.
  const dawn = out + OUT + FADE - DAWN + 0.5;
  const kf = (name: string, stops: Array<[number, string]>) =>
    `@keyframes ${name} { ${stops.map(([t, v]) => `${t <= 0 ? "0%" : t >= cycle ? "100%" : pct(t)} { ${v} }`).join(" ")} }`;
  let sky: string;
  let behind: string;
  let defs: string;
  if (c.night) {
    const span = dawn + DAWN - TRAIN_AT;
    const at = (u: number): [number, number] => [
      f(MOON_RISE[0] + (MOON_SET[0] - MOON_RISE[0]) * u),
      f(MOON_RISE[1] + (MOON_SET[1] - MOON_RISE[1]) * u - (MOON_RISE[1] - MOON_TOP) * Math.sin(Math.PI * u)),
    ];
    const arc: Array<[number, string]> = Array.from({ length: 13 }, (_, k) => {
      const [x, y] = at(k / 12);
      return [TRAIN_AT + (k / 12) * span, `transform: translate(${x}px, ${y}px);`];
    });
    const [rx, ry] = at(0);
    const [sx, sy] = at(1);
    const [hx, hy] = at((out - TRAIN_AT) / span);
    sky = [
      kf("glow", [[0, "opacity: 1;"], [TRAIN_AT + DUSK, "opacity: 0;"], [dawn, "opacity: 0;"], [dawn + DAWN, "opacity: 1;"], [cycle, "opacity: 1;"]]),
      kf("stars", [[0, "opacity: .25;"], [TRAIN_AT + DUSK, "opacity: 1;"], [dawn, "opacity: 1;"], [dawn + DAWN, "opacity: .25;"], [cycle, "opacity: .25;"]]),
      kf("moon", [[0, `transform: translate(${rx}px, ${ry}px);`], ...arc, [cycle, `transform: translate(${sx}px, ${sy}px);`]]),
      `.tint { opacity: 0; animation: glow ${f(cycle)}s ease-in-out infinite; }`,
      `.stars { animation: stars ${f(cycle)}s ease-in-out infinite; }`,
      `.moon { transform: translate(${hx}px, ${hy}px); animation: moon ${f(cycle)}s linear infinite; }`,
    ].join("\n  ");
    // A crescent, lit on the west.
    const r = MOON_R;
    behind = `<rect class="tint" x="0" y="44" width="100%" height="${246 - 44}" fill="url(#dusk)"/>
  <g class="moon"><path d="M0 ${-r}A${r} ${r} 0 1 0 0 ${r}A${f(r * 0.75)} ${r} 0 1 1 0 ${-r}Z" fill="${c.windows[3]}" opacity=".85" filter="url(#glow)"/></g>`;
    defs = `<linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.windows[1]}" stop-opacity="0"/><stop offset="1" stop-color="${c.windows[1]}" stop-opacity=".8"/></linearGradient>`;
  } else {
    sky = [
      kf("sun", [
        [0, `transform: translate(${SUN[0]}px, ${SUN[1]}px);`],
        [TRAIN_AT * 0.5, `transform: translate(${SUN[0]}px, ${SUN[1]}px); animation-timing-function: ease-in;`],
        [TRAIN_AT * 0.5 + DUSK, `transform: translate(${SUN[0]}px, ${SUN_SET}px);`],
        [dawn, `transform: translate(${SUN[0]}px, ${SUN_SET}px); animation-timing-function: ease-out;`],
        [dawn + DAWN, `transform: translate(${SUN[0]}px, ${SUN[1]}px);`],
        [cycle, `transform: translate(${SUN[0]}px, ${SUN[1]}px);`],
      ]),
      `.sun { transform: translate(${SUN[0]}px, ${SUN_SET}px); animation: sun ${f(cycle)}s linear infinite; }`,
    ].join("\n  ");
    const rays = Array.from({ length: 8 }, (_, k) => {
      const a = (k / 8) * 2 * Math.PI;
      const [c0, s0] = [Math.cos(a), Math.sin(a)];
      return `M${f(c0 * (SUN_R + 3))} ${f(s0 * (SUN_R + 3))}L${f(c0 * (SUN_R + 7))} ${f(s0 * (SUN_R + 7))}`;
    }).join("");
    behind = `<g class="sun"><path d="${rays}" stroke="${p.border}" stroke-width="1.2" stroke-linecap="round" opacity=".7"/><circle r="${SUN_R}" fill="${c.windows[1]}" stroke="${p.border}" stroke-width=".8"/></g>`;
    defs = "";
  }

  const css = `@keyframes on { 0% { opacity: 0; animation-timing-function: ease-out; } ${pct(GLOW)} { opacity: 1; } ${tail} }
  .wk { animation: ${f(cycle)}s linear infinite both; }
  .on { animation: on ${f(cycle)}s linear infinite both; }
  ${shown.join("\n  ")}
  ${sky}`;

  return {
    story: "A commuter train runs through the year, and each week's windows light up as it passes, brighter on busier days.",
    cycle,
    css,
    windows: groups.join(""),
    behind,
    defs,
    train: { at: TRAIN_AT, dur: TRAIN_S, east: true },
  };
};
