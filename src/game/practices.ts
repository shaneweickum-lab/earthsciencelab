export type PracticeId =
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
  kind: "regenerative" | "conventional";
  /** One-line hint shown on the button. */
  short: string;
  /** What actually happens in the soil, shown in the details panel. */
  science: string;
  unlockSeason?: number;
}

export const PRACTICES: Record<PracticeId, Practice> = {
  coverCrop: {
    id: "coverCrop", name: "Cover Crop", icon: "🌱", cost: 10, kind: "regenerative",
    short: "Plant clover and rye to cover the ground.",
    science: "Roots feed soil microbes and hold soil in place. Clover is a legume that pulls nitrogen from the air into the soil.",
  },
  compost: {
    id: "compost", name: "Compost", icon: "🍂", cost: 15, kind: "regenerative",
    short: "Spread rotted food and plant scraps.",
    science: "Adds organic matter and a huge crowd of living microbes. Nutrients are released slowly as it breaks down.",
  },
  noTill: {
    id: "noTill", name: "Go No-Till", icon: "🚫", cost: 8, kind: "regenerative",
    short: "Stop plowing this plot for good.",
    science: "Without plowing, fungal threads and worm tunnels stay intact, so soil structure rebuilds each season. Yields dip a little at first.",
  },
  rotate: {
    id: "rotate", name: "Rotate Crop", icon: "🔄", cost: 4, kind: "regenerative",
    short: "Grow a different crop than last time.",
    science: "Changing crops breaks pest cycles and different roots feed different microbes.",
  },
  mulch: {
    id: "mulch", name: "Mulch", icon: "🌾", cost: 6, kind: "regenerative",
    short: "Lay straw over the soil like a blanket.",
    science: "Mulch shields soil from pounding rain and hot sun, keeps moisture in, and slowly becomes organic matter.",
  },
  grazing: {
    id: "grazing", name: "Graze Animals", icon: "🐄", cost: 0, kind: "regenerative",
    short: "Move cattle across the cover crop briefly. Needs a cover crop.",
    science: "Short grazing turns cover crops into manure and trampled mulch, then animals move on so plants regrow. Earns a little money too.",
  },
  hedgerow: {
    id: "hedgerow", name: "Hedgerow", icon: "🌳", cost: 25, kind: "regenerative",
    short: "Plant shrubs on the edge. Permanent.",
    science: "Hedgerows block wind and runoff and give homes to ladybugs and birds that eat pests. Neighboring plots benefit too.",
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
  },
  plow: {
    id: "plow", name: "Plow", icon: "🚜", cost: 6, kind: "conventional",
    short: "Turn the soil over. Quick yield boost.",
    science: "Plowing kills weeds and releases a burst of nutrients, but it breaks up soil structure, burns off organic matter, and leaves soil bare.",
  },
  synthFert: {
    id: "synthFert", name: "Synthetic Fertilizer", icon: "🧪", cost: 12, kind: "conventional",
    short: "Big nutrient boost right now.",
    science: "Feeds the crop fast, but extra nitrogen washes away, the soil gets more acidic, and microbes have less reason to help plants.",
  },
  pesticide: {
    id: "pesticide", name: "Pesticide", icon: "☠️", cost: 10, kind: "conventional",
    short: "Protects from pests this season.",
    science: "Kills pests, but also many helpful insects, worms, and microbes.",
  },
};

export const PRACTICE_ORDER: PracticeId[] = [
  "coverCrop", "compost", "noTill", "rotate", "mulch", "grazing", "hedgerow", "compostTea", "biochar",
  "plow", "synthFert", "pesticide",
];
