import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cards, majorOf, PORTFOLIO, releasesMarkdown, replaceSection, TIP, zoneLabel } from "./build-profile.ts";
import { renderCard, TAGLINE_MAX } from "./lib/card.ts";
import { countCommands, EMPTY, fetchSnapshot, type Snapshot } from "./lib/data.ts";
import { renderHero } from "./lib/hero.ts";
import { DARK, esc, LIGHT } from "./lib/theme.ts";
import { tinyBitmap } from "./lib/tiny.ts";
import { HELSINKI_DARK, HELSINKI_LIGHT, renderPortfolio } from "./lib/portfolio.ts";
import { renderTip } from "./lib/tip.ts";
import { raven } from "./lib/raven.ts";

const SNAP: Snapshot = {
  packages: {
    "@northguild/gmt": { version: "1.21.0", lastRelease: "2026-11-03T10:54:24Z" },
    "@northguild/worktree": { version: "3.0.0", lastRelease: "2026-11-07T15:04:57Z" },
    "run-cv": { version: "0.2.4", lastRelease: "2026-09-13T09:51:22Z" },
  },
  gmt: {
    tests: 75622,
    functions: 773,
    executions: 2268660,
    timezones: ["Pacific/Niue", "America/New_York", "UTC", "Australia/Lord_Howe"],
    nodes: ["22", "24", "26"],
    locales: 17,
    namespaces: 19,
  },
  worktree: { commands: 9 },
  releases: [
    { repo: "northguild/worktree", name: "v3.0.0", url: "https://example.test/tag/v3.0.0", date: "2026-11-07T15:04:57Z" },
    { repo: "northguild/worktree", name: "v2.1.2", url: "https://example.test/tag/v2.1.2", date: "2026-10-14T20:00:00Z" },
    { repo: "northguild/gmt", name: "@northguild/gmt-oxlint@1.2.2", url: "https://example.test/g", date: "2026-11-03T10:54:24Z" },
  ],
};

describe("majorOf", () => {
  const r = (tag: string) => ({ repo: "r", name: "n", url: `https://example.test/tag/${tag}`, date: "" });
  it("reads a major from a v-tag or a monorepo tag", () => {
    assert.equal(majorOf(r("v3.0.0")), 3);
    assert.equal(majorOf(r("%40northguild/gmt%402.0.0")), 2);
  });
  it("ignores minors, patches and 0.0.0", () => {
    assert.equal(majorOf(r("v1.20.0")), undefined);
    assert.equal(majorOf(r("v2.1.0")), undefined);
    assert.equal(majorOf(r("v0.0.0")), undefined);
  });
});

describe("zoneLabel", () => {
  it("uses initials for a two-word city and three letters otherwise", () => {
    assert.deepEqual(["America/New_York", "Australia/Lord_Howe", "Asia/Kolkata", "UTC"].map(zoneLabel), ["NY", "LH", "KOL", "UTC"]);
  });
});

describe("countCommands", () => {
  it("counts command files, not their tests or folders", () => {
    const listing = [
      { name: "list.ts", type: "file" },
      { name: "list.test.ts", type: "file" },
      { name: "config-user.test.ts", type: "file" },
      { name: "helpers", type: "dir" },
    ];
    assert.equal(countCommands(listing), 1);
  });
  it("says nothing when the listing failed", () => {
    assert.equal(countCommands(null), undefined);
  });
});

describe("tinyBitmap", () => {
  it("draws run-cv's tiny lettering four pixels tall", () => {
    const rows = tinyBitmap("CI").map((row) => row.map((on) => (on ? "#" : ".")).join(""));
    assert.deepEqual(rows, ["###.#", "#...#", "#...#", "###.#"]);
  });
  it("refuses a letter it has no glyph for", () => {
    assert.throws(() => tinyBitmap("Q"), /no tiny glyph/);
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
    assert.match(svg, /2\.27M/);
    assert.match(svg, /v1\.21\.0/);
    assert.match(svg, />LH</);
    assert.equal(svg.match(/class="cell"/g)?.length, 12);
  });
  it("labels worktree's majors on its release timeline", () => {
    const svg = renderCard(cards(SNAP).worktree, DARK);
    assert.match(svg, />v3</);
    assert.doesNotMatch(svg, />v2</);
    assert.match(svg, />Oct<[\s\S]*>Nov</);
  });
  it("frames every card with square corners and lock brackets", () => {
    for (const card of Object.values(cards(SNAP))) {
      const svg = renderCard(card, DARK);
      assert.doesNotMatch(svg, /rx=/);
      assert.match(svg, /class="lock"/);
    }
  });
  it("shows a dash, not a crash, for a package with no data", () => {
    for (const card of Object.values(cards(EMPTY))) {
      const svg = renderCard(card, DARK);
      assert.doesNotMatch(svg, /NaN|undefined/);
    }
    assert.match(renderCard(cards(EMPTY).worktree, DARK), /—/);
  });
});

describe("renderHero", () => {
  const svg = renderHero({ command: "npx run-cv craig", name: "CRAIG", roles: "A & B", tagline: "t" });
  it("escapes text", () => {
    assert.match(svg, /A &amp; B/);
  });
  it("hides the typing machinery under reduced motion", () => {
    assert.match(svg, /prefers-reduced-motion[\s\S]*\.motion-only \{ display: none; \}/);
  });
  it("has square corners and lock brackets", () => {
    assert.doesNotMatch(svg, /rx=/);
    assert.match(svg, /class="lock"/);
  });
});

describe("raven", () => {
  const r = raven({ near: "#0f0", far: "#0a0" }, { width: 370, y0: 22, y1: 12, scale: 0.6, cycle: 18, start: 3 });
  it("draws six wingbeat frames and a glide, hidden under reduced motion", () => {
    assert.equal(r.svg.match(/class="beat"/g)?.length, 6);
    assert.match(r.svg, /class="glide"/);
    assert.match(r.svg, /class="raven motion-only"/);
    assert.doesNotMatch(r.svg + r.css, /NaN|undefined/);
  });
});

describe("renderTip", () => {
  for (const palette of [DARK, LIGHT]) {
    const svg = renderTip(TIP, palette);
    it("renders a titled, framed panel with the command", () => {
      assert.match(svg, /<title id="title">[^<]+<\/title>/);
      assert.match(svg, />npx run-cv craig</);
      assert.match(svg, /class="lock"/);
      assert.doesNotMatch(svg, /rx=|NaN|undefined/);
    });
  }
});

describe("renderPortfolio", () => {
  const dark = renderPortfolio(PORTFOLIO, HELSINKI_DARK);
  const light = renderPortfolio(PORTFOLIO, HELSINKI_LIGHT);
  it("renders a titled panel with the site, the quest and every locked skin", () => {
    for (const svg of [dark, light]) {
      assert.match(svg, /<title id="title">[^<]+<\/title>/);
      assert.match(svg, />craig-o-curtis\.github\.io</);
      assert.match(svg, />New quest</);
      assert.match(svg, />00\/12</);
      for (const skin of PORTFOLIO.locked) assert.match(svg, new RegExp(`>${skin}<`));
      assert.doesNotMatch(svg, /NaN|undefined/);
    }
  });
  it("lights the city only at night, and keeps nothing busy looping but the wheel", () => {
    assert.match(dark, /class="w0"/);
    assert.match(dark, /url\(#flood0\)/);
    assert.doesNotMatch(light, /class="w\d"|flood0/);
    for (const svg of [dark, light]) assert.deepEqual(svg.match(/\binfinite\b/g), ["infinite"]);
  });
});

describe("fetchSnapshot", () => {
  it("keeps the previous value for every source that fails", async () => {
    const snap = await fetchSnapshot([{ pkg: "@northguild/gmt", repo: "northguild/gmt" }], SNAP, async () => null);
    assert.deepEqual(snap.packages["@northguild/gmt"], SNAP.packages["@northguild/gmt"]);
    assert.deepEqual(snap.gmt, SNAP.gmt);
    assert.deepEqual(snap.worktree, SNAP.worktree);
    assert.deepEqual(snap.releases, SNAP.releases.filter((r) => r.repo === "northguild/gmt"));
  });
});

describe("esc", () => {
  it("escapes the XML specials", () => {
    assert.equal(esc(`<a href="x">&</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;");
  });
});
