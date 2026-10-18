import { nextRandom } from "@/game/rng";
import type { CropId } from "@/game/crops";
import { dayOf, seasonOf } from "./clock";
import { addItem, grantPlots, LESSONS, say } from "./engine";
import { GRADES } from "./grades";
import { ITEMS, sellPrice, WORLD_CROPS } from "./items";
import { FARM_W, TOWN, W } from "./map";
import { friendship, hearts, NPC_BY_ID, NPCS, POINTS_PER_HEART } from "./town";
import type { Grade, WorldState } from "./types";

/** What a quest asks for. Progress is read from the world, so it updates as you play. */
export type Goal =
  | { kind: "deliver"; items: { item: string; qty: number; minGrade?: Grade }[] }
  | { kind: "meetAll" }
  | { kind: "testSpots"; count: number }
  | { kind: "raisePh"; to: number }
  | { kind: "discover"; entry: string }
  | { kind: "gardenCleared"; percent: number }
  | { kind: "gardenPlanted"; crop: CropId; count: number }
  | { kind: "farmPlanted"; count: number }
  | { kind: "fedSpots"; count: number }
  | { kind: "wetSpots"; count: number }
  | { kind: "have"; item: string; qty: number }
  | { kind: "tally"; key: string; count: number };

export interface Reward {
  coins?: number;
  items?: { item: string; qty: number }[];
  /** Friendship points with the giver (100 = one heart). */
  friendship?: number;
  /** Friendship points with everyone in town. */
  everyone?: number;
  /** Farm plots unlocked for free. */
  plots?: number;
}

export interface QuestDef {
  id: string;
  giver: string;
  title: string;
  /** What the giver says when offering it. */
  ask: string;
  /** What they say when you finish. */
  thanks: string;
  /** Steps, done in order (most quests have one). */
  steps: { goal: Goal; label: string }[];
  reward: Reward;
  /** Hearts needed with the giver, and quests that must be done first. */
  needs?: { hearts?: number; quests?: string[] };
  /** Community projects change the town when finished. */
  project?: boolean;
  /** Lessons: a tip on how to do it (which keys, where to go). */
  hint?: string;
}

/** Grandma Rosa's lessons: notes she left, each teaching one thing and handing over the next tool. */
const lesson = (n: number, title: string, ask: string, hint: string, goal: Goal, label: string, thanks: string, reward: Reward): QuestDef => ({
  id: LESSONS[n - 1], giver: "rosa", title, ask, hint, thanks, steps: [{ goal, label }], reward,
});

export const TUTORIAL: QuestDef[] = [
  lesson(1, "Grandma's chest",
    "Welcome home, sweetheart. My old scythe is in the chest beside the front door. Walk over to it, face it, and open it.",
    "Walk with WASD or the arrow keys. Face the chest by the front door and press E, then click the scythe to take it.",
    { kind: "have", item: "scythe", qty: 1 }, "Take the scythe from the chest",
    "There it is! That scythe has cleared a lot of weeds in its day.", {}),
  lesson(2, "Clear the weeds",
    "Weeds steal water and food from your crops. Pick the scythe in your hotbar, face a weedy spot in your plot, and cut it down.",
    "Press the number key of the scythe's slot, then Space on a weed. Your plot is the open patch by the house; fenced plots aren't yours yet.",
    { kind: "tally", key: "weeds", count: 5 }, "Cut 5 weeds",
    "Look at that! Keep the fiber; it's good for compost and rope. Here's my hoe.", { items: [{ item: "hoe", qty: 1 }] }),
  lesson(3, "Break ground",
    "Roots need loose soil to grow. Use the hoe on bare, cleared ground to till it.",
    "The hoe only works on bare soil in your plot. Clear stones and sticks first, and only till where you'll plant: tilling breaks up soil crumbs.",
    { kind: "tally", key: "tilled", count: 4 }, "Till 4 spots",
    "Lovely rows. Carrots don't mind a chilly spring night, so here are some seeds.", { items: [{ item: "seed_carrot", qty: 6 }] }),
  lesson(4, "Seeds in the soil",
    "Pick the carrot seeds and plant them on your tilled soil. The panel on the right always tells you what Space will do before you press it.",
    "One seed per tilled spot. Watch the panel: it says if a crop likes the season and the soil.",
    { kind: "farmPlanted", count: 4 }, "Plant 4 crops",
    "They're in! Now they'll be thirsty. Here's my watering can.", { items: [{ item: "can", qty: 1 }] }),
  lesson(5, "A drink for the roots",
    "Seeds need damp soil to sprout and grow. Water your carrots. When the can runs dry, fill it at the pond.",
    "Space waters the spot in front of you. To refill, face the pond and press Space. Damp means moisture 60 or more on the soil panel.",
    { kind: "wetSpots", count: 4 }, "Get 4 crops' soil damp",
    "Good and damp. Healthy soil grows healthy food, so here's some compost and garden lime.", { items: [{ item: "compost", qty: 3 }, { item: "lime", qty: 2 }] }),
  lesson(6, "Feed the soil",
    "Compost adds organic matter that feeds the tiny life in your soil. Lime makes sour soil sweeter. Spread one of them on 2 spots in your garden.",
    "Pick compost or lime and press Space on a garden spot. Until you've tested the soil, compost is the safe choice.",
    { kind: "fedSpots", count: 2 }, "Spread compost or lime on 2 spots",
    "Your soil thanks you. Now for some firewood: here's my axe.", { items: [{ item: "axe", qty: 1 }] }),
  lesson(7, "Timber!",
    "Sticks, logs, and stumps are scattered all over the farm. Chop them with the axe for wood. Big ones take a few swings.",
    "Keep pressing Space on the same log; the panel shows how many swings are left. A felled tree grows back from its stump.",
    { kind: "have", item: "wood", qty: 5 }, "Have 5 wood",
    "That'll keep the stove going. Stones next: here's my pickaxe.", { items: [{ item: "pickaxe", qty: 1 }] }),
  lesson(8, "Rock solid",
    "Stones get in the way of your crops. Break them with the pickaxe, and keep the stone for building later.",
    "Every swing uses energy (the yellow bar). When you're worn out, it's time for bed.",
    { kind: "have", item: "stone", qty: 5 }, "Have 5 stone",
    "Strong work! Here's a little pocket money.", { coins: 50 }),
  lesson(9, "Sleep on it",
    "Your crops grow overnight, and a night's sleep refills your energy. Go into the farmhouse and go to bed. The farm saves itself when you sleep.",
    "Press E at the farmhouse door and choose Go to bed. Night falls in the evening; be in bed by 2 AM or you'll wake up tired.",
    { kind: "tally", key: "slept", count: 1 }, "Sleep in the farmhouse",
    "Good morning! Your carrots grew a little overnight. Here are more seeds to fill out your plot.", { items: [{ item: "seed_carrot", qty: 6 }] }),
  lesson(10, "Market day",
    "A farm runs on selling what it grows. Put something in the shipping bin by the house and you're paid overnight, or sell it at Seed & Soil Co. in town. Your fiber or wood will do.",
    "Press E at the shipping bin and click what to ship. Organic crops sell for more, so go easy on synthetic fertilizer.",
    { kind: "tally", key: "sold", count: 1 }, "Sell or ship something",
    "That's my grandchild! You know the basics now. The folks in town have been asking about you: go say hello, and check the notice board. Love, Grandma Rosa.", { coins: 100 }),
];

export const QUESTS: QuestDef[] = [
  // The science tools: each quest unlocks one in the store and pays for it.
  {
    id: "dig-deeper", giver: "luis", title: "Dig a little deeper",
    ask: "Grandma Rosa's tools still work? Good. Get some seeds in the ground: plant 6 crops on your farm, then come tell me.",
    thanks: "Nice rows! But the real action is under the plants. Mei just got shovels in. Dig a test hole and look for worms and soil crumbs. This should cover one.",
    steps: [{ goal: { kind: "farmPlanted", count: 6 }, label: "Plant 6 crops on your farm" }],
    reward: { coins: 60, friendship: 40, plots: 1 },
  },
  {
    id: "feed-the-soil", giver: "amara", title: "Feed the soil",
    ask: "Healthy soil grows healthy food. Spread compost or lime on 3 garden spots. You'll find some in your grandmother's chest.",
    thanks: "Good. Now, what did that actually change? A lab test tells you. Mei stocks the kits now, and this will pay for three.",
    steps: [{ goal: { kind: "fedSpots", count: 3 }, label: "Spread compost or lime on 3 garden spots" }],
    reward: { coins: 36, friendship: 40 },
  },
  {
    id: "soak-it-up", giver: "june", title: "Soak it up",
    ask: "Some days my garden drowns and some days it's dust. Water 6 of your crops until the soil is good and damp. Rain counts too!",
    thanks: "Some soil drinks water fast, and some lets it run right off. An infiltration ring shows you which kind you have. Mei sells them now. Here, my treat.",
    steps: [{ goal: { kind: "wetSpots", count: 6 }, label: "Get 6 of your crops' soil damp (moisture 60+)" }],
    reward: { coins: 45, friendship: 40 },
    needs: { quests: ["dig-deeper"] },
  },
  {
    id: "welcome", giver: "mei", title: "Meet the neighbors",
    ask: "Have you met everyone yet? Say hi to all five of us. Small town, big hearts!",
    thanks: "Now you know everyone! Here's a little welcome gift from all of us.",
    steps: [{ goal: { kind: "meetAll" }, label: "Talk to everyone in town" }],
    reward: { coins: 100, items: [{ item: "seed_beans", qty: 4 }], everyone: 20 },
  },
  {
    id: "reopen-mine", giver: "luis", title: "The old mine",
    ask: "My grandfather dug copper and tin in the old mine past town. It's been boarded up for years. Bring me 20 wood for timbers and 10 stone, and we'll shore it up together.",
    thanks: "There! The tunnel's safe again. Watch for ladders hidden under the rocks; the deeper you go, the better the ore. And bring a good pickaxe.",
    steps: [{ goal: { kind: "deliver", items: [{ item: "wood", qty: 20 }, { item: "stone", qty: 10 }] }, label: "Bring Luis 20 wood and 10 stone" }],
    reward: { coins: 50, friendship: 60, plots: 1 },
    needs: { quests: ["dig-deeper"] },
  },
  {
    id: "room-to-grow", giver: "luis", title: "Room to grow",
    ask: "Your field's filling up! There's good land south of the woods that nobody's farmed in years. Bring me 30 wood for fence posts and 10 stone, and I'll help you claim it.",
    thanks: "There's a path through the trees now, and two plots down there are yours. That's rich bottomland, so treat it well.",
    steps: [{ goal: { kind: "deliver", items: [{ item: "wood", qty: 30 }, { item: "stone", qty: 10 }] }, label: "Bring Luis 30 wood and 10 stone" }],
    reward: { friendship: 80, plots: 2 },
    needs: { hearts: 2, quests: ["first-carrots"] },
  },
  {
    id: "first-carrots", giver: "luis", title: "A neighborly trade",
    ask: "My carrot patch got eaten by rabbits. Could you spare 5 carrots? I'll make it worth your while.",
    thanks: "Gracias! These look great. Take some seeds from my stash.",
    steps: [{ goal: { kind: "deliver", items: [{ item: "crop_carrot", qty: 5 }] }, label: "Bring Luis 5 carrots" }],
    reward: { coins: 120, items: [{ item: "seed_corn", qty: 4 }], friendship: 60 },
  },
  {
    id: "soil-check", giver: "amara", title: "Know your soil",
    ask: "Before you change your soil, measure it. Run all three tests (lab kit, shovel, and infiltration ring) on 3 garden spots.",
    thanks: "Excellent data! Now you can see what your soil needs instead of guessing. That's science.",
    steps: [{ goal: { kind: "testSpots", count: 3 }, label: "Fully test 3 garden spots" }],
    reward: { coins: 100, items: [{ item: "labKit", qty: 3 }], friendship: 60 },
    needs: { quests: ["dig-deeper", "feed-the-soil", "soak-it-up"] },
  },
  {
    id: "sour-soil", giver: "amara", title: "Sweeten sour soil",
    ask: "Most of the soil around here is a little acidic. Bring one tested spot up to pH 6.2 or higher. Lime does it, and compost helps too.",
    thanks: "pH 6.2! Now phosphorus and other nutrients can actually reach the roots.",
    steps: [{ goal: { kind: "raisePh", to: 6.2 }, label: "Raise a tested spot to pH 6.2+" }],
    reward: { coins: 150, items: [{ item: "lime", qty: 2 }], friendship: 60 },
    needs: { quests: ["soil-check"] },
  },
  {
    id: "ladybug", giver: "june", title: "Little red helpers",
    ask: "Have you seen a lady beetle on your farm yet? They're the best pest control there is. Find one for your Nature Journal.",
    thanks: "Isn't she lovely? Here, a bug hotel, so more of them move in.",
    steps: [{ goal: { kind: "discover", entry: "ladybug" }, label: "Find a lady beetle" }],
    reward: { items: [{ item: "kit_bugHotel", qty: 1 }], friendship: 60 },
  },
  {
    id: "pip-worms", giver: "pip", title: "Worm detective",
    ask: "Dad says worms mean good dirt. Can you find one with your shovel? Do a shovel test!",
    thanks: "A WORM! You found a worm! Okay this rock is for you. It's my second-best rock.",
    steps: [{ goal: { kind: "discover", entry: "earthworm" }, label: "Find an earthworm with a shovel test" }],
    reward: { coins: 50, items: [{ item: "stone", qty: 1 }], friendship: 80 },
    needs: { quests: ["dig-deeper"] },
  },
  {
    id: "pip-rainbow", giver: "pip", title: "Chasing rainbows",
    ask: "I want to see a rainbow! When do they happen? Tell me when you see one!",
    thanks: "Sun behind you, rain in front! I'm going to stand in the right spot next time.",
    steps: [{ goal: { kind: "discover", entry: "rainbow" }, label: "See a rainbow" }],
    reward: { coins: 80, friendship: 80 },
    needs: { hearts: 2 },
  },
  {
    id: "sunflowers", giver: "june", title: "Food for the bees",
    ask: "My bees need more flowers. Could you grow sunflowers and bring me 3? I'll share something special.",
    thanks: "Look at those faces! My bees will be so happy. Take this hive: you've earned it.",
    steps: [{ goal: { kind: "deliver", items: [{ item: "crop_sunflower", qty: 3 }] }, label: "Bring June 3 sunflowers" }],
    reward: { items: [{ item: "kit_beehive", qty: 1 }], friendship: 80 },
    needs: { hearts: 2, quests: ["ladybug"] },
  },
  {
    id: "three-sisters", giver: "luis", title: "The Three Sisters",
    ask: "My abuela grew corn, beans, and squash together. The corn holds up the beans, the beans feed the soil, and the squash shades out weeds. Bring me 3 of each, grade C or better, and I'll show you her recipe.",
    thanks: "Just like Abuela's garden. You understand this land now.",
    steps: [{ goal: { kind: "deliver", items: [{ item: "crop_corn", qty: 3, minGrade: "C" }, { item: "crop_beans", qty: 3, minGrade: "C" }, { item: "crop_squash", qty: 3, minGrade: "C" }] }, label: "Bring 3 corn, 3 beans, and 3 squash (grade C+)" }],
    reward: { coins: 350, friendship: 120, plots: 1 },
    needs: { hearts: 3, quests: ["first-carrots"] },
  },
  {
    id: "best-tomato", giver: "mei", title: "The perfect tomato",
    ask: "A customer wants the best tomato in the county. Grade A or better. Think your soil is up to it?",
    thanks: "That's a beauty! Healthy soil really does grow better food.",
    steps: [{ goal: { kind: "deliver", items: [{ item: "crop_tomato", qty: 1, minGrade: "A" }] }, label: "Bring Mei a grade A tomato" }],
    reward: { coins: 400, friendship: 100 },
    needs: { hearts: 3 },
  },
  {
    id: "community-garden", giver: "amara", title: "Restore the community garden", project: true,
    ask: "The community garden behind the square used to be the best soil in the county. Help me bring it back? Clear it, feed it, and plant a cover crop to heal it.",
    thanks: "Look at it! Living soil again. The whole town owes you one, and the garden is yours to farm too.",
    steps: [
      { goal: { kind: "gardenCleared", percent: 80 }, label: "Clear weeds, sticks, and stones from the community garden" },
      { goal: { kind: "deliver", items: [{ item: "compost", qty: 6 }] }, label: "Bring Dr. Okafor 6 compost for the garden" },
      { goal: { kind: "gardenPlanted", crop: "clover", count: 6 }, label: "Plant clover on 6 community garden spots" },
    ],
    reward: { coins: 500, everyone: 100, items: [{ item: "kit_composter", qty: 1 }], plots: 2 },
    needs: { quests: ["soil-check"] },
  },
];

export const QUEST_BY_ID: Record<string, QuestDef> = Object.fromEntries([...QUESTS, ...TUTORIAL].map((q) => [q.id, q]));

export interface ActiveQuest {
  id: string;
  accepted: number;
  /** Index of the current step. */
  step: number;
  /** Notice-board requests carry their own goal and reward. */
  board?: { title: string; giver: string; npc: string; goal: Goal; reward: Reward; expires: number };
}

export interface QuestState {
  active: ActiveQuest[];
  done: string[];
}

export const questState = (s: WorldState): QuestState => s.quests ?? { active: [], done: [] };

function def(s: WorldState, a: ActiveQuest): { title: string; giver: string; steps: QuestDef["steps"]; reward: Reward } {
  if (a.board) return { title: a.board.title, giver: a.board.giver, steps: [{ goal: a.board.goal, label: goalLabel(a.board.goal) }], reward: a.board.reward };
  return QUEST_BY_ID[a.id];
}

// ───────────────────────── progress ─────────────────────────

const gradeAtLeast = (g: Grade | undefined, min?: Grade) => !min || GRADES.indexOf(g ?? "C") >= GRADES.indexOf(min);

function countAtGrade(s: WorldState, item: string, min?: Grade) {
  return s.inventory.reduce((n, x) => n + (x && x.item === item && gradeAtLeast(x.grade, min) ? x.qty : 0), 0);
}

/** Your own garden soil: the farm field and greenhouse beds. */
const ownGarden = (s: WorldState) => s.tiles.filter((t, i) => i % W < FARM_W && (t.ground === "farm" || t.greenhouse));

function gardenTiles(s: WorldState) {
  const g = TOWN.garden;
  const out = [];
  for (let y = g.y0; y <= g.y1; y++) for (let x = g.x0; x <= g.x1; x++) out.push(s.tiles[y * W + x]);
  return out;
}

export interface Progress {
  have: number;
  need: number;
  done: boolean;
}

export function goalProgress(s: WorldState, goal: Goal): Progress {
  const p = (have: number, need: number): Progress => ({ have: Math.min(have, need), need, done: have >= need });
  switch (goal.kind) {
    case "deliver": {
      const need = goal.items.reduce((n, i) => n + i.qty, 0);
      const have = goal.items.reduce((n, i) => n + Math.min(i.qty, countAtGrade(s, i.item, i.minGrade)), 0);
      return p(have, need);
    }
    case "meetAll":
      return p(NPCS.filter((n) => friendship(s, n.id).met).length, NPCS.length);
    case "testSpots":
      return p(s.tiles.filter((t) => (t.ground === "farm" || t.greenhouse) && t.known.lab && t.known.shovel && t.known.water).length, goal.count);
    case "raisePh":
      return p(s.tiles.some((t) => t.ground === "farm" && t.known.lab && t.soil.ph >= goal.to) ? 1 : 0, 1);
    case "discover":
      return p(s.journal.includes(goal.entry) ? 1 : 0, 1);
    case "gardenCleared": {
      const tiles = gardenTiles(s);
      const clear = tiles.filter((t) => !t.weeds && !t.obstacle).length;
      return p(Math.round((clear / tiles.length) * 100), goal.percent);
    }
    case "gardenPlanted":
      return p(gardenTiles(s).filter((t) => t.crop?.id === goal.crop && !t.crop.dead).length, goal.count);
    case "farmPlanted":
      return p(ownGarden(s).filter((t) => t.crop && !t.crop.dead).length, goal.count);
    case "fedSpots":
      return p(ownGarden(s).filter((t) => (t.boost ?? 0) > 0).length, goal.count);
    case "wetSpots":
      return p(ownGarden(s).filter((t) => t.crop && !t.crop.dead && t.moisture >= 60).length, goal.count);
    case "have":
      return p(countAtGrade(s, goal.item), goal.qty);
    case "tally":
      return p(s.tally?.[goal.key] ?? 0, goal.count);
  }
}

const TALLY_LABEL: Record<string, string> = { weeds: "Cut weeds", tilled: "Till spots", slept: "Sleep", sold: "Sell or ship things" };

export function goalLabel(goal: Goal): string {
  switch (goal.kind) {
    case "deliver":
      return "Bring " + goal.items.map((i) => `${i.qty} ${ITEMS[i.item].name}${i.minGrade ? ` (grade ${i.minGrade}+)` : ""}`).join(", ");
    case "meetAll": return "Talk to everyone in town";
    case "testSpots": return `Fully test ${goal.count} garden spots`;
    case "raisePh": return `Raise a tested spot to pH ${goal.to}+`;
    case "discover": return `Find: ${goal.entry}`;
    case "gardenCleared": return `Clear ${goal.percent}% of the community garden`;
    case "gardenPlanted": return `Plant ${goal.crop} on ${goal.count} community garden spots`;
    case "farmPlanted": return `Plant ${goal.count} crops on your farm`;
    case "fedSpots": return `Spread compost or lime on ${goal.count} garden spots`;
    case "wetSpots": return `Get ${goal.count} of your crops' soil damp`;
    case "have": return `Have ${goal.qty} ${ITEMS[goal.item].name}`;
    case "tally": return `${TALLY_LABEL[goal.key] ?? goal.key} ×${goal.count}`;
  }
}

/** The active quest's current step and progress. */
export function questStatus(s: WorldState, a: ActiveQuest) {
  const d = def(s, a);
  const step = d.steps[Math.min(a.step, d.steps.length - 1)];
  const progress = goalProgress(s, step.goal);
  return { ...d, stepIndex: a.step, step, progress, last: a.step >= d.steps.length - 1 };
}

// ───────────────────────── offering, accepting, finishing ─────────────────────────

/** Story quests this NPC can offer right now. */
export function offers(s: WorldState, npcId: string): QuestDef[] {
  const qs = questState(s);
  // Townsfolk wait until Grandma Rosa's lessons are done.
  if (!tutorialDone(s)) return [];
  return QUESTS.filter((q) => q.giver === npcId
    && !qs.done.includes(q.id) && !qs.active.some((a) => a.id === q.id)
    && (q.needs?.hearts ?? 0) <= hearts(s, npcId)
    && (q.needs?.quests ?? []).every((id) => qs.done.includes(id)));
}

export function accept(s: WorldState, id: string, board?: ActiveQuest["board"]): WorldState {
  const qs = questState(s);
  if (qs.active.some((a) => a.id === id)) return s;
  return { ...s, quests: { ...qs, active: [...qs.active, { id, accepted: dayOf(s.minute), step: 0, board }] } };
}

/** Active quests you can turn in to this NPC (or at the board, for "board"). */
export function readyToTurnIn(s: WorldState, giver: string): ActiveQuest[] {
  return questState(s).active.filter((a) => questStatus(s, a).giver === giver && questStatus(s, a).progress.done);
}

function takeItems(s: WorldState, items: { item: string; qty: number; minGrade?: Grade }[]): WorldState {
  const inv = [...s.inventory];
  for (const want of items) {
    let left = want.qty;
    // Hand over the lowest grade that still qualifies, so you keep your best produce.
    const order = inv
      .map((x, i) => ({ x, i }))
      .filter(({ x }) => x && x.item === want.item && gradeAtLeast(x.grade, want.minGrade))
      .sort((a, b) => GRADES.indexOf(a.x!.grade ?? "C") - GRADES.indexOf(b.x!.grade ?? "C"));
    for (const { x, i } of order) {
      if (left <= 0) break;
      const take = Math.min(left, x!.qty);
      inv[i] = x!.qty - take > 0 ? { ...x!, qty: x!.qty - take } : null;
      left -= take;
    }
  }
  return { ...s, inventory: inv };
}

/** A reward that doesn't fit in your bag goes into Grandma's chest by the house. */
function toChest(s: WorldState, item: string, qty: number): WorldState {
  const chest = s.buildings.find((b) => b.id === "chest");
  if (!chest) return s;
  const items = [...(chest.data.items ?? [])];
  const at = items.findIndex((x) => x?.item === item && !x.grade && !ITEMS[item].tool);
  if (at >= 0) items[at] = { ...items[at]!, qty: items[at]!.qty + qty };
  else {
    const free = items.findIndex((x) => !x);
    if (free >= 0) items[free] = { item, qty };
    else items.push({ item, qty });
  }
  return { ...s, buildings: s.buildings.map((b) => (b === chest ? { ...b, data: { ...b.data, items } } : b)) };
}

function giveReward(s: WorldState, giver: string, r: Reward): WorldState {
  let next: WorldState = { ...s, coins: s.coins + (r.coins ?? 0) };
  if (r.plots) next = grantPlots(next, r.plots);
  for (const it of r.items ?? []) next = addItem(next, it.item, it.qty) ?? toChest(next, it.item, it.qty);
  const friends = { ...(next.friends ?? {}) };
  const bump = (id: string, pts: number) => {
    const f = friends[id] ?? { points: 0 };
    friends[id] = { ...f, points: Math.min(10 * POINTS_PER_HEART, f.points + pts) };
  };
  if (r.friendship && NPC_BY_ID[giver]) bump(giver, r.friendship);
  if (r.everyone) for (const n of NPCS) bump(n.id, r.everyone);
  return { ...next, friends };
}

export function rewardText(r: Reward): string {
  const parts: string[] = [];
  if (r.coins) parts.push(`🪙 ${r.coins}`);
  for (const it of r.items ?? []) parts.push(`${ITEMS[it.item].icon} ${it.qty} ${ITEMS[it.item].name}`);
  if (r.friendship) parts.push(`❤️ +${Math.round(r.friendship / POINTS_PER_HEART * 10) / 10} heart${r.friendship === POINTS_PER_HEART ? "" : "s"}`);
  if (r.everyone) parts.push("❤️ friendship with everyone");
  if (r.plots) parts.push(`🌱 ${r.plots} farm plot${r.plots > 1 ? "s" : ""}`);
  return parts.join(" · ");
}

/** Finish the current step (handing over items for deliveries). Completes the quest after its last step. */
export function turnIn(s: WorldState, id: string): { state: WorldState; finished: boolean; text: string } {
  const qs = questState(s);
  const a = qs.active.find((q) => q.id === id);
  if (!a) return { state: s, finished: false, text: "" };
  const st = questStatus(s, a);
  if (!st.progress.done) return { state: s, finished: false, text: "Not quite yet!" };
  let next = st.step.goal.kind === "deliver" ? takeItems(s, st.step.goal.items) : s;
  if (!st.last) {
    next = { ...next, quests: { ...qs, active: qs.active.map((q) => (q.id === id ? { ...q, step: q.step + 1 } : q)) } };
    return { state: next, finished: false, text: `Great, that's done! Next: ${st.steps[a.step + 1].label}.` };
  }
  next = giveReward(next, a.board ? a.board.npc : st.giver, st.reward);
  next = { ...next, quests: { active: qs.active.filter((q) => q.id !== id), done: [...qs.done, id] } };
  const thanks = a.board ? "Thanks! That's exactly what I needed." : QUEST_BY_ID[id].thanks;
  return { state: next, finished: true, text: thanks };
}

// ───────────────────────── notice board ─────────────────────────

/** Two delivery requests a day from townsfolk, for crops in season. Turn them in at the board. */
export function boardRequests(s: WorldState): { id: string; board: NonNullable<ActiveQuest["board"]> }[] {
  const day = dayOf(s.minute);
  let seed = (s.seed ^ Math.imul(day, 0x9e3779b1)) >>> 0;
  const rand = () => {
    const [v, n] = nextRandom(seed);
    seed = n;
    return v;
  };
  const season = seasonOf(day, s.settings);
  const crops = (Object.keys(WORLD_CROPS) as CropId[]).filter((c) => !WORLD_CROPS[c].cover && (!s.settings.seasons || WORLD_CROPS[c].seasons.includes(season)));
  const grades: (Grade | undefined)[] = [undefined, undefined, "D", "C", "B"];
  return [0, 1].map((n) => {
    const crop = crops[Math.floor(rand() * crops.length)];
    const npc = NPCS[Math.floor(rand() * NPCS.length)];
    const qty = 2 + Math.floor(rand() * 5);
    const minGrade = grades[Math.floor(rand() * grades.length)];
    const item = `crop_${crop}`;
    // Pays half again what the store would, plus a little friendship with whoever asked.
    const coins = Math.round(sellPrice(ITEMS[item], minGrade ?? "C", false) * qty * 1.5 + 20);
    return {
      id: `board-${day}-${n}`,
      board: {
        title: `${npc.short} needs ${ITEMS[item].name.toLowerCase()}`,
        giver: "board",
        npc: npc.id,
        goal: { kind: "deliver" as const, items: [{ item, qty, minGrade }] },
        reward: { coins, friendship: 30 },
        expires: day + 3,
      },
    };
  });
}

/** Drop notice-board requests that ran out of time. */
export function expireBoard(s: WorldState): WorldState {
  const qs = questState(s);
  const day = dayOf(s.minute);
  const active = qs.active.filter((a) => !a.board || a.board.expires >= day);
  return active.length === qs.active.length ? s : { ...s, quests: { ...qs, active } };
}

// ───────────────────────── Grandma Rosa's lessons ─────────────────────────

export const tutorialDone = (s: WorldState) => questState(s).done.includes(LESSONS[LESSONS.length - 1]);

/** The lesson you're on, with its progress, or null once they're done (or skipped). */
export function tutorialStep(s: WorldState) {
  const a = questState(s).active.find((q) => LESSONS.includes(q.id));
  if (!a) return null;
  const q = QUEST_BY_ID[a.id];
  return { ...questStatus(s, a), id: a.id, number: LESSONS.indexOf(a.id) + 1, of: LESSONS.length, ask: q.ask, hint: q.hint ?? "", rewardText: rewardText(q.reward) };
}

/** Claim a finished lesson's reward and open the next one. */
export function claimLesson(s: WorldState): WorldState {
  const step = tutorialStep(s);
  if (!step) return s;
  const r = turnIn(s, step.id);
  if (!r.finished) return s;
  const next = LESSONS[LESSONS.indexOf(step.id) + 1];
  return say(next ? accept(r.state, next) : r.state, r.text);
}

/** Skip the rest of the lessons: every reward still to come is handed over at once. */
export function skipTutorial(s: WorldState): WorldState {
  const qs = questState(s);
  const left = LESSONS.filter((id) => !qs.done.includes(id));
  if (!left.length) return s;
  let next = s;
  for (const id of left) next = giveReward(next, "rosa", QUEST_BY_ID[id].reward);
  next = { ...next, quests: { active: qs.active.filter((a) => !LESSONS.includes(a.id)), done: [...qs.done, ...left] } };
  return say(next, "Grandma's tools are all yours. The folks in town have been asking about you!");
}
