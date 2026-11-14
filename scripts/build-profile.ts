// Builds the generated parts of the profile: assets/*.svg, data/profile.json, and the README sections
// between `<!-- name:start -->` and `<!-- name:end -->` markers. Everything else in README.md is
// hand-written and left alone.
//
//   node scripts/build-profile.ts            # fetch live figures, then render
//   node scripts/build-profile.ts --offline  # render from data/profile.json only
//
// Node 24+ (runs the TypeScript directly), no dependencies. GITHUB_TOKEN, when set, raises the GitHub
// API rate limit; the public endpoints work without it.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { type CardInput, renderCard } from "./lib/card.ts";
import { CITY_DARK, CITY_LIGHT, renderCity } from "./lib/city.ts";
import { EMPTY, fetchSnapshot, type Release, type Snapshot } from "./lib/data.ts";
import { renderGitlog } from "./lib/gitlog.ts";
import { guideMarkdown, LETTERS, QUIZ, RAIN_DARK, RAIN_LIGHT, renderAnswer, renderGuide } from "./lib/guide.ts";
import { renderHero } from "./lib/hero.ts";
import { idiomOfTheDay, renderIdiom } from "./lib/idioms.ts";
import { type Key, keysMarkdown, keyWidth, renderKey } from "./lib/keys.ts";
import { HELSINKI_DARK, HELSINKI_LIGHT, type PortfolioInput, renderPortfolio } from "./lib/portfolio.ts";
import { renderTip, type TipInput } from "./lib/tip.ts";
import { DARK, LIGHT } from "./lib/theme.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = path.join(ROOT, "assets");
const SNAPSHOT = path.join(ROOT, "data", "profile.json");
const README = path.join(ROOT, "README.md");

export const PROJECTS = [
  { key: "gmt", pkg: "@northguild/gmt", repo: "northguild/gmt" },
  { key: "worktree", pkg: "@northguild/worktree", repo: "northguild/worktree" },
] as const;

const num = (n: number | undefined) => (n === undefined ? "—" : new Intl.NumberFormat("en-US").format(n));
const compact = (n: number | undefined) =>
  n === undefined ? "—" : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
const day = (iso: string | undefined) =>
  iso ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso)) : "—";
const isoDay = (iso: string) => iso.slice(0, 10);

/**
 * A project's own releases, newest first. In a monorepo (gmt publishes its lint plugins from the same
 * repo) only the main package's count, when it names them `<pkg>@<version>`; otherwise every release does.
 */
export function ownReleases(s: Snapshot, pkg: string, repo: string): Release[] {
  const all = s.releases.filter((r) => r.repo === repo);
  const main = all.filter((r) => r.name.startsWith(`${pkg}@`));
  return main.length > 0 ? main : all;
}

/** The major version of an `x.0.0` release (x ≥ 1), read from its tag; undefined for anything else. */
export function majorOf(r: Release): number | undefined {
  const tag = decodeURIComponent(r.url.split("/tag/")[1] ?? r.name);
  const m = /(?:^v?|@)(\d+)\.0\.0$/.exec(tag);
  return m && Number(m[1]) > 0 ? Number(m[1]) : undefined;
}

/** A column label for an IANA zone: a two-word city's initials, else its first three letters. */
export function zoneLabel(zone: string): string {
  const city = zone.split("/").at(-1) ?? zone;
  const words = city.split("_");
  return (words.length > 1 ? words.map((w) => w[0]).join("") : city.slice(0, 3)).toUpperCase();
}

export const TIP: TipInput = {
  title: "TERMINAL ── RUN-CV",
  status: "READY",
  text: "My CV/resume runs in your terminal, in a green-screen mainframe UI.",
  command: "npx run-cv craig",
  note: "No terminal handy? Click to run it in the browser →",
};

export const PORTFOLIO: PortfolioInput = {
  url: "https://craig-o-curtis.github.io/",
  host: "craig-o-curtis.github.io",
  lines: [
    "My portfolio: an interactive dashboard of my work, stack, open source and agent workflows.",
    "Its field guide asks 12 questions, and each right answer unlocks a skin, a scene or a synth track:",
  ],
  locked: ["Mainframe", "Retro 82", "Solid", "Rain", "NorthGuild"],
  unlocks: 12,
};

/** The links under the hero, as function keys. */
export const KEYS: Key[] = [
  { slug: "portfolio", label: "PORTFOLIO", url: "https://craig-o-curtis.github.io/", alt: "my portfolio, craig-o-curtis.github.io" },
  { slug: "linkedin", label: "LINKEDIN", url: "https://www.linkedin.com/in/craigocurtis/", alt: "my LinkedIn profile" },
  { slug: "northguild", label: "@NORTHGUILD", url: "https://github.com/northguild", alt: "the northguild organisation on GitHub" },
  { slug: "northguild-dev", label: "NORTHGUILD.DEV", url: "https://northguild.dev", alt: "northguild.dev, the docs sites" },
];

export function cards(s: Snapshot): Record<string, CardInput> {
  const pkg = (name: string) => s.packages[name] ?? {};
  const zones = s.gmt.timezones ?? [];
  const nodes = s.gmt.nodes ?? [];
  const wt = ownReleases(s, "@northguild/worktree", "northguild/worktree");
  return {
    gmt: {
      title: "gmt",
      pill: `v${pkg("@northguild/gmt").version ?? "?"}`,
      tagline: ["Give Me Temporal. Date & time for JS/TS,", "built on TC39 Temporal. Never touches Date."],
      stats: [
        { value: num(s.gmt.tests), label: "tests" },
        { value: compact(s.gmt.executions), label: "test runs" },
        { value: num(s.gmt.functions), label: "functions" },
      ],
      body: {
        kind: "matrix",
        rows: nodes.map((n) => `node ${n}`),
        cols: zones.map(zoneLabel),
        caption: `${zones.length} time zones × ${nodes.length} Node versions`,
      },
      footer: s.gmt.locales === undefined ? "" : `${s.gmt.locales} locales`,
    },
    worktree: {
      title: "worktree",
      pill: `v${pkg("@northguild/worktree").version ?? "?"}`,
      tagline: ["Git worktrees without the ceremony.", "Hands each new worktree to a coding agent."],
      stats: [
        { value: wt.length > 0 ? num(wt.length) : "—", label: "releases" },
        { value: num(s.worktree.commands), label: "commands" },
        { value: day(pkg("@northguild/worktree").lastRelease), label: "last release" },
      ],
      body: { kind: "timeline", releases: wt.map((r) => ({ date: r.date, major: majorOf(r) })), caption: "release history" },
      footer: "npx @northguild/worktree",
    },
    dox: {
      title: "Dox",
      pill: "RAG",
      tagline: ["Two RAG assistants live in my docs sites.", "Dox for gmt even runs the library's tools."],
      stats: [],
      body: {
        kind: "chat",
        ask: "what's one month after Jan 31, 2024?",
        call: 'addDate("2024-01-31", { months: 1 })',
        answer: '"2024-02-29"  ← clamped, leap year',
        caption: "northguild.dev/gmt/dox",
      },
      footer: "ask it anything",
    },
    // Facts from the sites' own sources: northguild.dev's apps/site/src/scripts/aurora.worker.ts, gmt's
    // apps/dox/src/lib/globe/webgpu/renderer-webgpu.ts and worktree's docs/src/hero/particles.ts.
    northguild: {
      title: "northguild.dev",
      pill: "GPU",
      tagline: ["The docs sites draw live on the GPU:", "WebGPU and WebGL, on custom-built shaders."],
      stats: [],
      body: {
        kind: "scene",
        rows: [
          ["/", "aurora over real stars · WebGL worker"],
          ["/gmt", "WebGPU globe · 4× MSAA · live sun"],
          ["/worktree", "particles: leaf → git graph → wordmark"],
        ],
        caption: "northguild.dev",
      },
      footer: "WGSL · GLSL · OffscreenCanvas",
    },
  };
}

/** One row per project: its latest release and how many it shipped in the last 90 days (see ownReleases). */
export function releasesMarkdown(s: Snapshot, projects: ReadonlyArray<{ pkg: string; repo: string }> = PROJECTS, now = Date.now()): string {
  const since = now - 90 * 24 * 60 * 60 * 1000;
  const rows = projects.flatMap(({ pkg, repo }) => {
    const own = ownReleases(s, pkg, repo);
    const [latest] = own;
    if (!latest) return [];
    const recent = own.filter((r) => Date.parse(r.date) >= since).length;
    const name = repo.split("/")[1];
    return [`| [${name}](https://github.com/${repo}) | [\`${latest.name}\`](${latest.url}) | ${isoDay(latest.date)} | ${recent} |`];
  });
  if (rows.length === 0) return "_No releases yet._";
  return ["| Project | Latest release | Date | Releases, last 90 days |", "| --- | --- | --- | ---: |", ...rows].join("\n");
}

/** Replaces what sits between `<!-- name:start -->` and `<!-- name:end -->`. Throws if the markers are missing. */
export function replaceSection(doc: string, name: string, content: string): string {
  const start = `<!-- ${name}:start -->`;
  const end = `<!-- ${name}:end -->`;
  const i = doc.indexOf(start);
  const j = doc.indexOf(end);
  if (i === -1 || j === -1 || j < i) throw new Error(`README.md is missing the ${start} … ${end} markers`);
  return `${doc.slice(0, i + start.length)}\n${content}\n${doc.slice(j)}`;
}

async function main() {
  const offline = process.argv.includes("--offline");
  let prev: Snapshot = EMPTY;
  try {
    prev = { ...EMPTY, ...JSON.parse(await readFile(SNAPSHOT, "utf8")) };
  } catch {
    // First run: no snapshot yet.
  }

  const snapshot = offline ? prev : await fetchSnapshot([...PROJECTS], prev);

  await mkdir(ASSETS, { recursive: true });
  await mkdir(path.dirname(SNAPSHOT), { recursive: true });

  const writes: Array<Promise<void>> = [
    writeFile(SNAPSHOT, `${JSON.stringify(snapshot, null, 2)}\n`),
    writeFile(
      path.join(ASSETS, "hero.svg"),
      renderHero({
        command: "npx run-cv craig",
        name: "CRAIG CURTIS",
        roles: "Frontend Architect · Fullstack Developer · Chinese Linguist",
        tagline: "AI-accelerated TypeScript tooling — building at @northguild",
      }),
    ),
  ];
  for (const [theme, palette] of [["dark", DARK], ["light", LIGHT]] as const) {
    writes.push(writeFile(path.join(ASSETS, `tip-${theme}.svg`), renderTip(TIP, palette)));
  }
  for (const [theme, palette] of [["dark", HELSINKI_DARK], ["light", HELSINKI_LIGHT]] as const) {
    writes.push(writeFile(path.join(ASSETS, `portfolio-${theme}.svg`), renderPortfolio(PORTFOLIO, palette)));
  }
  for (const [theme, palette, colors] of [["dark", DARK, CITY_DARK], ["light", LIGHT, CITY_LIGHT]] as const) {
    writes.push(writeFile(path.join(ASSETS, `city-${theme}.svg`), renderCity(snapshot.contributions, palette, colors)));
    writes.push(writeFile(path.join(ASSETS, `gitlog-${theme}.svg`), renderGitlog(snapshot.activity ?? [], palette)));
  }
  const kw = keyWidth(KEYS);
  const question = QUIZ;
  const idiom = idiomOfTheDay();
  for (const [theme, palette] of [["dark", DARK], ["light", LIGHT]] as const) {
    writes.push(writeFile(path.join(ASSETS, `idiom-${theme}.svg`), renderIdiom(idiom, palette)));
    KEYS.forEach((k, i) => writes.push(writeFile(path.join(ASSETS, `key-${k.slug}-${theme}.svg`), renderKey(k, i + 1, kw, palette))));
  }
  for (const [theme, rain] of [["dark", RAIN_DARK], ["light", RAIN_LIGHT]] as const) {
    writes.push(writeFile(path.join(ASSETS, `guide-${theme}.svg`), renderGuide(question, rain)));
    question.options.forEach((o, i) =>
      writes.push(writeFile(path.join(ASSETS, `answer-${LETTERS[i].toLowerCase()}-${theme}.svg`), renderAnswer(LETTERS[i], o, rain))),
    );
  }
  for (const [key, card] of Object.entries(cards(snapshot))) {
    writes.push(writeFile(path.join(ASSETS, `card-${key}-dark.svg`), renderCard(card, DARK)));
    writes.push(writeFile(path.join(ASSETS, `card-${key}-light.svg`), renderCard(card, LIGHT)));
  }
  await Promise.all(writes);

  const readme = await readFile(README, "utf8");
  let next = replaceSection(readme, "releases", releasesMarkdown(snapshot));
  next = replaceSection(next, "keys", keysMarkdown(KEYS));
  next = replaceSection(next, "guide", guideMarkdown(question));
  await writeFile(README, next);

  console.log(
    `profile built: hero, terminal, portfolio, ${KEYS.length} keys, ${Object.keys(cards(snapshot)).length} cards, git log, city, quiz, chengyu (${idiom.hanzi}), × 2 themes; ${snapshot.releases.length} releases`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
