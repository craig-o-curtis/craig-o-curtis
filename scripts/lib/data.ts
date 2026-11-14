// Live figures for the profile, from public APIs only. Nothing here can fail the build: a source that
// cannot be reached keeps the value from the last snapshot (data/profile.json), so a flaky API costs a
// day's freshness, never a broken README.

export interface PackageData {
  version?: string;
  lastRelease?: string;
}

export interface Release {
  repo: string;
  name: string;
  url: string;
  date: string;
}

export interface Snapshot {
  packages: Record<string, PackageData>;
  gmt: {
    tests?: number;
    functions?: number;
    /** Test runs: every test, in every time zone, on every Node version. */
    executions?: number;
    timezones?: string[];
    nodes?: string[];
    locales?: number;
    namespaces?: number;
  };
  worktree: { commands?: number };
  releases: Release[];
  /** The last year of the contribution graph, one entry per day from `start`. */
  contributions?: Calendar;
  /** The most recently merged pull requests across ACTIVITY_REPOS, newest first. */
  activity?: Merge[];
}

export interface Calendar {
  /** The first day (a Sunday, as GitHub's graph starts its weeks), YYYY-MM-DD. */
  start: string;
  total: number;
  counts: number[];
  /** GitHub's own shading for each day, 0 (none) to 4 (its top quartile). */
  levels: number[];
}

export interface Merge {
  repo: string;
  number: number;
  sha: string;
  title: string;
  date: string;
  url: string;
}

export const EMPTY: Snapshot = { packages: {}, gmt: {}, worktree: {}, releases: [] };

/** Whose contribution graph the skyline draws. */
export const LOGIN = "craig-o-curtis";

/**
 * The repos the activity log reads, by name. An allowlist, never the org's listing: a token that can see a
 * private repo must still never put it on the profile.
 */
export const ACTIVITY_REPOS = ["northguild/gmt", "northguild/worktree", "northguild/northguild.dev", "northguild/run-cv"];
const ACTIVITY_LINES = 8;

/** A GET, or a POST when `body` is given (GraphQL). */
type Fetcher = (url: string, headers?: Record<string, string>, body?: unknown) => Promise<unknown>;

export const getJson: Fetcher = async (url, headers = {}, body) => {
  try {
    const res = await fetch(url, {
      method: body === undefined ? "GET" : "POST",
      headers: { "user-agent": "profile-readme-builder", ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.warn(`  ! ${url}: ${(error as Error).message}; keeping the last snapshot's value`);
    return null;
  }
};

export interface Source {
  pkg: string;
  repo: string;
}

interface GmtStats {
  tests?: number;
  functions?: number;
  executions?: number;
  timezoneList?: string[];
  nodes?: string[];
  locales?: number;
  byNamespace?: unknown[];
}

/** One file per command in worktree's src/commands, beside its tests. */
export function countCommands(listing: unknown): number | undefined {
  if (!Array.isArray(listing)) return undefined;
  return listing.filter((f: { name?: string; type?: string }) => f.type === "file" && /^[^.]+\.ts$/.test(f.name ?? "")).length;
}

const LEVELS: Record<string, number> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const CALENDAR_QUERY = `query($login: String!) { user(login: $login) { contributionsCollection { contributionCalendar {
  totalContributions weeks { contributionDays { date contributionCount contributionLevel } } } } } }`;

/** The GraphQL contribution calendar, flattened to one entry per day; undefined if the reply isn't one. */
export function toCalendar(reply: unknown): Calendar | undefined {
  const cal = (reply as { data?: { user?: { contributionsCollection?: { contributionCalendar?: unknown } } } } | null)?.data?.user
    ?.contributionsCollection?.contributionCalendar as
    | { totalContributions: number; weeks: Array<{ contributionDays: Array<{ date: string; contributionCount: number; contributionLevel: string }> }> }
    | undefined;
  const days = cal?.weeks?.flatMap((w) => w.contributionDays) ?? [];
  if (!cal || days.length === 0) return undefined;
  return {
    start: days[0].date,
    total: cal.totalContributions,
    counts: days.map((d) => d.contributionCount),
    levels: days.map((d) => LEVELS[d.contributionLevel] ?? 0),
  };
}

/** A PR title without the issue or ticket reference some repos append, e.g. `(#519)` or `(RAI-99, #407)`. */
export function cleanTitle(title: string): string {
  return title.replace(/\s*\((?:[A-Z][A-Z0-9]*-\d+,\s*)*#\d+\)\s*$/, "").trim();
}

/** Merged PRs from one repo's closed-PR listing; undefined if the listing failed. */
export function toMerges(repo: string, listing: unknown): Merge[] | undefined {
  if (!Array.isArray(listing)) return undefined;
  return (listing as Array<Record<string, unknown>>)
    .filter((pr) => pr.merged_at && pr.merge_commit_sha)
    .map((pr) => ({
      repo,
      number: Number(pr.number),
      sha: String(pr.merge_commit_sha).slice(0, 7),
      title: cleanTitle(String(pr.title)),
      date: String(pr.merged_at),
      url: String(pr.html_url),
    }));
}

export async function fetchSnapshot(sources: Source[], prev: Snapshot, get: Fetcher = getJson): Promise<Snapshot> {
  const gh = process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};

  const packages: Record<string, PackageData> = {};
  const releases: Release[] = [];

  await Promise.all(
    sources.map(async ({ pkg, repo }) => {
      const before = prev.packages[pkg] ?? {};
      const [latest, rels] = await Promise.all([
        get(`https://registry.npmjs.org/${pkg}/latest`),
        get(`https://api.github.com/repos/${repo}/releases?per_page=100`, gh),
      ]);

      const published = Array.isArray(rels)
        ? (rels as Array<Record<string, unknown>>)
            .filter((r) => !r.draft && !r.prerelease && r.published_at)
            .map((r) => ({
              repo,
              name: String(r.name || r.tag_name),
              url: String(r.html_url),
              date: String(r.published_at),
            }))
        : prev.releases.filter((r) => r.repo === repo);
      releases.push(...published);

      packages[pkg] = {
        version: (latest as { version?: string } | null)?.version ?? before.version,
        lastRelease: published[0]?.date ?? before.lastRelease,
      };
    }),
  );

  const [stats, commands, calendar, ...listings] = await Promise.all([
    // gmt publishes its own figures (written by its scripts/stats.mjs, drift-checked in its CI).
    get("https://raw.githubusercontent.com/northguild/gmt/main/apps/dox/src/data/gmt-stats.json") as Promise<GmtStats | null>,
    get("https://api.github.com/repos/northguild/worktree/contents/src/commands", gh),
    // GraphQL needs a token (the workflow's own will do); without one, keep the last calendar.
    process.env.GITHUB_TOKEN
      ? get("https://api.github.com/graphql", gh, { query: CALENDAR_QUERY, variables: { login: LOGIN } })
      : Promise.resolve(null),
    ...ACTIVITY_REPOS.map((repo) => get(`https://api.github.com/repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=30`, gh)),
  ]);

  const merges = ACTIVITY_REPOS.flatMap((repo, i) => toMerges(repo, listings[i]) ?? (prev.activity ?? []).filter((m) => m.repo === repo));

  return {
    packages,
    gmt: stats
      ? {
          tests: stats.tests,
          functions: stats.functions,
          executions: stats.executions,
          timezones: stats.timezoneList,
          nodes: stats.nodes,
          locales: stats.locales,
          namespaces: stats.byNamespace?.length,
        }
      : prev.gmt,
    worktree: { commands: countCommands(commands) ?? prev.worktree?.commands },
    releases: releases.sort((a, b) => b.date.localeCompare(a.date)),
    contributions: toCalendar(calendar) ?? prev.contributions,
    activity: merges.sort((a, b) => b.date.localeCompare(a.date)).slice(0, ACTIVITY_LINES),
  };
}
