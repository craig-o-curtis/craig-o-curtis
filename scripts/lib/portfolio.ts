// A window onto the portfolio site, dressed in its default Helsinki skin: bone type on charcoal (ink on
// paper in the light theme), and along the foot the city from the harbour that the site draws behind it
// (harbour.ts). The dark card is Helsinki after dark, floodlit, the windows lighting one by one as it
// loads; the light card is the same drawing by day. The skins still to unlock, and in the footer the site's
// field guide meter with its quest marker, hint at the game.
//
// Everything is drawn in its final state; the CSS only fades it in once. The one thing that keeps moving
// is the SkyWheel, a turn every two minutes, as on the site. Reduced motion holds it all still.

import {
  BLOCKS,
  DETAILS,
  FAR,
  FLOODLIT,
  GLINTS,
  GROUND,
  LAMPS,
  LANDMARKS,
  LIT,
  SPAN,
  WHEEL,
  WINDOWS,
} from "./harbour.ts";
import { ADVANCE, esc, FONT, REDUCED_MOTION } from "./theme.ts";

export interface PortfolioInput {
  url: string;
  host: string;
  lines: [string, string];
  /** Skins the visitor has yet to unlock, in the site's dial order. */
  locked: string[];
  /** Questions in the field guide, one unlock each. */
  unlocks: number;
}

/** Helsinki's tokens (the site's theme.css) and its skyline palette (its scenes/skyline.ts). */
export interface HelsinkiPalette {
  bg: string;
  fg: string;
  muted: string;
  accent: string;
  signal: string;
  onSignal: string;
  led: string;
  control: string;
  hairline: string;
  /** The glow over the rooftops at this hour, and the harbour under it. */
  glow: string;
  far: string;
  near: string;
  ink: string;
  /** Night lighting; absent by day. */
  night?: { flood: string; window: string; lit: string };
}

export const HELSINKI_DARK: HelsinkiPalette = {
  bg: "#111214",
  fg: "#efe9dc",
  muted: "#c2bcae",
  accent: "#9db7d6",
  signal: "#e0b15c",
  onSignal: "#111214",
  led: "#d8c9a3",
  control: "#7a7466",
  hairline: "rgb(239 233 220 / 0.14)",
  glow: "#1d2130",
  far: "#181b22",
  near: "#0f1013",
  ink: "rgb(157 183 214 / 0.3)",
  night: { flood: "#382d1b", window: "rgb(242 200 121 / 0.9)", lit: "#f2c879" },
};

export const HELSINKI_LIGHT: HelsinkiPalette = {
  bg: "#f6f4ef",
  fg: "#1d1d1b",
  muted: "#48443c",
  accent: "#2a5180",
  signal: "#7a5200",
  onSignal: "#ffffff",
  led: "#5e5028",
  control: "#8a8375",
  hairline: "rgb(29 29 27 / 0.14)",
  glow: "#dbe7f3",
  far: "#e4e8ee",
  near: "#d8dee6",
  ink: "rgb(42 81 128 / 0.34)",
};

// GitHub's own UI stack: the site's Geist can't load inside an <img>.
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";

export const PORTFOLIO_W = 840;
const H = 286;
const GUTTER = 6;
const PAD = 26;
/** Where the shore sits, and how big the city is drawn. */
const SHORE = 240;
const K = PORTFOLIO_W / (SPAN.to - SPAN.from);
const SPOKES = 16;
const WHEEL_PERIOD_S = 120;

const f = (n: number) => Number(n.toFixed(1));

/** Lock-on brackets round a box, like the site's quest marker round its meter. */
function brackets(x: number, y: number, w: number, h: number, arm: number): string {
  const r = x + w;
  const b = y + h;
  return [
    `M${x} ${y + arm}V${y}H${x + arm}`,
    `M${r - arm} ${y}H${r}V${y + arm}`,
    `M${r} ${b - arm}V${b}H${r - arm}`,
    `M${x + arm} ${b}H${x}V${b - arm}`,
  ].join("");
}

function padlock(x: number, y: number, color: string): string {
  return `<path d="M${x + 1.5} ${y + 4}V${y + 2.5}a2.5 2.5 0 0 1 5 0V${y + 4}" fill="none" stroke="${color}" stroke-width="1.2"/><rect x="${x}" y="${y + 4}" width="8" height="6" rx="1" fill="${color}"/>`;
}

/** The SkyWheel drawn round its hub at (0, 0), in the city's units: rim, hub, spokes, gondolas. */
function wheel(p: HelsinkiPalette, line: number): string {
  const { r } = WHEEL;
  const spokes: string[] = [];
  const cars: string[] = [];
  for (let i = 0; i < SPOKES; i++) {
    const a = (i / SPOKES) * Math.PI * 2;
    const [c, s] = [Math.cos(a), Math.sin(a)];
    spokes.push(`M${f(c * r * 0.18)} ${f(s * r * 0.18)}L${f(c * r)} ${f(s * r)}`);
    cars.push(`<circle cx="${f(c * r)}" cy="${f(s * r)}" r="3.4"/>`);
  }
  const rim = `<circle r="${r}"/><circle r="${f(r * 0.18)}"/>`;
  const lit = p.night
    ? `<g class="dusk" filter="url(#glow)" fill="none" stroke="${p.night.lit}" stroke-opacity=".65" stroke-width="1.4"><circle r="${r}"/></g>`
    : "";
  return `<g fill="none" stroke="${p.ink}" stroke-width="${f(line)}">${rim}<path d="${spokes.join("")}"/></g>${lit}
    <g fill="${p.near}" stroke="${p.ink}" stroke-width="${f(line)}">${cars.join("")}</g>${
      p.night ? `<g class="dusk" fill="${p.night.window}">${cars.join("").replaceAll('r="3.4"', 'r="1.4"')}</g>` : ""
    }`;
}

/** The city above the shore, in its own units; the card scales it into place. */
function city(p: HelsinkiPalette): string {
  const line = 1 / K;
  const night = p.night;
  const floods = night
    ? FLOODLIT.map((face, i) => `<path d="${face.d}" fill="url(#flood${i})"/>`).join("")
    : "";
  const buckets = 6;
  const windows = night
    ? Array.from({ length: buckets }, (_, b) => {
        const rects = WINDOWS.filter(([, , t]) => Math.min(buckets - 1, Math.floor(t * buckets)) === b)
          .map(([x, y]) => `<rect x="${x}" y="${y}" width="2" height="2"/>`)
          .join("");
        return `<g class="w${b}" fill="${night.window}">${rects}</g>`;
      }).join("")
    : "";
  const lights = night
    ? `<g class="dusk" filter="url(#glow)">
      <path d="${LIT}" fill="none" stroke="${night.lit}" stroke-opacity=".7" stroke-width="1.1" stroke-linecap="round"/>
      ${LAMPS.map((l) => `<circle cx="${l.x}" cy="${l.y}" r="${l.r}" fill="${night.lit}" fill-opacity="${l.r > 3 ? 0.55 : 0.95}"/>`).join("")}
    </g>`
    : "";
  // Every shape stroked at twice the hairline, then all filled over it: the fill hides each line inside
  // the union and leaves one clean outline, as the site draws it.
  return `<path d="${FAR}" transform="translate(37 0)" fill="${p.far}"/>
    <path d="${BLOCKS}${LANDMARKS}" fill="none" stroke="${p.ink}" stroke-width="${f(line * 2)}" stroke-linejoin="round"/>
    <path d="${BLOCKS}${LANDMARKS}" fill="${p.near}"/>
    ${night ? `<g class="dusk">${floods}</g>` : ""}
    <path d="${DETAILS}" fill="none" stroke="${p.ink}" stroke-width="${f(line)}"/>
    ${windows}
    ${lights}
    <g transform="translate(${WHEEL.x} ${WHEEL.y})"><g class="turn">${wheel(p, line)}</g></g>`;
}

/** The Suomenlinna ferry, moored mid-crossing, in the city's units. */
function ferry(p: HelsinkiPalette, x: number, y: number): string {
  const hull =
    `M${x - 22} ${y - 5}H${x + 22}L${x + 18} ${y}H${x - 19}Z` +
    `M${x - 13} ${y - 5}V${y - 11}H${x + 11}V${y - 5}Z` +
    `M${x - 5} ${y - 11}V${y - 15}H${x + 5}V${y - 11}Z`;
  const cabins = p.night
    ? `<g class="dusk" fill="${p.night.window}">${[0, 4, 8, 12, 16, 20].map((d) => `<rect x="${x - 11 + d}" y="${y - 9}" width="2" height="1.6"/>`).join("")}</g>`
    : "";
  return `<path d="M${x + 22} ${y + 1}L${x + 70} ${y + 5}M${x + 22} ${y + 1}L${x + 70} ${y - 2}" fill="none" stroke="${p.ink}" stroke-width="${f(1 / K)}"/>
    <path d="${hull}" fill="${p.near}" stroke="${p.ink}" stroke-width="${f(1 / K)}"/>${cabins}`;
}

/** Night: each bright light thrown across the water as a broken streak, in card pixels. */
function glints(lit: string): string {
  const reach = (H - SHORE) * 0.85;
  const out: string[] = [];
  for (const g of GLINTS) {
    const x = (g.x - SPAN.from) * K;
    for (let k = 2; k < reach; k += 3) {
      const fade = 1 - k / reach;
      const waver = 0.55 + 0.45 * Math.sin(k * 0.9 + g.x);
      const span = g.w * K * waver * (0.35 + 0.65 * fade);
      out.push(`<rect x="${f(x - span / 2)}" y="${SHORE + k}" width="${f(span)}" height="1.2" opacity="${(0.32 * fade * fade).toFixed(2)}"/>`);
    }
  }
  return `<g class="dusk" fill="${lit}">${out.join("")}</g>`;
}

export function renderPortfolio(input: PortfolioInput, p: HelsinkiPalette): string {
  const W = PORTFOLIO_W + 2 * GUTTER;
  const HH = H + 2 * GUTTER;
  const right = PORTFOLIO_W - PAD;
  const oy = SHORE - GROUND * K;
  const cityAt = `translate(${f(-SPAN.from * K)} ${f(oy)}) scale(${K})`;

  // The footer, bottom left over the harbour: the field guide's meter ("Guide", a pip per question, the
  // count) on a pane, locked on by brackets, and the quest tag beside it pointing at it, as the site
  // places them side by side in its plain view.
  const mono = 12;
  const count = `00/${String(input.unlocks).padStart(2, "0")}`;
  const countW = count.length * mono * ADVANCE;
  const pip = { w: 7, h: 12, gap: 4 };
  const pipsW = input.unlocks * (pip.w + pip.gap) - pip.gap;
  const rowY = SHORE + (H - SHORE) / 2;
  const meterY = rowY - pip.h / 2;
  const labelX = PAD + 2;
  const pipsX = labelX + 44;
  const countX = pipsX + pipsW + 10;
  const pips = Array.from(
    { length: input.unlocks },
    (_, i) => `<rect x="${pipsX + i * (pip.w + pip.gap)}" y="${meterY}" width="${pip.w}" height="${pip.h}" rx="1.5"/>`,
  ).join("");
  const box = { x: PAD - 8, y: meterY - 9, w: countX + countW + 8 - (PAD - 8), h: pip.h + 18 };

  const tagFont = 11.5;
  const left = "New quest";
  const rightText = `${input.unlocks} unlocks`;
  const lw = left.length * tagFont * ADVANCE;
  const rw = rightText.length * tagFont * ADVANCE;
  const tagW = 10 + 16 + 8 + lw + 17 + rw + 12;
  const tagH = 22;
  const arrowX = f(box.x + box.w + 12);
  const tagX = f(box.x + box.w + 22);
  const tagY = f(rowY - tagH / 2);
  const dx = tagX + 18;
  const dy = rowY;
  const leftX = tagX + 34;
  const sepX = leftX + lw + 8.5;
  const rightX = sepX + 8.5;

  // The skins still locked, as chips.
  const chipFont = 11.5;
  let cx = PAD;
  const chips = input.locked
    .map((name) => {
      const tw = name.length * chipFont * ADVANCE;
      const w = tw + 30;
      const chip = `<rect x="${cx}" y="114" width="${f(w)}" height="22" rx="4" fill="${p.bg}" fill-opacity=".6" stroke="${p.control}" stroke-dasharray="3 2"/>
    ${padlock(cx + 9, 119.5, p.control)}
    <text x="${cx + 22}" y="129" font-family="${FONT}" font-size="${chipFont}" fill="${p.muted}" textLength="${f(tw)}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>`;
      cx += w + 8;
      return chip;
    })
    .join("\n    ");

  const night = p.night;
  const floodDefs = night
    ? FLOODLIT.map(
        (face, i) =>
          `<linearGradient id="flood${i}" gradientUnits="userSpaceOnUse" x1="0" y1="${face.from}" x2="0" y2="${face.to}"><stop offset="0" stop-color="${night.flood}" stop-opacity="0"/><stop offset="1" stop-color="${night.flood}"/></linearGradient>`,
      ).join("\n  ")
    : "";
  const windowCss = night
    ? Array.from({ length: 6 }, (_, b) => `.w${b} { animation: appear .6s ease-out ${(1 + b * 0.4).toFixed(1)}s both; }`).join("\n  ")
    : "";
  const title = `${input.host}: ${input.lines.join(" ")} Still locked: ${input.locked.join(", ")}.`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${HH}" viewBox="0 0 ${W} ${HH}" role="img" aria-labelledby="title">
<title id="title">${esc(title)}</title>
<style>
  text { white-space: pre; }
  @keyframes appear { from { opacity: 0; } }
  @keyframes slide { from { opacity: 0; transform: translateX(14px); } 70% { transform: translateX(-2px); } }
  @keyframes blink { 50% { opacity: 0; } }
  @keyframes lock { from { opacity: 0; transform: scale(1.25); } 60% { opacity: 1; transform: scale(1); } 75% { opacity: .25; } to { opacity: 1; } }
  @keyframes turn { to { transform: rotate(360deg); } }
  .turn { transform-box: fill-box; transform-origin: center; animation: turn ${WHEEL_PERIOD_S}s linear infinite; }
  .dusk { animation: appear 2s ease-out .6s both; }
  ${windowCss}
  .tag { animation: slide .7s ease-out 1.1s both; }
  .arrow { animation: appear .3s 1.6s both, blink 1s step-end 1.9s 3; }
  .lock { transform-box: fill-box; transform-origin: center; animation: lock .9s ease-out .6s both; }
  ${REDUCED_MOTION}
</style>
<defs>
  <clipPath id="card"><rect width="${PORTFOLIO_W}" height="${H}" rx="10"/></clipPath>
  <linearGradient id="sky" x1="0" y1="${SHORE - 140}" x2="0" y2="${SHORE}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${p.glow}" stop-opacity="0"/><stop offset="1" stop-color="${p.glow}"/></linearGradient>
  <linearGradient id="depth" x1="0" y1="${SHORE}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <mask id="water"><rect y="${SHORE}" width="${PORTFOLIO_W}" height="${H - SHORE}" fill="url(#depth)"/></mask>
  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  ${floodDefs}
</defs>
<g transform="translate(${GUTTER} ${GUTTER})">
<g clip-path="url(#card)">
  <rect width="${PORTFOLIO_W}" height="${H}" fill="${p.bg}"/>
  <rect y="${SHORE - 140}" width="${PORTFOLIO_W}" height="140" fill="url(#sky)"/>
  <rect y="${SHORE}" width="${PORTFOLIO_W}" height="${H - SHORE}" fill="${p.glow}"/>
  <g id="city" transform="${cityAt}">
    ${city(p)}
  </g>
  <g mask="url(#water)"><use href="#city" xlink:href="#city" transform="translate(0 ${2 * SHORE}) scale(1 -1)"/></g>
  ${night ? glints(night.lit) : ""}
  <g transform="${cityAt}">${ferry(p, 960, GROUND + 22)}</g>
  <path d="M0 ${SHORE}H${PORTFOLIO_W}" stroke="${p.ink}"/>

  <text x="${PAD}" y="46" font-family="${SANS}" font-size="22" font-weight="600" fill="${p.fg}">There’s more at <tspan fill="${p.accent}">${esc(input.host)}</tspan></text>
  <text x="${PAD}" y="78" font-family="${SANS}" font-size="14.5" fill="${p.muted}">${esc(input.lines[0])}</text>
  <text x="${PAD}" y="100" font-family="${SANS}" font-size="14.5" fill="${p.muted}">${esc(input.lines[1])}</text>
  <g class="chips">
    ${chips}
  </g>

  <g class="tag">
    <rect x="${tagX}" y="${tagY}" width="${f(tagW)}" height="${tagH}" rx="4" fill="${p.signal}"/>
    <rect x="${dx - 6}" y="${dy - 6}" width="12" height="12" rx="1.5" transform="rotate(45 ${dx} ${dy})" fill="${p.onSignal}"/>
    <text x="${dx}" y="${dy + 4}" font-family="${FONT}" font-size="11" font-weight="700" text-anchor="middle" fill="${p.signal}">!</text>
    <text x="${f(leftX)}" y="${dy + 4}" font-family="${FONT}" font-size="${tagFont}" font-weight="700" fill="${p.onSignal}" textLength="${f(lw)}" lengthAdjust="spacingAndGlyphs">${left}</text>
    <path d="M${f(sepX)} ${tagY + 5}V${tagY + tagH - 5}" stroke="${p.onSignal}" stroke-opacity=".5"/>
    <text x="${f(rightX)}" y="${dy + 4}" font-family="${FONT}" font-size="${tagFont}" fill="${p.onSignal}" textLength="${f(rw)}" lengthAdjust="spacingAndGlyphs">${esc(rightText)}</text>
  </g>
  <text class="arrow" x="${arrowX}" y="${rowY + 3.5}" font-family="${SANS}" font-size="9" text-anchor="middle" fill="${p.signal}">◀</text>
  <rect x="${box.x + 2}" y="${box.y + 2}" width="${f(box.w - 4)}" height="${box.h - 4}" rx="3" fill="${p.bg}" fill-opacity=".82" stroke="${p.hairline}"/>
  <text x="${labelX}" y="${meterY + 10.5}" font-family="${SANS}" font-size="12.5" fill="${p.muted}">Guide</text>
  <g fill="none" stroke="${p.control}" stroke-width="1.2">${pips}</g>
  <text x="${f(countX)}" y="${meterY + 10.5}" font-family="${FONT}" font-size="${mono}" fill="${p.led}" textLength="${f(countW)}" lengthAdjust="spacingAndGlyphs">${count}</text>
  <path class="lock" d="${brackets(box.x, box.y, box.w, box.h, 7)}" fill="none" stroke="${p.signal}" stroke-width="2"/>
</g>
<rect width="${PORTFOLIO_W}" height="${H}" rx="10" fill="none" stroke="${p.hairline}" stroke-width="1.5"/>
</g>
</svg>
`;
}
