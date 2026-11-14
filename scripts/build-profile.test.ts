import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cards, KEYS, majorOf, PORTFOLIO, releasesMarkdown, replaceSection, TIP, zoneLabel } from "./build-profile.ts";
import { decodePng, ink } from "./check-render.ts";
import { renderCard, TAGLINE_MAX } from "./lib/card.ts";
import { CITY_DARK, CITY_LIGHT, cityStats, renderCity } from "./lib/city.ts";
import { ACTIVITY_REPOS, cleanTitle, countCommands, EMPTY, fetchSnapshot, type Snapshot, toCalendar, toMerges } from "./lib/data.ts";
import { clip, renderGitlog } from "./lib/gitlog.ts";
import {
  guideMarkdown,
  LETTERS,
  QUIZ,
  QUIZ_ANCHOR,
  RAIN_DARK,
  RAIN_LIGHT,
  renderAnswer,
  renderGuide,
  wrap,
} from "./lib/guide.ts";
import { glyph, IDIOMS, idiomOfTheDay, renderIdiom } from "./lib/idioms.ts";
import { keysMarkdown, keyWidth, renderKey } from "./lib/keys.ts";
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

describe("northguild.dev scene", () => {
  const svg = renderCard(cards(SNAP).northguild, DARK);
  it("swaps Helsinki for Ísafjörður each time Huginn leaves the right edge", () => {
    assert.match(svg, /<g class="helsinki">/);
    assert.match(svg, /<g class="isafjordur motion-only">/);
    // raven cycle 18s from 3s, out of view at 45%: first swap at 11.1s, so -6.9s into a 36s loop.
    assert.match(svg, /\.helsinki \{ animation: helsinki 36s step-end -6\.90s infinite; \}/);
    assert.match(svg, /\.isafjordur \{ opacity: 0; animation: isafjordur 36s step-end -6\.90s infinite; \}/);
    assert.doesNotMatch(svg, /NaN|undefined/);
  });
});

describe("renderTip", () => {
  for (const palette of [DARK, LIGHT]) {
    const svg = renderTip(TIP, palette);
    it("renders a titled, framed panel with the command", () => {
      assert.match(svg, /<title id="title">[^<]+<\/title>/);
      assert.match(svg, />npx run-cv craig</);
      assert.match(svg, />TERMINAL ── RUN-CV</);
      assert.doesNotMatch(svg, /\bTIP\b/);
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

describe("toCalendar", () => {
  const reply = (days: Array<[string, number, string]>) => ({
    data: { user: { contributionsCollection: { contributionCalendar: { totalContributions: 9, weeks: [{ contributionDays: days.map(([date, contributionCount, contributionLevel]) => ({ date, contributionCount, contributionLevel })) }] } } } },
  });
  it("flattens GitHub's calendar to one entry a day, levels as 0 to 4", () => {
    const cal = toCalendar(reply([["2026-01-04", 0, "NONE"], ["2026-01-05", 9, "FOURTH_QUARTILE"]]));
    assert.deepEqual(cal, { start: "2026-01-04", total: 9, counts: [0, 9], levels: [0, 4] });
  });
  it("says nothing for an error reply", () => {
    assert.equal(toCalendar({ errors: [{ message: "Bad credentials" }] }), undefined);
    assert.equal(toCalendar(null), undefined);
  });
});

describe("toMerges and cleanTitle", () => {
  it("keeps merged PRs only, with a short hash and a title without its trailing refs", () => {
    const listing = [
      { number: 2, merged_at: "2026-11-13T00:00:00Z", merge_commit_sha: "c7caa75abcdef", title: "feat(x): read GTFS (RAI-99, #407)", html_url: "u2" },
      { number: 1, merged_at: null, merge_commit_sha: "0000000", title: "closed unmerged", html_url: "u1" },
    ];
    assert.deepEqual(toMerges("northguild/gmt", listing), [
      { repo: "northguild/gmt", number: 2, sha: "c7caa75", title: "feat(x): read GTFS", date: "2026-11-13T00:00:00Z", url: "u2" },
    ]);
    assert.equal(toMerges("northguild/gmt", null), undefined);
    assert.equal(cleanTitle("fix(dox): landing keeps its layout (#519)"), "fix(dox): landing keeps its layout");
    assert.equal(cleanTitle("Keep Huginn's drift inside the page"), "Keep Huginn's drift inside the page");
  });
  it("reads only allowlisted, public repos", () => {
    assert.ok(ACTIVITY_REPOS.every((r) => r.startsWith("northguild/")));
    assert.ok(!ACTIVITY_REPOS.some((r) => /huginn|code-reviewer|spacetime|system-designer/.test(r)));
  });
});

describe("fetchSnapshot, new sources", () => {
  it("keeps the last calendar and each repo's last merges when their fetches fail", async () => {
    const prev: Snapshot = {
      ...SNAP,
      contributions: { start: "2026-01-04", total: 1, counts: [1], levels: [1] },
      activity: [{ repo: "northguild/gmt", number: 1, sha: "abc1234", title: "t", date: "2026-11-01T00:00:00Z", url: "u" }],
    };
    const snap = await fetchSnapshot([], prev, async () => null);
    assert.deepEqual(snap.contributions, prev.contributions);
    assert.deepEqual(snap.activity, prev.activity);
  });
});

describe("renderCity", () => {
  // Two weeks: a quiet one and a busy Wednesday.
  const cal = { start: "2026-01-04", total: 15, counts: [0, 0, 0, 0, 0, 0, 0, 1, 2, 0, 12, 0, 0, 0], levels: [0, 0, 0, 0, 0, 0, 0, 1, 2, 0, 4, 0, 0, 0] };
  it("counts the streak and the busiest day", () => {
    assert.deepEqual(cityStats(cal), { total: 15, longest: 2, busiest: { date: "Jan 14", count: 12 } });
  });
  for (const [palette, colors] of [[DARK, CITY_DARK], [LIGHT, CITY_LIGHT]] as const) {
    const svg = renderCity(cal, palette, colors);
    it("draws a titled, framed city with the year's figures", () => {
      assert.match(svg, /<title id="title">[^<]*15 contributions, longest streak 2 days, busiest Jan 14 \(12\)/);
      assert.match(svg, /class="lock"/);
      assert.match(svg, /prefers-reduced-motion/);
      assert.doesNotMatch(svg, /NaN|undefined/);
    });
  }
  it("splats only the days that had contributions, one dropping per busy week", () => {
    const svg = renderCity(cal, DARK, CITY_DARK);
    assert.equal(svg.match(/class="wk"/g)?.length, 1);
    assert.equal(svg.match(/class="sp"/g)?.length, 3);
    assert.equal(svg.match(/class="drop"/g)?.length, 1);
    assert.match(svg, new RegExp(`class="sp" d="[^"]+" fill="${CITY_DARK.windows[4]}"`));
    // He flies one pass and stays gone; the droppings are hidden unless they're falling.
    assert.match(svg, /\.raven \{ animation: raven [\d.]+s linear 1\.5s 1 both; \}/);
    assert.match(svg, /\.drop \{ opacity: 0; \}/);
  });
  it("lands each splat after its dropping, top floor first", () => {
    const svg = renderCity(cal, DARK, CITY_DARK);
    const [, dur, release] = svg.match(/animation:d1 ([\d.]+)s \S+ ([\d.]+)s forwards/) ?? [];
    const delays = [...svg.matchAll(/class="sp"[^>]*animation-delay:([\d.]+)s/g)].map((m) => Number(m[1]));
    assert.ok(delays.every((d) => d >= Number(release) + Number(dur)));
    assert.deepEqual(delays, [...delays].sort((a, b) => a - b));
  });
  it("draws an empty city, not a crash, with no calendar", () => {
    assert.doesNotMatch(renderCity(undefined, DARK, CITY_DARK), /NaN|undefined|class="wk"|class="drop"/);
  });
});

describe("renderGitlog", () => {
  const merges = [
    { repo: "northguild/gmt", number: 2, sha: "c7caa75", title: "x".repeat(200), date: "2026-11-13T00:00:00Z", url: "u" },
    { repo: "northguild/worktree", number: 1, sha: "abc1234", title: "fix: <tags> & things", date: "2026-11-12T00:00:00Z", url: "u" },
  ];
  const svg = renderGitlog(merges, DARK);
  it("prints a line per merge, escaped, long titles clipped", () => {
    assert.equal(svg.match(/class="ln"/g)?.length, 2);
    assert.match(svg, /&lt;tags&gt; &amp; things/);
    assert.match(svg, /x…</);
    assert.match(svg, />\(worktree\)</);
    assert.doesNotMatch(svg, /NaN|undefined/);
  });
  it("says so when nothing has merged", () => {
    assert.match(renderGitlog([], LIGHT), /nothing merged yet/);
  });
  it("clips with an ellipsis", () => {
    assert.equal(clip("abcdef", 4), "abc…");
    assert.equal(clip("abc", 4), "abc");
  });
});

describe("keys", () => {
  const w = keyWidth(KEYS);
  it("are all one width, each with its F-number and label", () => {
    KEYS.forEach((k, i) => {
      const svg = renderKey(k, i + 1, w, DARK);
      assert.match(svg, new RegExp(`>F${i + 1}<`));
      assert.match(svg, new RegExp(`>${k.label.replace(".", "\\.")}<`));
      assert.match(svg, new RegExp(`width="${w + 8}"`));
    });
  });
  it("link each key on its own in the README row", () => {
    const md = keysMarkdown(KEYS);
    assert.equal(md.match(/<a href=/g)?.length, KEYS.length);
    for (const k of KEYS) assert.ok(md.includes(`href="${k.url}"`));
  });
});

describe("pop quiz", () => {
  it("asks where Craig is from, and the answer is one of its options", () => {
    assert.match(QUIZ.prompt, /Purple Rain/);
    assert.equal(QUIZ.answer, "Minneapolis");
    assert.ok(QUIZ.options.includes(QUIZ.answer));
    assert.equal(QUIZ.options.length, 4);
  });
  it("keeps the answer out of the card and the buttons, and reveals it collapsed", () => {
    for (const p of [RAIN_DARK, RAIN_LIGHT]) {
      const card = renderGuide(QUIZ, p);
      assert.match(card, />POP QUIZ</);
      // The title lists the four options, the answer among them; nowhere else may name it.
      const withoutOptions = card.replace(/ Options: [^<]*</, "<");
      assert.doesNotMatch(withoutOptions, new RegExp(`Prince|${QUIZ.answer}`));
      assert.doesNotMatch(card, /NaN|undefined/);
    }
    const md = guideMarkdown(QUIZ);
    assert.equal(md.match(new RegExp(`<a href="#${QUIZ_ANCHOR}">`, "g"))?.length, 4);
    assert.match(md, /<details>\n<summary><b>Answer<\/b><\/summary>[\s\S]*\*\*Minneapolis\.\*\* Prince/);
    QUIZ.options.forEach((o, i) => assert.match(renderAnswer(LETTERS[i], o, RAIN_DARK), new RegExp(`<title id="title">Answer ${LETTERS[i]}: ${o}<`)));
  });
  it("loops the rain by exactly one tile, so it has no seam", () => {
    const card = renderGuide(QUIZ, RAIN_DARK);
    const tile = /<pattern id="streaks0" width="(\d+)" height="(\d+)"/.exec(card);
    assert.ok(tile);
    assert.match(card, new RegExp(`translate\\(-${tile[1]}px, ${tile[2]}px\\)`));
  });
  it("wraps at spaces", () => {
    assert.deepEqual(wrap("aa bb cc", 5), ["aa bb", "cc"]);
  });
});

describe("chengyu", () => {
  it("has four characters and a bitmap for each, for every idiom", () => {
    for (const i of IDIOMS) {
      assert.equal([...i.hanzi].length, 4, i.hanzi);
      for (const ch of i.hanzi) assert.equal(glyph(ch).length, 16, ch);
    }
  });
  it("rotates one a day", () => {
    assert.notEqual(idiomOfTheDay(0).hanzi, idiomOfTheDay(86_400_000).hanzi);
  });
  it("renders every idiom in both themes, fitting the card", () => {
    for (const i of IDIOMS) {
      for (const p of [DARK, LIGHT]) {
        const svg = renderIdiom(i, p);
        assert.match(svg, new RegExp(`<title id="title">Chengyu of the day: ${i.hanzi}`));
        assert.doesNotMatch(svg, /NaN|undefined/);
      }
    }
  });
});

describe("check-render", () => {
  it("decodes a PNG and measures how much is drawn", async () => {
    const { deflateSync } = await import("node:zlib");
    // A 2 × 1 RGB PNG: one black pixel, one white.
    const chunk = (type: string, data: Buffer) => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length);
      return Buffer.concat([len, Buffer.from(type), data, Buffer.alloc(4)]);
    };
    const ihdr = Buffer.from([0, 0, 0, 2, 0, 0, 0, 1, 8, 2, 0, 0, 0]);
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk("IHDR", ihdr),
      chunk("IDAT", deflateSync(Buffer.from([0, 0, 0, 0, 255, 255, 255]))),
      chunk("IEND", Buffer.alloc(0)),
    ]);
    const { width, height, rgba } = decodePng(png);
    assert.deepEqual([width, height], [2, 1]);
    assert.equal(ink(rgba), 0.5);
  });
});
