// Godot toolchain for the Soil & Sprout port (godot/).
//
//   node scripts/godot.mjs fetch    download the pinned Godot editor and web export templates
//   node scripts/godot.mjs test     run the headless GDScript tests (godot/tests)
//   node scripts/godot.mjs export   sync assets, import, and export the web build to public/godot/
//   node scripts/godot.mjs export --optional
//                                   the same, but a failure only warns (for site deploys: the
//                                   preview page then says the build isn't there)
//
// Downloads are cached in node_modules/.cache/godot (Vercel keeps it between builds), or in
// $GODOT_CACHE, or in .godot-cache/ if that already exists. The export template archive is
// 1.2 GB, so only the web templates are read out of it with HTTP range requests (about 20 MB).
import { execFileSync, spawnSync } from "child_process";
import { createHash } from "crypto";
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import * as zlib from "zlib";

const VERSION = "4.4.1";
const RELEASE = `https://github.com/godotengine/godot/releases/download/${VERSION}-stable`;
const EDITOR_ZIP = `Godot_v${VERSION}-stable_linux.x86_64.zip`;
/** From the release's SHA512-SUMS.txt. */
const EDITOR_SHA512 = "ef4e76880a514257175544952c61191106fdef3095b909bafed9fcbeb230c3e5533920a0f3012882dd4bbde83028a67549825794e2d2c3cf76eba7918b71370e";
const TEMPLATES = `Godot_v${VERSION}-stable_export_templates.tpz`;
const WEB_TEMPLATES = ["templates/version.txt", "templates/web_nothreads_release.zip", "templates/web_nothreads_debug.zip"];

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cache = process.env.GODOT_CACHE
  ?? (existsSync(join(root, ".godot-cache")) ? join(root, ".godot-cache") : join(root, "node_modules/.cache/godot"));
const project = join(root, "godot");
const editor = join(cache, `Godot_v${VERSION}-stable_linux.x86_64`);
// Godot looks for export templates in $XDG_DATA_HOME/godot/export_templates.
const dataHome = join(cache, "data");
const templateDir = join(dataHome, "godot/export_templates", `${VERSION}.stable`);

function curl(args) {
  return execFileSync("curl", ["-sSLf", "--retry", "3", "--max-time", "600", ...args], { maxBuffer: 1 << 30 });
}

/**
 * Read files out of a zip, given a way to read byte ranges of it (from disk or over HTTP).
 * Each file is checked against the CRC-32 the archive records for it.
 */
function zipReader(size, read) {
  const tail = read(Math.max(0, size - 65557), size - 1);
  const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("Not a zip file");
  const count = tail.readUInt16LE(eocd + 10);
  const cdSize = tail.readUInt32LE(eocd + 12);
  const cdOffset = tail.readUInt32LE(eocd + 16);
  const cd = read(cdOffset, cdOffset + cdSize - 1);
  const entries = new Map();
  for (let p = 0, i = 0; i < count; i++) {
    const nameLen = cd.readUInt16LE(p + 28), extraLen = cd.readUInt16LE(p + 30), commentLen = cd.readUInt16LE(p + 32);
    entries.set(cd.toString("utf8", p + 46, p + 46 + nameLen), {
      method: cd.readUInt16LE(p + 10),
      crc: cd.readUInt32LE(p + 16),
      compressed: cd.readUInt32LE(p + 20),
      offset: cd.readUInt32LE(p + 42),
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return (name) => {
    const e = entries.get(name);
    if (!e) throw new Error(`${name} is not in the archive`);
    const head = read(e.offset, e.offset + 29);
    const start = e.offset + 30 + head.readUInt16LE(26) + head.readUInt16LE(28);
    const raw = read(start, start + e.compressed - 1);
    const data = e.method === 8 ? zlib.inflateRawSync(raw) : raw;
    // zlib.crc32 is Node 22.2+; older Node skips the check.
    if (zlib.crc32 && zlib.crc32(data) !== e.crc) throw new Error(`${name} is corrupt (CRC mismatch)`);
    return data;
  };
}

function remoteZip(url) {
  const size = Number(/content-length:\s*(\d+)/i.exec(curl(["-I", url]).toString().split(/\r?\n\r?\n/).filter(Boolean).at(-1))[1]);
  return zipReader(size, (a, b) => curl(["-r", `${a}-${b}`, url]));
}

function fetchGodot() {
  mkdirSync(cache, { recursive: true });
  if (!existsSync(editor)) {
    console.log(`Downloading Godot ${VERSION}…`);
    const zip = join(cache, EDITOR_ZIP);
    curl(["-o", zip, `${RELEASE}/${EDITOR_ZIP}`]);
    const bytes = readFileSync(zip);
    rmSync(zip);
    const sha = createHash("sha512").update(bytes).digest("hex");
    if (sha !== EDITOR_SHA512) throw new Error(`${EDITOR_ZIP} doesn't match its published SHA-512.`);
    const read = zipReader(bytes.length, (a, b) => bytes.subarray(a, b + 1));
    writeFileSync(editor, read(`Godot_v${VERSION}-stable_linux.x86_64`));
    chmodSync(editor, 0o755);
  }
  if (!WEB_TEMPLATES.every((f) => existsSync(join(templateDir, f.replace("templates/", ""))))) {
    console.log("Downloading the web export templates…");
    const read = remoteZip(`${RELEASE}/${TEMPLATES}`);
    mkdirSync(templateDir, { recursive: true });
    for (const f of WEB_TEMPLATES) writeFileSync(join(templateDir, f.replace("templates/", "")), read(f));
  }
}

const env = { ...process.env, XDG_DATA_HOME: dataHome };

function godot(...args) {
  execFileSync(editor, ["--headless", "--path", project, ...args], { stdio: "inherit", env });
}

/**
 * The site's public/models stays the one asset pipeline (npm run assets); Godot gets a copy.
 * Godot 4.4 can't import KHR_mesh_quantization, so quantized models are expanded for it.
 */
async function syncAssets() {
  const from = join(root, "public/models");
  const to = join(project, "assets/models");
  const { NodeIO } = await import("@gltf-transform/core");
  const { ALL_EXTENSIONS } = await import("@gltf-transform/extensions");
  const { dequantize } = await import("@gltf-transform/functions");
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const files = (dir) => readdirSync(dir, { recursive: true }).map(String).filter((f) => statSync(join(dir, f)).isFile());
  const wanted = new Set();
  const copied = [];
  for (const f of files(from).filter((f) => /\.(glb|png)$/.test(f))) {
    const src = join(from, f), dest = join(to, f);
    wanted.add(f);
    if (existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs) continue;
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    if (f.endsWith(".glb")) copied.push(dest);
  }
  // After everything is copied, since some models read textures from a Textures/ folder.
  for (const dest of copied) {
    const doc = await io.read(dest);
    const ext = doc.getRoot().listExtensionsUsed().find((e) => e.extensionName === "KHR_mesh_quantization");
    if (!ext) continue;
    await doc.transform(dequantize());
    ext.dispose();
    await io.write(dest, doc);
  }
  // Remove models that are gone from public/models. (Leave other files: Godot extracts textures next to models.)
  if (existsSync(to)) for (const f of files(to)) {
    const src = f.replace(/\.import$/, "");
    if (src.endsWith(".glb") && !wanted.has(src)) rmSync(join(to, f));
  }
  // Item and farmer pictures (rendered from the models by npm run assets).
  const icons = join(project, "assets/icons");
  mkdirSync(icons, { recursive: true });
  for (const f of readdirSync(join(root, "public/icons")).filter((f) => f.endsWith(".png"))) {
    const src = join(root, "public/icons", f), dest = join(icons, f);
    if (!existsSync(dest) || statSync(dest).mtimeMs < statSync(src).mtimeMs) cpSync(src, dest);
  }
}

async function exportWeb() {
  await syncAssets();
  godot("--import");
  // Export next to the old build, then swap, so a failed export never leaves a half-written one.
  const out = join(root, "public/godot");
  const next = join(root, "public/.godot-next");
  rmSync(next, { recursive: true, force: true });
  mkdirSync(next, { recursive: true });
  godot("--export-release", "Web", join(next, "index.html"));
  if (!existsSync(join(next, "index.wasm"))) throw new Error("Godot finished without writing the web build.");
  rmSync(out, { recursive: true, force: true });
  renameSync(next, out);
  const mb = readdirSync(out).reduce((n, f) => n + statSync(join(out, f)).size, 0) / 1e6;
  console.log(`Exported the web build to public/godot (${mb.toFixed(1)} MB).`);
}

const cmd = process.argv[2];
if (cmd === "export" && process.argv.includes("--optional")) {
  try {
    fetchGodot();
    await exportWeb();
  } catch (e) {
    console.warn(`\n⚠ The Godot web build failed, so this deploy won't include it (the preview page will say so).\n${e.stack ?? e}\n`);
  }
  process.exit(0);
}
fetchGodot();
if (cmd === "test") {
  godot("--import");
  // GDScript errors don't stop a test (the function just returns), so any error fails the run.
  const r = spawnSync(editor, ["--headless", "--path", project, "-s", "res://tests/run_tests.gd"], { encoding: "utf8", maxBuffer: 1 << 28, env });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  process.stdout.write(out.replace(/^Godot Engine.*\n\n?/m, ""));
  const errors = out.split("\n").filter((l) => /SCRIPT ERROR|Parse Error|Compile Error/.test(l));
  if (errors.length) console.error(`\n${errors.length} script error(s) — failing the run.`);
  if (r.status !== 0 || errors.length) process.exit(1);
}
else if (cmd === "export") await exportWeb();
else if (cmd === "editor") execFileSync(editor, ["--path", project, "-e"], { stdio: "inherit", env });
else if (cmd !== "fetch") {
  console.error("Usage: node scripts/godot.mjs fetch|test|export");
  process.exit(1);
}
