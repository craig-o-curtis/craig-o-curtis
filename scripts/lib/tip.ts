// A callout panel in the cards' frame (square corners, target-lock brackets), in place of GitHub's
// `> [!TIP]` alert and its left rule. It types its command once; still, it shows the finished panel.

import { ADVANCE, esc, FONT, FRAME_CSS, frame, type Palette, REDUCED_MOTION } from "./theme.ts";

export interface TipInput {
  label: string;
  text: string;
  command: string;
  note: string;
}

export const TIP_W = 840;
const TIP_H = 136;
const GUTTER = 6;
const PAD = 26;
const CMD = 18;

export function renderTip(tip: TipInput, p: Palette): string {
  const maxText = Math.floor((TIP_W - 2 * PAD) / (15 * ADVANCE));
  if (tip.text.length > maxText) throw new Error(`tip text too long (${tip.text.length} > ${maxText}): ${tip.text}`);
  const label = `[ ${tip.label} ]`;
  const labelEnd = PAD + label.length * 13 * ADVANCE + 2 * label.length + 12;
  const cw = CMD * ADVANCE;
  const cmdX = PAD + 2 * cw;
  const cmdW = tip.command.length * cw;
  const n = tip.command.length;
  const W = TIP_W + 2 * GUTTER;
  const H = TIP_H + 2 * GUTTER;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title">
<title id="title">${esc(`${tip.label}: ${tip.text} ${tip.command}. ${tip.note}`)}</title>
<style>
  text { font-family: ${FONT}; white-space: pre; }
  @keyframes appear { from { opacity: 0; } }
  @keyframes type { from { transform: translateX(0); } to { transform: translateX(${cmdW}px); } }
  @keyframes blink { 50% { opacity: 0; } }
  @keyframes follow { from { transform: translateX(-${cmdW}px); } to { transform: translateX(0); } }
  .typing { animation: type ${(n * 0.07).toFixed(2)}s steps(${n}) .9s both; }
  .follow { animation: follow ${(n * 0.07).toFixed(2)}s steps(${n}) .9s both; }
  .blink { animation: blink 1s step-end infinite; }
  .note { animation: appear .4s ease-out ${(1.2 + n * 0.07).toFixed(2)}s both; }
  ${FRAME_CSS}
  ${REDUCED_MOTION}
</style>
<g transform="translate(${GUTTER} ${GUTTER})">
  <rect width="${TIP_W}" height="${TIP_H}" fill="${p.bg}"/>
  <text x="${PAD}" y="30" font-size="13" font-weight="700" letter-spacing="2" fill="${p.accent}">${esc(label)}</text>
  <line x1="${labelEnd.toFixed(1)}" y1="25.5" x2="${TIP_W - PAD}" y2="25.5" stroke="${p.faint}" stroke-width="1.5" stroke-dasharray="4 4"/>
  <text x="${PAD}" y="60" font-size="15" fill="${p.text}">${esc(tip.text)}</text>
  <text x="${PAD}" y="94" font-size="${CMD}" fill="${p.dim}">$</text>
  <text x="${cmdX}" y="94" font-size="${CMD}" font-weight="700" fill="${p.text}" textLength="${cmdW}" lengthAdjust="spacing">${esc(tip.command)}</text>
  <rect class="typing motion-only" x="${cmdX}" y="74" width="${cmdW + cw}" height="28" fill="${p.bg}"/>
  <g class="follow"><rect class="blink" x="${(cmdX + cmdW + cw * 0.5).toFixed(1)}" y="80" width="${cw}" height="18" fill="${p.text}"/></g>
  <text class="note" x="${PAD}" y="${TIP_H - 18}" font-size="13" fill="${p.dim}">${esc(tip.note)}</text>
</g>
${frame(p, { w: TIP_W, h: TIP_H, gutter: GUTTER, arm: 18, weight: 2.5, border: 1.5 })}
</svg>
`;
}
