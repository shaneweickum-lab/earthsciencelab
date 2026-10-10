export type InteractiveType =
  | "soil-pie"
  | "texture-triangle"
  | "soil-profile"
  | "health-sort"
  | "erosion-sim"
  | "principles";

export interface LessonSection {
  heading: string;
  body: string[];
  callout?: { title: string; text: string };
}

export interface QuizQuestion {
  prompt: string;
  options: string[];
  answer: number;
  explain: string;
}

export interface Lesson {
  slug: string;
  title: string;
  icon: string;
  summary: string;
  minutes: number;
  sections: LessonSection[];
  interactive: { type: InteractiveType; title: string; intro: string };
  quiz: QuizQuestion[];
}

export const LESSONS: Lesson[] = [
  {
    slug: "what-is-soil",
    title: "What Is Soil?",
    icon: "🪱",
    summary: "Soil isn't just dirt. It's a living mix of rock, air, water, and life.",
    minutes: 6,
    sections: [
      {
        heading: "Dirt vs. soil",
        body: [
          "Dirt is what gets on your shoes. Soil is a living system that covers much of the land on Earth and grows almost all of our food.",
          "Soil forms when rock slowly breaks down into tiny pieces and mixes with dead plants, animals, water, and air. Making just one inch of topsoil can take hundreds of years.",
        ],
      },
      {
        heading: "The four ingredients",
        body: [
          "Healthy soil is about half solid stuff and half empty space. The solid part is mostly minerals (tiny bits of rock) plus a small amount of organic matter (things that were once alive).",
          "The empty spaces, called pores, are filled with water and air. Roots and soil creatures need both, just like you do.",
        ],
        callout: {
          title: "Small but mighty",
          text: "Organic matter is usually only about 1–6% of soil, but it holds water, feeds microbes, and glues soil into crumbs.",
        },
      },
      {
        heading: "A city underground",
        body: [
          "A single teaspoon of healthy soil can hold more living microbes than there are people on Earth. Bacteria, fungi, earthworms, insects, and tiny worms called nematodes all live there.",
          "These creatures break down dead plants, recycle nutrients, and build tunnels that let water and air in. Soil is alive.",
        ],
      },
    ],
    interactive: {
      type: "soil-pie",
      title: "What's inside healthy soil?",
      intro: "Tap each slice to learn what it does.",
    },
    quiz: [
      {
        prompt: "About how much of healthy soil is empty space (pores)?",
        options: ["None of it", "About 10%", "About half", "Almost all of it"],
        answer: 2,
        explain: "Around half of good soil is pore space, filled with water and air.",
      },
      {
        prompt: "What is organic matter?",
        options: ["Tiny pieces of rock", "Material from things that were once alive", "Rainwater", "Plastic"],
        answer: 1,
        explain: "Organic matter comes from dead plants, animals, and microbes.",
      },
      {
        prompt: "How long can it take to form one inch of topsoil?",
        options: ["A day", "A year", "Hundreds of years", "One million years"],
        answer: 2,
        explain: "Soil forms slowly, so it can take hundreds of years to build an inch of topsoil.",
      },
      {
        prompt: "Which of these is NOT one of the four main parts of soil?",
        options: ["Minerals", "Air", "Water", "Sunlight"],
        answer: 3,
        explain: "Soil is minerals, organic matter, water, and air. Sunlight stays above ground!",
      },
      {
        prompt: "Why do roots need pores full of air?",
        options: ["Roots need oxygen to breathe", "Air makes soil heavier", "Air keeps soil cold", "They don't need air"],
        answer: 0,
        explain: "Roots and soil creatures need oxygen. Waterlogged soil can suffocate them.",
      },
    ],
  },
  {
    slug: "soil-texture",
    title: "Soil Texture",
    icon: "🤏",
    summary: "Sand, silt, and clay: the mix that decides how soil feels and behaves.",
    minutes: 8,
    sections: [
      {
        heading: "Three sizes of particles",
        body: [
          "Soil minerals come in three sizes. Sand is the biggest. You can see it and it feels gritty. Silt is medium and feels smooth like flour. Clay is the tiniest and feels sticky when wet.",
          "If a grain of clay were the size of a coin, a grain of sand could be bigger than a house!",
        ],
      },
      {
        heading: "Why texture matters",
        body: [
          "Sandy soils have big pores, so water rushes straight through. They dry out fast and don't hold much plant food.",
          "Clay soils have tiny pores that hold onto water and nutrients tightly, but they drain slowly and get sticky or hard.",
          "Loam is a balanced mix of sand, silt, and clay. Gardeners love it because it holds water but still drains.",
        ],
      },
      {
        heading: "The feel test",
        body: [
          "Scientists can estimate texture by hand. Wet a pinch of soil, roll it into a ball, then push it between your thumb and finger to make a ribbon.",
          "Gritty with no ribbon? Sandy. Smooth and floury? Silty. A long, sticky ribbon over 2 inches? Lots of clay.",
        ],
        callout: {
          title: "Texture is permanent",
          text: "You can't really change a soil's texture, but you can improve how it behaves by adding organic matter.",
        },
      },
    ],
    interactive: {
      type: "texture-triangle",
      title: "The Soil Texture Triangle",
      intro: "Slide the sand and clay amounts. Silt fills in the rest. Watch which texture class you land in.",
    },
    quiz: [
      {
        prompt: "Which particle is the smallest?",
        options: ["Sand", "Silt", "Clay", "Gravel"],
        answer: 2,
        explain: "Clay particles are the tiniest, smaller than 0.002 mm.",
      },
      {
        prompt: "A soil feels very gritty and water drains through it fast. It's probably…",
        options: ["Sandy", "Clay", "Silty", "Peat"],
        answer: 0,
        explain: "Big sand grains feel gritty and leave big pores for water to rush through.",
      },
      {
        prompt: "What is loam?",
        options: ["Pure clay", "A balanced mix of sand, silt, and clay", "Soil with no minerals", "A kind of rock"],
        answer: 1,
        explain: "Loam has a good balance of all three particle sizes.",
      },
      {
        prompt: "40% sand, 40% silt, 20% clay is which texture class?",
        options: ["Sand", "Loam", "Clay", "Silt"],
        answer: 1,
        explain: "That mix lands right in the loam zone of the texture triangle.",
      },
      {
        prompt: "In the ribbon test, a long sticky ribbon means…",
        options: ["Lots of sand", "Lots of clay", "No minerals", "The soil is frozen"],
        answer: 1,
        explain: "Clay is sticky and stretchy, so it makes long ribbons.",
      },
      {
        prompt: "What's the best way to help a sandy soil hold more water?",
        options: ["Add organic matter", "Add more sand", "Leave it bare", "Pave it"],
        answer: 0,
        explain: "Organic matter acts like a sponge, helping sandy soils hold water and nutrients.",
      },
    ],
  },
  {
    slug: "soil-horizons",
    title: "Soil Horizons",
    icon: "🪨",
    summary: "Dig a deep hole and soil shows its layers, like pages in a history book.",
    minutes: 7,
    sections: [
      {
        heading: "Soil has layers",
        body: [
          "If you dig a deep hole, the side of it shows bands of different colors and textures. Each band is called a horizon, and together they make a soil profile.",
          "Horizons form over thousands of years as water, roots, and creatures move materials up and down.",
        ],
      },
      {
        heading: "Meet the horizons",
        body: [
          "O horizon: the top layer of leaves and rotting plant material.",
          "A horizon: topsoil. Dark, full of life and organic matter. This is where most roots grow.",
          "E horizon: a pale layer where water has washed minerals down and out. Not every soil has one.",
          "B horizon: subsoil, where clay, iron, and minerals from above pile up. Often reddish or brown.",
          "C horizon: broken-up rock, the parent material the soil formed from.",
          "R horizon: solid bedrock.",
        ],
        callout: {
          title: "Topsoil is precious",
          text: "The A horizon is often less than a foot thick, but it grows most of our food. Losing it to erosion is a big deal.",
        },
      },
    ],
    interactive: {
      type: "soil-profile",
      title: "Explore a 3D soil profile",
      intro: "Drag to spin the soil column. Click a layer to learn about it.",
    },
    quiz: [
      {
        prompt: "What is a soil horizon?",
        options: ["A sunset over a farm", "A layer in the soil", "A type of worm", "A kind of fertilizer"],
        answer: 1,
        explain: "Horizons are the layers you see in a soil profile.",
      },
      {
        prompt: "Which horizon is called topsoil?",
        options: ["O", "A", "B", "R"],
        answer: 1,
        explain: "The A horizon is topsoil, dark and full of life.",
      },
      {
        prompt: "Where do clay and iron from above often collect?",
        options: ["O horizon", "E horizon", "B horizon", "In the air"],
        answer: 2,
        explain: "The B horizon (subsoil) is where washed-down minerals pile up.",
      },
      {
        prompt: "What is the R horizon?",
        options: ["Roots", "Solid bedrock", "Rotting leaves", "Rainwater"],
        answer: 1,
        explain: "R stands for rock. It's the solid bedrock below everything else.",
      },
      {
        prompt: "Why is the A horizon so important?",
        options: ["It's the hardest layer", "Most roots and soil life live there", "It's always frozen", "It has no nutrients"],
        answer: 1,
        explain: "Topsoil holds most of the organic matter, life, and roots.",
      },
    ],
  },
  {
    slug: "healthy-soil",
    title: "Signs of Healthy Soil",
    icon: "🩺",
    summary: "How do scientists and farmers know if soil is healthy? They check its vital signs.",
    minutes: 8,
    sections: [
      {
        heading: "Soil health vs. soil quality",
        body: [
          "Soil quality is how well a soil can do its jobs: growing plants, cleaning water, and supporting life. Soil health treats soil as a living ecosystem that can get stronger or weaker depending on how we treat it.",
          "Like a doctor checking your heartbeat and temperature, soil scientists check soil's vital signs.",
        ],
      },
      {
        heading: "The vital signs",
        body: [
          "Organic matter: more is usually better. It holds water and feeds soil life. Each 1% increase helps an acre of soil hold roughly 20,000 more gallons of water.",
          "Structure: healthy soil forms crumbs called aggregates, held together by roots, fungi, and sticky microbe slime. Crumbs leave room for air and water.",
          "Life: earthworms, fungi, and bacteria. Ten or more earthworms in a shovelful is a great sign.",
          "Infiltration: how fast water soaks in. Healthy soil drinks rain instead of letting it run off.",
          "pH: how acidic or basic soil is. Most crops like a pH between 6 and 7.",
          "Nutrients: nitrogen (N), phosphorus (P), and potassium (K) are the big three plant foods.",
        ],
      },
      {
        heading: "Use your senses",
        body: [
          "Healthy soil is usually dark, crumbly, and smells sweet and earthy. That smell comes from a chemical called geosmin made by soil bacteria.",
          "Unhealthy soil may be pale, hard, crusted on top, or smell sour.",
        ],
        callout: {
          title: "Try it: the slake test",
          text: "Drop a dry clump of soil into a glass of water. Healthy soil crumbs hold together. Weak soil falls apart into a cloudy mess.",
        },
      },
    ],
    interactive: {
      type: "health-sort",
      title: "Soil Doctor",
      intro: "Sort each clue: is it a sign of healthy soil or unhealthy soil?",
    },
    quiz: [
      {
        prompt: "What are soil aggregates?",
        options: ["Rocks", "Crumbs of soil glued together by roots, fungi, and microbes", "A type of bug", "Fertilizer pellets"],
        answer: 1,
        explain: "Aggregates are crumbs. Good structure means lots of stable crumbs.",
      },
      {
        prompt: "Most crops grow best at a pH of…",
        options: ["2–3", "6–7", "10–11", "14"],
        answer: 1,
        explain: "Most crops prefer slightly acidic to neutral soil, around pH 6–7.",
      },
      {
        prompt: "What causes the earthy smell of healthy soil?",
        options: ["Geosmin made by bacteria", "Rotten eggs", "Rainwater", "Rocks"],
        answer: 0,
        explain: "Soil bacteria make geosmin. Your nose is very sensitive to it!",
      },
      {
        prompt: "Which is a sign of HEALTHY soil?",
        options: ["A hard crust on top", "Water puddles and runs off", "Lots of earthworms", "Pale color and sour smell"],
        answer: 2,
        explain: "Earthworms show soil is alive and well fed.",
      },
      {
        prompt: "What do N, P, and K stand for?",
        options: ["Nitrogen, phosphorus, potassium", "Nickel, plutonium, krypton", "Neon, protein, kale", "Nitrate, peat, kelp"],
        answer: 0,
        explain: "These are the three main nutrients plants need.",
      },
    ],
  },
  {
    slug: "soil-threats",
    title: "How Soil Gets Hurt",
    icon: "🌪️",
    summary: "Erosion, compaction, and salt can ruin soil that took centuries to build.",
    minutes: 7,
    sections: [
      {
        heading: "Erosion",
        body: [
          "Erosion is when wind or water carries soil away. Bare soil is the most at risk because nothing holds it in place.",
          "In the 1930s, farmers on the U.S. Great Plains plowed up the prairie grass. A long drought dried the bare soil, and huge dust storms blew it away. This became known as the Dust Bowl.",
        ],
        callout: {
          title: "Raindrops are tiny bombs",
          text: "A raindrop hitting bare soil can splash soil particles up to 2 feet away. Plants and mulch absorb that impact.",
        },
      },
      {
        heading: "Compaction",
        body: [
          "Heavy machines, too many animals, or working wet soil can squash the pores closed. Roots can't push through, and water can't soak in.",
          "Compacted soil is like a sponge that has been flattened. It can't soak up much.",
        ],
      },
      {
        heading: "Other threats",
        body: [
          "Salinization: in dry places, irrigation water evaporates and leaves salt behind, which poisons plants.",
          "Too much tillage: plowing breaks apart soil crumbs, tears up fungal networks, and lets organic matter burn off into the air as carbon dioxide.",
          "Nutrient loss: harvesting crops year after year without putting anything back slowly starves the soil.",
        ],
      },
    ],
    interactive: {
      type: "erosion-sim",
      title: "Rainstorm test",
      intro: "Make it rain on two fields and compare how much soil washes away.",
    },
    quiz: [
      {
        prompt: "What is erosion?",
        options: ["Soil being carried away by wind or water", "Soil getting more fertile", "Plants growing roots", "Rain soaking in"],
        answer: 0,
        explain: "Erosion moves soil away, usually from bare ground.",
      },
      {
        prompt: "What helped cause the Dust Bowl?",
        options: ["Too many trees", "Plowed, bare soil plus drought", "Too much rain", "Volcanoes"],
        answer: 1,
        explain: "Plowing up deep-rooted prairie grass left soil bare when the drought hit.",
      },
      {
        prompt: "Compacted soil…",
        options: ["Soaks up more water", "Has squashed pores that block roots and water", "Has more air", "Is always sandy"],
        answer: 1,
        explain: "Compaction crushes the pores roots and water need.",
      },
      {
        prompt: "How does irrigation in dry places sometimes hurt soil?",
        options: ["It leaves salt behind as water evaporates", "It makes soil too cold", "It adds too many worms", "It never hurts soil"],
        answer: 0,
        explain: "Evaporating water leaves dissolved salts behind. This is called salinization.",
      },
      {
        prompt: "Which protects soil from raindrop splash?",
        options: ["Plowing", "Bare ground", "Plants and mulch covering the soil", "Driving tractors on it"],
        answer: 2,
        explain: "Cover absorbs the impact of rain, so soil stays put.",
      },
    ],
  },
  {
    slug: "regenerative-principles",
    title: "Regenerative Principles",
    icon: "🌿",
    summary: "Farming that heals soil instead of using it up.",
    minutes: 9,
    sections: [
      {
        heading: "What is regenerative farming?",
        body: [
          "Regenerative agriculture means farming in ways that rebuild soil health over time, leaving land better than you found it.",
          "Organic farming is related. It avoids synthetic fertilizers and pesticides and relies on compost, manure, and natural pest control instead. Many farms use ideas from both.",
        ],
      },
      {
        heading: "The five principles",
        body: [
          "1. Disturb the soil as little as possible. Skipping the plow (no-till) keeps soil crumbs and fungal networks intact.",
          "2. Keep the soil covered. Cover crops and mulch act like armor against rain, wind, and heat.",
          "3. Grow diversity. Many kinds of plants feed many kinds of microbes and confuse pests.",
          "4. Keep living roots in the ground. Roots leak sugars that feed soil life all year round.",
          "5. Bring in animals. Grazing animals, moved often, recycle plants into manure and wake up the soil.",
        ],
      },
      {
        heading: "Helpful tools",
        body: [
          "Compost: rotted food and plant scraps that add organic matter and microbes.",
          "Crop rotation: changing which crop grows in a field each season to break pest cycles.",
          "Cover crops like clover and beans are legumes. Bacteria in their roots pull nitrogen out of the air and turn it into plant food.",
          "Hedgerows and buffer strips: rows of shrubs and grasses that stop erosion and house helpful insects and birds.",
          "Biochar: charcoal made from plant waste that gives water, nutrients, and microbes a place to live.",
        ],
        callout: {
          title: "Ready to farm?",
          text: "Try these practices yourself in Regenerate the Field. Can you heal a worn-out farm in three years?",
        },
      },
    ],
    interactive: {
      type: "principles",
      title: "Match the practice",
      intro: "Each card shows a farm practice. Flip it to see which principle it follows.",
    },
    quiz: [
      {
        prompt: "What does no-till farming avoid?",
        options: ["Watering", "Plowing the soil", "Planting seeds", "Harvesting"],
        answer: 1,
        explain: "No-till skips the plow so soil structure and life stay intact.",
      },
      {
        prompt: "Why plant cover crops?",
        options: ["To leave soil bare", "To protect and feed the soil between main crops", "To attract pests", "To make soil saltier"],
        answer: 1,
        explain: "Cover crops shield soil and feed microbes with their roots.",
      },
      {
        prompt: "How do legumes like clover help soil?",
        options: ["They add nitrogen with help from root bacteria", "They remove all nutrients", "They make soil sandy", "They kill earthworms"],
        answer: 0,
        explain: "Bacteria in legume roots pull nitrogen from the air into the soil.",
      },
      {
        prompt: "What is crop rotation?",
        options: ["Spinning plants around", "Growing different crops in a field over time", "Planting only corn forever", "Watering in circles"],
        answer: 1,
        explain: "Rotating crops breaks pest cycles and feeds different microbes.",
      },
      {
        prompt: "How can grazing animals help soil?",
        options: ["By staying in one spot forever", "By eating plants briefly and leaving manure, then moving on", "By digging holes", "They always hurt soil"],
        answer: 1,
        explain: "Short, planned grazing recycles plants into manure and lets them regrow.",
      },
      {
        prompt: "Which of these is a regenerative principle?",
        options: ["Leave soil bare", "Plow often", "Keep living roots in the ground", "Grow only one crop"],
        answer: 2,
        explain: "Living roots feed soil life all year long.",
      },
    ],
  },
];

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}
