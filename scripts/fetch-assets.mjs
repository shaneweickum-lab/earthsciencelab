// Downloads the free (CC0) Kenney asset packs the farm game uses, copies only the models we need
// into public/models, renders item icons into public/icons, and writes the credits file.
// Usage: npm run assets   (needs network access to kenney.nl; results are committed, so the site never downloads)
import { execFileSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";

// Icons: some previews don't read well at hotbar size (the hoe and axe look like hammers), so those items keep emoji.
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const CACHE = path.join(ROOT, ".asset-cache");
const MODELS = path.join(ROOT, "public/models");
const ICONS = path.join(ROOT, "public/icons");
const BUDGET_BYTES = 4.5 * 1024 * 1024;

const PACKS = {
  nature: {
    title: "Nature Kit", url: "https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip",
    page: "https://kenney.nl/assets/nature-kit", dir: "Models/GLTF format",
    models: [
      "tree_default", "tree_default_fall", "tree_default_dark", "tree_oak", "tree_oak_fall", "tree_oak_dark",
      "tree_detailed", "tree_detailed_fall", "tree_detailed_dark", "tree_pineRoundA", "tree_pineRoundC", "tree_pineTallA", "tree_pineSmallB",
      "stump_round", "stump_old", "log", "log_large", "stone_smallA", "stone_smallB", "stone_smallC", "stone_smallFlatA",
      "grass", "grass_large", "grass_leafs", "plant_bushSmall", "plant_bush", "plant_flatShort",
      "flower_redA", "flower_yellowA", "flower_purpleA", "flower_yellowB",
      "mushroom_red", "mushroom_tan", "mushroom_redGroup", "mushroom_tanGroup", "lily_large", "lily_small",
      "crops_cornStageA", "crops_cornStageB", "crops_cornStageC", "crops_cornStageD", "crops_wheatStageA", "crops_wheatStageB",
      "crops_leafsStageA", "crops_leafsStageB", "crop_carrot", "crop_pumpkin", "plant_bushDetailed", "plant_bushLarge", "plant_flatTall",
      "fence_simple", "path_stone", "path_stoneCircle",
    ],
    icons: { previewDir: "Isometric", suffix: "_NE", map: {
      kit_fence: "fence_simple", kit_pathStone: "path_stone", kit_flowerBed: "flower_yellowA",
    } },
  },
  town: {
    title: "Fantasy Town Kit", url: "https://kenney.nl/media/pages/assets/fantasy-town-kit/efe948d309-1754222374/kenney_fantasy-town-kit_2.0.zip",
    page: "https://kenney.nl/assets/fantasy-town-kit", dir: "Models/GLB format", textures: true,
    models: [
      "wall-wood", "wall-wood-door", "wall-wood-window-shutters", "wall-wood-window-small", "wall-wood-corner",
      "roof-high-gable", "roof-high-gable-end", "roof-gable", "roof-gable-end", "chimney", "stall-green", "stall-red", "lantern", "cart", "banner-green",
    ],
  },
  survival: {
    title: "Survival Kit", url: "https://kenney.nl/media/pages/assets/survival-kit/4065a8185b-1712149243/kenney_survival-kit.zip",
    page: "https://kenney.nl/assets/survival-kit", dir: "Models/GLB format", textures: true,
    models: ["barrel", "chest", "box-large", "bucket", "signpost", "resource-wood", "tool-hoe", "tool-shovel", "tool-axe", "tool-pickaxe"],
    icons: { previewDir: "Previews", suffix: "", map: {
      pickaxe: "tool-pickaxe", shovel: "tool-shovel", wood: "resource-wood",
    } },
  },
  food: {
    title: "Food Kit", url: "https://kenney.nl/media/pages/assets/food-kit/83086fa91c-1719418518/kenney_food-kit.zip",
    page: "https://kenney.nl/assets/food-kit", dir: "Models/GLB format", textures: true,
    models: ["tomato", "carrot", "corn", "pumpkin-basic"],
    icons: { previewDir: "Previews", suffix: "", map: {
      crop_tomato: "tomato", crop_carrot: "carrot", crop_corn: "corn", crop_squash: "pumpkin-basic", honey: "honey",
    } },
  },
  characters: {
    title: "Mini Characters", url: "https://kenney.nl/media/pages/assets/mini-characters/bfc7e272b4-1774770718/kenney_mini-characters.zip",
    page: "https://kenney.nl/assets/mini-characters", dir: "Models/GLB format", textures: true,
    models: ["a", "b", "c", "d", "e", "f"].flatMap((l) => [`character-female-${l}`, `character-male-${l}`]),
    // Each character ships with 32 animations; the farm only plays these.
    keepAnimations: ["idle", "walk", "interact-right"],
    icons: { previewDir: "Previews", suffix: "", map: Object.fromEntries(
      ["a", "b", "c", "d", "e", "f"].flatMap((l) => [[`avatar_female-${l}`, `character-female-${l}`], [`avatar_male-${l}`, `character-male-${l}`]]),
    ) },
  },
};

const { NodeIO } = await import("@gltf-transform/core");
const { ALL_EXTENSIONS } = await import("@gltf-transform/extensions");
const { dedup, prune, quantize, weld } = await import("@gltf-transform/functions");
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);

/** Copy a model, dropping every animation not in `keep` (and the data only they used). */
async function keepOnly(src, dest, keep) {
  const doc = await io.read(src);
  for (const anim of doc.getRoot().listAnimations()) if (!keep.includes(anim.getName())) anim.dispose();
  await doc.transform(prune({ keepAttributes: true }), dedup());
  // Texture paths stay relative (Textures/colormap.png), so write next to the original layout.
  writeFileSync(dest, await io.writeBinary(doc));
}

mkdirSync(CACHE, { recursive: true });
rmSync(MODELS, { recursive: true, force: true });
rmSync(ICONS, { recursive: true, force: true });
mkdirSync(ICONS, { recursive: true });

let total = 0;
for (const [key, pack] of Object.entries(PACKS)) {
  const zip = path.join(CACHE, path.basename(pack.url));
  if (!existsSync(zip)) {
    console.log(`Downloading ${pack.title}…`);
    execFileSync("curl", ["-sSLf", "--max-time", "300", "-o", zip, pack.url], { stdio: "inherit" });
  }
  const unpacked = zip.replace(/\.zip$/, "");
  if (!existsSync(unpacked)) execFileSync("unzip", ["-qo", zip, "-d", unpacked]);

  const out = path.join(MODELS, key);
  mkdirSync(out, { recursive: true });
  for (const name of pack.models) {
    const src = path.join(unpacked, pack.dir, `${name}.glb`);
    if (!existsSync(src)) throw new Error(`${pack.title} has no model ${name}`);
    if (pack.keepAnimations) await keepOnly(src, path.join(out, `${name}.glb`), pack.keepAnimations);
    else copyFileSync(src, path.join(out, `${name}.glb`));
  }
  if (pack.textures) {
    mkdirSync(path.join(out, "Textures"), { recursive: true });
    copyFileSync(path.join(unpacked, pack.dir, "Textures/colormap.png"), path.join(out, "Textures/colormap.png"));
  }
  copyFileSync(path.join(unpacked, existsSync(path.join(unpacked, "License.txt")) ? "License.txt" : "license.txt"), path.join(out, "License.txt"));

  for (const [id, model] of Object.entries(pack.icons?.map ?? {})) {
    const src = path.join(unpacked, pack.icons.previewDir, `${model}${pack.icons.suffix}.png`);
    if (!existsSync(src)) throw new Error(`${pack.title} has no preview for ${model}`);
    await sharp(src).trim().resize(96, 96, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(ICONS, `${id}.png`));
  }
}

// ── Quaternius Ultimate Crops: OBJ source art in assets-src, converted to GLB ──
const QUATERNIUS = path.join(ROOT, "assets-src/quaternius-crops");
const QUATERNIUS_STAGES = ["1", "2", "3", "4", "Crop"];
const QUATERNIUS_CROPS = ["Carrot", "Corn", "Pumpkin", "Tomato", "Wheat"];
// Files that didn't make it into the upload: use the nearest stage instead.
const QUATERNIUS_FALLBACK = { Pumpkin_2: "Pumpkin_1", Tomato_3: "Tomato_2" };

/** Every material in the pack. Quaternius reuses the same plain colors, so missing .mtl files can be rebuilt. */
function quaterniusPalette() {
  const blocks = new Map();
  for (const f of readdirSync(QUATERNIUS).filter((x) => x.endsWith(".mtl"))) {
    for (const block of readFileSync(path.join(QUATERNIUS, f), "utf8").split(/^(?=newmtl )/m)) {
      const name = block.match(/^newmtl (\S+)/)?.[1];
      if (name && !blocks.has(name)) blocks.set(name, block.trim());
    }
  }
  return blocks;
}

async function convertQuaternius() {
  if (!existsSync(QUATERNIUS)) return;
  const { default: obj2gltf } = await import("obj2gltf");
  const palette = quaterniusPalette();
  const out = path.join(MODELS, "crops");
  const work = path.join(CACHE, "quaternius-work");
  mkdirSync(out, { recursive: true });
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  for (const crop of QUATERNIUS_CROPS) {
    for (const stage of QUATERNIUS_STAGES) {
      const name = `${crop}_${stage}`;
      const source = existsSync(path.join(QUATERNIUS, `${name}.obj`)) ? name : QUATERNIUS_FALLBACK[name];
      if (!source || !existsSync(path.join(QUATERNIUS, `${source}.obj`))) throw new Error(`Quaternius crops: missing ${name}.obj`);
      const obj = readFileSync(path.join(QUATERNIUS, `${source}.obj`), "utf8");
      const used = [...new Set([...obj.matchAll(/^usemtl (\S+)/gm)].map((m) => m[1]))];
      const mtlFile = path.join(QUATERNIUS, `${source}.mtl`);
      const mtl = existsSync(mtlFile)
        ? readFileSync(mtlFile, "utf8")
        : used.map((m) => palette.get(m) ?? `newmtl ${m}\nKd 0.4 0.6 0.3`).join("\n\n");
      writeFileSync(path.join(work, `${name}.obj`), obj.replace(/^mtllib .*$/m, `mtllib ${name}.mtl`));
      writeFileSync(path.join(work, `${name}.mtl`), mtl);
      const glb = await obj2gltf(path.join(work, `${name}.obj`), { binary: true });
      // Shrink: merge duplicate vertices and data, then store positions and normals in fewer bits.
      const doc = await io.readBinary(new Uint8Array(glb));
      await doc.transform(dedup(), weld(), quantize());
      writeFileSync(path.join(out, `${name}.glb`), await io.writeBinary(doc));
    }
  }
  copyFileSync(path.join(QUATERNIUS, "License.txt"), path.join(out, "License.txt"));
}
await convertQuaternius();

function sizeOf(dir) {
  return readdirSync(dir).reduce((n, f) => {
    const p = path.join(dir, f);
    return n + (statSync(p).isDirectory() ? sizeOf(p) : statSync(p).size);
  }, 0);
}
total = sizeOf(MODELS) + sizeOf(ICONS);

writeFileSync(path.join(MODELS, "CREDITS.md"), `# 3D model and icon credits

All models in this folder (and the item icons in \`public/icons\`, rendered from the packs' previews) are released under
**Creative Commons Zero (CC0 1.0)**: http://creativecommons.org/publicdomain/zero/1.0/

| Folder | Pack | Author | Source |
| --- | --- | --- | --- |
${Object.entries(PACKS).map(([k, p]) => `| \`${k}/\` | ${p.title} | Kenney | ${p.page} |`).join("\n")}
| \`crops/\` | Ultimate Crops (converted from OBJ in \`assets-src/quaternius-crops\`) | Quaternius | https://quaternius.com/packs/ultimatecrops.html |

Credit is not required by CC0, but we're grateful. Regenerate this folder with \`npm run assets\`.
`);

console.log(`Assets ready: ${(total / 1024 / 1024).toFixed(2)} MB`);
if (total > BUDGET_BYTES) {
  console.error(`Over the ${(BUDGET_BYTES / 1024 / 1024).toFixed(1)} MB budget.`);
  process.exit(1);
}
