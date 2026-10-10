export type PracticeId =
  | "weed"
  | "labTest"
  | "shovelTest"
  | "waterTest"
  | "coverCrop"
  | "compost"
  | "noTill"
  | "rotate"
  | "mulch"
  | "grazing"
  | "hedgerow"
  | "compostTea"
  | "biochar"
  | "plow"
  | "synthFert"
  | "pesticide";

export interface Practice {
  id: PracticeId;
  name: string;
  icon: string;
  cost: number;
  kind: "care" | "test" | "regenerative" | "conventional";
  /** One-line hint shown on the button. */
  short: string;
  /** What actually happens in the soil, shown in the details panel. */
  science: string;
  unlockSeason?: number;
  /** Effects that aren't a number, shown in the preview before you commit. */
  notes?: string[];
  /** False for practices that break organic certification. */
  organic?: boolean;
}

export const PRACTICES: Record<PracticeId, Practice> = {
  weed: {
    id: "weed", name: "Pull Weeds", icon: "🌿", cost: 0, kind: "care",
    short: "Clear the weeds by hand.",
    science: "Weeds compete with your crops for water, light, and nutrients. Pulling them by hand is how organic gardeners keep beds clean without herbicides.",
    notes: ["Must be done before you can plant or improve this plot", "Weeds come back on bare soil each season unless it's covered"],
  },
  labTest: {
    id: "labTest", name: "Lab Soil Test", icon: "🧪", cost: 5, kind: "test",
    short: "Mail a soil sample to a lab.",
    science: "A soil lab measures the nutrients (nitrogen, phosphorus, potassium), the pH, and how much organic matter is in your soil.",
    notes: ["Reveals: nutrients (N-P-K), pH, and organic matter", "Doesn't change the soil"],
  },
  shovelTest: {
    id: "shovelTest", name: "Shovel Test", icon: "🪱", cost: 0, kind: "test",
    short: "Dig a hole, count worms, check the crumbs.",
    science: "Dig up a shovelful of soil. Count the earthworms and look at how it breaks apart. Healthy soil crumbles into rounded crumbs; poor soil comes out in hard clods.",
    notes: ["Reveals: soil life and soil structure", "Doesn't change the soil"],
  },
  waterTest: {
    id: "waterTest", name: "Infiltration Test", icon: "💧", cost: 0, kind: "test",
    short: "Time how fast water soaks in.",
    science: "Push a ring into the ground, pour in water, and time how long it takes to soak in. Fast, steady soaking means good pores and good water holding.",
    notes: ["Reveals: how well the soil holds water", "Doesn't change the soil"],
  },
  coverCrop: {
    id: "coverCrop", name: "Cover Crop", icon: "🌱", cost: 14, kind: "regenerative",
    short: "Plant clover and rye to cover the ground.",
    science: "Roots feed soil microbes and hold soil in place. Clover is a legume that pulls nitrogen from the air into the soil.",
    notes: ["Covers the soil: protects it from erosion", "Keeps weeds from coming back", "Lets you graze animals here this season"],
  },
  compost: {
    id: "compost", name: "Compost", icon: "🍂", cost: 22, kind: "regenerative",
    short: "Spread rotted food and plant scraps.",
    science: "Adds organic matter and a huge crowd of living microbes. Nutrients are released slowly as it breaks down.",
  },
  noTill: {
    id: "noTill", name: "Go No-Till", icon: "🚫", cost: 10, kind: "regenerative",
    short: "Stop plowing this plot for good.",
    science: "Without plowing, fungal threads and worm tunnels stay intact, so soil structure rebuilds each season. Yields dip a little at first.",
    notes: ["Permanent: keeps building structure and soil life every season", "Harvest dips a little for the first 2 seasons"],
  },
  rotate: {
    id: "rotate", name: "Rotate Crop", icon: "🔄", cost: 4, kind: "regenerative",
    short: "Grow a different crop than last time.",
    science: "Changing crops breaks pest cycles and different roots feed different microbes.",
    notes: ["Helps protect this plot from pests"],
  },
  mulch: {
    id: "mulch", name: "Mulch", icon: "🌾", cost: 8, kind: "regenerative",
    short: "Lay straw over the soil like a blanket.",
    science: "Mulch shields soil from pounding rain and hot sun, keeps moisture in, and slowly becomes organic matter.",
    notes: ["Covers the soil: protects it from erosion", "Keeps weeds from coming back"],
  },
  grazing: {
    id: "grazing", name: "Graze Animals", icon: "🐄", cost: 0, kind: "regenerative",
    short: "Move cattle across the cover crop briefly. Needs a cover crop.",
    science: "Short grazing turns cover crops into manure and trampled mulch, then animals move on so plants regrow. Earns a little money too.",
    notes: ["Earns 6 coins from the animals"],
  },
  hedgerow: {
    id: "hedgerow", name: "Hedgerow", icon: "🌳", cost: 25, kind: "regenerative",
    short: "Plant shrubs on the edge. Permanent.",
    science: "Hedgerows block wind and runoff and give homes to ladybugs and birds that eat pests. Neighboring plots benefit too.",
    notes: ["Permanent", "Also protects the neighboring plots from pests and erosion"],
  },
  compostTea: {
    id: "compostTea", name: "Compost Tea", icon: "🫖", cost: 5, kind: "regenerative",
    short: "Spray a brew full of microbes.",
    science: "A quick boost of bacteria and fungi. It helps soil life but doesn't add much organic matter.",
  },
  biochar: {
    id: "biochar", name: "Biochar", icon: "⚫", cost: 30, kind: "regenerative", unlockSeason: 5,
    short: "Mix in charcoal made from plant waste. Permanent.",
    science: "Biochar is full of tiny pores that hold water and nutrients and give microbes a place to live, for hundreds of years.",
    notes: ["Permanent: keeps holding water and nutrients"],
  },
  plow: {
    id: "plow", name: "Plow", icon: "🚜", cost: 6, kind: "conventional",
    short: "Turn the soil over. Quick yield boost.",
    science: "Plowing kills weeds and releases a burst of nutrients, but it breaks up soil structure, burns off organic matter, and leaves soil bare.",
    notes: ["Leaves the soil bare, so storms can wash it away", "Ends no-till on this plot"],
  },
  synthFert: {
    id: "synthFert", name: "Synthetic Fertilizer", icon: "⚗️", cost: 12, kind: "conventional",
    short: "Big nutrient boost right now.",
    science: "Feeds the crop fast, but extra nitrogen washes away, the soil gets more acidic, and microbes have less reason to help plants.",
    notes: ["Not organic: your garden loses its organic certification and every harvest loses the 25% organic bonus"],
    organic: false,
  },
  pesticide: {
    id: "pesticide", name: "Pesticide", icon: "☠️", cost: 10, kind: "conventional",
    short: "Protects from pests this season.",
    science: "Kills pests, but also many helpful insects, worms, and microbes.",
    notes: ["Not organic: your garden loses its organic certification and every harvest loses the 25% organic bonus", "Protects this plot from pests this season"],
    organic: false,
  },
};

export const PRACTICE_ORDER: PracticeId[] = [
  "weed", "labTest", "shovelTest", "waterTest",
  "coverCrop", "compost", "noTill", "rotate", "mulch", "grazing", "hedgerow", "compostTea", "biochar",
  "plow", "synthFert", "pesticide",
];
