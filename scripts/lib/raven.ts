// Huginn, the raven that crosses northguild.dev's sky, at card size. Like the site's (its
// apps/site/src/scripts/aurora.raven.ts) he glides most of the time and flaps in short bouts at about
// 3.4 beats a second, the hand folding back on the upstroke; a heavy head and bill held forward, a
// wedge tail and fingered primaries.
//
// Seen from a little below and to the side while he flies right. The wingbeat is six silhouettes
// shown one after another (CSS can't morph paths in every browser); a slower cycle switches between
// a flapping bout and a glide, and he gains a little height while he flaps.

type P = [number, number];

const f = (n: number) => Number(n.toFixed(2));
const pt = ([x, y]: P) => `${f(x)} ${f(y)}`;
const lerp = (a: P, b: P, t: number): P => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// Heavy head and bill forward (+x), wedge tail behind.
const BODY =
  "M10 0.1 L8 -0.55 Q6.6 -1.6 4.4 -1.4 Q-0.5 -1.3 -5 -0.6 L-9.4 -1.6 L-10 0.2 L-9.3 1.4 L-5 0.7 Q-0.5 1.4 4 1.1 Q6.6 1 8 0.45 Z";

/**
 * One wing. `lift` is its angle above the horizontal in degrees, `span` its length, `sweep` how far the
 * tip trails behind the shoulder (the hand folding back). The near wing, seen from below, hangs a little
 * lower than its angle says; the far one is foreshortened and rides a little higher.
 */
export function wing(lift: number, span: number, sweep: number, near: boolean): string {
  const a = (lift * Math.PI) / 180;
  const len = near ? span : span * 0.85;
  const k = near ? 0.7 : -0.55;
  const front: P = [3.4, -0.3];
  const back: P = [-3.6, -0.2];
  const tip: P = [0.4 - sweep, -len * Math.sin(a) + k * len * Math.cos(a)];
  const wrist: P = [3.4 - sweep * 0.25, tip[1] * 0.45];
  const trail = (t: number) => lerp(tip, back, t);
  const pts: P[] = [front, wrist, tip];
  // Five primaries: a notch toward the leading edge between each pair of finger tips.
  for (let i = 1; i <= 4; i++) {
    pts.push(lerp(trail(i * 0.075), wrist, 0.2));
    pts.push(trail(i * 0.075 + 0.035));
  }
  // The secondaries bulge the inner trailing edge a little.
  const mid = trail(0.62);
  const out: P = [mid[0] - 1.4, mid[1] + Math.sign(tip[1] || 1) * 0.6];
  return `M${pt(front)} L${pts.slice(1).map(pt).join(" L")} Q${pt(out)} ${pt(back)} Z`;
}

// [lift, span, sweep] through one wingbeat: top of the upstroke, the downstroke, then back up with the
// hand folded.
const BEAT: Array<[number, number, number]> = [
  [62, 13, 4.5],
  [30, 15, 2.6],
  [-5, 15.5, 1.8],
  [-38, 14, 2.6],
  [0, 10, 5.8],
  [38, 11, 5.6],
];
const GLIDE: [number, number, number] = [8, 15.5, 2.4];

const BEAT_S = 0.29; // ~3.4 beats a second
const BOUT_S = 3.2; // one flapping bout and one glide
const FLAP_SHARE = 0.35;

function pose([lift, span, sweep]: [number, number, number], near: string, far: string): string {
  return `<path d="${wing(lift, span, sweep, false)}" fill="${far}"/><path d="${BODY}" fill="${near}"/><path d="${wing(lift, span, sweep, true)}" fill="${near}"/>`;
}

export interface RavenColors {
  near: string;
  far: string;
}

/**
 * The raven and its CSS. He crosses `width` px of sky once every `cycle` seconds, between `y0` and `y1`,
 * drawn at `scale` (1 = a body 20 px long).
 */
export function raven(c: RavenColors, o: { width: number; y0: number; y1: number; scale: number; cycle: number; start: number }): { svg: string; css: string } {
  const n = BEAT.length;
  const frames = BEAT.map((b, i) => `<g class="beat" style="animation-delay:-${f((BEAT_S / n) * (n - i))}s">${pose(b, c.near, c.far)}</g>`).join("");
  const across = 45; // percent of the cycle he is in view
  const way = (pct: number) => {
    const t = pct / across;
    // A gentle climb with a little sag in the middle.
    return `${f(-20 + t * (o.width + 40))}px, ${f(o.y0 + (o.y1 - o.y0) * t + Math.sin(t * Math.PI) * 4)}px`;
  };
  const flight = [0, 9, 18, 27, 36, 45].map((p) => `${p}% { transform: translate(${way(p)}); }`).join(" ");
  const on = (FLAP_SHARE * 100).toFixed(0);
  return {
    svg: `<g class="raven motion-only"><g class="bob"><g transform="scale(${o.scale})">
        <g class="flap">${frames}</g>
        <g class="glide">${pose(GLIDE, c.near, c.far)}</g>
      </g></g></g>`,
    css: `@keyframes raven { ${flight} 45.01%, 100% { transform: translate(-40px, ${o.y0}px); } }
  @keyframes beat { 0% { opacity: 1; } ${f(100 / n)}%, 100% { opacity: 0; } }
  @keyframes flap { 0% { opacity: 1; } ${on}%, 100% { opacity: 0; } }
  @keyframes glide { 0% { opacity: 0; } ${on}%, 100% { opacity: 1; } }
  @keyframes bob { 0% { transform: translateY(0); } ${on}% { transform: translateY(-2.5px); } 100% { transform: translateY(0); } }
  .raven { animation: raven ${o.cycle}s linear ${o.start}s infinite both; }
  .beat { animation: beat ${BEAT_S}s step-end infinite; }
  .flap { animation: flap ${BOUT_S}s step-end infinite; }
  .glide { animation: glide ${BOUT_S}s step-end infinite; }
  .bob { animation: bob ${BOUT_S}s ease-in-out infinite; }`,
  };
}
