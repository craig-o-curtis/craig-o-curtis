import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cards, releasesMarkdown, replaceSection } from "./build-profile.ts";
import { renderCard, sparkPoints, TAGLINE_MAX } from "./lib/card.ts";
import { EMPTY, fetchSnapshot, type Snapshot, toWeekly } from "./lib/data.ts";
import { renderHero } from "./lib/hero.ts";
import { DARK, esc, LIGHT } from "./lib/theme.ts";

const SNAP: Snapshot = {
  packages: {
    "@northguild/gmt": { version: "1.21.0", stars: 9, weekly: [0, 5, 262], lastRelease: "2026-11-03T10:54:24Z" },
    "@northguild/worktree": { version: "3.0.0", stars: 3, weekly: [1, 2, 237], lastRelease: "2026-11-07T15:04:57Z" },
    "run-cv": { version: "0.2.4", stars: 2, weekly: [0, 0, 18], lastRelease: "2026-09-13T09:51:22Z" },
  },
  gmt: { tests: 75622, functions: 773 },
  releases: [
    { repo: "northguild/worktree", name: "v3.0.0", url: "https://example.test/w", date: "2026-11-07T15:04:57Z" },
    { repo: "northguild/gmt", name: "@northguild/gmt-oxlint@1.2.2", url: "https://example.test/g", date: "2026-11-03T10:54:24Z" },
  ],
};

describe("toWeekly", () => {
  it("sums days into weeks, ending at the last day", () => {
    assert.deepEqual(toWeekly([1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2], 2), [7, 14]);
  });
  it("pads a short history with zero weeks at the front", () => {
    assert.deepEqual(toWeekly([3, 3, 3], 3), [0, 0, 9]);
  });
  it("puts a partial week first, not last", () => {
    assert.deepEqual(toWeekly([5, 1, 1, 1, 1, 1, 1, 1], 2), [5, 7]);
  });
});

describe("sparkPoints", () => {
  const box = { x: 0, y: 0, w: 100, h: 10 };
  it("puts the peak at the top and zero on the baseline", () => {
    assert.deepEqual(sparkPoints([0, 5, 10], box), [[0, 10], [50, 5], [100, 0]]);
  });
  it("keeps an all-zero series on the baseline instead of dividing by zero", () => {
    assert.deepEqual(sparkPoints([0, 0], box), [[0, 10], [100, 10]]);
  });
});

describe("replaceSection", () => {
  it("replaces only what sits between the markers", () => {
    const doc = "a\n<!-- x:start -->\nold\n<!-- x:end -->\nb";
    assert.equal(replaceSection(doc, "x", "new"), "a\n<!-- x:start -->\nnew\n<!-- x:end -->\nb");
  });
  it("is stable when run twice", () => {
    const doc = "<!-- x:start -->\n<!-- x:end -->";
    const once = replaceSection(doc, "x", "n");
    assert.equal(replaceSection(once, "x", "n"), once);
  });
  it("refuses a README without the markers", () => {
    assert.throws(() => replaceSection("no markers", "x", "n"), /missing/);
  });
});

describe("releasesMarkdown", () => {
  const now = Date.parse("2026-11-13T00:00:00Z");
  const rel = (repo: string, name: string, date: string) => ({ repo, name, url: `https://example.test/${name}`, date });
  const snap: Snapshot = {
    ...EMPTY,
    releases: [
      rel("northguild/gmt", "@northguild/gmt-oxlint@1.2.2", "2026-11-03T10:00:00Z"),
      rel("northguild/gmt", "@northguild/gmt@1.21.0", "2026-11-03T09:00:00Z"),
      rel("northguild/gmt", "@northguild/gmt@1.20.0", "2026-10-22T09:00:00Z"),
      rel("northguild/gmt", "@northguild/gmt@1.0.0", "2026-01-01T09:00:00Z"),
      rel("northguild/worktree", "v3.0.0", "2026-11-07T15:00:00Z"),
    ],
  };
  const projects = [
    { pkg: "@northguild/gmt", repo: "northguild/gmt" },
    { pkg: "@northguild/worktree", repo: "northguild/worktree" },
    { pkg: "run-cv", repo: "northguild/run-cv" },
  ];
  const md = releasesMarkdown(snap, projects, now);

  it("shows a monorepo's main package, not its latest plugin", () => {
    assert.match(md, /\| \[gmt\]\(https:\/\/github\.com\/northguild\/gmt\) \| \[`@northguild\/gmt@1\.21\.0`\]/);
    assert.doesNotMatch(md, /gmt-oxlint/);
  });
  it("counts only the main package's releases from the last 90 days", () => {
    assert.match(md, /`@northguild\/gmt@1\.21\.0`.*\| 2026-11-03 \| 2 \|/);
  });
  it("falls back to every release when names carry no package", () => {
    assert.match(md, /`v3\.0\.0`.*\| 2026-11-07 \| 1 \|/);
  });
  it("leaves out a project with no releases", () => {
    assert.doesNotMatch(md, /run-cv/);
  });
  it("says so when there are none at all", () => {
    assert.equal(releasesMarkdown(EMPTY, projects, now), "_No releases yet._");
  });
});

describe("cards", () => {
  for (const [key, card] of Object.entries(cards(SNAP))) {
    it(`${key}: taglines fit the card`, () => {
      for (const line of card.tagline) assert.ok(line.length <= TAGLINE_MAX, `${line.length} > ${TAGLINE_MAX}: ${line}`);
    });
    for (const palette of [DARK, LIGHT]) {
      it(`${key}: renders well-formed SVG with a title`, () => {
        const svg = renderCard(card, palette);
        assert.match(svg, /^<svg [^>]*role="img"/);
        assert.match(svg, /<title id="title">[^<]+<\/title>/);
        assert.match(svg, /prefers-reduced-motion/);
        assert.doesNotMatch(svg, /NaN|undefined/);
      });
    }
  }
  it("shows live figures", () => {
    const svg = renderCard(cards(SNAP).gmt, DARK);
    assert.match(svg, /75,622/);
    assert.match(svg, /v1\.21\.0/);
    assert.match(svg, />262</);
  });
  it("shows a dash, not a crash, for a package with no data", () => {
    const svg = renderCard(cards(EMPTY).worktree, DARK);
    assert.match(svg, /—/);
    assert.doesNotMatch(svg, /NaN|undefined/);
  });
});

describe("renderHero", () => {
  const svg = renderHero({ command: "npx run-cv craig", name: "A & B", roles: "r", tagline: "t" });
  it("escapes text", () => {
    assert.match(svg, /A &amp; B/);
  });
  it("hides the typing machinery under reduced motion", () => {
    assert.match(svg, /prefers-reduced-motion[\s\S]*\.motion-only \{ display: none; \}/);
  });
});

describe("fetchSnapshot", () => {
  it("keeps the previous value for every source that fails", async () => {
    const snap = await fetchSnapshot([{ pkg: "@northguild/gmt", repo: "northguild/gmt" }], SNAP, async () => null);
    assert.deepEqual(snap.packages["@northguild/gmt"], SNAP.packages["@northguild/gmt"]);
    assert.deepEqual(snap.gmt, SNAP.gmt);
    assert.deepEqual(snap.releases, SNAP.releases.filter((r) => r.repo === "northguild/gmt"));
  });
});

describe("esc", () => {
  it("escapes the XML specials", () => {
    assert.equal(esc(`<a href="x">&</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  });
});
