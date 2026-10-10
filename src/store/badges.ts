export type BadgeId =
  | "dirt-detective" | "texture-master" | "layer-explorer" | "health-inspector" | "erosion-fighter"
  | "regen-rookie" | "soil-scholar" | "first-harvest" | "field-restorer" | "soil-legend"
  | "globe-trotter" | "soil-explorer" | "world-soil-expert"
  | "element-spotter" | "lab-regular" | "table-master" | "soil-chemist";

export interface Badge {
  id: BadgeId;
  name: string;
  icon: string;
  description: string;
}

export const BADGES: Record<BadgeId, Badge> = {
  "dirt-detective": { id: "dirt-detective", name: "Dirt Detective", icon: "🔍", description: "Finish the What Is Soil? lesson." },
  "texture-master": { id: "texture-master", name: "Texture Master", icon: "🤏", description: "Get a perfect score on the Soil Texture quiz." },
  "layer-explorer": { id: "layer-explorer", name: "Layer Explorer", icon: "🪨", description: "Finish the Soil Horizons lesson." },
  "health-inspector": { id: "health-inspector", name: "Health Inspector", icon: "🩺", description: "Finish the Signs of Healthy Soil lesson." },
  "erosion-fighter": { id: "erosion-fighter", name: "Erosion Fighter", icon: "🛡️", description: "Finish the How Soil Gets Hurt lesson." },
  "regen-rookie": { id: "regen-rookie", name: "Regen Rookie", icon: "🌿", description: "Finish the Regenerative Principles lesson." },
  "soil-scholar": { id: "soil-scholar", name: "Soil Scholar", icon: "🎓", description: "Finish every soil lesson." },
  "first-harvest": { id: "first-harvest", name: "First Harvest", icon: "🧺", description: "Finish a full game of Regenerate the Field." },
  "field-restorer": { id: "field-restorer", name: "Field Restorer", icon: "🏆", description: "Bring a field to a Soil Health Index of 70 or more." },
  "soil-legend": { id: "soil-legend", name: "Soil Legend", icon: "⭐", description: "Earn 3 stars in Regenerate the Field." },
  "globe-trotter": { id: "globe-trotter", name: "Globe Trotter", icon: "🧭", description: "Visit your first soil region on the globe." },
  "soil-explorer": { id: "soil-explorer", name: "Soil Explorer", icon: "🌍", description: "Visit 10 soil regions on the globe." },
  "world-soil-expert": { id: "world-soil-expert", name: "World Soil Expert", icon: "🗺️", description: "Answer 10 globe quiz questions correctly." },
  "element-spotter": { id: "element-spotter", name: "Element Spotter", icon: "⚛️", description: "Look up your first element." },
  "lab-regular": { id: "lab-regular", name: "Lab Regular", icon: "🧪", description: "Explore 25 different elements." },
  "table-master": { id: "table-master", name: "Table Master", icon: "👑", description: "Explore all 118 elements." },
  "soil-chemist": { id: "soil-chemist", name: "Soil Chemist", icon: "🧑‍🔬", description: "Explore every element that builds soil." },
};

export const LESSON_BADGES: Record<string, BadgeId> = {
  "what-is-soil": "dirt-detective",
  "soil-horizons": "layer-explorer",
  "healthy-soil": "health-inspector",
  "soil-threats": "erosion-fighter",
  "regenerative-principles": "regen-rookie",
};
