// A chengyu (成语) a day: a four-character idiom, its pinyin, what it says word for word, and what it means
// at a keyboard. The characters write themselves in on a practice grid (田字格), stroke by stroke in real
// writing order: first in Simplified, as written in mainland China, then, after a pause, in Traditional, as
// written in Taiwan, whose stroke order differs in places (艹 is four strokes there, three on the mainland).
// Then round again. The strokes come from animCJK and Make Me a Hanzi (strokes.ts): each stroke an outline,
// revealed by a brush that runs along its median and is clipped to it.
//
// As everywhere, the final frame is the default: reduced motion shows the Simplified idiom written out.

import { SIMPLIFIED, type Strokes, TRADITIONAL } from "./strokes.ts";
import { ADVANCE, esc, FONT, FRAME_CSS, frame, type Palette, REDUCED_MOTION } from "./theme.ts";

export interface Idiom {
  /** Simplified, as written in mainland China. */
  hanzi: string;
  /** Traditional, as written in Taiwan and Hong Kong. */
  traditional: string;
  pinyin: string;
  /** Word for word. */
  literal: string;
  /** At a keyboard. */
  meaning: string;
}

export const IDIOMS: Idiom[] = [
  { hanzi: "刻舟求剑", traditional: "刻舟求劍", pinyin: "kè zhōu qiú jiàn", literal: "Mark the boat to find the sword", meaning: "A fixed UTC offset, after the clocks have moved. The world drifted; your marker didn't." },
  { hanzi: "画蛇添足", traditional: "畫蛇添足", pinyin: "huà shé tiān zú", literal: "Draw a snake, add feet", meaning: "The abstraction nobody asked for. Ship the snake." },
  { hanzi: "亡羊补牢", traditional: "亡羊補牢", pinyin: "wáng yáng bǔ láo", literal: "Lost a sheep, mend the pen", meaning: "Write the postmortem and fix the gap, even after the outage. It's not too late." },
  { hanzi: "未雨绸缪", traditional: "未雨綢繆", pinyin: "wèi yǔ chóu móu", literal: "Bind the windows before it rains", meaning: "Test the backup restore while nothing is on fire." },
  { hanzi: "掩耳盗铃", traditional: "掩耳盜鈴", pinyin: "yǎn ěr dào líng", literal: "Cover your ears to steal a bell", meaning: "Skipping the flaky test doesn't make the bug go away." },
  { hanzi: "举一反三", traditional: "舉一反三", pinyin: "jǔ yī fǎn sān", literal: "Shown one corner, find the other three", meaning: "Fix the bug, then go looking for the rest of its class." },
  { hanzi: "防微杜渐", traditional: "防微杜漸", pinyin: "fáng wēi dù jiàn", literal: "Stop the small before it spreads", meaning: "A lint rule today beats a refactor next year." },
  { hanzi: "事半功倍", traditional: "事半功倍", pinyin: "shì bàn gōng bèi", literal: "Half the work, twice the result", meaning: "What good tooling buys you." },
  { hanzi: "水滴石穿", traditional: "水滴石穿", pinyin: "shuǐ dī shí chuān", literal: "Dripping water bores through stone", meaning: "Small daily commits outlast heroic weekends." },
  { hanzi: "守株待兔", traditional: "守株待兔", pinyin: "shǒu zhū dài tù", literal: "Wait by the stump for a rabbit", meaning: "Re-running CI until it goes green is not a fix." },
  { hanzi: "纸上谈兵", traditional: "紙上談兵", pinyin: "zhǐ shàng tán bīng", literal: "Fight the war on paper", meaning: "A design doc with no prototype. Build the spike." },
  { hanzi: "胸有成竹", traditional: "胸有成竹", pinyin: "xiōng yǒu chéng zhú", literal: "The bamboo is drawn in the mind first", meaning: "Know the shape of the change before the first keystroke." },
  { hanzi: "杞人忧天", traditional: "杞人憂天", pinyin: "qǐ rén yōu tiān", literal: "The man of Qi fears the sky will fall", meaning: "Optimising the code path that runs once a month." },
  { hanzi: "井底之蛙", traditional: "井底之蛙", pinyin: "jǐng dǐ zhī wā", literal: "A frog at the bottom of a well", meaning: "Read other people's codebases. The sky is bigger than your repo." },
  { hanzi: "温故知新", traditional: "溫故知新", pinyin: "wēn gù zhī xīn", literal: "Review the old to learn the new", meaning: "git log knows why that line is there." },
  { hanzi: "实事求是", traditional: "實事求是", pinyin: "shí shì qiú shì", literal: "Seek truth from facts", meaning: "Profile it. Don't guess where the time goes." },
  { hanzi: "一劳永逸", traditional: "一勞永逸", pinyin: "yī láo yǒng yì", literal: "Toil once, rest for good", meaning: "Automate the thing you've now done three times." },
  { hanzi: "按图索骥", traditional: "按圖索驥", pinyin: "àn tú suǒ jì", literal: "Look for a fine horse from its picture", meaning: "Following the tutorial line for line into production." },
  { hanzi: "削足适履", traditional: "削足適履", pinyin: "xuē zú shì lǚ", literal: "Trim the feet to fit the shoes", meaning: "Bending the product to fit the framework." },
  { hanzi: "庖丁解牛", traditional: "庖丁解牛", pinyin: "páo dīng jiě niú", literal: "Cook Ding carves the ox", meaning: "Work with the grain of the system, and the blade never dulls." },
  { hanzi: "抛砖引玉", traditional: "拋磚引玉", pinyin: "pāo zhuān yǐn yù", literal: "Toss out a brick to draw out jade", meaning: "Open the draft PR. Someone will improve it." },
  { hanzi: "集思广益", traditional: "集思廣益", pinyin: "jí sī guǎng yì", literal: "Pool thoughts, widen the gain", meaning: "Why code review exists." },
  { hanzi: "自相矛盾", traditional: "自相矛盾", pinyin: "zì xiāng máo dùn", literal: "His own spear against his own shield", meaning: "Two tests that can't both pass." },
  { hanzi: "有条不紊", traditional: "有條不紊", pinyin: "yǒu tiáo bù wěn", literal: "In order, and never tangled", meaning: "A codebase where you can guess where things live." },
  { hanzi: "欲速不达", traditional: "欲速不達", pinyin: "yù sù bù dá", literal: "Rush, and you won't arrive", meaning: "The hotfix that needs a hotfix." },
  { hanzi: "一叶障目", traditional: "一葉障目", pinyin: "yī yè zhàng mù", literal: "One leaf before the eye", meaning: "Green unit tests, broken system. Step back and look." },
  { hanzi: "精益求精", traditional: "精益求精", pinyin: "jīng yì qiú jīng", literal: "Refine what is already fine", meaning: "It passes. Now make it clear." },
  { hanzi: "循序渐进", traditional: "循序漸進", pinyin: "xún xù jiàn jìn", literal: "Advance step by step, in order", meaning: "Migrate behind a flag, one module at a time." },
  { hanzi: "对症下药", traditional: "對症下藥", pinyin: "duì zhèng xià yào", literal: "Prescribe for the illness", meaning: "Fix the root cause, not the symptom in the logs." },
  { hanzi: "熟能生巧", traditional: "熟能生巧", pinyin: "shú néng shēng qiǎo", literal: "Practice breeds skill", meaning: "Katas are boring. Do them anyway." },
  { hanzi: "磨杵成针", traditional: "磨杵成針", pinyin: "mó chǔ chéng zhēn", literal: "Grind an iron rod into a needle", meaning: "Seventy-five thousand tests started with the first one." },
];

/** Today's idiom: one a day, in turn, by UTC day number. */
export function idiomOfTheDay(now = Date.now(), idioms = IDIOMS): Idiom {
  return idioms[Math.floor(now / 86_400_000) % idioms.length];
}

/** The labels under the grid, drawn from the same stroke data. */
export const VARIANT_LABELS = { simplified: "简体", traditional: "繁體" } as const;

export type Variant = "simplified" | "traditional";

/** A character's strokes in writing order. Throws for one strokes.ts doesn't hold. */
export function strokesOf(ch: string, variant: Variant): Strokes {
  const s = (variant === "traditional" ? TRADITIONAL[ch] : undefined) ?? SIMPLIFIED[ch];
  if (!s) throw new Error(`no strokes for ${ch}; run scripts/extract-strokes.ts`);
  return s;
}

/** The length of a median, in the 1024 box. */
export function medianLength(d: string): number {
  const n = d.match(/-?[\d.]+/g)?.map(Number) ?? [];
  let len = 0;
  for (let i = 2; i + 1 < n.length; i += 2) len += Math.hypot(n[i] - n[i - 2], n[i + 1] - n[i - 1]);
  return len;
}

export const IDIOM_W = 840;
const H = 196;
const GUTTER = 6;
const PAD = 26;
const CELL = 72;
const GAP = 12;
const TOP = 54;
const TEXT_X = PAD + 4 * CELL + 3 * GAP + 34;
/** The glyph's 1024 box, a little inside its cell. */
const INSET = 0.06;
const K = (CELL * (1 - 2 * INSET)) / 1024;
/** Pacing: a stroke takes BASE plus PER for every 1024 units of its median; then the brush lifts. */
const BASE = 0.07;
const PER = 0.3;
const LIFT = 0.05;
const NEXT_CHAR = 0.25;
const START = 0.6;
const HOLD = 3.5;
const FADE = 0.7;
const BLANK = 0.4;
/** pathLength of every median, so one keyframe distance fits them all. */
const LEN = 1000;

/** `text` broken at spaces into lines of at most `max` characters. */
function wrap(text: string, max: number): string[] {
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

/** Places a 1024 glyph box (y up, baseline 900) with its top-left at (x, y), `size` px square. */
const place = (x: number, y: number, size: number) => {
  const k = size / 1024;
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${k.toFixed(5)} ${(-k).toFixed(5)}) translate(0 -900)`;
};

export function renderIdiom(idiom: Idiom, p: Palette): string {
  const variants: Array<[Variant, string]> = [["simplified", idiom.hanzi], ["traditional", idiom.traditional]];
  for (const [, text] of variants) if ([...text].length !== 4) throw new Error(`a chengyu has four characters: ${text}`);
  const meaningSize = 14;
  const maxChars = Math.floor((IDIOM_W - PAD - TEXT_X) / (meaningSize * ADVANCE));
  const meaning = wrap(idiom.meaning, maxChars);
  if (meaning.length > 3) throw new Error(`idiom meaning too long for the card: ${idiom.meaning}`);
  const literal = `“${idiom.literal}”`;
  if (literal.length > maxChars + 4) throw new Error(`idiom gloss too long for the card: ${idiom.literal}`);

  // Lay out the writing first: when each stroke starts and how long it takes, variant after variant.
  let t = START;
  const plan = variants.map(([variant, text]) => {
    const begin = t;
    const chars = [...text].map((ch) => {
      const glyph = strokesOf(ch, variant);
      const strokes = glyph.medians.map((m) => {
        const dur = BASE + (PER * medianLength(m)) / 1024;
        const at = t;
        t += dur + LIFT;
        return { at, dur };
      });
      t += NEXT_CHAR;
      return { ch, glyph, strokes };
    });
    const fadeAt = t + HOLD;
    t = fadeAt + FADE + BLANK;
    return { variant, begin, fadeAt, chars };
  });
  const cycle = Number(t.toFixed(2));
  const pct = (s: number) => `${((s / cycle) * 100).toFixed(3)}%`;

  const grid = Array.from({ length: 4 }, (_, i) => {
    const x = PAD + i * (CELL + GAP);
    return `<rect x="${x}" y="${TOP}" width="${CELL}" height="${CELL}"/><path d="M${x} ${TOP + CELL / 2}h${CELL}M${x + CELL / 2} ${TOP}v${CELL}" stroke-dasharray="3 3"/>`;
  }).join("");

  const clips: string[] = [];
  const keys: string[] = [];
  const groups = plan.map((v, vi) => {
    const cells = v.chars.map((c, ci) => {
      const x = PAD + ci * (CELL + GAP) + CELL * INSET;
      const y = TOP + CELL * INSET;
      const brush = c.glyph.medians.map((m, si) => {
        const id = `c${vi}${ci}s${si}`;
        clips.push(`<clipPath id="${id}"><path d="${c.glyph.strokes[si]}"/></clipPath>`);
        const { at, dur } = c.strokes[si];
        keys.push(
          `@keyframes ${id} { 0%, ${pct(at)} { stroke-dashoffset: ${LEN}; opacity: 0; } ${pct(at + 0.005)} { stroke-dashoffset: ${LEN}; opacity: 1; animation-timing-function: cubic-bezier(.3, 0, .6, 1); } ${pct(at + dur)}, 100% { stroke-dashoffset: 0; opacity: 1; } }`,
        );
        return `<path class="st" d="${m}" clip-path="url(#${id})" pathLength="${LEN}" style="animation-name:${id}"/>`;
      });
      return `<g transform="${place(x, y, CELL * (1 - 2 * INSET))}"><path d="${c.glyph.strokes.join("")}" fill="${p.faint}"/>${brush.join("")}</g>`;
    });
    // The variant's name under the grid, in its own script, and in English after it.
    const label = [...VARIANT_LABELS[v.variant]]
      .map((ch, i) => `<g transform="${place(PAD + i * 18, TOP + CELL + 9, 17)}"><path d="${strokesOf(ch, v.variant).strokes.join("")}"/></g>`)
      .join("");
    const english = `<text x="${PAD + 42}" y="${TOP + CELL + 22}" font-size="11.5" letter-spacing="1" fill="${p.dim}">${v.variant === "simplified" ? "SIMPLIFIED · MAINLAND" : "TRADITIONAL · TAIWAN"}</text>`;
    const name = `<g fill="${p.dim}">${label}</g>${english}`;
    keys.push(
      vi === 0
        ? `@keyframes v0 { 0%, ${pct(v.fadeAt)} { opacity: 1; } ${pct(v.fadeAt + FADE)}, 100% { opacity: 0; } }`
        : `@keyframes v${vi} { 0%, ${pct(v.begin - 0.4)} { opacity: 0; } ${pct(v.begin)}, ${pct(v.fadeAt)} { opacity: 1; } ${pct(v.fadeAt + FADE)}, 100% { opacity: 0; } }`,
    );
    return `<g class="v${vi}">${name}<g filter="url(#glow)">${cells.join("")}</g></g>`;
  });

  const label = "[ CHENGYU OF THE DAY ]";
  const labelEnd = PAD + label.length * 13 * ADVANCE + 2 * label.length + 12;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${IDIOM_W + 2 * GUTTER}" height="${H + 2 * GUTTER}" viewBox="0 0 ${IDIOM_W + 2 * GUTTER} ${H + 2 * GUTTER}" role="img" aria-labelledby="title">
<title id="title">${esc(`Chengyu of the day: ${idiom.hanzi} (traditional ${idiom.traditional}), ${idiom.pinyin}, “${idiom.literal}”. ${idiom.meaning} The characters write themselves in stroke by stroke, in Simplified and then in Traditional.`)}</title>
<style>
  text { font-family: ${FONT}; white-space: pre; }
  @keyframes appear { from { opacity: 0; } }
  .gloss { animation: appear .5s ease-out ${START}s both; }
  .st { fill: none; stroke: ${p.text}; stroke-width: 150; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: ${LEN} ${LEN}; animation-duration: ${cycle}s; animation-timing-function: linear; animation-iteration-count: infinite; }
  .v0 { animation: v0 ${cycle}s linear infinite; }
  .v1 { opacity: 0; animation: v1 ${cycle}s linear infinite; }
  ${keys.join("\n  ")}
  ${FRAME_CSS}
  ${REDUCED_MOTION}
</style>
<defs>
  <filter id="glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  ${clips.join("\n  ")}
</defs>
<g transform="translate(${GUTTER} ${GUTTER})">
  <rect width="${IDIOM_W}" height="${H}" fill="${p.bg}"/>
  <text x="${PAD}" y="34" font-size="13" font-weight="700" letter-spacing="2" fill="${p.accent}">${esc(label)}</text>
  <line x1="${labelEnd.toFixed(1)}" y1="29.5" x2="${IDIOM_W - PAD}" y2="29.5" stroke="${p.faint}" stroke-width="1.5" stroke-dasharray="4 4"/>
  <g fill="none" stroke="${p.faint}" stroke-width="1">${grid}</g>
  ${groups.join("\n  ")}
  <g class="gloss">
    <text x="${TEXT_X}" y="${TOP + 22}" font-size="19" font-weight="700" fill="${p.accent}">${esc(idiom.pinyin)}</text>
    <text x="${TEXT_X}" y="${TOP + 48}" font-size="13.5" fill="${p.dim}">${esc(literal)}</text>
    ${meaning.map((l, i) => `<text x="${TEXT_X}" y="${TOP + 74 + i * 19}" font-size="${meaningSize}" fill="${p.text}">${esc(l)}</text>`).join("\n    ")}
  </g>
  <text x="${PAD}" y="${H - 14}" font-size="11.5" fill="${p.dim}">in real stroke order · a new one every day</text>
  <text x="${IDIOM_W - PAD}" y="${H - 14}" font-size="11.5" fill="${p.dim}" text-anchor="end">strokes: animCJK · Make Me a Hanzi</text>
</g>
${frame(p, { w: IDIOM_W, h: H, gutter: GUTTER, arm: 18, weight: 2.5, border: 1.5 })}
</svg>
`;
}
