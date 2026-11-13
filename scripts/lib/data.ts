// Live figures for the profile, from public APIs only. Nothing here can fail the build: a source that
// cannot be reached keeps the value from the last snapshot (data/profile.json), so a flaky API costs a
// day's freshness, never a broken README.

export interface PackageData {
  version?: string;
  stars?: number;
  /** npm downloads per week, oldest first, the last entry being the latest complete week. */
  weekly?: number[];
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
  gmt: { tests?: number; functions?: number; executions?: number };
  releases: Release[];
}

export const WEEKS = 26;

export const EMPTY: Snapshot = { packages: {}, gmt: {}, releases: [] };

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

/** Daily counts → weekly sums, ending at the last day given. Short histories are padded with zero weeks. */
export function toWeekly(daily: number[], weeks = WEEKS): number[] {
  const out: number[] = [];
  for (let end = daily.length; end > 0 && out.length < weeks; end -= 7) {
    out.unshift(daily.slice(Math.max(0, end - 7), end).reduce((a, b) => a + b, 0));
  }
  while (out.length < weeks) out.unshift(0);
  return out;
}

export interface Source {
  pkg: string;
  repo: string;
}

export async function fetchSnapshot(sources: Source[], prev: Snapshot, get: Fetcher = getJson): Promise<Snapshot> {
  const gh = process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  const days = WEEKS * 7;

  const packages: Record<string, PackageData> = {};
  const releases: Release[] = [];

  await Promise.all(
    sources.map(async ({ pkg, repo }) => {
      const before = prev.packages[pkg] ?? {};
      const [latest, range, repoInfo, rels] = await Promise.all([
        get(`https://registry.npmjs.org/${pkg}/latest`),
        get(`https://api.npmjs.org/downloads/range/last-year/${pkg}`),
        get(`https://api.github.com/repos/${repo}`, gh),
        get(`https://api.github.com/repos/${repo}/releases?per_page=50`, gh),
      ]);

      const daily = (range as { downloads?: Array<{ downloads: number }> } | null)?.downloads;
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
        stars: (repoInfo as { stargazers_count?: number } | null)?.stargazers_count ?? before.stars,
        weekly: daily ? toWeekly(daily.slice(-days).map((d) => d.downloads)) : before.weekly,
        lastRelease: published[0]?.date ?? before.lastRelease,
      };
    }),
  );

  // gmt publishes its own figures (written by its scripts/stats.mjs, drift-checked in its CI).
  const stats = (await get("https://raw.githubusercontent.com/northguild/gmt/main/apps/dox/src/data/gmt-stats.json")) as
    | Snapshot["gmt"]
    | null;

  return {
    packages,
    gmt: stats
      ? { tests: stats.tests, functions: stats.functions, executions: stats.executions }
      : prev.gmt,
    releases: releases.sort((a, b) => b.date.localeCompare(a.date)),
  };
}
