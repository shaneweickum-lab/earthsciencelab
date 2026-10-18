import type { Level } from "@/content/soil/curriculum/types";

export type JournalCategory = "insect" | "fungus" | "bird" | "animal" | "soil" | "weather" | "rock";

export interface JournalEntry {
  id: string;
  name: string;
  icon: string;
  category: JournalCategory;
  /** How a player finds it, shown as a hint before it's discovered. */
  hint: string;
  /** The same idea at three depths, matching the curriculum's grade levels. */
  fact: Record<Level, string>;
  /** Related curriculum lesson. */
  lesson?: string;
  /** Where the facts come from. */
  source: { org: string; url: string };
}

export const CATEGORY_INFO: Record<JournalCategory, { label: string; icon: string }> = {
  insect: { label: "Bugs & critters", icon: "🐞" },
  fungus: { label: "Fungi", icon: "🍄" },
  bird: { label: "Birds", icon: "🐦" },
  animal: { label: "Pond life", icon: "🐸" },
  soil: { label: "Soil science", icon: "🪱" },
  weather: { label: "Weather & sky", icon: "🌦️" },
  rock: { label: "Rocks & minerals", icon: "🪨" },
};

const UC_IPM = { org: "University of California Statewide IPM Program", url: "https://ipm.ucanr.edu" };
const XERCES = { org: "Xerces Society for Invertebrate Conservation", url: "https://xerces.org" };
const NRCS = { org: "USDA Natural Resources Conservation Service, Soil Health", url: "https://www.nrcs.usda.gov/conservation-basics/natural-resource-concerns/soils/soil-health" };
const PRIMER = { org: "Soil Biology Primer (Soil and Water Conservation Society / USDA NRCS)", url: "https://www.nrcs.usda.gov/conservation-basics/natural-resource-concerns/soils/soil-health" };
const CORNELL = { org: "Cornell Lab of Ornithology, All About Birds", url: "https://www.allaboutbirds.org" };
const NOAA = { org: "NOAA National Weather Service, JetStream", url: "https://www.weather.gov/jetstream/" };
const USGS = { org: "U.S. Geological Survey, Water Science School", url: "https://www.usgs.gov/special-topics/water-science-school" };
const PSU = { org: "Penn State Extension, Manure and Composting", url: "https://extension.psu.edu" };
const USGS_MINERALS = { org: "U.S. Geological Survey, National Minerals Information Center", url: "https://www.usgs.gov/centers/national-minerals-information-center" };
const MYPLATE = { org: "USDA MyPlate", url: "https://www.myplate.gov" };
const MUSHROOM = { org: "North American Mycological Association", url: "https://namyco.org" };

export const MUSHROOM_SAFETY = "Never eat a wild mushroom unless an expert identifies it. Some deadly mushrooms look like safe ones.";

export const JOURNAL: JournalEntry[] = [
  // ── Bugs & critters ──
  {
    id: "ladybug", name: "Lady Beetle", icon: "🐞", category: "insect", lesson: "regenerative-principles", source: UC_IPM,
    hint: "Look on the garden in spring and summer, on dry days.",
    fact: {
      elementary: "Ladybugs are beetles, and they are hungry hunters! One ladybug can eat dozens of aphids in a day, so farmers love them.",
      middle: "Lady beetles are predators. Both the adults and their spiky, alligator-shaped larvae eat aphids, which makes them free, natural pest control.",
      high: "Lady beetles are a classic biological control agent. Farms keep them around through conservation biological control: providing flowers for pollen and nectar and shelter for overwintering instead of spraying broad insecticides.",
    },
  },
  {
    id: "aphid", name: "Aphid", icon: "🦗", category: "insect", lesson: "regenerative-principles", source: UC_IPM,
    hint: "Tiny sap-suckers on garden crops in spring and summer.",
    fact: {
      elementary: "Aphids are tiny bugs that drink sap from plants. Too many can make plants weak, but ladybugs gobble them up.",
      middle: "Aphids pierce stems with a mouth like a straw and drink sugary sap. In summer, females can have babies without mating, so their numbers grow very fast.",
      high: "In summer, aphids reproduce parthenogenetically and give live birth, so populations can grow exponentially. Heavy nitrogen fertilizer makes plants more attractive to them. Their sugary waste, honeydew, is harvested by ants that guard them from predators.",
    },
  },
  {
    id: "ground-beetle", name: "Ground Beetle", icon: "🪲", category: "insect", lesson: "soil-food-web", source: UC_IPM,
    hint: "Hunts on the garden soil surface.",
    fact: {
      elementary: "Ground beetles run around on the soil at night and eat slugs, caterpillars, and other pests.",
      middle: "Ground beetles are some of the most common beetles on farms. Many eat pests, and some eat thousands of weed seeds.",
      high: "Carabid beetles are generalist predators and weed-seed predators. Less tillage and year-round plant cover increase their numbers, so ecologists use them as bioindicators of how a farm is managed.",
    },
  },
  {
    id: "pill-bug", name: "Pill Bug", icon: "🪲", category: "insect", lesson: "decomposition", source: PRIMER,
    hint: "Hides under damp logs and stumps, especially after rain.",
    fact: {
      elementary: "Pill bugs are not insects! They are crustaceans, cousins of shrimp and crabs. They roll into a ball to stay safe.",
      middle: "Pill bugs breathe with gill-like body parts, so they need damp places. They shred dead leaves into tiny pieces, which helps them rot faster.",
      high: "Terrestrial isopods are detritivores. By fragmenting leaf litter they increase its surface area for bacteria and fungi, speeding decomposition and nutrient cycling. Their gill-like pleopods must stay moist to work.",
    },
  },
  {
    id: "monarch", name: "Monarch Butterfly", icon: "🦋", category: "insect", source: XERCES,
    hint: "Visits flowers like sunflowers, buckwheat, clover, and flower beds in summer and fall.",
    fact: {
      elementary: "Monarch caterpillars eat only milkweed leaves. Grown-up monarchs sip sweet nectar from flowers.",
      middle: "Monarchs from eastern North America fly up to about 3,000 miles each fall to spend the winter in the mountain forests of central Mexico.",
      high: "The fall migration is done by a special long-lived generation that survives about 8 months, compared with a few weeks for summer adults. Milkweed toxins (cardenolides) make monarchs poisonous, and their bright orange warns predators, an example of aposematism.",
    },
  },
  {
    id: "honeybee", name: "Honeybee", icon: "🐝", category: "insect", lesson: "regenerative-principles", source: { org: "U.S. Department of Agriculture", url: "https://www.usda.gov/peoples-garden/pollinators" },
    hint: "Visit a beehive.",
    fact: {
      elementary: "Bees carry pollen from flower to flower. That helps plants make fruits and seeds. Bees turn flower nectar into honey.",
      middle: "About one out of every three bites of food we eat depends on pollinators like bees. A farm with many kinds of flowers feeds more bees.",
      high: "Honeybees share where food is with the waggle dance: the dance's angle shows the direction compared with the sun, and its length shows the distance. Colonies need diverse pollen sources for a balanced diet of proteins and fats.",
    },
  },
  {
    id: "dragonfly", name: "Dragonfly", icon: "🪰", category: "insect", source: XERCES,
    hint: "Zips around the pond shore on dry summer days.",
    fact: {
      elementary: "Dragonflies catch mosquitoes and other bugs right out of the air.",
      middle: "Baby dragonflies, called nymphs, live underwater for months or even years before they climb out and become fliers.",
      high: "Dragonflies intercept prey by predicting its flight path, and lab studies have found them catching prey over 90% of the time. Their nymphs need clean water, so they are indicators of healthy freshwater.",
    },
  },

  // ── Fungi ──
  {
    id: "oyster-mushroom", name: "Oyster Mushroom", icon: "🍄", category: "fungus", lesson: "decomposition", source: MUSHROOM,
    hint: "Grows on logs and stumps after rain or fog.",
    fact: {
      elementary: "Oyster mushrooms grow on dead wood and slowly turn it back into soil.",
      middle: "A mushroom is just the fruit of a fungus. The main body is a web of tiny threads called mycelium, hidden inside the log.",
      high: "Oyster mushrooms (Pleurotus) are white-rot fungi: their enzymes break down lignin, the toughest part of wood. They even trap and digest tiny roundworms (nematodes) to get extra nitrogen.",
    },
  },
  {
    id: "turkey-tail", name: "Turkey Tail", icon: "🍄", category: "fungus", lesson: "decomposition", source: MUSHROOM,
    hint: "Striped shelves on logs and stumps, especially on foggy days.",
    fact: {
      elementary: "Turkey tail fungus has colorful stripes like a turkey's tail feathers.",
      middle: "Turkey tail is a decomposer. It grows on dead hardwood logs and stumps for years, breaking the wood down.",
      high: "Trametes versicolor is a white-rot fungus. Its laccase enzymes are being studied for bioremediation, breaking down pollutants such as dyes and some pesticides.",
    },
  },
  {
    id: "puffball", name: "Puffball", icon: "🍄", category: "fungus", lesson: "decomposition", source: MUSHROOM,
    hint: "Pops up in grass after wet summer and fall weather.",
    fact: {
      elementary: "When a ripe puffball is squeezed or hit by a raindrop, it puffs out a cloud of spores. Spores are how fungi spread.",
      middle: "A big puffball can hold trillions of spores. Spores are like super-tiny seeds that float on the wind to new places.",
      high: "Puffballs are gasteroid fungi: spores mature inside a closed fruiting body and escape through a pore when raindrops or animals press on it, a kind of splash dispersal.",
    },
  },
  {
    id: "mycorrhizae", name: "Mycorrhizal Fungi", icon: "🕸️", category: "fungus", lesson: "soil-food-web", source: PRIMER,
    hint: "Do a shovel test where soil life is high.",
    fact: {
      elementary: "Some fungi team up with plant roots. The fungus brings the plant water and nutrients, and the plant shares sugar with the fungus.",
      middle: "Mycorrhizal fungi grow thin threads called hyphae that reach far past the roots, like extra roots. They are especially good at finding phosphorus.",
      high: "Most land plants form mycorrhizal partnerships. Arbuscular mycorrhizal fungi help glue soil into aggregates, and tillage tears their hyphal networks apart, one reason no-till builds soil structure.",
    },
  },
  {
    id: "decomposers", name: "Decomposers", icon: "🦠", category: "soil", lesson: "decomposition", source: PRIMER,
    hint: "Add plant fiber to a compost bin.",
    fact: {
      elementary: "Bacteria and fungi are tiny decomposers. They eat dead plants and turn them into dark, crumbly compost.",
      middle: "Compost piles heat up because millions of microbes give off heat as they break plants down. A hot pile can reach 130–160°F (55–70°C).",
      high: "Composting works best with a carbon-to-nitrogen ratio near 25–30:1, plus oxygen and moisture. Heat-loving (thermophilic) bacteria dominate the hot phase; then fungi and actinomycetes finish curing the compost.",
    },
  },

  {
    id: "hen", name: "Hens", icon: "🐔", category: "bird", source: PSU,
    hint: "Build a chicken coop.",
    fact: {
      elementary: "Chickens scratch and peck all day, gobbling up bugs, grubs, and weed seeds. Their droppings become great fertilizer once they are composted.",
      middle: "Chicken manure is rich in nitrogen, phosphorus, and potassium. Fresh manure can burn plants and may carry germs, so gardeners compost it before spreading it on soil.",
      high: "Poultry manure has a low carbon-to-nitrogen ratio (roughly 6–10:1), so mixing it with carbon-rich bedding like straw balances a compost pile. The heat of hot composting also kills pathogens such as Salmonella.",
    },
  },

  // ── Soil science ──
  {
    id: "groundwater", name: "Groundwater", icon: "🪣", category: "soil", source: USGS,
    hint: "Fill your watering can at a well.",
    fact: {
      elementary: "When rain soaks into the ground, some of it trickles down until it fills tiny spaces between bits of soil, sand, and rock. That hidden water is groundwater, and a well brings it back up.",
      middle: "Groundwater fills the pores and cracks in underground layers called aquifers. The top of that soaked zone is the water table. A well works because it reaches below the water table.",
      high: "Aquifers are recharged when rain and snowmelt infiltrate the soil. Pumping faster than recharge lowers the water table, and nitrate from fertilizer that leaches below the roots can contaminate wells: one more reason to keep nutrients in the soil.",
    },
  },
  {
    id: "forest-regrowth", name: "Forest Regrowth", icon: "🌳", category: "soil", source: { org: "USDA Forest Service", url: "https://www.fs.usda.gov/managing-land/natural-resources" },
    hint: "Chop down a tree.",
    fact: {
      elementary: "Many trees can grow back from their stumps! New shoots sprout from the roots that are still alive underground. Leaving some trees standing keeps homes for birds and shade for the soil.",
      middle: "Hardwoods like oak and maple can resprout from a stump (called coppicing). A forest that's cut grows back in stages: grasses and shrubs first, then fast-growing trees, then slow, long-lived ones. This is called succession.",
      high: "Tree roots hold soil against erosion and feed soil fungi with sugars; a mature tree also stores tons of carbon. Sustainable forestry cuts only part of a stand at a time and lets succession and stump sprouting regrow the rest.",
    },
  },
  {
    id: "earthworm", name: "Earthworm", icon: "🪱", category: "soil", lesson: "soil-food-web", source: NRCS,
    hint: "Do a shovel test in living soil.",
    fact: {
      elementary: "Earthworms eat soil and dead leaves and leave behind rich castings (worm poop!). Their tunnels let air and water into the soil.",
      middle: "Counting earthworms is a real soil test. Finding about 10 or more worms in a shovelful (one cubic foot) of soil is a sign of healthy soil.",
      high: "Worm castings hold more plant-available nutrients than the soil around them, and nightcrawler burrows can reach more than 6 feet deep, boosting water infiltration. Tillage and bare soil reduce worm numbers.",
    },
  },
  {
    id: "nitrogen-fixation", name: "Root Nodules", icon: "🫘", category: "soil", lesson: "roots-and-nitrogen", source: PRIMER,
    hint: "Harvest beans or dig in clover.",
    fact: {
      elementary: "Bean and clover roots have little bumps called nodules. Bacteria living inside turn air into plant food!",
      middle: "Air is about 78% nitrogen, but plants can't use it directly. Rhizobia bacteria in legume root nodules change it into a form plants can use.",
      high: "Rhizobia use the enzyme nitrogenase to reduce N₂ to ammonia. Nitrogenase is damaged by oxygen, so nodules make leghemoglobin to keep oxygen low; that is why active nodules are pink inside.",
    },
  },
  {
    id: "greenhouse-effect", name: "Greenhouse Effect", icon: "🏡", category: "weather", lesson: "soil-food-climate", source: NOAA,
    hint: "Build a greenhouse.",
    fact: {
      elementary: "Sunlight shines through the glass and warms the plants and soil inside. The glass keeps the warm air in, so it stays cozy even in winter.",
      middle: "Sunlight passes through glass and warms everything inside, and the glass traps the warm air. Earth's atmosphere traps heat in a similar way, which is called the greenhouse effect.",
      high: "A real greenhouse stays warm mostly because glass stops warm air from rising away (it blocks convection). Earth's greenhouse effect is different: gases like carbon dioxide and water vapor absorb infrared radiation from the ground and send some back down.",
    },
  },

  // ── Birds ──
  {
    id: "robin", name: "American Robin", icon: "🐦", category: "bird", lesson: "soil-food-web", source: CORNELL,
    hint: "Hops through the grass, especially on rainy days.",
    fact: {
      elementary: "Robins hunt for earthworms in the grass. You often see them after it rains, when worms come up.",
      middle: "Robins find worms mostly by sight. They tilt their heads to look closely with one eye before they grab.",
      high: "Robins depend on soil life, so they reveal soil health. In the 1950s and 60s, the pesticide DDT built up in earthworms and killed robins that ate them, a story Rachel Carson told in Silent Spring (1962).",
    },
  },
  {
    id: "chickadee", name: "Black-capped Chickadee", icon: "🐦", category: "bird", source: CORNELL,
    hint: "Flits through the forest edge in fall and winter.",
    fact: {
      elementary: "Chickadees stay all winter long. They hide seeds in lots of spots and remember where they put them.",
      middle: "A chickadee can hide thousands of seeds in the fall and remember hiding places for weeks.",
      high: "In fall, part of a chickadee's brain used for spatial memory (the hippocampus) adds new neurons, helping it remember food caches. On cold nights chickadees lower their body temperature to save energy.",
    },
  },

  // ── Pond life ──
  {
    id: "frog", name: "Frog", icon: "🐸", category: "animal", lesson: "soil-threats", source: { org: "U.S. Geological Survey, Amphibian Research and Monitoring", url: "https://armi.usgs.gov" },
    hint: "Sits on the pond shore in spring and summer, especially when it rains.",
    fact: {
      elementary: "Frogs drink and breathe partly through their skin, so they need clean water.",
      middle: "Frogs start life as tadpoles in water, then grow legs and lungs. That change is called metamorphosis. Grown frogs eat lots of insects.",
      high: "Amphibians' thin, permeable skin makes them sensitive to pollution, so they are indicator species. Sediment and fertilizer washing off bare farm soil can harm the ponds they live in.",
    },
  },
  {
    id: "pond-life", name: "Pond Life", icon: "💧", category: "animal", lesson: "soil-threats", source: { org: "U.S. Environmental Protection Agency, Nutrient Pollution", url: "https://www.epa.gov/nutrientpollution" },
    hint: "Visit the pond.",
    fact: {
      elementary: "A pond is full of life: tadpoles, water bugs, snails, and tiny green algae.",
      middle: "Algae and water plants make oxygen by photosynthesis. But too much fertilizer washing into a pond makes algae grow out of control.",
      high: "Nitrogen and phosphorus runoff cause eutrophication: algae bloom, then die, and decomposers use up the dissolved oxygen, so fish suffocate. Covered, living soil keeps nutrients on the farm and out of the water.",
    },
  },

  // ── Weather & sky ──
  {
    id: "rainbow", name: "Rainbow", icon: "🌈", category: "weather", source: NOAA,
    hint: "Watch for a sunny morning right after a rainy day.",
    fact: {
      elementary: "A rainbow appears when sunlight shines through raindrops. Each drop bends the light and splits it into colors.",
      middle: "Raindrops refract (bend), reflect, and refract sunlight again. Each color bends a slightly different amount, so white light spreads into a spectrum.",
      high: "The main rainbow forms about 42° away from the point directly opposite the sun, so you only see one with the sun behind you. A fainter second bow at about 51° has its colors reversed because of two reflections inside each drop.",
    },
  },
  {
    id: "thunderstorm", name: "Thunderstorm", icon: "⛈️", category: "weather", lesson: "roots-and-nitrogen", source: NOAA,
    hint: "Live through a thunderstorm.",
    fact: {
      elementary: "Thunder is the sound lightning makes. Lightning heats the air so fast that it booms!",
      middle: "Lightning heats the air to about 50,000°F, hotter than the surface of the sun. The air expands so fast it makes a sound wave: thunder.",
      high: "Lightning splits nitrogen molecules in the air, forming nitrogen oxides that rain carries into the soil as nitrate. It's a natural part of the nitrogen cycle, though much smaller than biological fixation by microbes.",
    },
  },
  {
    id: "frost", name: "Frost", icon: "🥶", category: "weather", source: NOAA,
    hint: "Wake up on a frosty morning.",
    fact: {
      elementary: "Frost is ice that forms on cold, clear nights. It can hurt tender plants like beans and tomatoes.",
      middle: "Frost forms when surfaces get colder than 32°F (0°C) and water vapor in the air turns straight into ice. That jump from gas to solid is called deposition.",
      high: "On calm, clear nights, the ground radiates heat to the sky and can cool below the air temperature. Ice crystals in plant tissue rupture cells. Hardy crops like carrots and wheat build up sugars and proteins that work like antifreeze.",
    },
  },
  {
    id: "snowflake", name: "Snowflake", icon: "❄️", category: "weather", source: NOAA,
    hint: "Watch the snow fall in winter.",
    fact: {
      elementary: "Snowflakes have six sides because of the way water molecules fit together when they freeze.",
      middle: "Snow forms when water vapor freezes straight into ice crystals in cold clouds. A snow blanket insulates the soil like a quilt.",
      high: "Ice's six-sided crystal lattice comes from hydrogen bonding. Whether a crystal grows as a plate, needle, or branching star depends on temperature and humidity. Fresh snow is mostly air, which makes it an excellent insulator for life in the soil below.",
    },
  },

  // ── Rocks & minerals ──
  {
    id: "copperOre", name: "Copper Ore", icon: "🟠", category: "rock", source: USGS_MINERALS,
    hint: "Mine an ore rock near the top of the mine.",
    fact: {
      elementary: "Copper is a reddish metal found inside some rocks. People have used it for more than 10,000 years, and today it carries electricity through the wires in your walls.",
      middle: "Copper ores like malachite (green) and chalcopyrite (brassy yellow) are minerals that contain copper. Heating them in a furnace separates the metal from the rest of the rock, a process called smelting.",
      high: "Most copper today comes from porphyry deposits, where hot fluids from cooling magma left copper sulfides spread through huge volumes of rock. Because ore is often under 1% copper, mines move enormous amounts of rock, so recycling copper saves a lot of energy.",
    },
  },
  {
    id: "tinOre", name: "Tin Ore", icon: "⚪", category: "rock", source: USGS_MINERALS,
    hint: "Mine a dark, heavy ore rock.",
    fact: {
      elementary: "Tin is a soft, silvery metal. Mixed with copper it makes bronze, a metal so useful that a whole period of history is called the Bronze Age!",
      middle: "The main tin ore is cassiterite, a very heavy, dark mineral. Melting about 9 parts copper with 1 part tin makes bronze, which is harder than either metal alone. A mix of metals is called an alloy.",
      high: "Cassiterite (SnO₂) is dense and resists weathering, so it collects in stream gravels as placer deposits. Bronze is harder than copper because the larger tin atoms disrupt the copper crystal lattice and block the planes of atoms from sliding.",
    },
  },
  {
    id: "ironOre", name: "Iron Ore", icon: "🟤", category: "rock", source: USGS_MINERALS,
    hint: "Mine deeper, from floor 5 down.",
    fact: {
      elementary: "Iron is the metal in steel, and it's also what makes some rocks and soils look red: rust! Your blood is red because of iron too.",
      middle: "Iron ores like hematite and magnetite are iron oxides: iron joined with oxygen. A blast furnace uses carbon to pull the oxygen away, leaving iron. Red soils get their color from iron oxides.",
      high: "Banded iron formations formed 2–3 billion years ago when oxygen made by early photosynthesizers reacted with iron dissolved in the oceans and settled out as layers of iron oxide. They're a record of Earth's atmosphere becoming oxygen-rich.",
    },
  },
  {
    id: "goldOre", name: "Gold", icon: "🟡", category: "rock", source: USGS_MINERALS,
    hint: "Mine deep, from floor 10 down.",
    fact: {
      elementary: "Gold is a shiny yellow metal that never rusts. It's found as tiny flakes in rock or in stream gravel.",
      middle: "Gold is often found as the pure element (native gold) in veins of quartz, where hot water deposited it in cracks. It's so unreactive that it doesn't rust or tarnish, which is why old gold coins still shine.",
      high: "Gold is soft (2.5–3 on the Mohs scale) and very dense, so pure gold tools would bend and wear quickly. It conducts electricity well and never corrodes, so tiny amounts are used in electronics connectors.",
    },
  },
  {
    id: "mithrilOre", name: "Mithril", icon: "🔷", category: "rock", source: USGS_MINERALS,
    hint: "Mine the deepest floors, from 20 down.",
    fact: {
      elementary: "Mithril is a metal from stories, not from the real Earth! In real life, the strongest, lightest metals, like titanium, come from minerals too.",
      middle: "Mithril was invented for fantasy books. Real metals with similar magic, like titanium (strong and light) come from minerals such as ilmenite and rutile, often found in beach sands.",
      high: "Titanium is the 9th most common element in Earth's crust, yet it's expensive because separating it from oxygen takes a lot of energy (the Kroll process). Its high strength-to-weight ratio makes it valuable for aircraft and medical implants.",
    },
  },
  {
    id: "smelting", name: "Smelting", icon: "🔥", category: "rock", source: USGS_MINERALS,
    hint: "Smelt ore into a bar at a furnace.",
    fact: {
      elementary: "Metal in rocks is mixed with other stuff. Heating ore in a very hot fire melts the metal out so it can be poured into bars. That's smelting!",
      middle: "Most ores are compounds, like a metal joined to oxygen or sulfur. Smelting uses heat and carbon (from charcoal or coke) to pull the oxygen away, leaving the pure metal behind.",
      high: "In smelting, carbon monoxide from burning carbon reduces metal oxides (for example Fe₂O₃ + 3CO → 2Fe + 3CO₂). It takes a lot of energy and releases CO₂, which is why recycling metal and newer methods using hydrogen matter for the climate.",
    },
  },
  {
    id: "alloy", name: "Bronze, an Alloy", icon: "🟫", category: "rock", source: USGS_MINERALS,
    hint: "Smelt copper and tin together.",
    fact: {
      elementary: "Bronze is copper and tin melted together. Mixing metals can make a new metal that's stronger than either one. A mix of metals is called an alloy.",
      middle: "About 5,000 years ago people discovered that adding tin to copper made bronze, which is much harder. It made better tools and weapons, starting the Bronze Age. Steel (iron + carbon) and brass (copper + zinc) are alloys too.",
      high: "In an alloy, atoms of a different size distort the metal's crystal lattice and pin dislocations (the defects that let planes of atoms slip), so the metal resists bending: solid-solution strengthening. Bronze with about 12% tin is far harder than pure copper.",
    },
  },
  {
    id: "sun-to-supper", name: "From Sun to Supper", icon: "🍲", category: "soil", source: MYPLATE,
    hint: "Cook something from your harvest.",
    fact: {
      elementary: "Plants catch sunlight and store its energy in their leaves, roots, and seeds. When you eat food from your garden, that sunshine energy becomes yours!",
      middle: "Photosynthesis turns sunlight, water, and carbon dioxide into sugar. Plants store it as starch (potatoes, wheat) or oil (sunflower seeds). Cooking breaks down tough cell walls and starch so your body can use more of that energy.",
      high: "Heat gelatinizes starch granules and denatures proteins, making them easier for digestive enzymes to break down. Your cells then release the stored chemical energy through cellular respiration, the reverse of photosynthesis: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy.",
    },
  },
];

export const JOURNAL_BY_ID: Record<string, JournalEntry> = Object.fromEntries(JOURNAL.map((e) => [e.id, e]));

export function journalEntry(id: string): JournalEntry | undefined {
  return JOURNAL_BY_ID[id];
}
