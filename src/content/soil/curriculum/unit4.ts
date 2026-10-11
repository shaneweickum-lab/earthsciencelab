import type { CurriculumLesson } from "./types";

/** Unit 4: Soils of the World */
export const UNIT4: CurriculumLesson[] = [
  {
    slug: "soil-orders",
    unit: 4,
    title: "The 12 Soil Orders",
    icon: "🗂️",
    bigIdea: "Scientists sort the world's soils into 12 orders based on the layers and properties they can see and measure, and each order tells a story about how and where that soil formed.",
    interactive: { type: "soil-orders", title: "Meet the 12 soil orders", intro: "Tap an order to see what it's like and where to find it on the Soil Globe." },
    sources: ["nrcs-kst", "nrcs-12orders", "nrcs-ssm", "weil-brady", "sssa-kskl", "smithsonian-dig-it"],
    standards: {
      elementary: ["4-ESS2-2", "5-ESS2-1"],
      middle: ["MS-ESS2-1", "MS-ESS3-1"],
      high: ["HS-ESS2-7", "HS-ESS3-1"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "Soils are not all the same! Scientists sort them into 12 big groups, just like you might sort rocks or leaves.",
        objectives: [
          "I can explain why scientists sort soils into groups.",
          "I can name at least three soil orders and tell one thing about each.",
          "I can notice that all soil order names end in \"sol\", which means soil.",
        ],
        vocab: [
          { term: "Classify", def: "To sort things into groups by how they are alike." },
          { term: "Soil order", def: "One of the 12 biggest groups scientists use to sort soils." },
          { term: "Layer", def: "A band of soil that looks different from the soil above and below it." },
          { term: "Permafrost", def: "Ground that stays frozen all year long." },
        ],
        sections: [
          {
            heading: "Sorting soils",
            body: [
              "You sort things all the time. You might put your crayons in one box and your markers in another. Scientists sort soils too!",
              "They dig a hole and look at the soil's layers, colors, and feel. Then they put it into one of 12 big groups called soil orders.",
            ],
            callout: { title: "Name clue", text: "Every soil order name ends in \"sol\". That comes from a Latin word for soil." },
            source: "nrcs-kst",
          },
          {
            heading: "Meet some soil orders",
            body: [
              "Mollisols are grassland soils. Grass roots made their top layer thick, dark, and soft. They are some of the best farm soils on Earth.",
              "Aridisols are desert soils. They are dry and have very little dark plant material in them.",
              "Gelisols are frozen soils in very cold places. Deep down they have permafrost, ground that stays frozen all year.",
            ],
            source: "nrcs-12orders",
          },
          {
            heading: "More soil orders",
            body: [
              "Andisols form from volcano ash. They are light and fluffy and can hold lots of water.",
              "Histosols are squishy soils in bogs and swamps. They are made mostly of old plant parts that rotted very slowly.",
              "Oxisols are very old red soils in warm, rainy places near the equator. Lots of rain over a very long time washed away much of their plant food.",
            ],
            callout: { title: "Try it", text: "Open the Soil Globe in this app to see where each soil order is found around the world." },
            source: "smithsonian-dig-it",
          },
        ],
        activity: {
          title: "Soil order trading card",
          time: "25 minutes",
          materials: ["An index card or half sheet of paper", "Crayons or colored pencils", "The soil orders interactive or a printed list of soil orders"],
          steps: [
            "Pick one soil order from the interactive.",
            "On the front of your card, write its name and draw what it might look like. Use the right colors, like dark brown for Mollisols or red for Oxisols.",
            "On the back, write where it is found and one cool fact about it.",
            "Trade cards with a classmate and teach each other about your soil.",
          ],
          lookFor: "Notice that each soil has its own color and its own home, like grasslands, deserts, or frozen land.",
        },
        quiz: [
          { prompt: "Why do scientists sort soils into groups?", options: ["To make soil heavier", "To understand and talk about different kinds of soil", "To make soil change color", "Because all soils are the same"], answer: 1, explain: "Sorting soils helps scientists understand them and share what they learn." },
          { prompt: "How many soil orders are there in the USDA system?", options: ["3", "7", "12", "100"], answer: 2, explain: "The USDA system has 12 soil orders." },
          { prompt: "Which soil order is found in grasslands and has a thick, dark top layer?", options: ["Mollisols", "Aridisols", "Gelisols", "Histosols"], answer: 0, explain: "Grass roots build the thick, dark top layer of Mollisols." },
          { prompt: "Where would you find a Gelisol?", options: ["In a hot desert", "In a very cold place with frozen ground", "On a sandy beach", "In a rainforest"], answer: 1, explain: "Gelisols have permafrost, ground that stays frozen all year." },
          { prompt: "What do all soil order names end with?", options: ["\"rock\"", "\"dirt\"", "\"land\"", "\"sol\""], answer: 3, explain: "\"Sol\" comes from a Latin word for soil, so every order name ends that way." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "From frozen tundra to red tropical clay, the USDA sorts every soil into one of 12 orders. Each name is a clue to what the soil is like and how it formed.",
        objectives: [
          "I can explain why soil scientists use a classification system.",
          "I can describe all 12 soil orders and use their name roots to remember them.",
          "I can connect a soil order to the climate, organisms, or parent material that formed it.",
        ],
        vocab: [
          { term: "Soil Taxonomy", def: "The USDA system for classifying soils into groups based on properties that can be observed and measured." },
          { term: "Horizon", def: "A layer in the soil that formed roughly parallel to the surface and differs from the layers above and below it." },
          { term: "Leaching", def: "The washing of dissolved materials down and out of the soil by water." },
          { term: "Weathering", def: "The breaking down of rocks and minerals by water, air, temperature, and living things." },
          { term: "Parent material", def: "The rock, ash, or sediment a soil forms from." },
        ],
        sections: [
          {
            heading: "Why classify soils?",
            body: [
              "There are tens of thousands of different soils in the United States alone. To make sense of them, the USDA uses a system called Soil Taxonomy. It sorts soils by properties scientists can see and measure in a soil pit, like horizons, color, clay content, and chemistry.",
              "Knowing a soil's order tells farmers, engineers, and builders a lot. A Vertisol might crack a building's foundation. A Histosol may sink if drained. A Mollisol is usually great for crops.",
            ],
            source: "nrcs-kst",
          },
          {
            heading: "Soils shaped by climate and life",
            body: [
              "Mollisols (Latin mollis, soft) have thick, dark, crumbly topsoil built by grass roots. They cover more of the United States than any other order, including much of the Great Plains and Corn Belt.",
              "Aridisols (aridus, dry) are desert soils with little organic matter. Salts or lime can build up because there isn't enough water to wash them away. Gelisols (gelare, to freeze) have permafrost near the surface.",
              "Spodosols (Greek spodos, wood ash) are sandy, acidic soils under pine and spruce forests, often with a pale gray layer that looks like ash. Alfisols (from Al and Fe, aluminum and iron) form under forests and have clay that washed down into a lower layer. They are fairly fertile.",
            ],
            source: "nrcs-12orders",
          },
          {
            heading: "Old soils, young soils",
            body: [
              "Oxisols (named for oxides) are very old, deeply weathered red soils of the tropics. Heavy rain over a long time has leached out most nutrients, leaving iron and aluminum oxides. Ultisols (ultimus, last) are also old, acidic, and weathered, with red or yellow clay below.",
              "At the other end, Entisols (from \"recent\") have barely started forming, like fresh floodplain mud or sand dunes. Inceptisols (inceptum, beginning) are young soils just starting to form layers, common on steep slopes.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Soils shaped by special ingredients",
            body: [
              "Some orders are defined by what they're made of. Andisols (Japanese an do, dark soil) form from volcanic ash. They are light, fluffy, and hold lots of water. Histosols (histos, tissue) are made mostly of partly rotted plants in bogs and swamps.",
              "Vertisols (verto, to turn) are full of clay that swells when wet and shrinks and cracks when dry. Surface soil falls into the cracks, so the soil slowly churns itself.",
            ],
            callout: { title: "Explore", text: "Use the Soil Globe page to find where each order is common. Look for patterns: where are the Gelisols? The Oxisols?" },
            source: "nrcs-12orders",
          },
        ],
        activity: {
          title: "Cooking Up Soils recipe cards",
          time: "30 minutes",
          materials: ["Index cards", "Colored pencils", "The soil orders interactive or Soil Globe", "A world map (optional)"],
          steps: [
            "Work with a partner and pick two soil orders that are very different, such as an Aridisol and an Oxisol.",
            "Write a \"recipe\" for each one. List the ingredients (parent material, climate, plants or animals) and the cooking time (young or very old).",
            "Add the \"cooking directions\": what happens during formation, such as leaching, salt buildup, or clay moving downward.",
            "Swap recipe cards with another pair and see if they can guess which soil order each recipe makes.",
          ],
          lookFor: "Notice that different climates, organisms, and starting materials \"cook up\" very different soils, and that time matters too.",
        },
        quiz: [
          { prompt: "Which soil order has thick, dark topsoil built by grass roots?", options: ["Spodosols", "Mollisols", "Oxisols", "Entisols"], answer: 1, explain: "Mollisols get their dark, soft topsoil from grassland roots adding organic matter for thousands of years." },
          { prompt: "A soil forms from volcanic ash and holds a lot of water. Which order is it most likely to be?", options: ["Andisols", "Aridisols", "Vertisols", "Gelisols"], answer: 0, explain: "Andisols form from volcanic ash and are light with a high water-holding capacity." },
          { prompt: "The name Aridisol comes from the Latin word for…", options: ["Old", "Soft", "Frozen", "Dry"], answer: 3, explain: "Aridus means dry, and Aridisols are desert soils." },
          { prompt: "Why are Oxisols low in nutrients?", options: ["They are too young", "They are frozen", "Heavy rain over a very long time leached the nutrients away", "They are made of volcanic ash"], answer: 2, explain: "Oxisols are old, highly weathered tropical soils, and rain has washed out most nutrients." },
          { prompt: "Which soil order is the youngest, with almost no horizons?", options: ["Ultisols", "Entisols", "Alfisols", "Oxisols"], answer: 1, explain: "Entisols are recent soils that have barely begun to form layers." },
          { prompt: "Why might an engineer care that a site has Vertisols?", options: ["The clay shrinks and swells and can crack foundations", "The soil is too sandy to hold anything", "The soil is always frozen", "The soil is too acidic for concrete"], answer: 0, explain: "Vertisol clays swell when wet and shrink when dry, which can damage roads and buildings." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Soil Taxonomy works like a key: you test a soil for diagnostic horizons and properties, and the first order whose rules it meets is its order. That system lets a soil in Florida be compared with one in Brazil.",
        objectives: [
          "I can explain the hierarchy of Soil Taxonomy from order to series and read a taxonomic name.",
          "I can describe the defining features of all 12 soil orders.",
          "I can identify key diagnostic horizons and use them to distinguish orders such as Alfisols and Ultisols.",
          "I can explain how classification informs land use decisions.",
        ],
        vocab: [
          { term: "Diagnostic horizon", def: "A soil horizon with specific, measurable properties used to classify soils, such as a mollic epipedon or argillic horizon." },
          { term: "Epipedon", def: "A diagnostic horizon at or near the surface, usually darkened by organic matter." },
          { term: "Base saturation", def: "The percentage of a soil's cation exchange sites held by base cations such as calcium, magnesium, potassium, and sodium rather than acidic cations." },
          { term: "Soil series", def: "The most specific level of Soil Taxonomy, a group of soils with similar horizons and properties, usually named for a place where it was first described." },
          { term: "Formative element", def: "A syllable in a taxonomic name that carries meaning, such as \"aqu\" for wet or \"ud\" for humid." },
        ],
        sections: [
          {
            heading: "A hierarchy from order to series",
            body: [
              "USDA Soil Taxonomy has six levels: order, suborder, great group, subgroup, family, and series. Each level down adds detail. There are 12 orders, and the NRCS keeps official descriptions for more than 20,000 soil series.",
              "The names are built from formative elements. Florida's state soil, Myakka, is a Spodosol (order). It is in the suborder Aquods (\"aqu\" for wet), the great group Alaquods (\"al\" for aluminum), and the subgroup Aeric Alaquods (better aerated than typical). Its family is sandy, siliceous, hyperthermic, which describes texture, mineralogy, and soil temperature. Myakka is its series name.",
            ],
            callout: { title: "Keys, not guesses", text: "The Keys to Soil Taxonomy are read in order. A soil is placed in the first order whose requirements it meets, starting with Gelisols, then Histosols, Spodosols, Andisols, Oxisols, Vertisols, Aridisols, Ultisols, Mollisols, Alfisols, Inceptisols, and finally Entisols." },
            source: "nrcs-kst",
          },
          {
            heading: "Diagnostic horizons",
            body: [
              "A mollic epipedon is a thick, dark surface horizon rich in organic matter with base saturation of 50% or more. It defines most Mollisols. An argillic horizon is a subsurface layer where clay has accumulated after moving down from above, and it shows up in Alfisols, Ultisols, and some Mollisols and Aridisols.",
              "A spodic horizon is a subsurface accumulation of humus combined with aluminum, often with iron. It usually sits beneath a pale, leached albic (E) horizon, giving Spodosols their striking bands. An oxic horizon is an intensely weathered subsurface layer dominated by low-activity clays and iron and aluminum oxides, with very low capacity to hold nutrient cations. It defines Oxisols.",
              "Base saturation separates two similar orders. Alfisols and Ultisols both have clay-enriched subsoils, but Ultisols are more leached, with base saturation below 35%, while Alfisols are at 35% or higher.",
            ],
            source: "weil-brady",
          },
          {
            heading: "All 12 orders at a glance",
            body: [
              "Gelisols have permafrost within about 1 meter of the surface. Histosols are mostly organic material, such as peat and muck. Spodosols have a spodic horizon. Andisols are dominated by volcanic materials with low bulk density and minerals like allophane. Oxisols have an oxic horizon.",
              "Vertisols have high clay content, deep cracks when dry, and slickensides, shiny surfaces formed as clay slides past clay. Aridisols have an aridic (dry) moisture regime plus a developed subsurface horizon, often one enriched in lime, gypsum, or salt. Ultisols and Alfisols have clay-enriched subsoils with low and higher base saturation. Mollisols have a mollic epipedon.",
              "Inceptisols show early development, such as a weak cambic horizon. Entisols show little or no horizon development at all.",
            ],
            source: "nrcs-12orders",
          },
          {
            heading: "Why classification matters to people",
            body: [
              "Soil orders predict how land will behave. Mollisols underpin much of the world's grain production. Oxisols and Ultisols usually need lime and fertilizer to farm well. Vertisols' shrink-swell clays damage roads, pipes, and foundations. Draining Histosols for farming exposes their organic matter to air, so it decomposes, releasing carbon dioxide, and the land surface sinks.",
              "Because the system is based on measurable properties, scientists anywhere can compare soils and transfer knowledge, for example how a management practice on one Ultisol might work on another.",
            ],
            source: "sssa-kskl",
          },
        ],
        activity: {
          title: "Key out a soil",
          time: "40 minutes",
          materials: ["Printed soil profile descriptions or photos (from the Soil Globe or a teacher handout)", "A simplified dichotomous key to the 12 orders", "Paper and pencil"],
          steps: [
            "Build or receive a simplified key that asks questions in the official order: Is there permafrost within 1 m? Is it mostly organic material? Is there a spodic horizon? Continue through all 12 orders.",
            "For each profile description, work through the key and record the first order whose rule it meets.",
            "Write one sentence explaining which diagnostic horizon or property decided the classification.",
            "Compare answers with a partner and discuss any profile you disagreed on. Identify which measurement, such as base saturation, would settle it.",
          ],
          lookFor: "Notice that the key order matters. A frozen organic soil keys out as a Gelisol, not a Histosol, because Gelisols come first.",
        },
        quiz: [
          { prompt: "Which list shows the levels of Soil Taxonomy from broadest to most specific?", options: ["Series, family, subgroup, great group, suborder, order", "Order, suborder, great group, subgroup, family, series", "Order, great group, suborder, family, subgroup, series", "Family, order, series, subgroup, suborder, great group"], answer: 1, explain: "Soil Taxonomy goes order, suborder, great group, subgroup, family, series." },
          { prompt: "A soil has a thick, dark, organic-rich surface horizon with 70% base saturation. Which diagnostic horizon does this describe?", options: ["Spodic horizon", "Oxic horizon", "Mollic epipedon", "Albic horizon"], answer: 2, explain: "A mollic epipedon is thick, dark, rich in organic matter, and has at least 50% base saturation." },
          {
            prompt: "Lab data for four forest soils, each with a clay-enriched (argillic) subsoil, show base saturation in that subsoil: Soil A 62%, Soil B 18%, Soil C 41%, Soil D 25%. Which soils are most likely Ultisols?",
            options: ["A and C", "B and D", "Only A", "All four"],
            answer: 1,
            explain: "Ultisols have base saturation below 35%, so Soils B (18%) and D (25%) fit. A and C are 35% or higher, which fits Alfisols.",
          },
          { prompt: "In the taxonomic name \"Aeric Alaquods\", what does the formative element \"aqu\" tell you?", options: ["The soil is wet for long periods", "The soil is very dry", "The soil is volcanic", "The soil is frozen"], answer: 0, explain: "\"Aqu\" signals wetness. Aquods are Spodosols that are saturated for much of the year." },
          { prompt: "Why do Oxisols usually need fertilizer and lime to grow crops well?", options: ["They have too much organic matter", "Their clays shrink and swell", "Their oxic horizon has very little capacity to hold nutrient cations after intense weathering", "They are frozen most of the year"], answer: 2, explain: "Long, intense weathering leaves Oxisols with low-activity clays and oxides that hold few nutrients, and they tend to be acidic." },
          { prompt: "What happens when a Histosol is drained for farming?", options: ["It becomes a Mollisol right away", "Its organic matter decomposes, releasing carbon dioxide, and the land surface sinks", "It gains organic matter quickly", "Nothing changes"], answer: 1, explain: "Air reaches the once-waterlogged organic material, microbes decompose it, carbon is lost, and the surface subsides." },
        ],
      },
    },
  },
  {
    slug: "soils-and-climate",
    unit: 4,
    title: "Why Soils Differ Around the World",
    icon: "🌡️",
    bigIdea: "Climate and the plants that grow in it shape soils, so the world's soils form patterns we can map, from dark grassland soils to frozen tundra soils.",
    sources: ["jenny-1941", "nrcs-12orders", "nrcs-state-soils", "weil-brady", "nrcs-ssm", "nrcs-wss", "noaa-permafrost", "smithsonian-dig-it"],
    standards: {
      elementary: ["3-ESS2-2", "4-ESS2-2", "5-ESS2-1"],
      middle: ["MS-ESS2-6", "MS-ESS3-1"],
      high: ["HS-ESS2-2", "HS-ESS2-7", "HS-ESS3-1"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "A desert soil looks very different from a rainforest soil. Rain, heat, cold, and plants all help decide what kind of soil forms in a place.",
        objectives: [
          "I can explain how rain and temperature change soil.",
          "I can match a place, like a desert or grassland, to the kind of soil found there.",
          "I can name my state's soil or find out what it is.",
        ],
        vocab: [
          { term: "Climate", def: "The usual weather in a place over many years." },
          { term: "Grassland", def: "A big open place covered mostly by grasses." },
          { term: "Tundra", def: "A very cold, treeless place where the ground deep down stays frozen." },
          { term: "State soil", def: "A soil chosen to represent a state, like a state bird or state flower." },
        ],
        sections: [
          {
            heading: "Weather makes soil",
            body: [
              "Soil forms very slowly. Rain, sun, heat, and cold all help. So do plants and animals.",
              "In rainy places, water soaks down through the soil and carries some things away. In dry places, there is not much water to move things, so the soil stays more like it started.",
            ],
            source: "jenny-1941",
          },
          {
            heading: "Soils around the world",
            body: [
              "Grasslands grow dark, soft soils. Grass roots grow, die, and add dark plant material year after year.",
              "Deserts have dry, light-colored soils. Rainforests have very old red soils. Rain has washed away much of their plant food. Cold tundra has soils with frozen ground underneath.",
            ],
            callout: { title: "Go exploring", text: "Visit the Soil Globe in this app to spin the Earth and see where these soils are found." },
            source: "nrcs-12orders",
          },
          {
            heading: "Every state has a soil",
            body: [
              "Just like a state bird, every state has a state soil. Texas has Houston Black, a dark clay that cracks open when it dries out.",
              "Iowa has Tama, a dark soil that formed under tall prairie grass. Florida has Myakka, a sandy soil found in flat pine woods.",
            ],
            source: "nrcs-state-soils",
          },
        ],
        activity: {
          title: "Climate and soil matching game",
          time: "20 minutes",
          materials: ["Picture cards of places: grassland, desert, rainforest, pine forest, tundra, volcano", "Soil cards with a color and short description for each soil", "Crayons"],
          steps: [
            "Lay the place cards in a row.",
            "Read each soil card with a partner. Talk about the colors and clues.",
            "Match each soil card to the place where it forms.",
            "Check your answers on the Soil Globe, then color a picture of your favorite place and its soil.",
          ],
          lookFor: "Notice that dark soils go with grasslands, red soils go with rainy warm places, and frozen soils go with cold places.",
        },
        quiz: [
          { prompt: "Which place has dark, soft soil made by grass roots?", options: ["Desert", "Grassland", "Tundra", "Beach"], answer: 1, explain: "Grass roots add dark plant material to the soil every year." },
          { prompt: "What does a lot of rain do to soil over a long time?", options: ["Washes some things down and away", "Turns it to rock", "Freezes it", "Makes it disappear"], answer: 0, explain: "Rainwater soaks down and carries some materials away." },
          { prompt: "Which place has soil with frozen ground underneath?", options: ["Rainforest", "Desert", "Grassland", "Tundra"], answer: 3, explain: "In the tundra, the ground deep down stays frozen all year." },
          { prompt: "What is a state soil?", options: ["A soil sold in stores", "The only soil in a state", "A soil chosen to represent a state", "A soil made in a lab"], answer: 2, explain: "A state soil is picked to represent the state, like a state bird." },
          { prompt: "Texas's state soil, Houston Black, is a clay that…", options: ["Cracks open when it dries", "Is always frozen", "Is pure sand", "Glows in the dark"], answer: 0, explain: "Houston Black clay shrinks and cracks when dry and swells when wet." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "If you flew from a desert to a rainforest, the soil below would change from pale and salty to deep and red. Climate and vegetation are a big reason why.",
        objectives: [
          "I can explain how temperature and precipitation affect soil formation.",
          "I can compare leaching and accumulation and predict which happens in a given climate.",
          "I can match major biomes to the soil orders that form there.",
          "I can describe my state soil and why it was chosen.",
        ],
        vocab: [
          { term: "Biome", def: "A large region with a similar climate, plants, and animals, such as a grassland or tundra." },
          { term: "Leaching", def: "The removal of dissolved materials as water moves down through soil." },
          { term: "Accumulation", def: "The buildup of materials such as salt, lime, or clay in a soil layer." },
          { term: "Permafrost", def: "Ground that stays at or below freezing for at least two years in a row." },
          { term: "Soil-forming factors", def: "Climate, organisms, relief (landscape shape), parent material, and time." },
        ],
        sections: [
          {
            heading: "Five factors, one big driver",
            body: [
              "In 1941, soil scientist Hans Jenny described five factors that form soil: climate, organisms, relief, parent material, and time. Climate is often the biggest driver across large regions.",
              "Temperature controls how fast chemical weathering and decomposition happen. Precipitation controls how much water moves through the soil. Climate also decides which plants grow, and plants add organic matter.",
            ],
            source: "jenny-1941",
          },
          {
            heading: "Leaching vs. accumulation",
            body: [
              "Where rain is plentiful, water soaks through the whole soil and carries dissolved nutrients, lime, and even clay downward. This is leaching. Over a very long time, warm, wet tropical soils can lose most of their nutrients.",
              "Where rain is scarce, water only wets the upper part of the soil and then evaporates. Dissolved lime and salts are left behind and build up in layers. This is accumulation, and it is common in desert soils.",
            ],
            callout: { title: "Rule of thumb", text: "More water moving down means more leaching. Less water means more accumulation." },
            source: "weil-brady",
          },
          {
            heading: "Biomes and their soils",
            body: [
              "Grasslands build Mollisols, with dark topsoil from dense grass roots. Tropical rainforests are home to Oxisols and Ultisols, old soils leached by heavy rain. Deserts have Aridisols, low in organic matter and often with lime or salt layers.",
              "Cool conifer forests form Spodosols. Acidic needle litter helps leach iron, aluminum, and organic matter out of the upper layer, leaving a pale gray band. Tundra has Gelisols with permafrost. Near volcanoes, ash weathers into Andisols, which can be very fertile. That last one shows that parent material can matter as much as climate.",
            ],
            source: "nrcs-12orders",
          },
          {
            heading: "State soils",
            body: [
              "Every U.S. state has a state soil that represents it. Texas's Houston Black is a Vertisol, a dark clay of the Blackland Prairie that swells when wet and cracks when dry. It covers about 1.5 million acres and is farmed for crops like cotton, sorghum, and corn.",
              "Iowa's Tama is a Mollisol that formed in loess, windblown silt, under tall prairie grass. Florida's Myakka is a Spodosol of the flatwoods. Florida made it the official state soil in 1989, and it covers more than 1.5 million acres.",
            ],
            source: "nrcs-state-soils",
          },
        ],
        activity: {
          title: "State soil research card",
          time: "35 minutes",
          materials: ["Computer or tablet with internet access", "Index cards or a card template", "Colored pencils", "The Soil Globe page (/soil/globe)"],
          steps: [
            "Look up your state soil on the NRCS State Soils page.",
            "Record its name, soil order, parent material, and main land use on your card.",
            "Write the climate of your state: is it wet or dry, warm or cold? Explain how that climate helped make your state soil.",
            "Find your state soil's order on the Soil Globe and note one other part of the world with the same order.",
          ],
          lookFor: "Notice how your state's climate and vegetation explain your state soil's order, and that the same order shows up in places with similar conditions.",
        },
        quiz: [
          { prompt: "Which soil order is most common in tropical rainforests?", options: ["Gelisols", "Aridisols", "Oxisols", "Spodosols"], answer: 2, explain: "Heavy rain and warmth over a long time produce highly weathered Oxisols, along with Ultisols." },
          { prompt: "In a desert, why do salts and lime build up in the soil?", options: ["There's too much rain", "Water doesn't move far enough down to carry them away", "Plants add them", "Permafrost traps them"], answer: 1, explain: "Little rain means water evaporates before leaching dissolved materials out, so they accumulate." },
          { prompt: "Which of these is NOT one of Jenny's five soil-forming factors?", options: ["Climate", "Time", "Parent material", "Ocean tides"], answer: 3, explain: "The five factors are climate, organisms, relief, parent material, and time." },
          { prompt: "Iowa's state soil, Tama, is a Mollisol. What vegetation helped form it?", options: ["Tall prairie grass", "Tropical rainforest", "Desert cactus", "Tundra moss"], answer: 0, explain: "Tama formed under tall prairie grass, whose roots built its thick, dark topsoil." },
          { prompt: "A pale gray layer under a pine forest is a clue to which soil order?", options: ["Vertisols", "Spodosols", "Mollisols", "Aridisols"], answer: 1, explain: "Spodosols have a leached, ash-gray layer under acidic conifer litter." },
          { prompt: "Andisols are found near volcanoes in many climates. What does this show?", options: ["Climate is the only factor", "Parent material can be as important as climate", "Volcanoes stop soil from forming", "Andisols only form in deserts"], answer: 1, explain: "Volcanic ash parent material produces Andisols in many different climates." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Global soil patterns are a record of water and energy moving through landscapes. Reading those patterns helps us farm, build, and predict how soils will respond to a changing climate.",
        objectives: [
          "I can explain how the balance of precipitation and evaporation controls leaching and accumulation.",
          "I can connect the major biomes to their dominant soil orders through specific mechanisms.",
          "I can interpret data relating climate to soil properties.",
          "I can evaluate the role of permafrost soils in the carbon cycle and describe how soils are mapped.",
        ],
        vocab: [
          { term: "Evapotranspiration", def: "Water lost to the air by evaporation from soil plus transpiration from plants." },
          { term: "Calcic horizon", def: "A subsurface horizon where calcium carbonate has accumulated, typical of dry climates." },
          { term: "Podzolization", def: "The process in which acids from organic matter move aluminum, iron, and humus downward, forming a pale E horizon over a spodic horizon." },
          { term: "Permafrost carbon", def: "Organic carbon stored in perennially frozen ground, where cold slows decomposition." },
          { term: "Soil survey", def: "A systematic inventory that maps soils across a landscape and describes their properties and uses." },
        ],
        sections: [
          {
            heading: "Water balance drives soil patterns",
            body: [
              "Jenny's state-factor model treats soil as a function of climate, organisms, relief, parent material, and time. At continental scales, climate dominates through two controls: temperature, which speeds weathering and decomposition, and the balance between precipitation and evapotranspiration.",
              "Where precipitation exceeds evapotranspiration, water drains through the profile and leaches soluble ions, then base cations, and eventually silica, leaving acidic, oxide-rich soils. Where evapotranspiration exceeds precipitation, wetting fronts stop partway down and carbonates, gypsum, or salts precipitate as calcic, gypsic, or salic horizons. Jenny documented that in the central U.S. the depth to the carbonate layer increases as annual rainfall increases.",
            ],
            source: "jenny-1941",
          },
          {
            heading: "Biomes as soil factories",
            body: [
              "Grasslands put much of their growth into dense, fibrous roots that die and are replaced, building the thick mollic epipedons of Mollisols. Moderate rainfall leaches some but not all bases, so fertility stays high. Hot, humid rainforests weather minerals intensely over long periods, producing Oxisols and Ultisols with low base saturation. Most nutrients in these ecosystems cycle quickly through living plants and litter rather than staying in the mineral soil.",
              "Cool conifer forests drop acidic needle litter. Organic acids bind aluminum and iron and carry them downward in a process called podzolization, forming Spodosols. Tundra soils freeze and thaw above permafrost, forming Gelisols. Volcanic regions form Andisols in many climates, showing that parent material can override climate.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Permafrost soils and the carbon cycle",
            body: [
              "Cold, often waterlogged conditions slow decomposition, so Gelisols have accumulated large stores of organic carbon over thousands of years. Scientific estimates suggest soils in the northern permafrost region hold more carbon than the atmosphere currently does, though the exact amount is still being refined.",
              "As the Arctic warms and permafrost thaws, microbes can decompose some of this carbon and release carbon dioxide and methane. That could amplify warming, a feedback. Researchers are still working out how much carbon could be released, how fast, and how much new plant growth might offset it.",
            ],
            callout: { title: "Careful claims", text: "Permafrost carbon is an active research area. Use phrases like \"estimates suggest\" and check how uncertainty is reported." },
            source: "noaa-permafrost",
          },
          {
            heading: "Mapping soils: from state soils to the Web Soil Survey",
            body: [
              "Soil scientists map soils by digging pits, describing horizons, and linking soil types to landscape position, vegetation, and parent material. The NRCS publishes these soil surveys free online through the Web Soil Survey, launched in 2005, where anyone can outline an area and see its soils and their ratings for farming, building, and septic systems.",
              "State soils show how mapping connects to climate. Texas's Houston Black is a Vertisol (Udic Haplusterts) formed in calcareous clays and marls of the Blackland Prairie. Iowa's Tama is a Mollisol formed in loess under tallgrass prairie. Florida's Myakka is a Spodosol (Aeric Alaquods) of poorly drained flatwoods, where a fluctuating water table and acidic sands drive podzolization.",
            ],
            source: "nrcs-wss",
          },
        ],
        activity: {
          title: "Rainfall and carbonate depth analysis",
          time: "40 minutes",
          materials: ["Graph paper or a spreadsheet", "The data table below or soil survey data from the Web Soil Survey", "Access to the Soil Globe page (/soil/globe)"],
          steps: [
            "Use this example data set, modeled on Jenny's classic pattern for grassland soils. It pairs mean annual precipitation with depth to the carbonate layer: 300 mm, 25 cm; 450 mm, 45 cm; 600 mm, 70 cm; 750 mm, 95 cm; 900 mm, 120 cm.",
            "Plot precipitation on the x-axis and depth to carbonates on the y-axis. Draw a best-fit line and calculate its slope.",
            "Explain the mechanism. Why does more rain push the carbonate layer deeper? Predict what happens above about 1,000 mm per year.",
            "Optional: use the Web Soil Survey to look up a real soil near you and check whether it has a calcic horizon, then explain it with your local climate.",
          ],
          lookFor: "Depth to carbonates increases with precipitation because water carries dissolved calcium carbonate deeper before evaporation leaves it behind. In very wet climates, carbonates are leached out entirely.",
        },
        quiz: [
          { prompt: "Under which condition is leaching strongest?", options: ["Evapotranspiration greatly exceeds precipitation", "Precipitation greatly exceeds evapotranspiration", "Precipitation equals zero", "The soil is frozen year-round"], answer: 1, explain: "When more water falls than evaporates, the excess drains through the soil and carries dissolved materials away." },
          {
            prompt: "In an example data set, depth to carbonates is 25 cm at 300 mm of rain and 120 cm at 900 mm of rain. What is the average change in depth per 100 mm of extra rainfall?",
            options: ["About 4 cm", "About 16 cm", "About 40 cm", "About 95 cm"],
            answer: 1,
            explain: "(120 − 25) cm ÷ (900 − 300) mm = 95 cm ÷ 600 mm, or about 16 cm per 100 mm of rain.",
          },
          { prompt: "Which process forms the pale E horizon and spodic horizon of a Spodosol?", options: ["Calcification", "Podzolization", "Salinization", "Shrink-swell churning"], answer: 1, explain: "In podzolization, organic acids carry aluminum, iron, and humus downward." },
          { prompt: "Why have permafrost soils stored so much organic carbon?", options: ["Cold, often waterlogged conditions slow decomposition", "They receive the most rainfall", "They have the most plant growth per year", "Volcanic ash adds carbon"], answer: 0, explain: "Low temperatures and saturation slow microbes, so organic matter accumulates faster than it breaks down." },
          { prompt: "Which statement about thawing permafrost is the most scientifically careful?", options: ["It will certainly release all its carbon within ten years", "It cannot affect climate at all", "It could release carbon dioxide and methane that amplify warming, but the amount and timing are uncertain", "It only releases oxygen"], answer: 2, explain: "Researchers agree thaw can release greenhouse gases, but the size and timing are still active research questions." },
          { prompt: "Why do Andisols appear in both tropical and cold regions?", options: ["They form wherever volcanic ash is the parent material", "They only form in deserts", "They are always frozen", "They form from coral reefs"], answer: 0, explain: "Volcanic parent material controls Andisol formation more than climate does." },
        ],
      },
    },
  },
];
