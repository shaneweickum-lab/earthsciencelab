// Runs in headless Chromium for scripts/render-icons.mjs: builds each item from the game's own
// models (or simple shapes in the same low-poly style) and renders it from the same 3/4 view.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const SIZE = 256;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setSize(SIZE, SIZE);
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ───────────────────────── models ─────────────────────────

const gltf = new GLTFLoader();
const cache = new Map();

/** Kenney's Nature Kit colors (the same repaint as src/components/world/scene/models.tsx). */
const PALETTE = {
  grass: "#6fae4f", leafsGreen: "#4f9a45", leafsDark: "#3d7058", leafsFall: "#e08a3c",
  woodBark: "#8a5a3c", woodBarkDark: "#6e4a35", woodInner: "#e8c99a", woodBirch: "#efe6d6",
  dirt: "#8a6040", stone: "#b9bcb6", stoneDark: "#8f948f", wood: "#b07a4f", woodDark: "#8a5a3c", corn: "#f0c75a",
};

/** Matte, flat-shaded materials, as the game draws them. */
function matte(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if ("metalness" in m) {
        m.metalness = 0;
        m.roughness = Math.max(m.roughness, 0.8);
      }
      if (PALETTE[m.name]) m.color.set(PALETTE[m.name]);
      m.flatShading = true;
      m.needsUpdate = true;
    }
  });
  return root;
}

async function glb(url) {
  if (!cache.has(url)) cache.set(url, gltf.loadAsync(url).then((g) => matte(g.scene)));
  return (await cache.get(url)).clone(true);
}

const kenney = (kit, name) => glb(`/kenney/kenney_${kit}/Models/${kit === "nature-kit" ? "GLTF format" : "GLB format"}/${name}.glb`);
const survival = (n) => kenney("survival-kit", n);
const food = (n) => kenney("food-kit", n);
const nature = (n) => kenney("nature-kit", n);
const crop = (n) => glb(`/models/crops/${n}.glb`);
const building = (n) => glb(`/models/qbuildings/${n}.glb`);

/** The same model with its grey metal recolored, for copper, bronze, iron, gold, and mithril tools. */
function metal(root, color) {
  // sRGB 0–255, as the texture's pixels are.
  const tint = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  root.traverse((o) => {
    if (!o.isMesh || !o.material.map) return;
    const img = o.material.map.image;
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    const px = g.getImageData(0, 0, c.width, c.height);
    const d = px.data;
    for (let i = 0; i < d.length; i += 4) {
      const max = Math.max(d[i], d[i + 1], d[i + 2]), min = Math.min(d[i], d[i + 1], d[i + 2]);
      // Grey, not too dark: the metal parts. Keep their shading, take the tier's color.
      if (max > 90 && (max - min) / max < 0.3) {
        const k = max / 175;
        d[i] = Math.min(255, tint[0] * k);
        d[i + 1] = Math.min(255, tint[1] * k);
        d[i + 2] = Math.min(255, tint[2] * k);
      }
    }
    g.putImageData(px, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.flipY = o.material.map.flipY;
    tex.magFilter = THREE.NearestFilter;
    o.material = o.material.clone();
    o.material.map = tex;
  });
  return root;
}

const TIER_COLORS = { copper: "#c8753d", bronze: "#b8893a", iron: "#d4d8dc", gold: "#f2c230", mithril: "#7fd6e8" };

// ───────────────────────── simple shapes ─────────────────────────

const mat = (color) => new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.85, flatShading: true });

function mesh(geo, color, pos = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1]) {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.set(...pos);
  m.rotation.set(...rot);
  m.scale.set(...scale);
  return m;
}
const box = (w, h, d, color, pos, rot) => mesh(new THREE.BoxGeometry(w, h, d), color, pos, rot);
const cyl = (rt, rb, h, color, pos, rot, seg = 12) => mesh(new THREE.CylinderGeometry(rt, rb, h, seg), color, pos, rot);
const ball = (r, color, pos, scale, detail = 1) => mesh(new THREE.IcosahedronGeometry(r, detail), color, pos, [0, 0, 0], scale);
const cone = (r, h, color, pos, rot, seg = 8) => mesh(new THREE.ConeGeometry(r, h, seg), color, pos, rot);

function group(...parts) {
  const g = new THREE.Group();
  for (const p of parts.flat()) g.add(p);
  return g;
}
function place(o, pos = [0, 0, 0], rot = [0, 0, 0], s = 1) {
  o.position.set(...pos);
  o.rotation.set(...rot);
  o.scale.setScalar(s);
  return o;
}

/** A tied sack with a colored band, and a little heap of what's inside in front of it. */
function sack(color, band, heap) {
  return group(
    ball(0.5, color, [0, 0.45, 0], [1, 1.05, 0.85]),
    cyl(0.18, 0.28, 0.25, color, [0, 0.95, 0]),
    cyl(0.2, 0.2, 0.06, "#8a6a45", [0, 0.9, 0]),
    box(0.62, 0.22, 0.05, band, [0, 0.5, 0.42]),
    heap ? ball(0.28, heap, [0.35, 0.1, 0.45], [1.2, 0.5, 1], 0) : [],
  );
}

function wateringCan(color, trim) {
  return group(
    cyl(0.38, 0.42, 0.7, color, [0, 0.35, 0]),
    cyl(0.4, 0.4, 0.06, trim, [0, 0.72, 0]),
    cyl(0.05, 0.08, 0.8, color, [0.55, 0.45, 0], [0, 0, -0.9], 8),
    cyl(0.12, 0.08, 0.1, trim, [0.88, 0.7, 0], [0, 0, -0.9], 8),
    mesh(new THREE.TorusGeometry(0.28, 0.05, 6, 12, Math.PI), trim, [-0.1, 0.72, 0], [0, 0, 0]),
  );
}

/** A seed packet with the crop drawn on it, standing behind a few seeds. */
async function packet(color, front) {
  const f = await front;
  const s = new THREE.Box3().setFromObject(f).getSize(new THREE.Vector3());
  const k = 0.55 / Math.max(s.x, s.y, s.z);
  f.scale.multiplyScalar(k);
  const b = new THREE.Box3().setFromObject(f);
  f.position.set(0, 0.55 - (b.min.y + b.max.y) / 2, 0.12);
  return group(
    box(0.8, 1.05, 0.08, "#fbf6ef", [0, 0.55, 0]),
    box(0.8, 0.22, 0.085, color, [0, 0.98, 0]),
    box(0.8, 0.16, 0.085, color, [0, 0.12, 0]),
    f,
  );
}

const potato = () => group(
  ball(0.3, "#b8875a", [0, 0.22, 0], [1.3, 0.85, 1]),
  ball(0.24, "#a87a4f", [0.38, 0.18, 0.2], [1.1, 0.8, 1]),
);
const beans = () => group([-0.2, 0, 0.2].map((x, i) => mesh(new THREE.CapsuleGeometry(0.07, 0.7, 3, 6), i === 1 ? "#7fb446" : "#8bc34a", [x, 0.12, 0], [Math.PI / 2, 0, 0.3 * (i - 1)])));
const sunflower = () => group(
  cyl(0.45, 0.45, 0.08, "#f2c230", [0, 0.5, 0], [Math.PI / 2.6, 0, 0], 14),
  cyl(0.24, 0.24, 0.1, "#5a3a22", [0, 0.51, 0.02], [Math.PI / 2.6, 0, 0], 10),
  cyl(0.04, 0.05, 0.5, "#4f8a2e", [0, 0.1, -0.15], [0.3, 0, 0], 6),
);
const buckwheat = () => group(
  cyl(0.03, 0.04, 0.7, "#c86b5a", [0, 0.35, 0], [0, 0, 0], 6),
  [0, 1, 2, 3, 4, 5].map((i) => ball(0.09, "#fbf6ef", [Math.cos(i) * 0.14, 0.7 + (i % 3) * 0.06, Math.sin(i) * 0.14], [1, 1, 1], 0)),
  ball(0.16, "#5d9c42", [0.18, 0.25, 0], [1, 0.4, 1], 0),
);
const clover = () => group(
  [0, 1, 2].map((i) => ball(0.2, "#4f9a3c", [Math.cos(i * 2.1) * 0.2, 0.1, Math.sin(i * 2.1) * 0.2], [1, 0.3, 1], 0)),
  ball(0.12, "#e9a7c8", [0, 0.35, 0], [1, 1, 1], 0),
  cyl(0.02, 0.02, 0.3, "#4f8a2e", [0, 0.18, 0], [0, 0, 0], 5),
);

// ───────────────────────── the items ─────────────────────────

const SEED_COLORS = {
  clover: "#4f9a3c", beans: "#6aa84f", buckwheat: "#c86b5a", carrot: "#e8792b", wheat: "#d6b04a",
  potato: "#8a6a45", sunflower: "#f2c230", squash: "#e0902f", corn: "#e8c547", tomato: "#d9452f",
};
const PRODUCE = {
  carrot: () => crop("Carrot_Crop"), corn: () => crop("Corn_Crop"), tomato: () => crop("Tomato_Crop"),
  squash: () => crop("Pumpkin_Crop"), wheat: () => nature("crops_wheatStageB"),
  potato: async () => potato(), beans: async () => beans(), sunflower: async () => sunflower(),
  buckwheat: async () => buckwheat(), clover: async () => clover(),
};

const ICONS = {
  hoe: () => survival("tool-hoe"),
  axe: () => survival("tool-axe"),
  pickaxe: () => survival("tool-pickaxe"),
  shovel: () => survival("tool-shovel"),
  scythe: async () => group(
    cyl(0.04, 0.05, 1.5, "#b07a4f", [0, 0.75, 0], [0, 0, 0.2], 6),
    cyl(0.04, 0.04, 0.3, "#8a5a3c", [0.05, 0.75, 0.12], [Math.PI / 2, 0, 0], 6),
    mesh(new THREE.TorusGeometry(0.55, 0.06, 4, 12, Math.PI * 0.6), "#c9ced6", [0.6, 1.3, 0], [0, 0, Math.PI * 0.55], [1, 1, 0.4]),
  ),
  can: async () => wateringCan("#4f8a6e", "#3a6650"),
  bigCan: async () => wateringCan("#c87a45", "#9a5a30"),
  ring: async () => group(
    mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.5, 20, 1, true), "#b9bcb6", [0, 0.25, 0]),
    mesh(new THREE.TorusGeometry(0.5, 0.035, 6, 20), "#8f948f", [0, 0.5, 0], [Math.PI / 2, 0, 0]),
    cyl(0.48, 0.48, 0.04, "#5fa3cf", [0, 0.35, 0], [0, 0, 0], 20),
    cyl(0.7, 0.75, 0.06, "#8a6040", [0, -0.02, 0], [0, 0, 0], 20),
  ),
  labKit: async () => group(
    box(1, 0.3, 0.6, "#fbf6ef", [0, 0.15, 0]),
    box(1.02, 0.08, 0.62, "#3f86b0", [0, 0.3, 0]),
    [["#d9452f", -0.3], ["#3f7d4e", 0], ["#f2c230", 0.3]].map(([c, x]) => group(
      cyl(0.08, 0.08, 0.6, "#e6f2f5", [x, 0.6, 0], [0, 0, 0], 10),
      cyl(0.075, 0.075, 0.3, c, [x, 0.45, 0], [0, 0, 0], 10),
    )),
  ),
  compost: async () => sack("#7a5233", "#3f7d4e", "#3a2415"),
  lime: async () => sack("#efe9dc", "#3f86b0", "#ffffff"),
  biochar: async () => sack("#4a4a4a", "#e8792b", "#1e1e1e"),
  mulch: async () => group(
    box(1, 0.55, 0.65, "#d8b75a", [0, 0.28, 0]),
    box(1.02, 0.57, 0.06, "#a8873a", [-0.25, 0.28, 0], [0, Math.PI / 2, 0]),
    box(1.02, 0.57, 0.06, "#a8873a", [0.25, 0.28, 0], [0, Math.PI / 2, 0]),
  ),
  synthFert: async () => group(
    cyl(0.32, 0.35, 0.8, "#3f86b0", [0, 0.4, 0]),
    cyl(0.12, 0.14, 0.15, "#fbf6ef", [0, 0.88, 0]),
    box(0.5, 0.3, 0.05, "#fbf6ef", [0, 0.42, 0.32]),
  ),
  fiber: () => nature("grass_leafsLarge"),
  // The same rocks and logs that lie around the farm.
  wood: () => glb("/models/qnature/WoodLog.glb"),
  stone: async () => group(await glb("/models/qnature/Rock_1.glb"), place(await glb("/models/qnature/Rock_2.glb"), [1.2, 0, 0.6], [0, 1, 0], 0.7)),
  honey: () => food("honey"),
  egg: async () => group((await food("egg")), place(await food("egg"), [0.35, 0, 0.15], [0, 1, 0.3])),
  kit_composter: async () => group(
    box(0.8, 0.8, 0.8, "#3d6b3f", [0, 0.4, 0]),
    box(0.85, 0.06, 0.85, "#2c4f2e", [0, 0.83, 0]),
  ),
  kit_rainBarrel: () => survival("barrel"),
  kit_beehive: async () => group(
    [0, 1, 2].map((i) => box(0.6, 0.26, 0.5, i % 2 ? "#f5e7b8" : "#fbf6ef", [0, 0.13 + i * 0.28, 0])),
    box(0.7, 0.06, 0.6, "#b5532f", [0, 0.85, 0]),
  ),
  kit_birdHouse: async () => group(
    cyl(0.04, 0.04, 1.2, "#7a5636", [0, 0.6, 0], [0, 0, 0], 6),
    box(0.35, 0.35, 0.35, "#c0603b", [0, 1.3, 0]),
    cone(0.32, 0.25, "#6b4423", [0, 1.58, 0], [0, Math.PI / 4, 0], 4),
    mesh(new THREE.CircleGeometry(0.06, 10), "#2a2017", [0, 1.3, 0.18]),
  ),
  kit_bugHotel: async () => group(
    box(0.7, 0.9, 0.4, "#9a6b3f", [0, 0.45, 0]),
    [0, 1, 2, 3, 4, 5].map((i) => cyl(0.07, 0.07, 0.02, "#4a2f1c", [-0.2 + (i % 3) * 0.2, 0.3 + Math.floor(i / 3) * 0.3, 0.21], [Math.PI / 2, 0, 0], 8)),
    cone(0.55, 0.3, "#3f7d4e", [0, 1.0, 0], [0, Math.PI / 4, 0], 4),
  ),
  kit_scarecrow: async () => group(
    cyl(0.04, 0.04, 1.4, "#7a5636", [0, 0.7, 0], [0, 0, 0], 6),
    box(0.9, 0.06, 0.06, "#7a5636", [0, 1.05, 0]),
    box(0.35, 0.45, 0.2, "#3f86b0", [0, 0.95, 0]),
    ball(0.15, "#e0c27a", [0, 1.38, 0]),
    cone(0.25, 0.2, "#d6b04a", [0, 1.52, 0], [0, 0, 0], 10),
  ),
  kit_greenhouse: async () => {
    const glass = new THREE.MeshStandardMaterial({ color: "#cfeef0", transparent: true, opacity: 0.45, roughness: 0.1 });
    const g = group(
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => box(0.08, 1.2, 0.08, "#fbf6ef", [x * 0.75, 0.6, z * 0.75])),
      box(1.6, 0.08, 0.08, "#fbf6ef", [0, 1.2, 0.75]),
      box(1.6, 0.08, 0.08, "#fbf6ef", [0, 1.2, -0.75]),
      box(1.6, 0.05, 1.6, "#8a6a45", [0, 0.02, 0]),
      ball(0.2, "#4f9a3c", [-0.3, 0.2, 0.1], [1, 0.8, 1], 0),
      ball(0.18, "#5d9c42", [0.35, 0.18, -0.2], [1, 0.8, 1], 0),
    );
    const walls = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 1.5), glass);
    walls.position.y = 0.6;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.6, 4), glass);
    roof.position.y = 1.5;
    roof.rotation.y = Math.PI / 4;
    g.add(walls, roof);
    return g;
  },
  kit_fence: () => nature("fence_simple"),
  kit_flowerBed: () => nature("flower_yellowA"),
  kit_pathStone: () => nature("path_stone"),
  kit_well: () => building("Well"),
  kit_chickenCoop: () => building("ChickenCoop"),
  kit_smallBarn: () => building("SmallBarn"),
};
/** Ore: a rock from the world with crystals of the ore's color, as the mine draws it. */
const ORE_COLORS = { copperOre: "#3fae7a", tinOre: "#3b3440", ironOre: "#b24a2c", goldOre: "#f2c230", mithrilOre: "#5fd8f0" };
async function ore(color) {
  const rock = await glb("/models/qnature/Rock_2.glb");
  const r = new THREE.Box3().setFromObject(rock).getSize(new THREE.Vector3());
  const k = 1 / Math.max(r.x, r.y, r.z);
  rock.scale.setScalar(k);
  const bits = [[0.25, 0.55, 0.3, 0.24], [-0.22, 0.45, 0.35, 0.19], [0.05, 0.72, 0.05, 0.21], [0.38, 0.3, -0.1, 0.16]].map(([x, y, z, r]) => {
    const m = mesh(new THREE.OctahedronGeometry(r, 0), color, [x, y, z], [0.4, x * 3, 0.3]);
    if (color === ORE_COLORS.mithrilOre) m.material.emissive = new THREE.Color(color).multiplyScalar(0.4);
    return m;
  });
  return group(rock, bits);
}
for (const [id, color] of Object.entries(ORE_COLORS)) ICONS[id] = () => ore(color);

/** A metal ingot (a little stack of two). */
function bars(color) {
  const bar = (y, ry) => {
    const m = mesh(new THREE.CylinderGeometry(0.42, 0.55, 0.28, 4, 1), color, [0, y, 0], [0, ry, 0], [1.6, 1, 0.8]);
    if (color === "#5fd8f0") m.material.emissive = new THREE.Color(color).multiplyScalar(0.3);
    return m;
  };
  return group(bar(0.14, Math.PI / 4), place(bar(0.42, Math.PI / 4), [0.1, 0, 0.05], [0, 0.4, 0]));
}
ICONS.copperBar = async () => bars("#c8753d");
ICONS.bronzeBar = async () => bars("#b8893a");
ICONS.ironBar = async () => bars("#c9ced6");
ICONS.goldBar = async () => bars("#f2c230");
ICONS.mithrilBar = async () => bars("#5fd8f0");
ICONS.sticks = async () => group([-0.3, 0, 0.3].map((z, i) => cyl(0.05, 0.06, 1.3, i === 1 ? "#9a6b3f" : "#8a5a3c", [0, 0.06 + i * 0.05, z], [0, (i - 1) * 0.35, Math.PI / 2], 6)));
ICONS.refinedFiber = async () => group(
  mesh(new THREE.TorusGeometry(0.4, 0.17, 8, 16), "#e8d9a8", [0, 0.2, 0], [Math.PI / 2, 0, 0]),
  mesh(new THREE.TorusGeometry(0.3, 0.12, 8, 16), "#d9c88f", [0, 0.42, 0], [Math.PI / 2, 0, 0]),
);
ICONS.rope = async () => group([0, 1, 2].map((i) => mesh(new THREE.TorusGeometry(0.45 - i * 0.04, 0.09, 6, 20), i % 2 ? "#b08458" : "#c49a6c", [0, 0.1 + i * 0.17, 0], [Math.PI / 2, 0, i])));
ICONS.kit_workbench = () => survival("workbench");
ICONS.kit_grinder = () => survival("workbench-grind");
ICONS.kit_chest = () => survival("chest");
/** The spinning wheel and furnace are drawn the same way in the game (scene/Buildings.tsx). */
ICONS.kit_spinningWheel = async () => group(
  mesh(new THREE.TorusGeometry(0.5, 0.05, 6, 20), "#9a6b3f", [0, 0.85, 0]),
  [0, 1, 2, 3].map((k) => box(0.04, 0.95, 0.04, "#b08458", [0, 0.85, 0], [0, 0, (k * Math.PI) / 4])),
  box(0.9, 0.08, 0.3, "#7a5636", [0.15, 0.25, 0]),
  [[-0.25, 0.12], [0.55, 0.12]].map(([x]) => box(0.07, 0.5, 0.07, "#7a5636", [x, 0.12, 0])),
  box(0.07, 0.75, 0.07, "#7a5636", [0, 0.5, 0.12]),
  cyl(0.06, 0.06, 0.25, "#e8d9a8", [0.45, 0.45, 0], [0, 0, 0], 8),
);
ICONS.kit_furnace = async () => group(
  box(0.9, 0.9, 0.8, "#8f8a82", [0, 0.45, 0]),
  box(0.95, 0.12, 0.85, "#7a756d", [0, 0.92, 0]),
  box(0.4, 0.35, 0.05, "#1a1410", [0, 0.3, 0.41]),
  box(0.3, 0.12, 0.06, "#ff8a2a", [0, 0.2, 0.42]),
  cyl(0.14, 0.16, 0.5, "#7a756d", [0.25, 1.2, -0.15], [0, 0, 0], 8),
);

// The kitchen: Kenney's Food Kit utensils and dishes, and the Furniture Kit stoves the farm draws.
/** Something sitting on top of something else (a dish on a plate, a pan on a stove), `s` times the base's width. */
async function on(base, top, s = 1, rot = [0, 0, 0]) {
  const b = await base;
  const t = await top;
  const box3 = new THREE.Box3().setFromObject(b);
  t.rotation.set(...rot);
  const size = (o) => new THREE.Box3().setFromObject(o).getSize(new THREE.Vector3());
  const bs = size(b), ts = size(t);
  t.scale.multiplyScalar((s * Math.max(bs.x, bs.z)) / Math.max(ts.x, ts.z));
  const tb = new THREE.Box3().setFromObject(t);
  t.position.set((box3.min.x + box3.max.x) / 2 - (tb.min.x + tb.max.x) / 2, box3.max.y - tb.min.y, (box3.min.z + box3.max.z) / 2 - (tb.min.z + tb.max.z) / 2);
  return group(b, t);
}
const furniture = (n) => glb(`/models/furniture/${n}.glb`);
ICONS.knife = () => food("cooking-knife");
ICONS.pan = () => food("frying-pan");
ICONS.pot = () => food("pot");
ICONS.kit_stove = () => on(furniture("kitchenStove"), food("frying-pan"), 0.55);
ICONS.kit_oven = () => on(furniture("kitchenStoveElectric"), food("loaf"), 0.45);
ICONS.flour = async () => sack("#f3ead6", "#d6b04a", "#ffffff");
ICONS.carrotSticks = () => on(food("cutting-board"), food("carrot"), 0.75, [0, 0, Math.PI / 2]);
ICONS.salad = () => food("salad");
ICONS.toastedSeeds = () => food("bowl-cereal");
ICONS.friedEgg = () => food("egg-cooked");
ICONS.cornOnCob = () => on(food("plate"), food("corn"), 0.75, [0, 0, Math.PI / 2]);
ICONS.bakedPotato = () => on(food("plate"), Promise.resolve(potato()), 0.55);
ICONS.fries = () => food("fries");
ICONS.tomatoSoup = () => food("bowl-soup");
ICONS.pancakes = () => food("pancakes");
ICONS.beanStew = () => food("pot-stew");
ICONS.bread = () => food("loaf");
ICONS.sandwich = () => food("sandwich");
ICONS.pizza = () => food("pizza");
ICONS.pie = () => food("pie");

// Fishing: Kai's rod, the fish of the river, pond, and sea (the Food Kit's fish, tinted), and the dishes.
/** A model painted one color (keeping its shading). */
function tint(root, color) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material = (Array.isArray(o.material) ? o.material[0] : o.material).clone();
    o.material.map = null;
    o.material.color.set(color);
  });
  return root;
}
const FISH_COLORS = {
  brookTrout: "#8f9a5a", rainbowTrout: "#d98a9a", catfish: "#7a6f60", salmon: "#e0846a", bluegill: "#4f7fb8", perch: "#e0b83a",
  bass: "#5f8f3f", flounder: "#b8a07a", mackerel: "#3f8fa0", stripedBass: "#a8b0b8", anyFish: "#8fb0c8",
};
for (const [id, color] of Object.entries(FISH_COLORS)) ICONS[id] = async () => tint(await food("fish"), color);
ICONS.crab = async () => group(
  ball(0.42, "#4f7fb8", [0, 0.25, 0], [1.3, 0.55, 1]),
  [-1, 1].flatMap((side) => [
    ...[0, 1, 2].map((k) => cyl(0.04, 0.04, 0.5, "#3f6fa0", [side * (0.55 + k * 0.02), 0.15, -0.25 + k * 0.25], [0, 0, side * 1.1], 5)),
    ball(0.13, "#d9452f", [side * 0.5, 0.35, 0.4], [1.2, 0.8, 1]),
  ]),
  ball(0.05, "#1a1410", [-0.12, 0.45, 0.35]), ball(0.05, "#1a1410", [0.12, 0.45, 0.35]),
);
ICONS.kelp = async () => group([-0.25, 0, 0.25].map((x, i) => mesh(new THREE.CapsuleGeometry(0.09, 1.0 + i * 0.2, 3, 6), i === 1 ? "#5d7d2f" : "#6f8f3a", [x, 0.6, 0], [0, 0, (i - 1) * 0.25])));
ICONS.rod = async () => group(
  cyl(0.03, 0.05, 2.2, "#8a5a3c", [0, 1.1, 0], [0, 0, -0.5], 6),
  cyl(0.11, 0.11, 0.12, "#c9ced6", [-0.2, 0.55, 0.06], [Math.PI / 2, 0, 0], 10),
  cyl(0.008, 0.008, 1.3, "#eeeeee", [0.75, 1.0, 0], [0, 0, 0], 4),
  ball(0.08, "#d9452f", [0.75, 0.35, 0]),
);
ICONS.panFish = () => on(food("frying-pan"), food("fish"), 0.55);
ICONS.fishStew = () => food("bowl-broth");
ICONS.bakedFish = () => on(food("plate"), food("fish"), 0.7);
ICONS.fishTacos = () => food("taco");

for (const [tier, color] of Object.entries(TIER_COLORS)) {
  ICONS[`axe_${tier}`] = async () => metal(await survival("tool-axe-upgraded"), color);
  ICONS[`pickaxe_${tier}`] = async () => metal(await survival("tool-pickaxe-upgraded"), color);
}
for (const [id, color] of Object.entries(SEED_COLORS)) {
  ICONS[`seed_${id}`] = () => packet(color, PRODUCE[id]());
  ICONS[`crop_${id}`] = PRODUCE[id];
}

// Homestead decorations (src/world/decor.json): each one's own model.
for (const d of await (await fetch("/decor.json")).json()) ICONS[`decor_${d.id}`] = () => glb(`/models/${d.pack}/${d.model}.glb`);

// ───────────────────────── rendering ─────────────────────────

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x8a7a6a, 1.6));
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.position.set(3, 6, 4);
scene.add(sun);
const fill = new THREE.DirectionalLight(0xffffff, 0.6);
fill.position.set(-4, 2, -2);
scene.add(fill);

/** The same view for every icon: from the front-right and a little above, like the farm camera. */
const VIEW = new THREE.Vector3(0.9, 0.75, 1.3).normalize();

window.iconIds = () => Object.keys(ICONS);

window.renderIcon = async (id) => {
  const obj = await ICONS[id]();
  scene.add(obj);
  const sphere = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere());
  const r = sphere.radius * 1.02;
  const cam = new THREE.OrthographicCamera(-r, r, r, -r, 0.01, r * 10);
  cam.position.copy(sphere.center).addScaledVector(VIEW, r * 4);
  cam.lookAt(sphere.center);
  renderer.render(scene, cam);
  scene.remove(obj);
  return renderer.domElement.toDataURL("image/png");
};

window.iconsReady = true;
