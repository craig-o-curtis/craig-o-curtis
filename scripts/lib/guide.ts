// A pop quiz over downtown Minneapolis across the Mississippi on a wet night (minneapolis.ts), as the
// portfolio site draws it behind its Rain skin: violet and gold, in the rain. The question is where Craig is
// from: the hometown of the artist behind "Purple Rain", and this card is the homage. The light card is the
// same city on a grey day. The answers are separate small SVGs, one link each, since an image can hold only
// one; the README reveals the answer in a collapsed section under them.
//
// As everywhere, the final frame is the default; the rain is the only thing that keeps moving, and reduced
// motion stops it.

import {
  BLOCKS,
  BRIDGE,
  DETAILS,
  FAR,
  FLOODLIT,
  FOSHAY,
  GOLD,
  GOLD_FAINT,
  GROUND,
  LAMPS,
  LANDMARKS,
  SIGN,
  SPAN,
  VIOLET,
  WINDOWS,
} from "./minneapolis.ts";
import { ADVANCE, esc, FONT, REDUCED_MOTION } from "./theme.ts";

export interface Quiz {
  prompt: string;
  options: string[];
  answer: string;
  /** Shown when the answer is opened. */
  reveal: string;
}

export const QUIZ: Quiz = {
  prompt: "Craig is from the hometown of the artist who gave the world “Purple Rain”. Which city is it?",
  options: ["Detroit", "Minneapolis", "Chicago", "Memphis"],
  answer: "Minneapolis",
  reveal: "Prince’s hometown, and mine. The purple rain falling on the skyline above is for him.",
};

export const LETTERS = ["A", "B", "C", "D"];

/** Rain's tokens (the site's rain theme and its scenes/rain.ts), and the same city by day. */
export interface RainPalette {
  bg: string;
  fg: string;
  muted: string;
  gold: string;
  violet: string;
  glow: string;
  far: string;
  near: string;
  ink: string;
  river: string;
  rain: string;
  button: string;
  night?: { warm: string; cool: string; neon: string; flood: string };
}

export const RAIN_DARK: RainPalette = {
  bg: "#120818",
  fg: "#f1e8fb",
  muted: "#c9b8dc",
  gold: "#e8c35a",
  violet: "#c084fc",
  glow: "#3a1858",
  far: "#25123a",
  near: "#0e0614",
  ink: "rgb(192 132 252 / 0.32)",
  river: "#12071c",
  rain: "rgb(192 132 252 / 0.35)",
  button: "#1d0f2a",
  night: { warm: "rgb(246 213 140 / 0.8)", cool: "rgb(216 190 255 / 0.65)", neon: "#ff6070", flood: "#3b2811" },
};

export const RAIN_LIGHT: RainPalette = {
  bg: "#f6f2fa",
  fg: "#1e1328",
  muted: "#4b3d5c",
  gold: "#7a5a00",
  violet: "#6b2fb3",
  glow: "#e3d6f0",
  far: "#e7def0",
  near: "#d9cce6",
  ink: "rgb(107 47 179 / 0.4)",
  river: "#e8e0f0",
  rain: "rgb(107 47 179 / 0.22)",
  button: "#efe7f7",
};

const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif";
/** A rough sans advance as a share of font size, for wrapping. */
const SANS_ADVANCE = 0.52;

export const GUIDE_W = 840;
const H = 326;
const GUTTER = 6;
const PAD = 26;
const SHORE = 282;
const K = 0.5;
const PROMPT_SIZE = 18;

const f = (n: number) => Number(n.toFixed(1));

/** `text` broken into lines of at most `max` characters, at spaces. */
export function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    if (line && line.length + 1 + word.length > max) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function city(p: RainPalette): string {
  const line = 1 / K;
  const night = p.night;
  const windows = night
    ? [0, 1]
        .map((cool) => {
          const rects = WINDOWS.filter(([, , c]) => c === cool)
            .map(([x, y]) => `<rect x="${x}" y="${y}" width="2.4" height="3"/>`)
            .join("");
          return `<g class="lights" fill="${cool ? night.cool : night.warm}">${rects}</g>`;
        })
        .join("")
    : "";
  const floods = night
    ? FLOODLIT.map((face, i) => `<path d="${face.d}" fill="url(#mflood${i})"/>`).join("")
    : "";
  const sign = night
    ? `<text x="${SIGN.x}" y="${SIGN.y}" font-family="Georgia, 'Times New Roman', serif" font-size="${SIGN.size}" font-weight="700" fill="${night.neon}" textLength="${SIGN.width}" lengthAdjust="spacingAndGlyphs" filter="url(#mglow)">${SIGN.text}</text>
    <text x="${FOSHAY.x}" y="${FOSHAY.y}" font-family="Georgia, 'Times New Roman', serif" font-size="${FOSHAY.size}" fill="${p.gold}" textLength="${FOSHAY.width}" lengthAdjust="spacingAndGlyphs">${FOSHAY.text}</text>`
    : `<text x="${SIGN.x}" y="${SIGN.y}" font-family="Georgia, 'Times New Roman', serif" font-size="${SIGN.size}" font-weight="700" fill="${p.muted}" textLength="${SIGN.width}" lengthAdjust="spacingAndGlyphs">${SIGN.text}</text>`;
  const lit = night
    ? `<g class="lights" filter="url(#mglow)" fill="none" stroke-linecap="round">
      <path d="${GOLD}" stroke="${p.gold}" stroke-width="1.6"/>
      <path d="${GOLD_FAINT}" stroke="${p.gold}" stroke-opacity=".45" stroke-width="1"/>
      <path d="${VIOLET}" stroke="${p.violet}" stroke-width="2"/>
    </g>
    <g fill="${p.gold}">${LAMPS.map((l) => `<circle cx="${l.x}" cy="${l.y}" r="1.8"/>`).join("")}</g>`
    : "";
  return `<path d="${FAR}" fill="${p.far}"/>
    <path d="${BLOCKS}${LANDMARKS}" fill="none" stroke="${p.ink}" stroke-width="${f(line * 2)}" stroke-linejoin="round"/>
    <path d="${BLOCKS}${LANDMARKS}" fill="${p.near}"/>
    ${floods}
    <path d="${DETAILS}" fill="none" stroke="${p.ink}" stroke-width="${f(line)}"/>
    ${windows}
    ${lit}
    ${sign}
    <path d="${BRIDGE}" fill="${p.near}" stroke="${p.ink}" stroke-width="${f(line)}"/>`;
}

/**
 * Rain falls as two layers, each a pattern tile slid by exactly one tile (left one width, down one height)
 * per loop, so the loop has no seam. The streaks slant by the tile's own width / height, so they fall along
 * their length. Each streak is drawn at its four wrapped positions, so the edges of the tile meet.
 */
const RAIN_TW = 120;
const RAIN_TH = 400;
const SLANT = RAIN_TW / RAIN_TH;
const RAIN_LAYERS = [
  { seed: 1958, streaks: 26, len: [10, 18], width: 1.1, opacity: 1, seconds: 1.15 },
  { seed: 612, streaks: 34, len: [5, 9], width: 0.8, opacity: 0.55, seconds: 2.1 },
] as const;

/** Slanted rain streaks in one tile, seeded so they never change. */
function rainTile(seed: number, n: number, [min, max]: readonly [number, number]): string {
  let a = seed;
  const rand = () => {
    a = (a * 16807) % 2147483647;
    return a / 2147483647;
  };
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const x = rand() * RAIN_TW;
    const y = rand() * RAIN_TH;
    const len = min + rand() * (max - min);
    for (const [dx, dy] of [[0, 0], [RAIN_TW, 0], [0, -RAIN_TH], [RAIN_TW, -RAIN_TH]]) {
      out.push(`M${f(x + dx)} ${f(y + dy)}l${f(-len * SLANT)} ${f(len)}`);
    }
  }
  return out.join("");
}

export function renderGuide(q: Quiz, p: RainPalette): string {
  const W = GUIDE_W + 2 * GUTTER;
  const HH = H + 2 * GUTTER;
  const maxChars = Math.floor((GUIDE_W - 2 * PAD) / (PROMPT_SIZE * SANS_ADVANCE));
  const lines = wrap(q.prompt, maxChars);
  if (lines.length > 3) throw new Error(`guide prompt runs to ${lines.length} lines: ${q.prompt}`);
  const oy = SHORE - GROUND * K;
  const cityAt = `translate(${f(GUIDE_W / 2 - ((SPAN.from + SPAN.to) / 2) * K)} ${f(oy)}) scale(${K})`;
  const label = "POP QUIZ";
  const night = p.night;
  const floodDefs = night
    ? FLOODLIT.map(
        (face, i) =>
          `<linearGradient id="mflood${i}" gradientUnits="userSpaceOnUse" x1="0" y1="${face.from}" x2="0" y2="${face.to}"><stop offset="0" stop-color="${night.flood}" stop-opacity="0"/><stop offset="1" stop-color="${night.flood}"/></linearGradient>`,
      ).join("")
    : "";
  const title = `Pop quiz, over Minneapolis in the purple rain: ${q.prompt} Options: ${q.options.map((o, i) => `${LETTERS[i]}, ${o}`).join("; ")}. Pick one below; the answer is under them.`;
  const promptText = lines
    .map((l, i) => `<text x="${PAD}" y="${76 + i * 26}" font-family="${SANS}" font-size="${PROMPT_SIZE}" font-weight="600" fill="${p.fg}">${esc(l)}</text>`)
    .join("\n  ");
  const hintY = 76 + lines.length * 26 + 6;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${HH}" viewBox="0 0 ${W} ${HH}" role="img" aria-labelledby="title">
<title id="title">${esc(title)}</title>
<style>
  text { white-space: pre; }
  @keyframes appear { from { opacity: 0; } }
  @keyframes fall { from { transform: translate(0, 0); } to { transform: translate(-${RAIN_TW}px, ${RAIN_TH}px); } }
  @keyframes lock { from { opacity: 0; transform: scale(1.25); } 60% { opacity: 1; transform: scale(1); } 75% { opacity: .25; } to { opacity: 1; } }
  .rain { will-change: transform; animation: fall linear infinite; }
  ${RAIN_LAYERS.map((l, i) => `.rain${i} { animation-duration: ${l.seconds}s; }`).join("\n  ")}
  .lights { animation: appear 1.6s ease-out .4s both; }
  .q { animation: appear .5s ease-out .2s both; }
  .lock { transform-box: fill-box; transform-origin: center; animation: lock .9s ease-out .5s both; }
  ${REDUCED_MOTION}
</style>
<defs>
  <clipPath id="card"><rect width="${GUIDE_W}" height="${H}" rx="10"/></clipPath>
  <linearGradient id="msky" x1="0" y1="${SHORE - 170}" x2="0" y2="${SHORE}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${p.glow}" stop-opacity="0"/><stop offset="1" stop-color="${p.glow}"/></linearGradient>
  <linearGradient id="mdepth" x1="0" y1="${SHORE}" x2="0" y2="${H}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  <mask id="mwater"><rect y="${SHORE}" width="${GUIDE_W}" height="${H - SHORE}" fill="url(#mdepth)"/></mask>
  <filter id="mglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  ${RAIN_LAYERS.map(
    (l, i) =>
      `<pattern id="streaks${i}" width="${RAIN_TW}" height="${RAIN_TH}" patternUnits="userSpaceOnUse"><path d="${rainTile(l.seed, l.streaks, l.len)}" stroke="${p.rain}" stroke-opacity="${l.opacity}" stroke-width="${l.width}" stroke-linecap="round" fill="none"/></pattern>`,
  ).join("\n  ")}
  ${floodDefs}
</defs>
<g transform="translate(${GUTTER} ${GUTTER})">
<g clip-path="url(#card)">
  <rect width="${GUIDE_W}" height="${H}" fill="${p.bg}"/>
  <rect y="${SHORE - 170}" width="${GUIDE_W}" height="170" fill="url(#msky)"/>
  <rect y="${SHORE}" width="${GUIDE_W}" height="${H - SHORE}" fill="${p.river}"/>
  <g id="mcity" transform="${cityAt}">
    ${city(p)}
  </g>
  <g mask="url(#mwater)"><use href="#mcity" xlink:href="#mcity" transform="translate(0 ${2 * SHORE}) scale(1 -1)"/></g>
  <path d="M0 ${SHORE}H${GUIDE_W}" stroke="${p.ink}"/>
  ${RAIN_LAYERS.map(
    (_, i) => `<rect class="rain rain${i}" y="-${RAIN_TH}" width="${GUIDE_W + RAIN_TW}" height="${H + RAIN_TH}" fill="url(#streaks${i})"/>`,
  ).join("\n  ")}

  <g class="q">
    <g class="lock"><rect x="${PAD - 1}" y="35" width="11" height="11" rx="1.5" transform="rotate(45 ${PAD + 4.5} 40.5)" fill="${p.gold}"/><text x="${PAD + 4.5}" y="44.5" font-family="${FONT}" font-size="10" font-weight="700" text-anchor="middle" fill="${p.bg}">!</text></g>
    <text x="${PAD + 18}" y="46" font-family="${FONT}" font-size="12" font-weight="700" letter-spacing="1.5" fill="${p.gold}">${esc(label)}</text>
    <text x="${GUIDE_W - PAD}" y="46" font-family="${FONT}" font-size="11.5" fill="${p.muted}" text-anchor="end">Minneapolis, in the purple rain</text>
    ${promptText}
    <text x="${PAD}" y="${hintY}" font-family="${SANS}" font-size="13.5" fill="${p.muted}">Pick an answer below, then open the answer to check.</text>
  </g>
</g>
<rect width="${GUIDE_W}" height="${H}" rx="10" fill="none" stroke="${p.ink}" stroke-width="1.5"/>
</g>
</svg>
`;
}

export const ANSWER_W = 410;
const ANSWER_H = 44;

/** One answer button: its letter on a gold cap, then the option, squeezed only if it must be. */
export function renderAnswer(letter: string, option: string, p: RainPalette): string {
  const W = ANSWER_W + 2 * GUTTER;
  const HH = ANSWER_H + 2 * GUTTER;
  const size = 14.5;
  const x = 52;
  const room = ANSWER_W - x - 16;
  const natural = option.length * size * SANS_ADVANCE;
  const squeeze = natural > room ? ` textLength="${room}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${HH}" viewBox="0 0 ${W} ${HH}" role="img" aria-labelledby="title">
<title id="title">${esc(`Answer ${letter}: ${option}`)}</title>
<g transform="translate(${GUTTER} ${GUTTER})">
  <rect width="${ANSWER_W}" height="${ANSWER_H}" rx="7" fill="${p.button}" stroke="${p.ink}" stroke-width="1.5"/>
  <rect x="10" y="9" width="28" height="26" rx="4" fill="${p.gold}"/>
  <text x="24" y="27" font-family="${FONT}" font-size="15" font-weight="700" text-anchor="middle" fill="${p.button}">${letter}</text>
  <text x="${x}" y="27.5" font-family="${SANS}" font-size="${size}" fill="${p.fg}"${squeeze}>${esc(option)}</text>
</g>
</svg>
`;
}

/** The heading the quiz sits under in the README; the answer buttons link back to it. */
export const QUIZ_ANCHOR = "pop-quiz";

/** The README block: the card, its answers two to a row, and the answer, collapsed. */
export function guideMarkdown(q: Quiz): string {
  const pic = (file: string, alt: string, width: string) =>
    `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${file}-dark.svg"><img src="assets/${file}-light.svg" width="${width}" alt="${esc(alt)}"></picture>`;
  const answers = q.options.map(
    (o, i) => `<a href="#${QUIZ_ANCHOR}">${pic(`answer-${LETTERS[i].toLowerCase()}`, `Answer ${LETTERS[i]}: ${o}`, "48%")}</a>`,
  );
  return [
    pic("guide", `Pop quiz: ${q.prompt}`, "100%"),
    "",
    `<p align="center">\n  ${answers.slice(0, 2).join("\n  ")}\n  <br>\n  ${answers.slice(2).join("\n  ")}\n</p>`,
    "",
    `<details>\n<summary><b>Answer</b></summary>\n<br>\n\n**${q.answer}.** ${q.reveal}\n\n</details>`,
  ].join("\n");
}
