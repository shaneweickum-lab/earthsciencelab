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
// Kenney nature models for small things (stones, grass, flowers); trees, stumps, and logs are Quaternius's.
const BUDGET_BYTES = 10 * 1024 * 1024;

const PACKS = {
  nature: {
    title: "Nature Kit", url: "https://kenney.nl/media/pages/assets/nature-kit/37ac38a37b-1677698939/kenney_nature-kit.zip",
    page: "https://kenney.nl/assets/nature-kit", dir: "Models/GLTF format",
    models: [
      "stone_smallA", "stone_smallB", "stone_smallC", "stone_smallFlatA",
      "grass", "grass_large", "grass_leafs", "plant_bushSmall", "plant_bush", "plant_flatShort",
      "flower_redA", "flower_yellowA", "flower_purpleA", "flower_yellowB",
      "mushroom_red", "mushroom_tan", "mushroom_redGroup", "mushroom_tanGroup", "lily_large", "lily_small",
      "crops_cornStageA", "crops_cornStageB", "crops_cornStageC", "crops_cornStageD", "crops_wheatStageA", "crops_wheatStageB",
      "crops_leafsStageA", "crops_leafsStageB", "crop_carrot", "crop_pumpkin", "plant_bushDetailed", "plant_bushLarge", "plant_flatTall",
      "fence_simple", "path_stone", "path_stoneCircle",
    ],
  },
  town: {
    title: "Fantasy Town Kit", url: "https://kenney.nl/media/pages/assets/fantasy-town-kit/efe948d309-1754222374/kenney_fantasy-town-kit_2.0.zip",
    page: "https://kenney.nl/assets/fantasy-town-kit", dir: "Models/GLB format", textures: true,
    models: [
      "wall-wood", "wall-wood-door", "wall-wood-window-shutters", "wall-wood-window-small", "wall-wood-corner",
      "roof-high-gable", "roof-high-gable-end", "roof-gable", "roof-gable-end", "chimney", "stall-green", "stall-red", "lantern", "cart", "banner-green", "fountain-round-detail", "hedge", "stall-bench", "banner-red", "wall-window-shutters", "wall-door", "wall",
    ],
  },
  survival: {
    title: "Survival Kit", url: "https://kenney.nl/media/pages/assets/survival-kit/4065a8185b-1712149243/kenney_survival-kit.zip",
    page: "https://kenney.nl/assets/survival-kit", dir: "Models/GLB format", textures: true,
    models: ["barrel", "chest", "box-large", "bucket", "signpost", "resource-wood", "tool-hoe", "tool-shovel", "tool-axe", "tool-pickaxe", "workbench", "workbench-grind"],
  },
  food: {
    title: "Food Kit", url: "https://kenney.nl/media/pages/assets/food-kit/83086fa91c-1719418518/kenney_food-kit.zip",
    page: "https://kenney.nl/assets/food-kit", dir: "Models/GLB format", textures: true,
    // Crops, and the pot and loaf drawn on the stove and oven.
    models: ["tomato", "carrot", "corn", "pumpkin-basic", "pot-stew", "loaf"],
  },
  furniture: {
    // Homestead decorations. The kit's materials are unlit; we make them lit so they shade like the farm.
    title: "Furniture Kit", url: "https://kenney.nl/media/pages/assets/furniture-kit/440e0608a4-1677580847/kenney_furniture-kit.zip",
    page: "https://kenney.nl/assets/furniture-kit", dir: "Models/GLTF format", lit: true,
    models: [
      "bedSingle", "bedDouble", "bedBunk", "cabinetBed", "chair", "chairCushion", "chairRounded", "loungeChair", "loungeChairRelax",
      "loungeSofa", "loungeDesignSofa", "loungeSofaOttoman", "table", "tableCoffee", "tableCloth", "sideTable", "desk", "chairDesk",
      "bookcaseOpen", "bookcaseClosedWide", "books", "lampRoundFloor", "lampSquareTable", "rugRectangle", "rugRound", "rugSquare", "rugDoormat",
      "pottedPlant", "plantSmall1", "plantSmall2", "plantSmall3", "kitchenStove", "kitchenStoveElectric", "kitchenFridge", "kitchenSink", "kitchenCabinet",
      "kitchenCoffeeMachine", "radio", "televisionVintage", "coatRackStanding", "bathtub", "washer", "trashcan", "cardboardBoxClosed",
      "benchCushion", "bench", "speaker", "laptop", "floorFull", "wall", "wallWindow", "wallDoorway",
    ],
  },
  characters: {
    title: "Mini Characters", url: "https://kenney.nl/media/pages/assets/mini-characters/bfc7e272b4-1774770718/kenney_mini-characters.zip",
    page: "https://kenney.nl/assets/mini-characters", dir: "Models/GLB format", textures: true,
    models: ["a", "b", "c", "d", "e", "f"].flatMap((l) => [`character-female-${l}`, `character-male-${l}`]),
    // Each character ships with 32 animations; the farm only plays these.
    keepAnimations: ["idle", "walk", "interact-right", "holding-right", "attack-melee-right", "pick-up"],
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

/** Copy a model with its unlit materials made ordinary lit ones (and its data shrunk). */
async function makeLit(src, dest) {
  const doc = await io.read(src);
  for (const ext of doc.getRoot().listExtensionsUsed()) if (ext.extensionName === "KHR_materials_unlit") ext.dispose();
  for (const m of doc.getRoot().listMaterials()) m.setMetallicFactor(0).setRoughnessFactor(0.85);
  await doc.transform(dedup(), weld(), quantize());
  writeFileSync(dest, await io.writeBinary(doc));
}

// `--only=<pack>` rebuilds one Kenney pack in place (e.g. --only=characters) and leaves the rest alone.
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.slice("--only=".length);
if (ONLY && !PACKS[ONLY] && ONLY !== "trees") throw new Error(`No pack called ${ONLY}. Packs: ${Object.keys(PACKS).join(", ")}, trees`);

mkdirSync(CACHE, { recursive: true });
if (!ONLY) {
  rmSync(MODELS, { recursive: true, force: true });
  rmSync(ICONS, { recursive: true, force: true });
}
mkdirSync(ICONS, { recursive: true });

let total = 0;
for (const [key, pack] of Object.entries(PACKS)) {
  if (ONLY && key !== ONLY) continue;
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
    else if (pack.lit) await makeLit(src, path.join(out, `${name}.glb`));
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

// ── Quaternius packs: OBJ source art in assets-src, converted to GLB ──
const QUATERNIUS_STAGES = ["1", "2", "3", "4", "Crop"];
const QUATERNIUS_CROPS = ["Carrot", "Corn", "Pumpkin", "Tomato", "Wheat"];
const SEASON = ["", "_Autumn", "_Snow"];
const range = (n) => Array.from({ length: n }, (_, i) => i + 1);
/** Source folder, output folder, and which models the game uses (with fallbacks for files that didn't upload). */
const OBJ_PACKS = [
  {
    title: "Ultimate Crops", src: "quaternius-crops", out: "crops", page: "https://quaternius.com/packs/ultimatecrops.html",
    models: QUATERNIUS_CROPS.flatMap((c) => QUATERNIUS_STAGES.map((st) => `${c}_${st}`)),
    fallback: { Pumpkin_2: "Pumpkin_1", Tomato_3: "Tomato_2" },
  },
  {
    // Trees, rocks, stumps, and logs in every season (autumn leaves, snow), plus bushes, grass, and plants.
    title: "Ultimate Nature", src: "quaternius-nature", out: "qnature", page: "https://quaternius.com/packs/ultimatenature.html",
    models: [
      // Pines for the mountain (the textured tree pack below has none).
      ...SEASON.flatMap((s) => range(3).map((n) => `PineTree${s}_${n}`)),
      ...range(4).flatMap((n) => [`Rock_${n}`, `Rock_Snow_${n}`]), "Rock_Moss_1", "Rock_Moss_2",
      ...["TreeStump", "WoodLog"].flatMap((t) => [t, `${t}_Moss`, `${t}_Snow`]),
      "Bush_1", "Bush_2", "Bush_Snow_1", "BushBerries_1", "Grass", "Grass_2", "Grass_Short", "Flowers", "Plant_1", "Plant_2", "Plant_3", "Lilypad",
    ],
  },
  {
    title: "Farm Buildings", src: "quaternius-farm-buildings", out: "qbuildings", page: "https://quaternius.com",
    models: ["Barn", "BigBarn", "ChickenCoop", "Silo", "SmallBarn", "WaterTower", "Well", "Windmill"],
  },
];

/** Every material in a pack. Quaternius reuses the same plain colors, so missing .mtl files can be rebuilt. */
function quaterniusPalette(dir) {
  const blocks = new Map();
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".mtl"))) {
    for (const block of readFileSync(path.join(dir, f), "utf8").split(/^(?=newmtl )/m)) {
      const name = block.match(/^newmtl (\S+)/)?.[1];
      if (name && !blocks.has(name)) blocks.set(name, block.trim());
    }
  }
  return blocks;
}

async function convertObjPack(pack) {
  const src = path.join(ROOT, "assets-src", pack.src);
  if (!existsSync(src)) return;
  const { default: obj2gltf } = await import("obj2gltf");
  const palette = quaterniusPalette(src);
  const out = path.join(MODELS, pack.out);
  const work = path.join(CACHE, `${pack.src}-work`);
  mkdirSync(out, { recursive: true });
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  for (const name of pack.models) {
    const source = existsSync(path.join(src, `${name}.obj`)) ? name : pack.fallback?.[name];
    if (!source || !existsSync(path.join(src, `${source}.obj`))) throw new Error(`${pack.title}: missing ${name}.obj`);
    const obj = readFileSync(path.join(src, `${source}.obj`), "utf8");
    const used = [...new Set([...obj.matchAll(/^usemtl (\S+)/gm)].map((m) => m[1]))];
    const mtlFile = path.join(src, `${source}.mtl`);
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
  const license = readdirSync(src).find((f) => /^license/i.test(f));
  if (license) copyFileSync(path.join(src, license), path.join(out, "License.txt"));
}

if (!ONLY) for (const pack of OBJ_PACKS) await convertObjPack(pack);

// ── Quaternius's textured trees: glTF with big textures, packed into small GLBs ──
const TREE_PACK = {
  title: "Stylized Trees", src: "quaternius-trees", out: "qtrees", page: "https://quaternius.com",
  models: [...range(5).map((n) => `BirchTree_${n}`), ...range(5).map((n) => `MapleTree_${n}`), ...[1, 3, 5, 7, 9].map((n) => `DeadTree_${n}`), "Bush_Small", "Bush_Flowers"],
};

/**
 * Bark becomes a 256px JPEG and leaves a 512px PNG (the 2048px originals and their 20 MB normal
 * maps are far too heavy for the web, and too fine to see from the game's camera). See-through
 * leaves are cut out (alpha mask) rather than blended, so thousands of instanced trees draw in
 * the right order.
 */
async function convertTreePack(pack) {
  const src = path.join(ROOT, "assets-src", pack.src);
  if (!existsSync(src)) return;
  const out = path.join(MODELS, pack.out);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  for (const name of pack.models) {
    const doc = await io.read(path.join(src, `${name}.gltf`));
    for (const m of doc.getRoot().listMaterials()) {
      m.setNormalTexture(null).setMetallicFactor(0).setRoughnessFactor(0.9);
      if (m.getAlphaMode() === "BLEND") m.setAlphaMode("MASK").setAlphaCutoff(0.5);
    }
    await doc.transform(prune());
    for (const tex of doc.getRoot().listTextures()) {
      const leaves = tex.getMimeType() === "image/png";
      const img = sharp(Buffer.from(tex.getImage())).resize(leaves ? 512 : 256, leaves ? 512 : 256);
      tex.setImage(new Uint8Array(await (leaves ? img.png({ palette: true, quality: 90 }) : img.jpeg({ quality: 80 })).toBuffer()));
    }
    await doc.transform(dedup(), weld(), quantize());
    writeFileSync(path.join(out, `${name}.glb`), await io.writeBinary(doc));
  }
  copyFileSync(path.join(src, "License.txt"), path.join(out, "License.txt"));
}

if (!ONLY || ONLY === "trees") await convertTreePack(TREE_PACK);

function sizeOf(dir) {
  return readdirSync(dir).reduce((n, f) => {
    const p = path.join(dir, f);
    return n + (statSync(p).isDirectory() ? sizeOf(p) : statSync(p).size);
  }, 0);
}

if (!ONLY) writeFileSync(path.join(MODELS, "CREDITS.md"), `# 3D model and icon credits

All models in this folder (and the icons in \`public/icons\`: the avatars from Kenney's previews, the items rendered
from these models by \`npm run icons\`) are released under
**Creative Commons Zero (CC0 1.0)**: http://creativecommons.org/publicdomain/zero/1.0/

| Folder | Pack | Author | Source |
| --- | --- | --- | --- |
${Object.entries(PACKS).map(([k, p]) => `| \`${k}/\` | ${p.title} | Kenney | ${p.page} |`).join("\n")}
${OBJ_PACKS.map((p) => `| \`${p.out}/\` | ${p.title} (converted from OBJ in \`assets-src/${p.src}\`) | Quaternius | ${p.page} |`).join("\n")}
| \`${TREE_PACK.out}/\` | ${TREE_PACK.title} (from glTF in \`assets-src/${TREE_PACK.src}\`, textures shrunk) | Quaternius | ${TREE_PACK.page} |

Credit is not required by CC0, but we're grateful. Regenerate this folder with \`npm run assets\`.
`);

// Item icons are rendered from the models above, so they match the game.
if (!ONLY) execFileSync(process.execPath, [path.join(ROOT, "scripts/render-icons.mjs")], { stdio: "inherit" });
total = sizeOf(MODELS) + sizeOf(ICONS);
console.log(`Assets ready: ${(total / 1024 / 1024).toFixed(2)} MB`);
if (total > BUDGET_BYTES) {
  console.error(`Over the ${(BUDGET_BYTES / 1024 / 1024).toFixed(1)} MB budget.`);
  process.exit(1);
}
