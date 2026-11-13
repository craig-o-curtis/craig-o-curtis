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
import { EMPTY, fetchSnapshot, type Snapshot } from "./lib/data.ts";
import { renderHero } from "./lib/hero.ts";
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
const day = (iso: string | undefined) =>
  iso ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(iso)) : "—";
const isoDay = (iso: string) => iso.slice(0, 10);

export function cards(s: Snapshot): Record<string, CardInput> {
  const pkg = (name: string) => s.packages[name] ?? {};
  const perWeek = (name: string) => num(pkg(name).weekly?.at(-1));
  const spark = (name: string) => ({
    kind: "sparkline" as const,
    series: pkg(name).weekly ?? [],
    caption: "npm downloads · 26 weeks",
  });
  return {
    gmt: {
      title: "gmt",
      pill: `v${pkg("@northguild/gmt").version ?? "?"}`,
      tagline: ["Give Me Temporal. Date & time for JS/TS,", "built on TC39 Temporal. Never touches Date."],
      stats: [
        { value: num(s.gmt.tests), label: "tests" },
        { value: num(s.gmt.functions), label: "functions" },
        { value: perWeek("@northguild/gmt"), label: "npm / week" },
      ],
      body: spark("@northguild/gmt"),
      footer: `★ ${num(pkg("@northguild/gmt").stars)}`,
    },
    worktree: {
      title: "worktree",
      pill: `v${pkg("@northguild/worktree").version ?? "?"}`,
      tagline: ["Git worktrees without the ceremony.", "Hands each new worktree to a coding agent."],
      stats: [
        { value: perWeek("@northguild/worktree"), label: "npm / week" },
        { value: `★ ${num(pkg("@northguild/worktree").stars)}`, label: "stars" },
        { value: day(pkg("@northguild/worktree").lastRelease), label: "last release" },
      ],
      body: spark("@northguild/worktree"),
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
  };
}

/**
 * One row per project: its latest release and how many it shipped in the last 90 days. In a monorepo
 * (gmt publishes its lint plugins from the same repo) only the main package's releases count, when it
 * names them `<pkg>@<version>`; otherwise every release in the repo does.
 */
export function releasesMarkdown(s: Snapshot, projects: ReadonlyArray<{ pkg: string; repo: string }> = PROJECTS, now = Date.now()): string {
  const since = now - 90 * 24 * 60 * 60 * 1000;
  const rows = projects.flatMap(({ pkg, repo }) => {
    const all = s.releases.filter((r) => r.repo === repo);
    const main = all.filter((r) => r.name.startsWith(`${pkg}@`));
    const own = main.length > 0 ? main : all;
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
  for (const [key, card] of Object.entries(cards(snapshot))) {
    writes.push(writeFile(path.join(ASSETS, `card-${key}-dark.svg`), renderCard(card, DARK)));
    writes.push(writeFile(path.join(ASSETS, `card-${key}-light.svg`), renderCard(card, LIGHT)));
  }
  await Promise.all(writes);

  const readme = await readFile(README, "utf8");
  await writeFile(README, replaceSection(readme, "releases", releasesMarkdown(snapshot)));

  console.log(`profile built: hero, ${Object.keys(cards(snapshot)).length} cards × 2 themes, ${snapshot.releases.length} releases`);
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
