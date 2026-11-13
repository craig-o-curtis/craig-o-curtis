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

// Shared by every SVG: with reduced motion asked for, show the finished frame and nothing moving.
export const REDUCED_MOTION = `@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
  .motion-only { display: none; }
}`;
