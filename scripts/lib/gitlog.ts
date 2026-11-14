// A terminal tailing what landed lately across @northguild: the last few merged pull requests as
// `git log --oneline --graph` prints them, typed in a line at a time. Each segment (graph, hash, repo,
// title, date) sits at its own column, so the columns hold whichever monospace font the viewer has.

import type { Merge } from "./data.ts";
import { ADVANCE, esc, FONT, FRAME_CSS, frame, type Palette, REDUCED_MOTION } from "./theme.ts";

export const GITLOG_W = 840;
const GUTTER = 6;
const PAD = 22;
const SIZE = 13;
const CW = SIZE * ADVANCE;
const LINE = 21;
const TOP = 84;
const COMMAND = "git log --oneline --graph --merges";
const COMMENT = "# @northguild, every repo, main";

const f = (n: number) => Number(n.toFixed(1));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const day = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, " ")}`;
};

/** `text` cut to `max` characters, ending in an ellipsis when it was longer. */
export function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

export function renderGitlog(merges: Merge[], p: Palette): string {
  const lines = merges.length;
  const H = TOP + Math.max(1, lines) * LINE + 46;
  const cols = Math.floor((GITLOG_W - 2 * PAD) / CW);
  const repoW = Math.max(...merges.map((m) => m.repo.split("/")[1].length), 3) + 2;
  // Columns: "* " graph, 7-char hash, (repo), title, date at the right edge.
  const xHash = PAD + 2 * CW;
  const xRepo = xHash + 8 * CW;
  const xTitle = xRepo + (repoW + 1) * CW;
  const titleMax = cols - (2 + 8 + repoW + 1) - 8;
  const cmdX = PAD + 2 * CW;
  const cmdW = COMMAND.length * CW;
  const typeDur = COMMAND.length * 0.045;
  const t0 = 0.5 + typeDur + 0.25;

  const rows = merges.map((m, i) => {
    const y = TOP + i * LINE;
    const repo = m.repo.split("/")[1];
    const title = clip(m.title, titleMax);
    return `<g class="ln" style="animation-delay:${(t0 + i * 0.18).toFixed(2)}s">
    <text x="${PAD}" y="${y}" font-size="${SIZE}" fill="${p.text}">*</text>
    <text x="${f(xHash)}" y="${y}" font-size="${SIZE}" fill="${p.dim}">${esc(m.sha)}</text>
    <text x="${f(xRepo)}" y="${y}" font-size="${SIZE}" fill="${p.accent}">(${esc(repo)})</text>
    <text x="${f(xTitle)}" y="${y}" font-size="${SIZE}" fill="${p.text}"${title.length > 4 ? ` textLength="${f(title.length * CW)}" lengthAdjust="spacingAndGlyphs"` : ""}>${esc(title)}</text>
    <text x="${GITLOG_W - PAD}" y="${y}" font-size="${SIZE}" fill="${p.dim}" text-anchor="end">${esc(day(m.date))}</text>
  </g>`;
  });
  if (lines === 0) rows.push(`<text x="${PAD}" y="${TOP}" font-size="${SIZE}" fill="${p.dim}">(nothing merged yet)</text>`);
  const endY = TOP + Math.max(1, lines) * LINE + 6;
  const endDelay = t0 + lines * 0.18 + 0.2;

  const title =
    lines === 0
      ? "Recently merged at @northguild: nothing yet."
      : `Recently merged at @northguild, newest first: ${merges.map((m) => `${m.repo.split("/")[1]}: ${m.title} (${day(m.date).replace(/\s+/, " ")})`).join("; ")}.`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${GITLOG_W + 2 * GUTTER}" height="${H + 2 * GUTTER}" viewBox="0 0 ${GITLOG_W + 2 * GUTTER} ${H + 2 * GUTTER}" role="img" aria-labelledby="title">
<title id="title">${esc(title)}</title>
<style>
  text { font-family: ${FONT}; white-space: pre; }
  @keyframes appear { from { opacity: 0; } }
  @keyframes type { from { transform: translateX(0); } to { transform: translateX(${f(cmdW + CW)}px); } }
  @keyframes blink { 50% { opacity: 0; } }
  .typing { animation: type ${typeDur.toFixed(2)}s steps(${COMMAND.length}) .5s both; }
  .comment { animation: appear .3s ease-out ${(0.5 + typeDur).toFixed(2)}s both; }
  .ln { animation: appear .12s linear both; }
  .end { animation: appear .01s linear ${endDelay.toFixed(2)}s both; }
  .blink { animation: blink 1s step-end infinite; }
  ${FRAME_CSS}
  ${REDUCED_MOTION}
</style>
<g transform="translate(${GUTTER} ${GUTTER})">
  <rect width="${GITLOG_W}" height="${H}" fill="${p.bg}"/>
  <rect width="${GITLOG_W}" height="28" fill="${p.bar}"/>
  <text x="${PAD - 8}" y="19" font-size="11.5" fill="${p.dim}" letter-spacing="1">NORTHGUILD ── MERGED TO MAIN</text>
  <text x="${GITLOG_W - PAD + 8}" y="19" font-size="11.5" fill="${p.dim}" text-anchor="end" letter-spacing="1">LIVE, DAILY <tspan class="blink" fill="${p.text}">●</tspan></text>
  <text x="${PAD}" y="54" font-size="${SIZE}" fill="${p.dim}">$</text>
  <text x="${f(cmdX)}" y="54" font-size="${SIZE}" fill="${p.text}" textLength="${f(cmdW)}" lengthAdjust="spacing">${esc(COMMAND)}</text>
  <rect class="typing motion-only" x="${f(cmdX)}" y="38" width="${f(cmdW + CW)}" height="22" fill="${p.bg}"/>
  <!-- After the cover, which ends its slide just where the comment starts. -->
  <text class="comment" x="${f(cmdX + cmdW + 2 * CW)}" y="54" font-size="${SIZE}" fill="${p.border}">${esc(COMMENT)}</text>
  ${rows.join("\n  ")}
  <g class="end"><text x="${PAD}" y="${endY + 14}" font-size="${SIZE}" fill="${p.dim}">$</text><rect class="blink" x="${f(cmdX)}" y="${endY + 2}" width="${f(CW)}" height="15" fill="${p.text}"/></g>
</g>
${frame(p, { w: GITLOG_W, h: H, gutter: GUTTER, arm: 18, weight: 2.5, border: 1.5 })}
</svg>
`;
}
