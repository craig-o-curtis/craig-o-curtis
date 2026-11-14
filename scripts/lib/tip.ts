// A terminal window in the cards' frame (square corners, target-lock brackets), styled like the git log
// panel: a title bar, a comment saying what this is, then the command typed once at the prompt, and a
// note on the way to run it without a terminal. Still, it shows the finished window.

import { ADVANCE, esc, FONT, FRAME_CSS, frame, type Palette, REDUCED_MOTION } from "./theme.ts";

export interface TipInput {
  /** Title bar, left and right. */
  title: string;
  status: string;
  /** Printed as a shell comment above the command. */
  text: string;
  command: string;
  note: string;
}

export const TIP_W = 840;
const TIP_H = 136;
const GUTTER = 6;
const PAD = 22;
const BAR = 28;
const TEXT = 14;
const CMD = 18;

const f = (n: number) => Number(n.toFixed(1));

export function renderTip(tip: TipInput, p: Palette): string {
  const comment = `# ${tip.text}`;
  const maxText = Math.floor((TIP_W - 2 * PAD) / (TEXT * ADVANCE));
  if (comment.length > maxText) throw new Error(`terminal text too long (${comment.length} > ${maxText}): ${tip.text}`);
  const cw = CMD * ADVANCE;
  const cmdX = PAD + 2 * cw;
  const cmdW = tip.command.length * cw;
  const n = tip.command.length;
  const typeDur = n * 0.07;
  const W = TIP_W + 2 * GUTTER;
  const H = TIP_H + 2 * GUTTER;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="title">
<title id="title">${esc(`${tip.title}: ${tip.text} Run ${tip.command}. ${tip.note}`)}</title>
<style>
  text { font-family: ${FONT}; white-space: pre; }
  @keyframes appear { from { opacity: 0; } }
  @keyframes type { from { transform: translateX(0); } to { transform: translateX(${f(cmdW)}px); } }
  @keyframes blink { 50% { opacity: 0; } }
  @keyframes follow { from { transform: translateX(-${f(cmdW)}px); } to { transform: translateX(0); } }
  .comment { animation: appear .4s ease-out .4s both; }
  .typing { animation: type ${typeDur.toFixed(2)}s steps(${n}) .9s both; }
  .follow { animation: follow ${typeDur.toFixed(2)}s steps(${n}) .9s both; }
  .blink { animation: blink 1s step-end infinite; }
  .note { animation: appear .4s ease-out ${(1.2 + typeDur).toFixed(2)}s both; }
  ${FRAME_CSS}
  ${REDUCED_MOTION}
</style>
<g transform="translate(${GUTTER} ${GUTTER})">
  <rect width="${TIP_W}" height="${TIP_H}" fill="${p.bg}"/>
  <rect width="${TIP_W}" height="${BAR}" fill="${p.bar}"/>
  <text x="${PAD - 8}" y="19" font-size="11.5" fill="${p.dim}" letter-spacing="1">${esc(tip.title)}</text>
  <text x="${TIP_W - PAD + 8}" y="19" font-size="11.5" fill="${p.dim}" text-anchor="end" letter-spacing="1">${esc(tip.status)} <tspan class="blink" fill="${p.text}">●</tspan></text>
  <text class="comment" x="${PAD}" y="56" font-size="${TEXT}" fill="${p.dim}">${esc(comment)}</text>
  <text x="${PAD}" y="90" font-size="${CMD}" fill="${p.dim}">$</text>
  <text x="${f(cmdX)}" y="90" font-size="${CMD}" font-weight="700" fill="${p.text}" textLength="${f(cmdW)}" lengthAdjust="spacing">${esc(tip.command)}</text>
  <rect class="typing motion-only" x="${f(cmdX)}" y="70" width="${f(cmdW + cw)}" height="28" fill="${p.bg}"/>
  <g class="follow"><rect class="blink" x="${f(cmdX + cmdW + cw * 0.5)}" y="76" width="${f(cw)}" height="18" fill="${p.text}"/></g>
  <text class="note" x="${PAD}" y="${TIP_H - 16}" font-size="13" fill="${p.dim}">${esc(tip.note)}</text>
</g>
${frame(p, { w: TIP_W, h: TIP_H, gutter: GUTTER, arm: 18, weight: 2.5, border: 1.5 })}
</svg>
`;
}
