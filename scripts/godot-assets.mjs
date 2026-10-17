// Fonts and emoji for the Godot port. Godot's web build has no system fonts, so it can't draw
// emoji. This finds every emoji the game uses (in godot/data and the GDScript sources) and
// downloads Google's Noto emoji as 64px PNGs into godot/assets/emoji, plus the Nunito font.
// The files are committed; rerun after adding content with new emoji:
//   node scripts/godot-assets.mjs
// Keep EMOJI_START and the sequence rules in step with godot/ui/emoji.gd.
import { execFileSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const godot = join(root, "godot");
const EMOJI_DIR = join(godot, "assets/emoji");
const FONT_DIR = join(godot, "assets/fonts");
const EMOJI_URL = "https://cdn.jsdelivr.net/npm/emoji-datasource-google@15.1.2/img/google/64";
const FONT_URL = "https://raw.githubusercontent.com/google/fonts/main/ofl/nunito";

/** Code points that start an emoji (the game's emoji all come from these blocks). */
export function emojiStart(cp) {
  return (cp >= 0x1f000 && cp <= 0x1faff) || (cp >= 0x2600 && cp <= 0x27bf) || (cp >= 0x23e9 && cp <= 0x23ff)
    || cp === 0x2b50 || cp === 0x2b1c || cp === 0x2b1b || cp === 0x25b6 || cp === 0x25c0;
}

/** Split text into emoji sequences (with variation selectors, ZWJ joins, and skin tones). */
export function findEmoji(text) {
  const cps = [...text].map((c) => c.codePointAt(0));
  const out = [];
  for (let i = 0; i < cps.length; i++) {
    if (!emojiStart(cps[i])) continue;
    const seq = [cps[i]];
    while (i + 1 < cps.length) {
      const n = cps[i + 1];
      if (n === 0xfe0f || (n >= 0x1f3fb && n <= 0x1f3ff)) seq.push(cps[++i]);
      else if (n === 0x200d && i + 2 < cps.length) seq.push(cps[++i], cps[++i]);
      else break;
    }
    out.push(seq);
  }
  return out;
}

/** File name for an emoji: its code points in hex, without variation selectors. */
const key = (seq) => seq.filter((c) => c !== 0xfe0f).map((c) => c.toString(16)).join("-");

function files(dir, ext) {
  return readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith(ext) && statSync(join(dir, f)).isFile()).map((f) => join(dir, f));
}

function fetchTo(url, file) {
  try {
    execFileSync("curl", ["-sSLf", "--retry", "2", "-o", file, url], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

mkdirSync(EMOJI_DIR, { recursive: true });
mkdirSync(FONT_DIR, { recursive: true });

const sources = [...files(join(godot, "data"), ".json"), ...["autoload", "engine", "scene", "ui"].flatMap((d) => files(join(godot, d), ".gd"))];
const wanted = new Map();
for (const f of sources) for (const seq of findEmoji(readFileSync(f, "utf8"))) wanted.set(key(seq), seq);

const missing = [];
for (const [k, seq] of wanted) {
  const file = join(EMOJI_DIR, `${k}.png`);
  if (existsSync(file)) continue;
  // emoji-datasource names some files with the variation selector and some without.
  const names = [k, seq.map((c) => c.toString(16)).join("-"), `${k}-fe0f`, k.replace("-", "-fe0f-")];
  if (!names.some((n) => fetchTo(`${EMOJI_URL}/${n}.png`, file))) missing.push(String.fromCodePoint(...seq));
}
writeFileSync(join(EMOJI_DIR, "CREDITS.md"), `# Emoji

Noto Emoji by Google, licensed under the Apache License 2.0 (https://github.com/googlefonts/noto-emoji),
as 64px PNGs from the emoji-datasource-google package (MIT, https://github.com/iamcal/emoji-data).
Made by scripts/godot-assets.mjs.
`);

for (const [name, file] of [["Nunito%5Bwght%5D.ttf", "Nunito.ttf"], ["OFL.txt", "Nunito-OFL.txt"]]) {
  if (!existsSync(join(FONT_DIR, file))) fetchTo(`${FONT_URL}/${name}`, join(FONT_DIR, file));
}

console.log(`${wanted.size} emoji in use, ${readdirSync(EMOJI_DIR).filter((f) => f.endsWith(".png")).length} images.`);
if (missing.length) {
  console.error(`No image for: ${missing.join(" ")}`);
  process.exit(1);
}
