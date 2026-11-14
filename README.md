<!--
  Partly generated. Edit anything you like outside the "name:start" / "name:end" marker comments;
  scripts/build-profile.ts rewrites what sits between them (releases, keys, guide), and
  .github/workflows/profile.yml runs it daily. The images in assets/ are generated too: change scripts/,
  not the SVGs. Keep the raven comment below: it's an easter egg for whoever reads the raw file.
-->

<!--
                ░
                ░▓░
                ░▓█▓░
                ░▓███▓
                ▓▓█████▓
               ▓█████████░
               ████████████░
               █████████████▓
               ██████████████
               ██████████████▓
               ███████████████
     ▓▓▓░░     ░██████████████▓▓▓▓▓▓░░
    ▓███████████████████████████████████▓░░
    ▓██████████████████████████████████▓▓▓░░
     ░▓░░            ░░░░░░░░░░░░

    Huginn, "thought": one of Odin's two ravens, sent out each morning to bring back news.
    He crosses the sky on northguild.dev, and a few of the pictures below.

    You read the source, so here is a clue for the field guide at craig-o-curtis.github.io:
    every answer is already on the site. Open a panel, read it, then go back to the guide.
    Start with the language question. The Profile panel answers it in its first lines.
-->

<a href="https://northguild.github.io/run-cv/">
  <img src="assets/hero.svg" width="100%" alt="A green-screen mainframe terminal types npx run-cv craig and prints: Craig Curtis. Frontend Architect, Fullstack Developer, Chinese Linguist. AI-accelerated TypeScript tooling, building at @northguild.">
</a>

<!-- keys:start -->
<p align="center">
  <a href="https://craig-o-curtis.github.io/"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/key-portfolio-dark.svg"><img src="assets/key-portfolio-light.svg" width="24%" alt="F1 PORTFOLIO: my portfolio, craig-o-curtis.github.io"></picture></a>
  <a href="https://www.linkedin.com/in/craigocurtis/"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/key-linkedin-dark.svg"><img src="assets/key-linkedin-light.svg" width="24%" alt="F2 LINKEDIN: my LinkedIn profile"></picture></a>
  <a href="https://github.com/northguild"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/key-northguild-dark.svg"><img src="assets/key-northguild-light.svg" width="24%" alt="F3 @NORTHGUILD: the northguild organisation on GitHub"></picture></a>
  <a href="https://northguild.dev"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/key-northguild-dev-dark.svg"><img src="assets/key-northguild-dev-light.svg" width="24%" alt="F4 NORTHGUILD.DEV: northguild.dev, the docs sites"></picture></a>
</p>
<!-- keys:end -->

## Product-Minded, AI-Accelerated Frontend Architect, Fullstack Developer, and Chinese Linguist

I build small, sharp TypeScript tools, mostly things that fix a problem I got tired of having. I build them AI-accelerated: agent-ready APIs, two RAG assistants embedded in my docs sites, and daily Claude Code / Cursor workflows. I build the tooling, not just use it.

Also: I read and speak Chinese. Years of parsing a language with no spaces, no tenses, and heavy context-dependence turns out to be decent training for reading unfamiliar codebases. A chengyu a day, and what it means at a keyboard:

<picture><source media="(prefers-color-scheme: dark)" srcset="assets/idiom-dark.svg"><img src="assets/idiom-light.svg" width="100%" alt="Today's chengyu, a four-character Chinese idiom, with its pinyin, a word-for-word gloss and what it means for software."></picture>

<a href="https://northguild.github.io/run-cv/"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/tip-dark.svg"><img src="assets/tip-light.svg" width="100%" alt="A terminal window: my CV/resume runs in your terminal, in a green-screen mainframe UI. Run npx run-cv craig, or click to run it in the browser."></picture></a>

<p align="center"><code>npx run-cv craig</code> · <a href="https://northguild.github.io/run-cv/">Run it in the browser</a></p>

## What I'm building at [@northguild](https://github.com/northguild)

Independent open-source engineering. The numbers below are live, refreshed daily.

<p align="center">
  <a href="https://northguild.dev/gmt/"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/card-gmt-dark.svg"><img src="assets/card-gmt-light.svg" width="48%" alt="gmt: date and time library for JavaScript and TypeScript, built on TC39 Temporal. Its test count, test runs and functions, and its test matrix of time zones by Node versions."></picture></a>
  <a href="https://northguild.dev/worktree/"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/card-worktree-dark.svg"><img src="assets/card-worktree-light.svg" width="48%" alt="worktree: a CLI for Git worktrees that hands new worktrees to coding agents. Its releases, commands and last release, and its release history."></picture></a>
</p>

<p align="center">
  <a href="https://northguild.dev/gmt/dox/"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/card-dox-dark.svg"><img src="assets/card-dox-light.svg" width="48%" alt="Dox: the RAG assistant in gmt's docs, answering a date question by running a gmt function."></picture></a>
  <a href="https://northguild.dev"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/card-northguild-dark.svg"><img src="assets/card-northguild-light.svg" width="48%" alt="northguild.dev: the docs sites draw live on the GPU, under a night sky where Huginn the raven flies over Helsinki, then Ísafjörður. An aurora over real stars in a WebGL worker, gmt's WebGPU globe, and worktree's particles that turn a leaf into a git graph."></picture></a>
</p>

<a href="https://github.com/northguild"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/gitlog-dark.svg"><img src="assets/gitlog-light.svg" width="100%" alt="A terminal running git log across every @northguild repo: the pull requests merged most recently, refreshed daily."></picture></a>

<details>
<summary><b>More on each project</b></summary>
<br>

- **[gmt](https://github.com/northguild/gmt)** — Give Me Temporal! JavaScript's `Date` is a decades-old bug factory: mutable, timezone-naive, and happy to guess what you meant. GMT is the most tested date and time library for JavaScript and TypeScript: built on the TC39 Temporal standard, it never touches `Date`, and its typed string-in / string-out functions handle time zones, DST, and business days in place of Luxon, date-fns, Moment.js, and Day.js. Ships with companion lint packages (`@northguild/gmt-oxlint`, `@northguild/gmt-eslint`, `@northguild/gmt-biome`) that keep humans and AI agents off the legacy footguns. pnpm monorepo, published as `@northguild/gmt`. [Docs](https://northguild.dev/gmt/) · [Dox](https://northguild.dev/gmt/dox/), the docs assistant that runs GMT's tools and answers from the API reference
- **[worktree](https://github.com/northguild/worktree)** — Git worktrees are excellent and the raw commands are awkward. This CLI turns branch-off → create → copy `.env` → open editor → clean up later into a few commands with sensible prompts, and can hand the new worktree straight to a coding agent. A `--json` agent mode and an installable agent skill let agents drive it too, and the docs have an embedded AI assistant. Context switching without the stash-and-pray dance. `npx @northguild/worktree` · [Docs](https://northguild.dev/worktree/)

</details>

### Latest releases

<!-- releases:start -->
| Project | Latest release | Date | Releases, last 90 days |
| --- | --- | --- | ---: |
| [gmt](https://github.com/northguild/gmt) | [`@northguild/gmt@1.21.0`](https://github.com/northguild/gmt/releases/tag/%40northguild/gmt%401.21.0) | 2026-11-03 | 8 |
| [worktree](https://github.com/northguild/worktree) | [`v3.0.0`](https://github.com/northguild/worktree/releases/tag/v3.0.0) | 2026-11-07 | 14 |
<!-- releases:end -->

### Pop quiz

Where I'm from, under purple rain.

<!-- guide:start -->
<picture><source media="(prefers-color-scheme: dark)" srcset="assets/guide-dark.svg"><img src="assets/guide-light.svg" width="100%" alt="Pop quiz: Craig is from the hometown of the artist who gave the world “Purple Rain”. Which city is it?"></picture>

<p align="center">
  <a href="#pop-quiz"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/answer-a-dark.svg"><img src="assets/answer-a-light.svg" width="48%" alt="Answer A: Detroit"></picture></a>
  <a href="#pop-quiz"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/answer-b-dark.svg"><img src="assets/answer-b-light.svg" width="48%" alt="Answer B: Minneapolis"></picture></a>
  <br>
  <a href="#pop-quiz"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/answer-c-dark.svg"><img src="assets/answer-c-light.svg" width="48%" alt="Answer C: Chicago"></picture></a>
  <a href="#pop-quiz"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/answer-d-dark.svg"><img src="assets/answer-d-light.svg" width="48%" alt="Answer D: Memphis"></picture></a>
</p>

<details>
<summary><b>Answer</b></summary>
<br>

**Minneapolis.** Prince’s hometown, and mine. The purple rain falling on the skyline above is for him.

</details>
<!-- guide:end -->

### Contributions

<a href="https://github.com/craig-o-curtis"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/city-dark.svg"><img src="assets/city-light.svg" width="100%" alt="My GitHub contributions over the last year, drawn as a city in front of Helsinki: one tower a week, one window a day, lit by that day's contributions."></picture></a>

<a href="https://craig-o-curtis.github.io/"><picture><source media="(prefers-color-scheme: dark)" srcset="assets/portfolio-dark.svg"><img src="assets/portfolio-light.svg" width="100%" alt="There's more at craig-o-curtis.github.io: my portfolio, an interactive dashboard of my work, stack, open source and agent workflows, over Helsinki's skyline from the harbour. Its field guide asks 12 questions, and each right answer unlocks a skin, a scene or a synth track. Still locked: Mainframe, Retro 82, Solid, Rain and NorthGuild."></picture></a>

<p align="center"><a href="https://craig-o-curtis.github.io/"><b>craig-o-curtis.github.io</b></a></p>

---

<details>
<summary><b>How this README builds itself</b></summary>
<br>

```mermaid
%%{init: {"theme": "base", "themeVariables": {"fontFamily": "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", "primaryColor": "#0d0d0d", "primaryTextColor": "#00ff00", "primaryBorderColor": "#008000", "secondaryColor": "#0d0d0d", "tertiaryColor": "#0d0d0d", "textColor": "#2e9d3e", "nodeTextColor": "#00ff00", "lineColor": "#2e9d3e", "clusterBkg": "#001a00", "clusterBorder": "#008000", "titleColor": "#00ff00", "edgeLabelBackground": "#0d0d0d"}}}%%
flowchart TD
  cron(["daily, 05:17 UTC"]) --> build
  push(["push to main"]) --> build
  pr(["pull request"]) --> ci
  subgraph build ["profile.yml: build job"]
    direction TB
    test["npm test"] --> fetch["fetch live figures<br>npm · GitHub REST · GitHub GraphQL · gmt's stats"]
    fetch --> ok{"source<br>reachable?"}
    ok -- "yes" --> snap[("data/profile.json")]
    ok -- "no: keep the last value" --> snap
    snap --> render["render every SVG, dark and light<br>hero · keys · cards · git log · guide · city · chengyu"]
    render --> md["rewrite the README between its marker comments"]
    md --> changed{"anything<br>changed?"}
    changed -- "yes" --> commit["commit and push"]
    changed -- "no" --> done["stop"]
  end
  subgraph ci ["ci.yml: checks, read-only"]
    direction TB
    t2["npm test"] --> offline["offline build from the snapshot"]
    offline --> chrome["render every SVG in headless Chrome<br>still and settled; fail on blank or broken"]
  end
```

No dependencies: Node 24 runs the TypeScript in [scripts/](scripts/) directly, and every image is a hand-built SVG.

</details>

<details>
<summary><b>A note on this account</b></summary>
<br>

Most of my production work over the last decade lived in organizations I no longer have access to. What's left under my personal account is largely a decade of learning exercises and course demos — I've kept them public because the trail is worth more than a tidy profile. The open-source I own and actively maintain is under [@northguild](https://github.com/northguild), pinned below.

</details>
