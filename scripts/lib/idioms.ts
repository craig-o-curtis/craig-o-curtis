// A chengyu (成语) a day: a four-character idiom, its pinyin, what it says word for word, and what it means
// at a keyboard. The characters are drawn as pixels from GNU Unifont's 16 × 16 bitmaps (hanzi.ts), the same
// terminal-cell way the hero draws the name: an SVG behind <img> can't load a web font, and a CJK system
// font isn't on every machine.
//
// As in tip.ts, the final frame is the default. The characters print a row at a time, one after another;
// reduced motion shows them printed.

import { HANZI } from "./hanzi.ts";
import { ADVANCE, esc, FONT, FRAME_CSS, frame, type Palette, REDUCED_MOTION } from "./theme.ts";

export interface Idiom {
  hanzi: string;
  pinyin: string;
  /** Word for word. */
  literal: string;
  /** At a keyboard. */
  meaning: string;
}

export const IDIOMS: Idiom[] = [
  { hanzi: "刻舟求剑", pinyin: "kè zhōu qiú jiàn", literal: "Mark the boat to find the sword", meaning: "A fixed UTC offset, after the clocks have moved. The world drifted; your marker didn't." },
  { hanzi: "画蛇添足", pinyin: "huà shé tiān zú", literal: "Draw a snake, add feet", meaning: "The abstraction nobody asked for. Ship the snake." },
  { hanzi: "亡羊补牢", pinyin: "wáng yáng bǔ láo", literal: "Lost a sheep, mend the pen", meaning: "Write the postmortem and fix the gap, even after the outage. It's not too late." },
  { hanzi: "未雨绸缪", pinyin: "wèi yǔ chóu móu", literal: "Bind the windows before it rains", meaning: "Test the backup restore while nothing is on fire." },
  { hanzi: "掩耳盗铃", pinyin: "yǎn ěr dào líng", literal: "Cover your ears to steal a bell", meaning: "Skipping the flaky test doesn't make the bug go away." },
  { hanzi: "举一反三", pinyin: "jǔ yī fǎn sān", literal: "Shown one corner, find the other three", meaning: "Fix the bug, then go looking for the rest of its class." },
  { hanzi: "防微杜渐", pinyin: "fáng wēi dù jiàn", literal: "Stop the small before it spreads", meaning: "A lint rule today beats a refactor next year." },
  { hanzi: "事半功倍", pinyin: "shì bàn gōng bèi", literal: "Half the work, twice the result", meaning: "What good tooling buys you." },
  { hanzi: "水滴石穿", pinyin: "shuǐ dī shí chuān", literal: "Dripping water bores through stone", meaning: "Small daily commits outlast heroic weekends." },
  { hanzi: "守株待兔", pinyin: "shǒu zhū dài tù", literal: "Wait by the stump for a rabbit", meaning: "Re-running CI until it goes green is not a fix." },
  { hanzi: "纸上谈兵", pinyin: "zhǐ shàng tán bīng", literal: "Fight the war on paper", meaning: "A design doc with no prototype. Build the spike." },
  { hanzi: "胸有成竹", pinyin: "xiōng yǒu chéng zhú", literal: "The bamboo is drawn in the mind first", meaning: "Know the shape of the change before the first keystroke." },
  { hanzi: "杞人忧天", pinyin: "qǐ rén yōu tiān", literal: "The man of Qi fears the sky will fall", meaning: "Optimising the code path that runs once a month." },
  { hanzi: "井底之蛙", pinyin: "jǐng dǐ zhī wā", literal: "A frog at the bottom of a well", meaning: "Read other people's codebases. The sky is bigger than your repo." },
  { hanzi: "温故知新", pinyin: "wēn gù zhī xīn", literal: "Review the old to learn the new", meaning: "git log knows why that line is there." },
  { hanzi: "实事求是", pinyin: "shí shì qiú shì", literal: "Seek truth from facts", meaning: "Profile it. Don't guess where the time goes." },
  { hanzi: "一劳永逸", pinyin: "yī láo yǒng yì", literal: "Toil once, rest for good", meaning: "Automate the thing you've now done three times." },
  { hanzi: "按图索骥", pinyin: "àn tú suǒ jì", literal: "Look for a fine horse from its picture", meaning: "Following the tutorial line for line into production." },
  { hanzi: "削足适履", pinyin: "xuē zú shì lǚ", literal: "Trim the feet to fit the shoes", meaning: "Bending the product to fit the framework." },
  { hanzi: "庖丁解牛", pinyin: "páo dīng jiě niú", literal: "Cook Ding carves the ox", meaning: "Work with the grain of the system, and the blade never dulls." },
  { hanzi: "抛砖引玉", pinyin: "pāo zhuān yǐn yù", literal: "Toss out a brick to draw out jade", meaning: "Open the draft PR. Someone will improve it." },
  { hanzi: "集思广益", pinyin: "jí sī guǎng yì", literal: "Pool thoughts, widen the gain", meaning: "Why code review exists." },
  { hanzi: "自相矛盾", pinyin: "zì xiāng máo dùn", literal: "His own spear against his own shield", meaning: "Two tests that can't both pass." },
  { hanzi: "有条不紊", pinyin: "yǒu tiáo bù wěn", literal: "In order, and never tangled", meaning: "A codebase where you can guess where things live." },
  { hanzi: "欲速不达", pinyin: "yù sù bù dá", literal: "Rush, and you won't arrive", meaning: "The hotfix that needs a hotfix." },
  { hanzi: "一叶障目", pinyin: "yī yè zhàng mù", literal: "One leaf before the eye", meaning: "Green unit tests, broken system. Step back and look." },
  { hanzi: "精益求精", pinyin: "jīng yì qiú jīng", literal: "Refine what is already fine", meaning: "It passes. Now make it clear." },
  { hanzi: "循序渐进", pinyin: "xún xù jiàn jìn", literal: "Advance step by step, in order", meaning: "Migrate behind a flag, one module at a time." },
  { hanzi: "对症下药", pinyin: "duì zhèng xià yào", literal: "Prescribe for the illness", meaning: "Fix the root cause, not the symptom in the logs." },
  { hanzi: "熟能生巧", pinyin: "shú néng shēng qiǎo", literal: "Practice breeds skill", meaning: "Katas are boring. Do them anyway." },
  { hanzi: "磨杵成针", pinyin: "mó chǔ chéng zhēn", literal: "Grind an iron rod into a needle", meaning: "Seventy-five thousand tests started with the first one." },
];

/** Today's idiom: one a day, in turn, by UTC day number. */
export function idiomOfTheDay(now = Date.now(), idioms = IDIOMS): Idiom {
  return idioms[Math.floor(now / 86_400_000) % idioms.length];
}

/** A character's 16 × 16 Unifont bitmap, rows of booleans. Throws for one hanzi.ts doesn't hold. */
export function glyph(ch: string): boolean[][] {
  const hex = HANZI[ch];
  if (!hex) throw new Error(`no bitmap for ${ch}; run scripts/extract-hanzi.ts`);
  return Array.from({ length: 16 }, (_, y) => {
    const row = Number.parseInt(hex.slice(y * 4, y * 4 + 4), 16);
    return Array.from({ length: 16 }, (_, x) => (row & (0x8000 >> x)) !== 0);
  });
}

export const IDIOM_W = 840;
const H = 196;
const GUTTER = 6;
const PAD = 26;
const PX = 4.5;
const CELL = 16 * PX;
const GAP = 12;
const TOP = 62;
const TEXT_X = PAD + 4 * CELL + 3 * GAP + 34;

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

export function renderIdiom(idiom: Idiom, p: Palette): string {
  const chars = [...idiom.hanzi];
  if (chars.length !== 4) throw new Error(`a chengyu has four characters: ${idiom.hanzi}`);
  const meaningSize = 14;
  const maxChars = Math.floor((IDIOM_W - PAD - TEXT_X) / (meaningSize * ADVANCE));
  const meaning = wrap(idiom.meaning, maxChars);
  if (meaning.length > 3) throw new Error(`idiom meaning too long for the card: ${idiom.meaning}`);
  const literal = `“${idiom.literal}”`;
  if (literal.length > maxChars + 4) throw new Error(`idiom gloss too long for the card: ${idiom.literal}`);

  const cells = chars.map((ch, i) => {
    const x0 = PAD + i * (CELL + GAP);
    const d = glyph(ch)
      .flatMap((row, y) => row.map((on, x) => (on ? `M${(x0 + x * PX).toFixed(1)} ${(TOP + y * PX).toFixed(1)}h${PX - 0.6}v${PX - 0.6}h-${PX - 0.6}Z` : "")))
      .join("");
    const start = (0.5 + i * 0.45).toFixed(2);
    return `<path d="${d}" fill="${p.text}"/>
    <rect class="print motion-only" x="${x0 - 2}" y="${TOP - 2}" width="${CELL + 4}" height="${CELL + 4}" fill="${p.bg}" style="animation-delay:${start}s"/>`;
  });
  const after = 0.5 + 4 * 0.45;
  const label = "[ CHENGYU OF THE DAY ]";
  const labelEnd = PAD + label.length * 13 * ADVANCE + 2 * label.length + 12;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${IDIOM_W + 2 * GUTTER}" height="${H + 2 * GUTTER}" viewBox="0 0 ${IDIOM_W + 2 * GUTTER} ${H + 2 * GUTTER}" role="img" aria-labelledby="title">
<title id="title">${esc(`Chengyu of the day: ${idiom.hanzi} (${idiom.pinyin}), “${idiom.literal}”. ${idiom.meaning}`)}</title>
<style>
  text { font-family: ${FONT}; white-space: pre; }
  @keyframes appear { from { opacity: 0; } }
  @keyframes print { from { transform: translateY(0); } to { transform: translateY(${CELL + 4}px); } }
  .print { animation: print .4s steps(16) both; }
  .gloss { animation: appear .5s ease-out ${after.toFixed(2)}s both; }
  ${FRAME_CSS}
  ${REDUCED_MOTION}
</style>
<defs>
  <clipPath id="cells"><rect x="${PAD - 2}" y="${TOP - 2}" width="${4 * CELL + 3 * GAP + 4}" height="${CELL + 4}"/></clipPath>
  <filter id="glow" x="-5%" y="-20%" width="110%" height="140%"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<g transform="translate(${GUTTER} ${GUTTER})">
  <rect width="${IDIOM_W}" height="${H}" fill="${p.bg}"/>
  <text x="${PAD}" y="34" font-size="13" font-weight="700" letter-spacing="2" fill="${p.accent}">${esc(label)}</text>
  <line x1="${labelEnd.toFixed(1)}" y1="29.5" x2="${IDIOM_W - PAD}" y2="29.5" stroke="${p.faint}" stroke-width="1.5" stroke-dasharray="4 4"/>
  <g clip-path="url(#cells)" filter="url(#glow)">
    ${cells.join("\n    ")}
  </g>
  <g class="gloss">
    <text x="${TEXT_X}" y="${TOP + 14}" font-size="19" font-weight="700" fill="${p.accent}">${esc(idiom.pinyin)}</text>
    <text x="${TEXT_X}" y="${TOP + 40}" font-size="13.5" fill="${p.dim}">${esc(literal)}</text>
    ${meaning.map((l, i) => `<text x="${TEXT_X}" y="${TOP + 66 + i * 19}" font-size="${meaningSize}" fill="${p.text}">${esc(l)}</text>`).join("\n    ")}
  </g>
  <text x="${PAD}" y="${H - 16}" font-size="11.5" fill="${p.dim}">Mandarin, DLPT5 3/3 · a new one every day</text>
  <text x="${IDIOM_W - PAD}" y="${H - 16}" font-size="11.5" fill="${p.dim}" text-anchor="end">glyphs: GNU Unifont</text>
</g>
${frame(p, { w: IDIOM_W, h: H, gutter: GUTTER, arm: 18, weight: 2.5, border: 1.5 })}
</svg>
`;
}
