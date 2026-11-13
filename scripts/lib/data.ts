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
}

export const EMPTY: Snapshot = { packages: {}, gmt: {}, worktree: {}, releases: [] };

type Fetcher = (url: string, headers?: Record<string, string>) => Promise<unknown>;

export const getJson: Fetcher = async (url, headers = {}) => {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "profile-readme-builder", ...headers },
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

  const [stats, commands] = await Promise.all([
    // gmt publishes its own figures (written by its scripts/stats.mjs, drift-checked in its CI).
    get("https://raw.githubusercontent.com/northguild/gmt/main/apps/dox/src/data/gmt-stats.json") as Promise<GmtStats | null>,
    get("https://api.github.com/repos/northguild/worktree/contents/src/commands", gh),
  ]);

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
  };
}
