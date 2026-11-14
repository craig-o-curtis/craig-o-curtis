// Home, behind the contribution city (city.ts and street.ts): the valley the tracks run down, between two
// rock hills with pines and spruces on top, and the business parks' offices standing further off.
//
// Drawn by hand in card coordinates: x runs 0 to WIDTH, y is 0 at street level and negative upward.

export const WIDTH = 800;

const f = (n: number) => Number(n.toFixed(2));
const rect = (x: number, y: number, w: number, h: number) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
/** A box standing on the street, `h` tall. */
const block = (x: number, w: number, h: number) => rect(x, -h, w, h);
const ellipse = (cx: number, cy: number, rx: number, ry: number) =>
  `M${f(cx - rx)} ${f(cy)}a${f(rx)} ${f(ry)} 0 1 0 ${f(2 * rx)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-2 * rx)} 0Z`;
const poly = (pts: ReadonlyArray<readonly [number, number]>) => `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;

/** A hill's top edge, left to right. */
type Ridge = ReadonlyArray<readonly [number, number]>;
const LEFT_HILL: Ridge = [
  [0, -126], [14, -131], [30, -129], [46, -121], [60, -117], [76, -108], [90, -97], [104, -90], [118, -80],
  [132, -66], [146, -50], [160, -30], [172, 0],
];
const RIGHT_HILL: Ridge = [
  [628, 0], [640, -30], [652, -52], [668, -70], [684, -84], [700, -96], [716, -106], [734, -114], [752, -122],
  [770, -127], [786, -132], [800, -130],
];

/** How high a ridge stands at x. */
function ridgeAt(r: Ridge, x: number): number {
  for (let i = 1; i < r.length; i++) {
    const [x0, y0] = r[i - 1];
    const [x1, y1] = r[i];
    if (x >= x0 && x <= x1) return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
  }
  return 0;
}

/**
 * A conifer rooted at (x, y) and `h` tall. Mostly spruces, a narrow stack of drooping tiers; every third
 * a pine, a bare trunk under a lopsided rounded crown.
 */
function tree(x: number, y: number, h: number, i: number): string {
  if (i % 3 !== 1) {
    const tiers = 5;
    let d = rect(x - 0.5, y - h * 0.15, 1, h * 0.15);
    for (let t = 0; t < tiers; t++) {
      const base = y - h * 0.1 - (t * h * 0.78) / tiers;
      const half = (h * 0.24 * (tiers - t)) / tiers + 0.8;
      d += `M${f(x - half)} ${f(base + 0.8)}Q${f(x - half * 0.4)} ${f(base - h * 0.08)} ${f(x)} ${f(base - h * 0.3)}Q${f(x + half * 0.4)} ${f(base - h * 0.08)} ${f(x + half)} ${f(base + 0.8)}Z`;
    }
    return d;
  }
  const lean = h * 0.08;
  let d = `M${f(x - 0.8)} ${f(y)}L${f(x + lean - 0.4)} ${f(y - h * 0.62)}L${f(x + lean + 0.4)} ${f(y - h * 0.62)}L${f(x + 0.8)} ${f(y)}Z`;
  d += ellipse(x + lean, y - h * 0.78, h * 0.24, h * 0.2);
  d += ellipse(x + lean - h * 0.16, y - h * 0.66, h * 0.16, h * 0.13);
  d += ellipse(x + lean + h * 0.15, y - h * 0.86, h * 0.14, h * 0.12);
  return d;
}

const hill = (r: Ridge, trees: ReadonlyArray<readonly [number, number]>) =>
  `${poly([[r[0][0], 0], ...r, [r[r.length - 1][0], 0]])}${trees.map(([x, h], i) => tree(x, ridgeAt(r, x), h, i)).join("")}`;

/** Far: the business parks' offices, behind everything nearer. */
export const FAR = [
  // West: behind the hill and the manor.
  block(80, 30, 128),
  block(112, 22, 136),
  block(150, 40, 124),
  block(186, 30, 142),
  rect(194, -148, 10, 6),
  block(222, 30, 128),
  rect(228, -133, 14, 5),
  // The middle of the valley, beyond the towers.
  block(268, 26, 120),
  block(300, 40, 112),
  block(420, 30, 126),
  rect(428, -131, 12, 5),
  block(470, 36, 116),
  block(560, 28, 124),
  // East: over the far hill.
  block(596, 32, 122),
  rect(604, -127, 12, 5),
  block(626, 28, 136),
  block(652, 42, 120),
  rect(664, -126, 16, 6),
  block(692, 30, 130),
].join("");

/** Near: the two hills and their trees. */
export const NEAR = [
  hill(LEFT_HILL, [[6, 22], [20, 16], [34, 24], [50, 18], [66, 20], [84, 15], [100, 17], [118, 13]]),
  hill(RIGHT_HILL, [[700, 14], [716, 18], [732, 22], [748, 16], [764, 24], [780, 19], [794, 21]]),
].join("");
