// The header: a green-screen terminal that types `npx run-cv craig` and prints the profile, the name in
// run-cv's own logo lettering with its rolling green gradient.
//
// Every element is drawn in its final state and the CSS animates it *from* hidden (`animation-fill-mode:
// both`), so with animations off (reduced motion, or a renderer without CSS animation) the finished
// frame is what shows. Typing is a background-coloured cover sliding off the text in `steps()`.

import { ADVANCE, DARK, esc, FONT, FRAME_CSS, frame, REDUCED_MOTION } from "./theme.ts";
import { tinyBitmap } from "./tiny.ts";

export interface HeroInput {
  command: string;
  name: string;
  roles: string;
  tagline: string;
}

const W = 840;
const H = 300;
const GUTTER = 8;
const PAD = 28;
const SIZE = 16;
const CW = SIZE * ADVANCE;

// The name's pixels: square, with a hairline gap so they read as terminal cells.
const PX = 16;
const GAP = 1.5;
const NAME_TOP = 110;

// run-cv's App.tsx: these five stops, rotated one place every 150 ms.
const LOGO_STOPS = ["#00ff00", "#008000", "#003300", "#008000", "#00ff00"];
const LOGO_TICK = 0.15;
// The gradient rolls a few laps as the name lands, then settles; every lap ends on the all-lit frame.
const LOGO_LAPS = 4;

/**
 * `phase` starts the gradient so that its dark middle stop sits on the first blank column after the
 * first word: the still frame (reduced motion) then shows every letter lit.
 */
function nameLogo(name: string): { clip: string; width: number; phase: number } {
  const bitmap = tinyBitmap(name);
  const rects: string[] = [];
  bitmap.forEach((row, y) => {
    row.forEach((on, x) => {
      if (on) rects.push(`<rect x="${PAD + x * PX}" y="${NAME_TOP + y * PX}" width="${PX - GAP}" height="${PX - GAP}"/>`);
    });
  });
  const cols = bitmap[0]?.length ?? 0;
  const gap = name.indexOf(" ") === -1 ? cols / 2 : tinyBitmap(name.slice(0, name.indexOf(" "))).at(0)!.length + 1.5;
  return { clip: rects.join(""), width: cols * PX, phase: PAD + (gap - cols / 2) * PX };
}

export function renderHero(input: HeroInput): string {
  const p = DARK;
  const cmdX = PAD + 2 * CW;
  const cmdW = input.command.length * CW;
  const typeStart = 0.5;
  const typeDur = input.command.length * 0.075;
  const t = (offset: number) => (typeStart + typeDur + offset).toFixed(2);
  const logo = nameLogo(input.name);
  const stops = LOGO_STOPS.map((c, i) => `<stop offset="${i / (LOGO_STOPS.length - 1)}" stop-color="${c}"/>`).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W + 2 * GUTTER}" height="${H + 2 * GUTTER}" viewBox="0 0 ${W + 2 * GUTTER} ${H + 2 * GUTTER}" role="img" aria-labelledby="title">
<title id="title">${esc(`${input.name}: ${input.roles}. ${input.tagline}`)}</title>
<style>
  text { font-family: ${FONT}; white-space: pre; }
  @keyframes appear { from { opacity: 0; } to { opacity: 1; } }
  @keyframes type { from { transform: translateX(0); } to { transform: translateX(${cmdW}px); } }
  @keyframes blink { 50% { opacity: 0; } }
  @keyframes gone { to { opacity: 0; } }
  @keyframes flicker { 0% { opacity: 0; } 8% { opacity: .9; } 12% { opacity: .15; } 22% { opacity: 1; } 28% { opacity: .45; } 36%, 100% { opacity: 1; } }
  @keyframes scan { from { transform: translateY(-90px); } to { transform: translateY(${H}px); } }
  @keyframes roll { from { transform: translateX(0); } to { transform: translateX(-${logo.width}px); } }
  .typing { animation: type ${typeDur.toFixed(2)}s steps(${input.command.length}) ${typeStart}s both; }
  .cursor-1 { animation: gone .01s linear ${t(0.35)}s both; }
  .blink { animation: blink 1s step-end infinite; }
  .l1 { animation: appear .01s linear ${t(0.35)}s both; }
  .l2 { animation: flicker .9s linear ${t(0.85)}s both; }
  .l3 { animation: appear .4s ease-out ${t(1.55)}s both; }
  .l4 { animation: appear .4s ease-out ${t(1.85)}s both; }
  .l5 { animation: appear .01s linear ${t(2.25)}s both; }
  .roll { animation: roll ${(LOGO_STOPS.length * LOGO_TICK).toFixed(2)}s steps(${LOGO_STOPS.length}) ${t(0.85)}s ${LOGO_LAPS} both; }
  .scan { animation: scan 4s linear 1s both; }
  ${FRAME_CSS}
  ${REDUCED_MOTION}
</style>
<defs>
  <clipPath id="screen"><rect width="${W}" height="${H}"/></clipPath>
  <clipPath id="name">${logo.clip}</clipPath>
  <linearGradient id="logo" gradientUnits="userSpaceOnUse" x1="${logo.phase}" y1="0" x2="${logo.phase + logo.width}" y2="0" spreadMethod="repeat">${stops}</linearGradient>
  <pattern id="lines" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" opacity=".35"/></pattern>
  <radialGradient id="vignette" cx="50%" cy="50%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".55"/></radialGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.text}" stop-opacity="0"/><stop offset=".5" stop-color="${p.text}" stop-opacity=".07"/><stop offset="1" stop-color="${p.text}" stop-opacity="0"/></linearGradient>
  <filter id="glow" x="-10%" y="-40%" width="120%" height="180%"><feGaussianBlur stdDeviation="2.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<g transform="translate(${GUTTER} ${GUTTER})">
<g clip-path="url(#screen)">
  <rect width="${W}" height="${H}" fill="${p.bg}"/>
  <rect width="${W}" height="30" fill="${p.bar}"/>
  <text x="${PAD - 10}" y="20" font-size="12" fill="${p.dim}" letter-spacing="1">RUN-CV 3270 ── SESSION 0001 ── NORTHGUILD SYS</text>
  <text x="${W - PAD + 10}" y="20" font-size="12" fill="${p.dim}" text-anchor="end" letter-spacing="1">ONLINE <tspan class="blink" fill="${p.text}">●</tspan></text>

  <g filter="url(#glow)">
    <text x="${PAD}" y="70" font-size="${SIZE}" fill="${p.dim}">$</text>
    <text x="${cmdX}" y="70" font-size="${SIZE}" fill="${p.text}" textLength="${cmdW}" lengthAdjust="spacing">${esc(input.command)}</text>
  </g>
  <rect class="typing motion-only" x="${cmdX}" y="48" width="${cmdW + CW}" height="34" fill="${p.bg}"/>
  <g class="cursor-1 motion-only"><g class="typing"><rect class="blink" x="${cmdX}" y="56" width="${CW}" height="18" fill="${p.text}"/></g></g>

  <g filter="url(#glow)">
    <text class="l1" x="${PAD}" y="96" font-size="14" fill="${p.dim}">  resolving profile 'craig' <tspan fill="${p.faint}">................................</tspan> <tspan fill="${p.accent}">OK</tspan></text>
    <g class="l2"><g clip-path="url(#name)"><rect class="roll" x="${PAD}" y="${NAME_TOP}" width="${2 * logo.width}" height="${4 * PX}" fill="url(#logo)"/></g></g>
    <text class="l3" x="${PAD}" y="200" font-size="${SIZE}" fill="${p.accent}">${esc(input.roles)}</text>
    <text class="l4" x="${PAD}" y="226" font-size="14" fill="${p.dim}">${esc(input.tagline)}</text>
    <g class="l5"><text x="${PAD}" y="258" font-size="${SIZE}" fill="${p.dim}">$</text><rect class="blink" x="${cmdX}" y="244" width="${CW}" height="18" fill="${p.text}"/></g>
  </g>

  <rect y="${H - 28}" width="${W}" height="28" fill="${p.bar}"/>
  <text x="${PAD - 10}" y="${H - 9}" font-size="12" fill="${p.text}" letter-spacing="1">READY</text>
  <text x="${W / 2}" y="${H - 9}" font-size="12" fill="${p.dim}" text-anchor="middle" letter-spacing="1">F1=HELP   F3=EXIT   F12=RUN-CV</text>
  <text x="${W - PAD + 10}" y="${H - 9}" font-size="12" fill="${p.dim}" text-anchor="end" letter-spacing="1">INSERT</text>

  <rect class="scan motion-only" width="${W}" height="90" fill="url(#beam)"/>
  <rect width="${W}" height="${H}" fill="url(#lines)"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>
</g>
</g>
${frame(p, { w: W, h: H, gutter: GUTTER, arm: 26, weight: 3, border: 1.5 })}
</svg>
`;
}
