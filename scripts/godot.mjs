// Godot toolchain for the Soil & Sprout port (godot/).
//
//   node scripts/godot.mjs fetch    download the pinned Godot editor and web export templates
//   node scripts/godot.mjs test     run the headless GDScript tests (godot/tests)
//   node scripts/godot.mjs export   sync assets, import, and export the web build to public/godot/
//
// Downloads go to .godot-cache/. The export template archive is 1.2 GB, so only the web
// templates are pulled out of it with HTTP range requests (about 10 MB).
import { execFileSync, spawnSync } from "child_process";
import { chmodSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "fs";
import { homedir } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { inflateRawSync } from "zlib";

const VERSION = "4.4.1";
const RELEASE = `https://github.com/godotengine/godot/releases/download/${VERSION}-stable`;
const EDITOR_ZIP = `Godot_v${VERSION}-stable_linux.x86_64.zip`;
const TEMPLATES = `Godot_v${VERSION}-stable_export_templates.tpz`;
const WEB_TEMPLATES = ["templates/version.txt", "templates/web_nothreads_release.zip", "templates/web_nothreads_debug.zip"];

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cache = join(root, ".godot-cache");
const project = join(root, "godot");
const editor = join(cache, `Godot_v${VERSION}-stable_linux.x86_64`);
const templateDir = join(
  process.env.XDG_DATA_HOME ?? join(homedir(), ".local/share"),
  "godot/export_templates",
  `${VERSION}.stable`,
);

function curl(args) {
  return execFileSync("curl", ["-sSLf", "--retry", "3", "--max-time", "600", ...args], { maxBuffer: 1 << 30 });
}

/** Read one file out of a remote zip without downloading the whole archive. */
function remoteZip(url) {
  const size = Number(/content-length:\s*(\d+)/i.exec(curl(["-I", url]).toString().split(/\r?\n\r?\n/).filter(Boolean).at(-1))[1]);
  const tail = curl(["-r", `${Math.max(0, size - 65557)}-${size - 1}`, url]);
  const eocd = tail.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("Not a zip: " + url);
  const count = tail.readUInt16LE(eocd + 10);
  const cdSize = tail.readUInt32LE(eocd + 12);
  const cdOffset = tail.readUInt32LE(eocd + 16);
  const cd = curl(["-r", `${cdOffset}-${cdOffset + cdSize - 1}`, url]);
  const entries = new Map();
  for (let p = 0, i = 0; i < count; i++) {
    const nameLen = cd.readUInt16LE(p + 28), extraLen = cd.readUInt16LE(p + 30), commentLen = cd.readUInt16LE(p + 32);
    entries.set(cd.toString("utf8", p + 46, p + 46 + nameLen), {
      method: cd.readUInt16LE(p + 10),
      compressed: cd.readUInt32LE(p + 20),
      offset: cd.readUInt32LE(p + 42),
    });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return (name) => {
    const e = entries.get(name);
    if (!e) throw new Error(`${name} is not in ${url}`);
    const head = curl(["-r", `${e.offset}-${e.offset + 29}`, url]);
    const start = e.offset + 30 + head.readUInt16LE(26) + head.readUInt16LE(28);
    const data = curl(["-r", `${start}-${start + e.compressed - 1}`, url]);
    return e.method === 8 ? inflateRawSync(data) : data;
  };
}

function fetchGodot() {
  mkdirSync(cache, { recursive: true });
  if (!existsSync(editor)) {
    console.log(`Downloading Godot ${VERSION}…`);
    const zip = join(cache, EDITOR_ZIP);
    curl(["-o", zip, `${RELEASE}/${EDITOR_ZIP}`]);
    execFileSync("unzip", ["-qo", zip, "-d", cache]);
    rmSync(zip);
    chmodSync(editor, 0o755);
  }
  if (!WEB_TEMPLATES.every((f) => existsSync(join(templateDir, f.replace("templates/", ""))))) {
    console.log("Downloading the web export templates…");
    const read = remoteZip(`${RELEASE}/${TEMPLATES}`);
    mkdirSync(templateDir, { recursive: true });
    for (const f of WEB_TEMPLATES) writeFileSync(join(templateDir, f.replace("templates/", "")), read(f));
  }
}

function godot(...args) {
  execFileSync(editor, ["--headless", "--path", project, ...args], { stdio: "inherit" });
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
  for (const f of files(from).filter((f) => /\.(glb|png)$/.test(f))) {
    const src = join(from, f), dest = join(to, f);
    wanted.add(f);
    if (existsSync(dest) && statSync(dest).mtimeMs >= statSync(src).mtimeMs) continue;
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
    if (!f.endsWith(".glb")) continue;
    const doc = await io.read(dest);
    const ext = doc.getRoot().listExtensionsUsed().find((e) => e.extensionName === "KHR_mesh_quantization");
    if (!ext) continue;
    await doc.transform(dequantize());
    ext.dispose();
    await io.write(dest, doc);
  }
  if (existsSync(to)) for (const f of files(to)) if (!wanted.has(f.replace(/\.import$/, ""))) rmSync(join(to, f));
}

async function exportWeb() {
  await syncAssets();
  godot("--import");
  const out = join(root, "public/godot");
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  godot("--export-release", "Web", join(out, "index.html"));
  const mb = readdirSync(out).reduce((n, f) => n + statSync(join(out, f)).size, 0) / 1e6;
  console.log(`Exported the web build to public/godot (${mb.toFixed(1)} MB).`);
}

const cmd = process.argv[2];
fetchGodot();
if (cmd === "test") {
  godot("--import");
  // GDScript errors don't stop a test (the function just returns), so any error fails the run.
  const r = spawnSync(editor, ["--headless", "--path", project, "-s", "res://tests/run_tests.gd"], { encoding: "utf8", maxBuffer: 1 << 28 });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  process.stdout.write(out.replace(/^Godot Engine.*\n\n?/m, ""));
  const errors = out.split("\n").filter((l) => /SCRIPT ERROR|Parse Error|Compile Error/.test(l));
  if (errors.length) console.error(`\n${errors.length} script error(s) — failing the run.`);
  if (r.status !== 0 || errors.length) process.exit(1);
}
else if (cmd === "export") await exportWeb();
else if (cmd === "editor") execFileSync(editor, ["--path", project, "-e"], { stdio: "inherit" });
else if (cmd !== "fetch") {
  console.error("Usage: node scripts/godot.mjs fetch|test|export");
  process.exit(1);
}
