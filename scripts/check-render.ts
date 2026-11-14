// Renders every generated SVG in headless Chrome and fails if one doesn't parse or comes out blank. Each SVG
// is drawn twice: still (prefers-reduced-motion, the frame a viewer without animation sees) and settled
// (every animation a minute along, by a negative delay injected into a copy, which is deterministic where
// Chrome's virtual time isn't). The PNGs land in dist/render/ for a human to look at.
//
//   node scripts/check-render.ts                 # every assets/*.svg
//   node scripts/check-render.ts assets/x.svg    # just these
//
// Chrome comes from $CHROME, else the usual install paths (GitHub's Ubuntu runners ship google-chrome).
// No dependencies: PNGs are decoded with node:zlib.

import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { inflateSync } from "node:zlib";

const exec = promisify(execFile);
/** A Chrome that hasn't answered in this long is stuck: kill it and report the SVG, don't stall the job. */
const CHROME_TIMEOUT_MS = 45_000;
/** How many Chromes run at once: $RENDER_JOBS, else 2. Chrome on macOS stalls now and then under more. */
const JOBS = Math.max(1, Number(process.env.RENDER_JOBS) || 2);

/** Runs Chrome, once more if the first try fails: a lone stall shouldn't fail the check. */
async function run(bin: string, args: string[]): Promise<{ stdout: string }> {
  const opts = { maxBuffer: 64 << 20, timeout: CHROME_TIMEOUT_MS, killSignal: "SIGKILL" as const };
  try {
    return await exec(bin, args, opts);
  } catch {
    return await exec(bin, args, opts);
  }
}
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "dist", "render");
/** How far along every animation is in the settled render. */
const SETTLE_S = 60;
/** A render counts as blank when fewer than this share of pixels differ from the top-left one. */
const MIN_INK = 0.005;

function chrome(): string {
  const candidates = [
    process.env.CHROME,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];
  const found = candidates.find((c) => c && existsSync(c));
  if (!found) throw new Error("no Chrome found; set CHROME to its path");
  return found;
}

/** Width, height and RGBA pixels of an 8-bit RGB or RGBA PNG (what Chrome writes). */
export function decodePng(buf: Buffer): { width: number; height: number; rgba: Uint8Array } {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let pos = 8;
  let width = 0;
  let height = 0;
  let channels = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      const depth = data[8];
      const color = data[9];
      if (depth !== 8 || (color !== 2 && color !== 6) || data[12] !== 0) throw new Error(`unsupported PNG (depth ${depth}, colour ${color})`);
      channels = color === 6 ? 4 : 3;
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const px = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? px[y * stride + x - channels] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= channels && y > 0 ? px[(y - 1) * stride + x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[y * stride + x] = v & 0xff;
    }
  }
  if (channels === 4) return { width, height, rgba: px };
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    rgba.set(px.subarray(i * 3, i * 3 + 3), i * 4);
    rgba[i * 4 + 3] = 255;
  }
  return { width, height, rgba };
}

/** The share of pixels that differ visibly from the top-left one. */
export function ink(rgba: Uint8Array): number {
  const n = rgba.length / 4;
  let differ = 0;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(rgba[i * 4] - rgba[0]) + Math.abs(rgba[i * 4 + 1] - rgba[1]) + Math.abs(rgba[i * 4 + 2] - rgba[2]);
    if (d > 24) differ++;
  }
  return differ / n;
}

function size(svg: string): { w: number; h: number } {
  const root = /<svg\b[^>]*>/.exec(svg)?.[0] ?? "";
  const w = Number(/\swidth="([\d.]+)"/.exec(root)?.[1]);
  const h = Number(/\sheight="([\d.]+)"/.exec(root)?.[1]);
  if (!w || !h) throw new Error("the root <svg> has no numeric width and height");
  return { w: Math.ceil(w), h: Math.ceil(h) };
}

async function check(bin: string, file: string): Promise<string[]> {
  const name = path.basename(file, ".svg");
  const url = pathToFileURL(file).href;
  const problems: string[] = [];
  const profile = await mkdtemp(path.join(tmpdir(), "render-"));
  const scratch = await mkdtemp(path.join(tmpdir(), "settled-"));
  const base = ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", `--user-data-dir=${profile}`];
  try {
    const dom = (await run(bin, [...base, "--dump-dom", url])).stdout;
    if (dom.includes("<parsererror")) return [`${name}: does not parse as XML`];
    const svg = await readFile(file, "utf8");
    const { w, h } = size(svg);
    const settled = path.join(scratch, `${name}.svg`);
    await writeFile(settled, svg.replace(/(<svg\b[^>]*>)/, `$1<style>* { animation-delay: -${SETTLE_S}s !important; }</style>`));
    for (const [suffix, flags, target] of [
      ["still", ["--force-prefers-reduced-motion"], url],
      ["settled", [], pathToFileURL(settled).href],
    ] as const) {
      const png = path.join(OUT, `${name}.${suffix}.png`);
      await run(bin, [...base, ...flags, `--window-size=${w},${h}`, `--screenshot=${png}`, target]);
      const share = ink(decodePng(await readFile(png)).rgba);
      if (share < MIN_INK) problems.push(`${name} (${suffix}): blank, ${(share * 100).toFixed(2)}% of pixels drawn`);
    }
  } catch (error) {
    const e = error as Error & { killed?: boolean };
    problems.push(`${name}: ${e.killed ? `Chrome stalled past ${CHROME_TIMEOUT_MS / 1000}s, twice` : e.message.split("\n")[0]}`);
  } finally {
    await rm(profile, { recursive: true, force: true });
    await rm(scratch, { recursive: true, force: true });
  }
  return problems;
}

async function main() {
  const bin = chrome();
  const args = process.argv.slice(2);
  const files = args.length
    ? args.map((a) => path.resolve(a))
    : (await readdir(path.join(ROOT, "assets"))).filter((f) => f.endsWith(".svg")).sort().map((f) => path.join(ROOT, "assets", f));
  await mkdir(OUT, { recursive: true });
  const problems: string[] = [];
  for (let i = 0; i < files.length; i += JOBS) {
    const batch = await Promise.all(files.slice(i, i + JOBS).map((f) => check(bin, f)));
    problems.push(...batch.flat());
  }
  console.log(`rendered ${files.length} SVGs × 2 into ${path.relative(ROOT, OUT)}/`);
  if (problems.length) {
    for (const p of problems) console.error(`  ✗ ${p}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
