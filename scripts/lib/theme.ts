// Palettes follow run-cv's terminal theme (northguild/run-cv src/styles/theme.ts and
// scripts/pdf-gen/styles/themes/terminal/variables.css), so the profile and the CV read as one thing.

export interface Palette {
  bg: string;
  bar: string;
  border: string;
  text: string;
  dim: string;
  faint: string;
  accent: string;
}

export const DARK: Palette = {
  bg: "#0d0d0d",
  bar: "#001a00",
  border: "#008000",
  text: "#00ff00",
  dim: "#00a000",
  faint: "#003300",
  accent: "#00ffff",
};

// The same screen on paper: dark greens on a pale green ground, for GitHub's light theme.
export const LIGHT: Palette = {
  bg: "#f4fbf4",
  bar: "#e3f3e3",
  border: "#2e7d32",
  text: "#0b5d1e",
  dim: "#3f7a4f",
  faint: "#d3ebd3",
  accent: "#006d77",
};

// An SVG shown through <img> cannot load web fonts, so this is a stack of fonts the viewer already has.
// Text that must line up character by character also sets `textLength`, which pins its width whichever
// font wins.
export const FONT =
  "ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', 'Liberation Mono', monospace";

// Monospace advance width as a fraction of font size; 0.6 holds for every font in the stack.
export const ADVANCE = 0.6;

export function esc(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export interface FrameOptions {
  /** Size of the framed screen, without the gutter. */
  w: number;
  h: number;
  /** Space around the screen that holds the corner brackets; the SVG is `w + 2 * gutter` wide. */
  gutter: number;
  /** Length of each bracket arm. */
  arm: number;
  /** Bracket stroke width. */
  weight: number;
  /** Frame stroke width. */
  border: number;
}

/**
 * A square-cornered frame with a target-lock bracket outside each corner, like a sight that has
 * acquired the screen. Draw the screen inside `<g transform="translate(gutter gutter)">` first, then
 * this on top. The brackets close in and blink once (`.lock`, see FRAME_CSS); still, they just sit there.
 */
export function frame(p: Palette, o: FrameOptions): string {
  const W = o.w + 2 * o.gutter;
  const H = o.h + 2 * o.gutter;
  const e = o.weight / 2;
  const a = o.arm;
  const corners = [
    `M${e} ${e + a} V${e} H${e + a}`,
    `M${W - e - a} ${e} H${W - e} V${e + a}`,
    `M${W - e} ${H - e - a} V${H - e} H${W - e - a}`,
    `M${e + a} ${H - e} H${e} V${H - e - a}`,
  ];
  return `<rect x="${o.gutter}" y="${o.gutter}" width="${o.w}" height="${o.h}" fill="none" stroke="${p.border}" stroke-width="${o.border}"/>
<path class="lock" d="${corners.join(" ")}" fill="none" stroke="${p.text}" stroke-width="${o.weight}" stroke-linecap="square"/>`;
}

export const FRAME_CSS = `@keyframes lock { 0% { opacity: 0; transform: scale(1.05); } 55% { opacity: 1; transform: scale(1); } 65% { opacity: .2; } 75% { opacity: 1; } 85% { opacity: .2; } 100% { opacity: 1; transform: scale(1); } }
  .lock { transform-box: view-box; transform-origin: 50% 50%; animation: lock .9s ease-out .1s both; }`;

// Shared by every SVG: with reduced motion asked for, show the finished frame and nothing moving.
export const REDUCED_MOTION = `@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
  .motion-only { display: none; }
}`;
