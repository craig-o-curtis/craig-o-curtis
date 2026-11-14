// The street the contribution city is built from (city.ts), west to east, seen from the tracks: blocks of
// flats, the old mall by the station with its striped crown, the manor's two wings with their scroll
// gables (stretched to seven storeys from their real two or three), the slab of flats with plant rooms
// and its terrace wing, the mall's tall north face with its lattice sign mast, the stepped pair of slabs
// standing on it, the mall's east end with its glass box and steel silos, the office tower with the
// sloped crown, the drum on its roof and the steel frame up its west side, the business-park offices,
// and more flats.
//
// Each building is so many weeks wide (one column of windows a week) and so many floors tall. The week's
// seven days are the top seven floors under the roof, Sunday highest, so a dropping that lands on the
// roof splatters straight down them.

export type Kind =
  | "flats"
  | "office"
  | "old-mall"
  | "manor"
  | "flats-tower"
  | "terrace"
  | "mall-mast"
  | "slab"
  | "mall-silos"
  | "wing"
  | "crown-tower";

export interface Building {
  kind: Kind;
  weeks: number;
  floors: number;
}

/** West to east. The last one takes whatever weeks are left, so the street always fills the year. */
export const STREET: readonly Building[] = [
  { kind: "flats", weeks: 3, floors: 8 },
  { kind: "old-mall", weeks: 4, floors: 7 },
  { kind: "flats", weeks: 2, floors: 9 },
  { kind: "manor", weeks: 2, floors: 7 },
  { kind: "manor", weeks: 2, floors: 7 },
  { kind: "flats", weeks: 3, floors: 10 },
  { kind: "flats-tower", weeks: 2, floors: 21 },
  { kind: "terrace", weeks: 1, floors: 11 },
  { kind: "mall-mast", weeks: 3, floors: 9 },
  { kind: "slab", weeks: 2, floors: 19 },
  { kind: "slab", weeks: 1, floors: 17 },
  { kind: "mall-silos", weeks: 4, floors: 9 },
  { kind: "wing", weeks: 1, floors: 8 },
  { kind: "crown-tower", weeks: 3, floors: 20 },
  { kind: "wing", weeks: 2, floors: 9 },
  { kind: "office", weeks: 3, floors: 12 },
  { kind: "flats", weeks: 3, floors: 8 },
  { kind: "flats", weeks: 2, floors: 10 },
  { kind: "office", weeks: 3, floors: 11 },
  { kind: "flats", weeks: 4, floors: 9 },
  { kind: "flats", weeks: 3, floors: 8 },
];

/** The street for a year of `weeks` weeks: the last building stretches or shrinks to fill it. */
export function layout(weeks: number): Building[] {
  const head = STREET.slice(0, -1);
  const used = head.reduce((n, b) => n + b.weeks, 0);
  const last = STREET[STREET.length - 1];
  return [...head, { ...last, weeks: Math.max(1, weeks - used) }];
}

const f = (n: number) => Number(n.toFixed(2));
const rect = (x: number, y: number, w: number, h: number) => `M${f(x)} ${f(y)}h${f(w)}v${f(h)}h${f(-w)}Z`;
const circle = (cx: number, cy: number, r: number) => `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;

/**
 * The outline of a scroll gable `w` wide and `h` tall on eaves at (cx, y), from its west foot to its east
 * foot: curved shoulders stepping in twice to a round crown. Continues a path already at (cx - w/2, y).
 */
function gable(cx: number, y: number, w: number, h: number): string {
  const s = w / 2;
  const L = (dx: number) => f(cx - dx);
  const R = (dx: number) => f(cx + dx);
  const Y = (k: number) => f(y - h * k);
  return `V${Y(0.18)}Q${L(s * 0.62)} ${Y(0.2)} ${L(s * 0.62)} ${Y(0.48)}Q${L(s * 0.4)} ${Y(0.5)} ${L(s * 0.4)} ${Y(0.72)}H${L(s * 0.28)}Q${f(cx)} ${Y(1.12)} ${R(s * 0.28)} ${Y(0.72)}H${R(s * 0.4)}Q${R(s * 0.4)} ${Y(0.5)} ${R(s * 0.62)} ${Y(0.48)}Q${R(s * 0.62)} ${Y(0.2)} ${R(s)} ${Y(0.18)}V${f(y)}`;
}

export interface Dressed {
  /** The building's outline, walls and all: filled like a tower. */
  body: string;
  /** What stands on the roof: filled like a tower too. */
  roof: string;
  /** Hairlines over the sky: a lattice mast, a railing. */
  trim: string;
  /** Marks on the walls in the unlit windows' colour: an oculus, a joint. */
  marks: string;
  /** Stripes on the walls in the dim colour. */
  stripes: string;
  /** Warning lights. */
  lights: Array<[number, number]>;
  /** A crown lit after dark in changing colours. */
  crown?: string;
  /** Where a dropping lands at x: the top of whatever is there. */
  landing: (x: number) => number;
}

/**
 * Dresses a building `w` wide from x on the street at `ground`, its walls rising to `top` (the parapet
 * over its top floor of windows).
 */
export function dress(b: Building, x: number, w: number, ground: number, top: number): Dressed {
  const d: Dressed = { body: rect(x, top, w, ground - top), roof: "", trim: "", marks: "", stripes: "", lights: [], landing: () => top };
  const r = x + w;
  const mid = x + w / 2;
  switch (b.kind) {
    case "flats":
      // A lift-motor room on the roof, off-centre.
      d.roof = rect(x + w * 0.62, top - 4, Math.min(9, w * 0.2), 4);
      break;
    case "office":
      d.roof = rect(x + 4, top - 3, w * 0.3, 3) + rect(r - w * 0.35, top - 5, w * 0.2, 5);
      break;
    case "old-mall": {
      // A tall brick crown over the top floor, striped in red.
      const crown = 8;
      d.body = rect(x, top - crown, w, ground - top + crown);
      for (let s = x + 3; s < r - 2; s += 5.2) d.stripes += rect(s, top - crown + 1.5, 1.4, 4 + ((s - x) % 3));
      d.landing = () => top - crown;
      break;
    }
    case "manor": {
      // A hipped roof, two chimneys and a scroll gable on the front, its oculus and window.
      // The gable rises out of the front wall; the roof shows either side of it.
      const g = w * 0.39;
      d.body = `M${f(x)} ${ground}V${top}H${f(mid - g)}${gable(mid, top, 2 * g, 20)}H${f(r)}V${ground}Z`;
      d.roof = `M${f(x - 1)} ${top}L${f(x + 4)} ${top - 7}H${f(mid - g)}V${top}ZM${f(mid + g)} ${top}V${top - 7}H${f(r - 4)}L${f(r + 1)} ${top}Z` + rect(x + 2, top - 12, 3, 5) + rect(r - 5, top - 13, 3, 6);
      d.marks = circle(mid, top - 14, 2) + rect(mid - 1.8, top - 8, 3.6, 5);
      d.landing = (px) => (Math.abs(px - mid) < w * 0.3 ? top - 18 : top - 7);
      break;
    }
    case "flats-tower":
      // Plant rooms and the rescue helipad's railing on the roof.
      d.roof = rect(x + 3, top - 5, 8, 5) + rect(r - 13, top - 7, 10, 7);
      d.trim = `M${f(x + 1)} ${top - 2}H${f(r - 1)}`;
      d.lights.push([f(r - 8), top - 8.5]);
      d.landing = (px) => (px > r - 13 ? top - 7 : top - 5);
      break;
    case "terrace":
      d.trim = `M${f(x)} ${top - 3}H${f(r)}` + Array.from({ length: Math.floor(w / 3) }, (_, i) => `M${f(x + 1 + i * 3)} ${top}v-3`).join("");
      break;
    case "mall-mast": {
      // The sign mast near the west end: two legs, cross-bracing, two sign boxes and a light on top.
      const mx = x + 6;
      const mw = 8;
      const mt = top - 44;
      let lattice = `M${mx} ${top}V${mt}M${mx + mw} ${top}V${mt}`;
      for (let y = top; y > mt + 5; y -= 6) lattice += `M${mx} ${y}L${mx + mw} ${y - 6}M${mx + mw} ${y}L${mx} ${y - 6}`;
      d.trim = lattice;
      d.roof = rect(mx - 3, mt + 1, mw + 6, 7) + rect(mx - 2, mt + 14, mw + 4, 5);
      d.lights.push([mx + mw / 2, mt - 1.5]);
      d.landing = (px) => (px >= mx - 3 && px <= mx + mw + 3 ? mt + 1 : top);
      break;
    }
    case "slab":
      // The taller slab of the pair steps up a floor at its east end.
      if (b.floors > 17) {
        d.roof = rect(r - w * 0.3, top - 5, w * 0.3, 5);
        d.marks = Array.from({ length: Math.floor((ground - top) / 7) - 1 }, (_, i) => rect(x + 1, top + 4 + i * 7, 1.6, 1.2)).join("");
      }
      break;
    case "mall-silos": {
      // A glass box raised over the west half; two steel silos at the east corner.
      d.roof = rect(x + 4, top - 7, w * 0.4, 7) + `M${f(r - 18)} ${top}V${top - 12}Q${f(r - 14)} ${top - 16} ${f(r - 10)} ${top - 12}V${top}ZM${f(r - 8)} ${top}V${top - 10}Q${f(r - 4)} ${top - 14} ${f(r)} ${top - 10}V${top}Z`;
      d.marks = Array.from({ length: 4 }, (_, i) => rect(x + 8 + i * w * 0.08, top - 6, 0.8, 5)).join("");
      d.landing = (px) => (px < x + 4 + w * 0.4 ? top - 7 : px > r - 18 ? top - 13 : top);
      break;
    }
    case "crown-tower": {
      // The crown slopes down to the east; the drum sits at the low end; the frame stands off the west face.
      const rise = 11;
      d.body = `M${f(x)} ${ground}V${top - rise}L${f(r)} ${top}V${ground}Z`;
      d.roof =
        `M${f(r - 16)} ${top + 1}V${top - 6}Q${f(r - 7)} ${top - 12} ${f(r + 2)} ${top - 6}V${top + 1}Z` +
        rect(x - 4.6, top - rise + 2, 2.2, ground - top + rise - 2) +
        Array.from({ length: Math.floor((ground - top) / 18) }, (_, i) => rect(x - 4.6, top - rise + 10 + i * 18, 4.6, 1.2)).join("");
      d.crown = `M${f(x)} ${top - rise}L${f(r)} ${top}`;
      d.lights.push([f(r - 7), top - 11.5]);
      d.landing = (px) => (px > r - 16 ? top - 9 : top - rise * (1 - (px - x) / w));
      break;
    }
    case "wing":
      d.roof = rect(x + 2, top - 3, w - 4, 3);
      break;
  }
  return d;
}
