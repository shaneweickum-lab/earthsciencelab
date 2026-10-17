import { dayOf, seasonOf, timeOfDay } from "./clock";
import { DIRS, facingTile, isWalkable, todayWeather } from "./engine";
import { ITEMS } from "./items";
import { W } from "./map";
import type { Dir, WorldState } from "./types";

/** One stop in an NPC's day: from `hour` on, they stand here (or are indoors). */
interface Stop {
  hour: number;
  x: number;
  y: number;
  facing: Dir;
  /** Indoors: not visible and can't be talked to. */
  inside?: boolean;
  /** What they're doing, shown when you talk to them. */
  doing: string;
}

export interface Npc {
  id: string;
  name: string;
  /** Name for tags and quest lists. */
  short: string;
  role: string;
  /** Character model (Kenney Mini Characters for now). */
  avatar: string;
  /** Draw a little smaller (kids). */
  scale?: number;
  schedule: Stop[];
  greeting: string;
  /** Things they say, by friendship: 0–3 hearts, 4–7, 8–10. Some mention the season or weather. */
  lines: [string[], string[], string[]];
  loves: string[];
  likes: string[];
  dislikes: string[];
  /** Little stories they share once you're close enough friends. */
  stories: { hearts: number; text: string }[];
}

export const NPCS: Npc[] = [
  {
    id: "mei", short: "Mei", name: "Mei Tanaka", role: "Shopkeeper, Seed & Soil Co.", avatar: "female-d",
    schedule: [
      { hour: 7, x: 44, y: 10, facing: "down", doing: "opening the shop" },
      { hour: 12, x: 54, y: 18, facing: "up", doing: "eating lunch by the fountain" },
      { hour: 13, x: 44, y: 10, facing: "down", doing: "minding the shop" },
      { hour: 18, x: 57, y: 17, facing: "left", doing: "chatting in the square" },
      { hour: 21, x: 44, y: 10, facing: "down", inside: true, doing: "closed for the night" },
    ],
    greeting: "Welcome to town! I'm Mei. I run Seed & Soil Co. If it grows, I probably sell the seeds for it.",
    lines: [
      ["Organic produce always sells better. People can taste the difference.", "Buy seeds for the season you're in. A tomato won't sprout in the snow!", "Business is slow on rainy days. Good for your crops, though."],
      ["You're becoming one of my best suppliers!", "I saved you the good seed packets. The ones from last year's best plants.", "My grandmother said: feed the soil, not the plant."],
      ["Honestly, the town feels more alive since you moved in.", "I'm thinking of adding a whole shelf just for your harvest.", "You're not just a customer anymore. You're a friend."],
    ],
    loves: ["crop_tomato", "honey"], likes: ["crop_carrot", "crop_squash", "crop_corn", "crop_beans", "crop_potato"], dislikes: ["stone", "fiber"],
    stories: [
      { hearts: 3, text: "Can I tell you something? I almost closed the shop last year. Nobody was farming anymore. Then you showed up." },
      { hearts: 6, text: "My grandmother started this shop with one shelf of seeds she saved herself. I still keep her seed jars in the back. Want to see them sometime?" },
      { hearts: 9, text: "I've decided: the best produce shelf gets a sign with your farm's name on it. Don't argue!" },
    ],
  },
  {
    id: "amara", short: "Dr. Okafor", name: "Dr. Amara Okafor", role: "Soil scientist, County Extension Office", avatar: "female-a",
    schedule: [
      { hour: 8, x: 51, y: 10, facing: "down", doing: "reading soil test reports" },
      { hour: 11, x: 65, y: 21, facing: "down", doing: "checking on the community garden" },
      { hour: 14, x: 51, y: 10, facing: "down", doing: "running samples in the lab" },
      { hour: 17, x: 56, y: 14, facing: "down", doing: "taking an evening walk" },
      { hour: 19, x: 51, y: 10, facing: "down", inside: true, doing: "home for the night" },
    ],
    greeting: "Hello! I'm Dr. Okafor, the county soil scientist. Bring me your questions. And your dirt!",
    lines: [
      ["A teaspoon of healthy soil can hold more living things than there are people on Earth.", "Test before you treat. Lime only helps if your soil is actually acidic.", "Organic matter is like a sponge. More of it means your soil holds more water."],
      ["Your soil tests are getting better. I can see it in the numbers!", "Fungi threads can stretch for miles underground, connecting plant roots.", "Every time you till, you break the soil's crumbs. Try to till only what you plant."],
      ["You think like a scientist now. Observe, test, then act.", "I'd like to write up your farm as a case study, if you don't mind.", "When I started, the community garden was the best soil in the county. You could make it that way again."],
    ],
    loves: ["compost", "crop_carrot", "biochar"], likes: ["crop_beans", "crop_wheat", "labKit", "crop_potato"], dislikes: ["synthFert"],
    stories: [
      { hearts: 3, text: "I grew up on a farm where the topsoil had blown away. That's why I became a soil scientist: so no one else loses their land that way." },
      { hearts: 6, text: "Do you know what I love most about soil? It's the most alive place on Earth, and almost nobody looks at it." },
      { hearts: 9, text: "I'm presenting your farm's soil data at the state conference. You're turning worn-out ground into living soil. People need to see that it's possible." },
    ],
  },
  {
    id: "june", short: "June", name: "June Hale", role: "Beekeeper and naturalist", avatar: "female-c",
    schedule: [
      { hour: 6, x: 63, y: 10, facing: "down", doing: "checking the hives" },
      { hour: 9, x: 59, y: 18, facing: "right", doing: "watching butterflies in the flowers" },
      { hour: 13, x: 69, y: 23, facing: "left", doing: "tending the garden beehive" },
      { hour: 16, x: 63, y: 10, facing: "down", doing: "jarring honey" },
      { hour: 20, x: 63, y: 10, facing: "down", inside: true, doing: "asleep early. Bees start at dawn!" },
    ],
    greeting: "Oh, hello! Careful, the bees are busy. I'm June. If it buzzes, flutters, or crawls, I can tell you its name.",
    lines: [
      ["A honeybee visits about a hundred flowers on one trip.", "Plant some flowers near your crops. The bees will thank you with better harvests.", "Ladybugs eat aphids by the dozen. Never spray them!"],
      ["Have you filled in your Nature Journal? I'd love to see it.", "Clover is a bee's favorite snack. And it feeds the soil too!", "Fog brings out the mushrooms. Just look, never eat, unless an expert says so."],
      ["You notice things now. The little things. That's the whole secret.", "My bees forage on your farm, you know. Your honey is partly mine!", "I'm glad someone young is caring for this land."],
    ],
    loves: ["honey", "crop_sunflower", "seed_clover"], likes: ["crop_buckwheat", "crop_carrot", "kit_flowerBed"], dislikes: ["synthFert", "stone"],
    stories: [
      { hearts: 3, text: "My first hive swarmed away. I cried for a week, then I read every bee book in the library. Mistakes are just lessons with stings attached." },
      { hearts: 6, text: "Some evenings I just sit and listen to the hives. Thousands of bees, all humming together. It sounds like the whole valley breathing." },
      { hearts: 9, text: "I've been keeping a journal of every creature on this land for forty years. When I'm too old for it, I'd like you to have it." },
    ],
  },
  {
    id: "luis", short: "Luis", name: "Luis Ortega", role: "Neighbor farmer", avatar: "male-a",
    schedule: [
      { hour: 6, x: 51, y: 26, facing: "up", doing: "working his corn field" },
      { hour: 12, x: 46, y: 13, facing: "right", doing: "taking a lunch break" },
      { hour: 13, x: 51, y: 26, facing: "up", doing: "pulling weeds" },
      { hour: 18, x: 46, y: 26, facing: "down", doing: "resting on the porch" },
      { hour: 21, x: 46, y: 26, facing: "down", inside: true, doing: "inside with the family" },
    ],
    greeting: "So you're the new farmer! Luis Ortega. My family's been growing corn here for three generations.",
    lines: [
      ["Corn, beans, and squash grow great together. The 'Three Sisters,' my abuela called them.", "Watch the forecast. One frost can wipe out a whole field of beans.", "Rotate your crops. Same crop, same spot, same pests."],
      ["Your field is looking good, neighbor!", "I tried your no-till idea. Fewer weeds than I expected!", "Pip won't stop talking about your farm."],
      ["You're family now. Come for dinner anytime.", "Between your farm and mine, this valley is coming back to life.", "Abuela would've liked you."],
    ],
    loves: ["crop_corn", "crop_wheat"], likes: ["crop_beans", "crop_squash", "crop_potato", "wood"], dislikes: ["stone"],
    stories: [
      { hearts: 3, text: "When the dust storms came in my grandfather's time, they plowed everything bare. We lost half our soil. My abuela planted cover crops to bring it back." },
      { hearts: 6, text: "I used to think farming was just about yields. Watching your farm, I'm starting to think it's about the soil first." },
      { hearts: 9, text: "Pip wants to take over the farm someday. Because of you, I think there'll still be good soil left for them." },
    ],
  },
  {
    id: "pip", short: "Pip", name: "Pip Ortega", role: "Luis's kid, full of questions", avatar: "male-e", scale: 0.8,
    schedule: [
      { hour: 8, x: 54, y: 17, facing: "up", doing: "looking for frogs in the fountain" },
      { hour: 11, x: 36, y: 11, facing: "left", doing: "peeking at your farm" },
      { hour: 14, x: 60, y: 16, facing: "right", doing: "collecting rocks" },
      { hour: 17, x: 47, y: 24, facing: "left", doing: "doing homework on the steps" },
      { hour: 20, x: 46, y: 26, facing: "down", inside: true, doing: "in bed (supposedly)" },
    ],
    greeting: "Whoa, you're the new farmer?! I'm Pip! Do worms have eyes? Do YOU know?",
    lines: [
      ["Why is dirt brown? Is it rusty?", "If you cut a worm in half do you get two worms? (Dad says no.)", "I found a pill bug! It rolled into a ball! Is it a bug or a shrimp??"],
      ["I counted 7 worms in one shovel of dirt! Is that good?", "Why do leaves change color in fall? Where does the green go?", "Can I help on your farm someday?"],
      ["When I grow up I'm going to be a soil scientist like Dr. Okafor!", "You're the coolest grown-up I know. Don't tell Dad.", "I made you a rock. It's a good rock."],
    ],
    loves: ["stone", "honey", "crop_carrot"], likes: ["crop_tomato", "wood", "seed_sunflower"], dislikes: ["synthFert", "fiber"],
    stories: [
      { hearts: 3, text: "I made a list of every bug I've ever found. It has 47 bugs on it. Okay, 12 are the same pill bug. His name is Gerald." },
      { hearts: 6, text: "Dr. Okafor let me look at dirt under a microscope! There were tiny worms called nematodes! They were WIGGLING!" },
      { hearts: 9, text: "When I'm a soil scientist I'm going to name a microbe after you. A good one. Not a stinky one." },
    ],
  },
];

export const NPC_BY_ID: Record<string, Npc> = Object.fromEntries(NPCS.map((n) => [n.id, n]));

// ───────────────────────── where NPCs are ─────────────────────────

/** Game minutes per tile when walking. */
const WALK_MINUTES = 2;

const pathCache = new WeakMap<WorldState["buildings"], Map<string, [number, number][]>>();

/** Shortest walkable route between two tiles (breadth-first search). Falls back to a straight hop. */
export function route(state: WorldState, from: [number, number], to: [number, number]): [number, number][] {
  let cache = pathCache.get(state.buildings);
  if (!cache) pathCache.set(state.buildings, (cache = new Map()));
  const key = `${from}>${to}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const start = from[1] * W + from[0], goal = to[1] * W + to[0];
  const prev = new Map<number, number>([[start, -1]]);
  const queue = [start];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === goal) break;
    const cx = cur % W, cy = Math.floor(cur / W);
    for (const [dx, dy] of Object.values(DIRS)) {
      const nx = cx + dx, ny = cy + dy, n = ny * W + nx;
      if (prev.has(n) || !(n === goal || isWalkable(state, nx, ny))) continue;
      prev.set(n, cur);
      queue.push(n);
    }
  }
  const path: [number, number][] = [];
  if (prev.has(goal)) for (let c = goal; c !== -1; c = prev.get(c)!) path.unshift([c % W, Math.floor(c / W)]);
  const result = path.length ? path : [from, to];
  cache.set(key, result);
  return result;
}

export interface NpcPose {
  x: number;
  y: number;
  facing: Dir;
  moving: boolean;
  visible: boolean;
  doing: string;
}

function stopAt(npc: Npc, hour: number): { stop: Stop; prev: Stop } {
  const s = npc.schedule;
  let i = s.length - 1;
  for (let k = 0; k < s.length; k++) if (hour >= s[k].hour) i = k;
  if (hour < s[0].hour) i = s.length - 1;
  return { stop: s[i], prev: s[(i - 1 + s.length) % s.length] };
}

/** Where an NPC is at a moment (game minute, fractions allowed), walking between stops along real paths. */
export function npcPose(state: WorldState, npc: Npc, minute: number): NpcPose {
  const tod = timeOfDay(minute);
  const hour = (tod / 60) % 24;
  const { stop, prev } = stopAt(npc, Math.floor(hour));
  const since = ((tod - stop.hour * 60) % 1440 + 1440) % 1440;
  if (stop.inside && since > 0) return { x: stop.x, y: stop.y, facing: stop.facing, moving: false, visible: false, doing: stop.doing };
  const path = prev.inside && !stop.inside ? [[stop.x, stop.y] as [number, number]] : route(state, [prev.x, prev.y], [stop.x, stop.y]);
  const steps = path.length - 1;
  const t = since / WALK_MINUTES;
  if (t >= steps) return { x: stop.x, y: stop.y, facing: stop.facing, moving: false, visible: !stop.inside, doing: stop.doing };
  const i = Math.floor(t), f = t - i;
  const [ax, ay] = path[i], [bx, by] = path[i + 1];
  const facing: Dir = bx > ax ? "right" : bx < ax ? "left" : by > ay ? "down" : "up";
  return { x: ax + (bx - ax) * f, y: ay + (by - ay) * f, facing, moving: true, visible: true, doing: `walking (${stop.doing} next)` };
}

/** The NPC standing on the tile you're facing, if any. */
export function npcInFront(state: WorldState): Npc | null {
  if (state.mine) return null;
  const f = facingTile(state);
  for (const npc of NPCS) {
    const p = npcPose(state, npc, state.minute);
    if (p.visible && Math.abs(p.x - f.x) < 0.75 && Math.abs(p.y - f.y) < 0.75) return npc;
  }
  return null;
}

// ───────────────────────── friendship ─────────────────────────

export const POINTS_PER_HEART = 100;
export const MAX_HEARTS = 10;

export interface Friendship {
  points: number;
  /** Heart levels whose story has been told. */
  stories?: number[];
  /** Day of the last chat and gift (one each per day). */
  talked?: number;
  gifted?: number;
  met?: boolean;
}

export function friendship(state: WorldState, id: string): Friendship {
  return state.friends?.[id] ?? { points: 0 };
}

export function hearts(state: WorldState, id: string): number {
  return Math.min(MAX_HEARTS, Math.floor(friendship(state, id).points / POINTS_PER_HEART));
}

function setFriend(state: WorldState, id: string, f: Friendship): WorldState {
  return { ...state, friends: { ...(state.friends ?? {}), [id]: { ...f, points: Math.max(0, Math.min(MAX_HEARTS * POINTS_PER_HEART, f.points)) } } };
}

/** Today's line from an NPC. The first chat each day raises friendship. */
export function talk(state: WorldState, id: string): { state: WorldState; text: string } {
  const npc = NPC_BY_ID[id];
  const f = friendship(state, id);
  const d = dayOf(state.minute);
  if (!f.met) return { state: setFriend(state, id, { ...f, met: true, talked: d, points: f.points + 20 }), text: npc.greeting };
  const h = hearts(state, id);
  const story = npc.stories.find((st) => st.hearts <= h && !(f.stories ?? []).includes(st.hearts));
  if (story) {
    const told = { ...f, stories: [...(f.stories ?? []), story.hearts], talked: d, points: f.points + (f.talked === d ? 0 : 20) };
    return { state: setFriend(state, id, told), text: story.text };
  }
  const tier = h >= 8 ? 2 : h >= 4 ? 1 : 0;
  const pool = [...npc.lines[tier], ...seasonalLines(state)];
  const text = pool[(d * 7 + id.length) % pool.length];
  if (f.talked === d) return { state, text };
  return { state: setFriend(state, id, { ...f, talked: d, points: f.points + 20 }), text };
}

function seasonalLines(state: WorldState): string[] {
  const w = todayWeather(state);
  const season = seasonOf(dayOf(state.minute), state.settings);
  const out: string[] = [];
  if (w === "rain" || w === "storm") out.push("At least the rain is watering everyone's gardens for free.");
  if (w === "snow") out.push("Snow! The soil sleeps under it like a blanket.");
  if (w === "frost") out.push("Frost this morning. Hope your tender crops were covered!");
  if (w === "heat") out.push("Too hot! Mulch your beds or they'll bake.");
  if (state.settings.seasons && season === "Fall") out.push("I love fall. Everything turns gold.");
  return out;
}

export type GiftReaction = "love" | "like" | "neutral" | "dislike";

export function giftReaction(npc: Npc, itemId: string): GiftReaction {
  if (npc.loves.includes(itemId)) return "love";
  if (npc.likes.includes(itemId)) return "like";
  if (npc.dislikes.includes(itemId)) return "dislike";
  return "neutral";
}

const GIFT_POINTS: Record<GiftReaction, number> = { love: 80, like: 45, neutral: 20, dislike: -20 };
const GIFT_TEXT: Record<GiftReaction, string> = {
  love: "Oh! I love this! Thank you so much!",
  like: "How thoughtful. Thank you!",
  neutral: "Thanks, that's nice of you.",
  dislike: "Oh… um. Thanks, I guess.",
};

export function canGift(itemId: string): boolean {
  const kind = ITEMS[itemId]?.kind;
  return kind !== undefined && kind !== "tool";
}

/** Give the selected item. One gift per NPC per day. */
export function giveGift(state: WorldState, id: string): { state: WorldState; text: string } {
  const npc = NPC_BY_ID[id];
  const slot = state.inventory[state.selected];
  if (!slot || !canGift(slot.item)) return { state, text: "Pick an item in your hotbar to give as a gift." };
  const f = friendship(state, id);
  const d = dayOf(state.minute);
  if (f.gifted === d) return { state, text: "You already gave me something today. You're too kind!" };
  const reaction = giftReaction(npc, slot.item);
  const inv = [...state.inventory];
  inv[state.selected] = slot.qty > 1 ? { ...slot, qty: slot.qty - 1 } : null;
  const next = setFriend({ ...state, inventory: inv }, id, { ...f, met: true, gifted: d, points: f.points + GIFT_POINTS[reaction] });
  return { state: next, text: GIFT_TEXT[reaction] };
}
