// Renders an icon for every item into public/icons, from the same models the game draws
// (Kenney and Quaternius, see scripts/icons-page.js), so the hotbar matches the world.
// Needs the unpacked Kenney packs from `npm run assets` (in .asset-cache) and a Chromium
// that Playwright can launch. Usage: node scripts/render-icons.mjs [item ids…]
import { createServer } from "node:http";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright-core";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "public/icons");
const ROUTES = {
  "/three/": "node_modules/three/",
  "/kenney/": ".asset-cache/",
  "/models/": "public/models/",
};
const TYPES = { ".js": "text/javascript", ".glb": "model/gltf-binary", ".png": "image/png", ".obj": "text/plain", ".mtl": "text/plain", ".bin": "application/octet-stream", ".gltf": "model/gltf+json" };

if (!existsSync(path.join(ROOT, ".asset-cache/kenney_survival-kit"))) {
  console.error("Run `npm run assets` first: the icons are rendered from the unpacked Kenney packs in .asset-cache.");
  process.exit(1);
}

const PAGE = `<!doctype html><html><body style="margin:0;background:transparent">
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
<script type="module" src="/icons-page.js"></script></body></html>`;

const server = createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (url === "/") return res.writeHead(200, { "content-type": "text/html" }).end(PAGE);
  if (url === "/icons-page.js") return res.writeHead(200, { "content-type": "text/javascript" }).end(readFileSync(path.join(ROOT, "scripts/icons-page.js")));
  const prefix = Object.keys(ROUTES).find((p) => url.startsWith(p));
  const file = prefix && path.join(ROOT, ROUTES[prefix], url.slice(prefix.length));
  if (!file || !file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}/`;

const pw = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
const dir = existsSync(pw) ? readdirSync(pw).find((d) => d.startsWith("chromium-")) : null;
const browser = await chromium.launch({
  executablePath: dir ? path.join(pw, dir, "chrome-linux/chrome") : undefined,
  args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"],
});
const page = await browser.newPage();
page.on("pageerror", (e) => console.error(e.message));
await page.goto(base);
await page.waitForFunction(() => window.iconsReady, null, { timeout: 30000 });

const only = process.argv.slice(2);
const ids = (await page.evaluate(() => window.iconIds())).filter((id) => !only.length || only.includes(id));
for (const id of ids) {
  const url = await page.evaluate((i) => window.renderIcon(i), id);
  const png = Buffer.from(url.split(",")[1], "base64");
  await sharp(png).trim().resize(96, 96, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(OUT, `${id}.png`));
}
console.log(`Rendered ${ids.length} icons into public/icons.`);
await browser.close();
server.close();
