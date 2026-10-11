import type { CurriculumLesson } from "./types";

/** Unit 1: What Is Soil? */
export const UNIT1: CurriculumLesson[] = [
  {
    slug: "what-is-soil",
    unit: 1,
    title: "What Is Soil?",
    icon: "🪱",
    bigIdea: "Soil is a living mixture of rock bits, decaying life, water, and air, and almost every land plant and animal depends on it.",
    interactive: { type: "soil-pie", title: "What's inside healthy soil?", intro: "Tap each slice to learn what it does." },
    sources: ["nrcs-ssm", "weil-brady", "usda-healthy-soils", "nrcs-soil-health", "s4t", "smithsonian-dig-it"],
    standards: {
      elementary: ["2-PS1-1", "5-ESS2-1"],
      middle: ["MS-ESS2-1", "MS-LS2-3"],
      high: ["HS-ESS2-7", "HS-LS2-5"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "Soil is not just dirt. It's a mix of tiny rocks, old leaves, water, air, and lots of living things!",
        objectives: [
          "I can name the four things soil is made of.",
          "I can explain why soil is important to plants and animals.",
          "I can tell the difference between soil and dirt.",
        ],
        vocab: [
          { term: "Soil", def: "The top layer of the ground where plants grow. It is made of tiny rocks, dead plants, water, and air." },
          { term: "Minerals", def: "Tiny pieces of rock in the soil." },
          { term: "Organic matter", def: "Bits of plants and animals that were once alive, like old leaves." },
          { term: "Decompose", def: "To rot and break down into tiny pieces." },
        ],
        sections: [
          {
            heading: "Soil is a recipe",
            body: [
              "Imagine making soil in a big bowl. First, add lots of tiny bits of rock. Next, sprinkle in some old leaves and twigs. Then pour in some water and leave room for air.",
              "Mix it all together and add billions of tiny living things. Now you have soil!",
            ],
            source: "weil-brady",
          },
          {
            heading: "Soil is alive",
            body: [
              "Worms, bugs, and tiny living things too small to see live in soil. They eat old leaves and turn them into food for plants.",
              "A teaspoon of soil has more tiny living things in it than there are people on Earth!",
            ],
            callout: { title: "Wow!", text: "Scientists call those tiny living things microbes. You need a microscope to see them." },
            source: "usda-healthy-soils",
          },
          {
            heading: "Why soil matters",
            body: [
              "Plants grow their roots in soil. Soil gives them water and food. Animals eat the plants, and people eat both plants and animals.",
              "So when you eat breakfast, you can thank the soil!",
            ],
            source: "nrcs-soil-health",
          },
        ],
        activity: {
          title: "Soil detective",
          time: "20 minutes",
          materials: ["A cup of soil from outside", "A paper plate", "A magnifying glass", "A craft stick or spoon"],
          steps: [
            "Spread the soil out on the paper plate.",
            "Use the craft stick to gently sort it into piles: tiny rocks, plant bits, and anything that moves.",
            "Look at each pile with the magnifying glass.",
            "Draw what you find. Put any living things back outside when you're done.",
          ],
          lookFor: "Find at least one rock bit, one plant bit, and maybe a living thing like a worm or tiny bug.",
          safety: "Wash your hands after touching soil.",
        },
        quiz: [
          { prompt: "Which of these is NOT part of soil?", options: ["Tiny rocks", "Old leaves", "Water", "Plastic toys"], answer: 3, explain: "Soil is made of tiny rocks, old plant and animal bits, water, and air." },
          { prompt: "What do worms and microbes do in soil?", options: ["Eat old leaves and make food for plants", "Make the soil hot", "Turn soil into rock", "Nothing"], answer: 0, explain: "They break down old leaves and turn them into food that plants can use." },
          { prompt: "Where do plants get water and food from?", options: ["The clouds", "The soil", "The wind", "The moon"], answer: 1, explain: "Plant roots take in water and food from the soil." },
          { prompt: "A teaspoon of soil has more tiny living things than…", options: ["Zero", "One", "The number of people on Earth", "One ant"], answer: 2, explain: "Soil is packed with microbes, more than there are people on Earth!" },
          { prompt: "What does decompose mean?", options: ["To grow bigger", "To rot and break down", "To freeze", "To shine"], answer: 1, explain: "When leaves decompose, they rot and break into tiny pieces that become part of the soil." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "Soil isn't just dirt. It's a living system of minerals, organic matter, water, and air that took hundreds of years to form.",
        objectives: [
          "I can describe the four main components of soil and their approximate share in a healthy soil.",
          "I can explain why soil is considered a living system.",
          "I can describe at least three jobs soil does for ecosystems and people.",
        ],
        vocab: [
          { term: "Soil", def: "A natural mixture of minerals, organic matter, water, and air at Earth's surface that can support rooted plants." },
          { term: "Mineral particles", def: "Weathered pieces of rock, grouped by size into sand, silt, and clay." },
          { term: "Organic matter", def: "Material from living things, such as roots, leaves, microbes, and humus." },
          { term: "Pore space", def: "The gaps between soil particles, filled with water or air." },
          { term: "Microorganism", def: "A living thing too small to see without a microscope, such as bacteria and many fungi." },
        ],
        sections: [
          {
            heading: "Dirt vs. soil",
            body: [
              "Dirt is what ends up on your shoes or under the couch. Soil is a natural system at Earth's surface that can support plant roots.",
              "Soil forms as rock slowly breaks down and mixes with remains of plants, animals, and microbes. Building just one inch of topsoil can take hundreds of years.",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "The four ingredients",
            body: [
              "A healthy loam soil is roughly half solids and half pore space. The solids are about 45% mineral particles and about 5% organic matter. The pores hold water (about 25%) and air (about 25%), and those amounts shift as soil gets wetter or drier.",
              "Mineral particles are grouped by size. Sand is largest, silt is medium, and clay is smallest, less than 0.002 mm across.",
            ],
            callout: { title: "Small but mighty", text: "Organic matter is often only a few percent of soil, but it holds water, feeds microbes, and glues particles into crumbs." },
            source: "weil-brady",
          },
          {
            heading: "A city underground",
            body: [
              "According to the USDA, there are more microorganisms in a teaspoon of soil than there are people on Earth. Bacteria, fungi, protozoa, nematodes, mites, insects, and earthworms all live there.",
              "These organisms break down dead material, recycle nutrients, and build tunnels and crumbs that let air and water in.",
            ],
            source: "usda-healthy-soils",
          },
          {
            heading: "Soil's big jobs",
            body: [
              "The USDA Natural Resources Conservation Service lists five jobs healthy soil does: it regulates water, sustains plant and animal life, filters and buffers pollutants, cycles nutrients, and provides physical stability and support for roots and buildings.",
            ],
            source: "nrcs-soil-health",
          },
        ],
        activity: {
          title: "Soil shake jar",
          time: "15 minutes plus 24 hours of settling",
          materials: ["A clear jar with a lid", "Soil to fill the jar about one-third", "Water", "A teaspoon of dish soap (optional, helps particles separate)", "A ruler"],
          steps: [
            "Fill the jar one-third with soil, then add water until it's about three-quarters full. Add the soap.",
            "Close the lid tightly and shake hard for 3 minutes.",
            "Set the jar down and don't touch it. Look after 1 minute, 1 hour, and 24 hours.",
            "Measure the height of each layer that settles, and note anything floating on top.",
          ],
          lookFor: "Sand settles first on the bottom, then silt, then clay on top. Floating bits are organic matter.",
          safety: "Use a plastic jar if possible, and wash hands after handling soil.",
        },
        quiz: [
          { prompt: "About how much of a healthy loam soil is pore space?", options: ["None", "About 10%", "About half", "Almost all of it"], answer: 2, explain: "Roughly half of a healthy loam soil is pores filled with water and air." },
          { prompt: "Which particle is smallest?", options: ["Sand", "Silt", "Clay", "Gravel"], answer: 2, explain: "Clay particles are smaller than 0.002 mm." },
          { prompt: "What is organic matter?", options: ["Tiny rock pieces", "Material from living things", "Rainwater", "Pore space"], answer: 1, explain: "Organic matter comes from roots, leaves, microbes, and other once-living material." },
          { prompt: "Which of these is one of soil's jobs listed by the NRCS?", options: ["Making sunlight", "Filtering and buffering pollutants", "Creating wind", "Producing oxygen gas from rock"], answer: 1, explain: "Healthy soil filters and buffers pollutants, along with regulating water, sustaining life, cycling nutrients, and providing support." },
          { prompt: "How long can it take to form one inch of topsoil?", options: ["A day", "A year", "Hundreds of years", "Ten million years"], answer: 2, explain: "Soil forms slowly. Estimates are commonly in the hundreds of years per inch, depending on climate." },
          { prompt: "Why do roots need pores filled with air?", options: ["Roots need oxygen", "Air makes soil heavier", "Air keeps soil cold", "They don't need air"], answer: 0, explain: "Roots and most soil organisms need oxygen. Waterlogged soil can suffocate them." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Soil sits where rock, air, water, and life meet. It is a living, slowly forming natural body that regulates water, carbon, and nutrients for the whole planet.",
        objectives: [
          "I can define soil the way soil scientists do and explain how it differs from sediment or dirt.",
          "I can describe soil's volume composition and explain why the water–air balance changes.",
          "I can explain how soil connects the geosphere, hydrosphere, atmosphere, and biosphere.",
          "I can evaluate why soil is treated as a non-renewable resource on human timescales.",
        ],
        vocab: [
          { term: "Pedosphere", def: "The soil layer of Earth, where the geosphere, hydrosphere, atmosphere, and biosphere overlap." },
          { term: "Soil (USDA definition)", def: "A natural body of solids, liquids, and gases on the land surface, with horizons formed by additions, losses, transfers, and transformations, or the ability to support rooted plants." },
          { term: "Porosity", def: "The fraction of soil volume that is pore space." },
          { term: "Humus", def: "Well-decomposed, relatively stable organic matter that gives topsoil its dark color." },
          { term: "Ecosystem services", def: "Benefits people get from nature, such as food production, water filtering, and carbon storage." },
        ],
        sections: [
          {
            heading: "A scientist's definition",
            body: [
              "The USDA Soil Survey Manual defines soil as a natural body of solids (minerals and organic matter), liquids, and gases at the land surface. It either has horizons, layers formed by additions, losses, transfers, and transformations of energy and matter, or it can support rooted plants.",
              "That definition separates soil from simple sediment: soil is changed in place by climate and living things over time.",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "Composition by volume",
            body: [
              "A textbook loam surface soil is about 50% solids (roughly 45% minerals and 5% organic matter) and 50% pore space. At an ideal moisture level, that pore space is shared about equally between water and air.",
              "The water–air split is dynamic. After a heavy rain, water fills most pores and oxygen can run short. As soil drains and roots take up water, air moves back in. Compaction reduces total porosity, especially the large pores that drain water and supply oxygen.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Where Earth's systems meet",
            body: [
              "Soil is the interface of the geosphere (weathering rock), the hydrosphere (water moving through pores), the atmosphere (gas exchange, carbon dioxide, and nitrogen), and the biosphere (roots and microbes).",
              "The USDA notes that a teaspoon of soil holds more microorganisms than there are people on Earth. Their activity drives decomposition and nutrient cycling, and it helps build soil structure.",
            ],
            source: "usda-healthy-soils",
          },
          {
            heading: "Why soil is effectively non-renewable",
            body: [
              "Soil forms slowly, with estimates of roughly a few hundred to over a thousand years per inch depending on climate and parent material. Erosion from bare, tilled land can remove soil far faster than that.",
              "Because soil loss can outpace formation by orders of magnitude, soil scientists treat it as non-renewable on human timescales. That's why the NRCS frames soil management around protecting soil functions: water regulation, sustaining life, filtering pollutants, nutrient cycling, and physical support.",
            ],
            source: "nrcs-soil-health",
          },
        ],
        activity: {
          title: "Measure porosity",
          time: "30 minutes",
          materials: ["Two clear cups of the same size", "Dry sand", "Dry garden soil", "A graduated cylinder or measuring cup", "Water"],
          steps: [
            "Fill one cup to a marked line (for example 200 mL) with dry sand, and the other with dry garden soil. Tap each gently to settle.",
            "Slowly pour measured water into each cup until water just reaches the surface. Record the volume added.",
            "Calculate porosity = water added ÷ total soil volume × 100%.",
            "Compare the two samples, and predict how compacting the soil would change your result. Test it if you have time.",
          ],
          lookFor: "Most soils have porosity of roughly 30–60%. Well-aggregated garden soil often has more pore space than packed sand.",
          safety: "Wash hands after handling soil. Wipe up spills to avoid slips.",
        },
        quiz: [
          { prompt: "According to the USDA definition, what makes soil different from a pile of sediment?", options: ["Soil is always dark", "Soil has horizons formed in place or can support rooted plants", "Soil contains no minerals", "Soil is always wet"], answer: 1, explain: "Soil is changed in place over time, forming horizons, or it can support rooted plants." },
          { prompt: "A soil sample has a volume of 200 mL and holds 96 mL of water when saturated. What is its porosity?", options: ["24%", "48%", "96%", "208%"], answer: 1, explain: "96 ÷ 200 × 100% = 48%." },
          { prompt: "Right after a heavy rain, what happens to the pore space?", options: ["It fills with water and oxygen can run short", "It fills with air", "It disappears permanently", "Minerals dissolve"], answer: 0, explain: "Water displaces air in pores. Air returns as the soil drains." },
          { prompt: "Carbon dioxide released by soil microbes moving into the air above is an example of soil interacting with which Earth system?", options: ["Geosphere", "Atmosphere", "Hydrosphere", "None of them"], answer: 1, explain: "Gas exchange between soil pores and the air links the pedosphere to the atmosphere." },
          { prompt: "Why is soil considered non-renewable on human timescales?", options: ["It never forms", "Formation takes hundreds of years per inch, but erosion can remove it much faster", "It is made of plastic", "Plants destroy it"], answer: 1, explain: "Soil forms very slowly, so losses from erosion can't be replaced in a human lifetime." },
          { prompt: "What is humus?", options: ["Fresh leaves", "Stable, well-decomposed organic matter", "A type of clay", "Rainwater"], answer: 1, explain: "Humus is relatively stable organic matter that darkens topsoil and holds water and nutrients." },
        ],
      },
    },
  },
];
