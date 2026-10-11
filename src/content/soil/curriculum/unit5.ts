import type { CurriculumLesson } from "./types";

/** Unit 5: Soil Health & Stewardship */
export const UNIT5: CurriculumLesson[] = [
  // ───────────────────────────── Lesson 1 ─────────────────────────────
  {
    slug: "healthy-soil",
    unit: 5,
    title: "Signs of Healthy Soil",
    icon: "🩺",
    bigIdea: "Healthy soil is a living ecosystem, and we can check its vital signs, like crumbly structure, fast water soak-in, and plenty of life, to see how well it is working.",
    interactive: { type: "health-sort", title: "Soil Doctor", intro: "Sort each clue: is it a sign of healthy soil or unhealthy soil?" },
    sources: ["nrcs-soil-health", "nrcs-test-kit", "nrcs-soil-is-alive", "weil-brady", "s4t", "smithsonian-dig-it"],
    standards: {
      elementary: ["5-LS2-1", "5-ESS3-1"],
      middle: ["MS-ESS3-3", "MS-LS2-5"],
      high: ["HS-ESS3-4", "HS-LS2-7"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "A doctor checks your heartbeat to see if you are healthy. Soil scientists check soil's clues too, like worms, crumbs, and smell!",
        objectives: [
          "I can name three signs of healthy soil.",
          "I can name two signs of unhealthy soil.",
          "I can use my eyes, hands, and nose to check soil safely.",
        ],
        vocab: [
          { term: "Healthy soil", def: "Soil that is full of life and can help plants grow well." },
          { term: "Crumbs", def: "Little clumps of soil stuck together. Scientists call them aggregates." },
          { term: "Earthworm", def: "A soft, wiggly animal that eats old plants and makes tunnels in soil." },
          { term: "Clue", def: "Something you notice that helps you figure out an answer." },
        ],
        sections: [
          {
            heading: "Soil can be healthy or sick",
            body: [
              "You can be healthy or sick. Soil can too! Healthy soil is alive. It is full of worms, bugs, and tiny living things.",
              "Scientists say healthy soil keeps working year after year to help plants, animals, and people.",
            ],
            source: "nrcs-soil-health",
          },
          {
            heading: "Look and feel",
            body: [
              "Healthy soil is often dark and crumbly, like chocolate cake crumbs. The crumbs have little spaces for air and water.",
              "Sick soil may be hard like a brick, pale, or have a crust on top. Water just sits on it or runs away.",
            ],
            callout: { title: "Soil doctor tip", text: "Squeeze a little damp soil. If it breaks into soft crumbs, that is a good sign!" },
            source: "nrcs-test-kit",
          },
          {
            heading: "Find the life",
            body: [
              "Earthworms are a great clue. They only stay where there is food and air. Their tunnels help rain soak in.",
              "Roots, bugs, and white fuzzy threads called fungi are good clues too.",
            ],
            source: "nrcs-soil-is-alive",
          },
          {
            heading: "Use your nose",
            body: [
              "Healthy soil smells sweet and earthy, like the air after rain. Tiny living things in the soil make that smell.",
              "Soil that smells sour or rotten may not have enough air.",
            ],
            source: "smithsonian-dig-it",
          },
        ],
        activity: {
          title: "Soil checkup",
          time: "25 minutes",
          materials: ["Two cups of soil from different places (like a garden and a path)", "Two paper plates", "A magnifying glass", "A spray bottle of water", "A crayon and paper"],
          steps: [
            "Put each soil on its own plate. Label them A and B.",
            "Look closely with the magnifying glass. Do you see crumbs, roots, or living things?",
            "Spray each soil lightly with water. Smell each one. Which smells more earthy?",
            "Press each soil with your finger. Is it soft and crumbly or hard?",
            "Draw a happy face next to the soil with more healthy clues.",
          ],
          lookFor: "Healthy soil usually has more crumbs, roots, and living things, and it smells earthy.",
          safety: "Do not put soil near your mouth or eyes. Smell by waving air toward your nose. Wash your hands when you finish, and put any bugs or worms back outside.",
        },
        quiz: [
          { prompt: "Which is a sign of healthy soil?", options: ["A hard crust on top", "Lots of earthworms", "Water that runs away", "A sour smell"], answer: 1, explain: "Earthworms live where soil has food and air, so they are a great sign." },
          { prompt: "Healthy soil often feels like…", options: ["Soft, crumbly cake crumbs", "A hard brick", "Smooth glass", "Sticky glue"], answer: 0, explain: "Crumbs leave little spaces for air and water." },
          { prompt: "What does healthy soil smell like?", options: ["Nothing at all", "Rotten eggs", "Sweet and earthy", "Soap"], answer: 2, explain: "Tiny living things in healthy soil make an earthy smell." },
          { prompt: "What happens when rain falls on very hard, sick soil?", options: ["It soaks in fast", "It turns into worms", "It freezes", "It sits on top or runs away"], answer: 3, explain: "Hard soil has few spaces, so water can't soak in." },
          { prompt: "How do earthworm tunnels help soil?", options: ["They let air and water in", "They make soil hard", "They scare plants", "They dry up the soil"], answer: 0, explain: "Worm tunnels are like little pipes for air and water." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "How do farmers and scientists know if soil is healthy? They measure its vital signs, from organic matter and crumb structure to how fast water soaks in.",
        objectives: [
          "I can state the NRCS definition of soil health in my own words.",
          "I can explain the difference between soil quality and soil health.",
          "I can describe at least five indicators of soil health and what they tell us.",
          "I can perform a slake test and an infiltration test and interpret the results.",
        ],
        vocab: [
          { term: "Soil health", def: "The continued capacity of soil to function as a vital living ecosystem that sustains plants, animals, and humans (USDA NRCS)." },
          { term: "Indicator", def: "A measurement or sign that tells you about the condition of something." },
          { term: "Aggregate stability", def: "How well soil crumbs hold together when they get wet." },
          { term: "Infiltration", def: "Water soaking down into the soil from the surface." },
          { term: "Soil respiration", def: "Carbon dioxide released by roots and soil organisms as they breathe. More respiration usually means more soil life." },
        ],
        sections: [
          {
            heading: "Soil health vs. soil quality",
            body: [
              "The USDA Natural Resources Conservation Service (NRCS) defines soil health as \"the continued capacity of soil to function as a vital living ecosystem that sustains plants, animals, and humans.\" The NRCS says soil health is also referred to as soil quality.",
              "The two terms overlap, but they have different emphasis. Soil quality describes how well a soil can do its jobs, such as growing plants and cleaning water. Soil health stresses that soil is alive and that the way we manage it can make it stronger or weaker over time.",
            ],
            source: "nrcs-soil-health",
          },
          {
            heading: "The vital signs",
            body: [
              "Organic matter: decomposed plant, animal, and microbe material. It holds water and nutrients and feeds soil life. NRCS materials estimate that each 1% increase in organic matter can help an acre of topsoil hold up to roughly 20,000 more gallons of water, though the real amount depends on the soil.",
              "Aggregate stability: healthy soil forms crumbs glued by roots, fungal threads, and sticky substances made by microbes. Stable crumbs keep pores open for air and water.",
              "Infiltration: how fast water soaks in. Fast infiltration means less runoff and erosion.",
              "Life: earthworms, fungi, and bacteria. Soil respiration, the carbon dioxide soil life gives off, is a way to measure how active that life is.",
              "Chemistry: pH (most crops grow best around 6 to 7) and nutrients such as nitrogen, phosphorus, and potassium.",
            ],
            source: "nrcs-soil-is-alive",
          },
          {
            heading: "The NRCS Soil Quality Test Kit",
            body: [
              "In the late 1990s, USDA scientists created a Soil Quality Test Kit so farmers could check soil in the field without a lab. Its tests include soil respiration, infiltration, bulk density (how packed the soil is), electrical conductivity (a measure of salts), pH, nitrate, aggregate stability, a slake test, and an earthworm count.",
              "For the earthworm count, you dig out about one cubic foot of soil and count the worms. Many farmers treat 10 or more worms in that amount as a good sign, though worm numbers also depend on season, moisture, and soil type.",
            ],
            callout: { title: "Why compare?", text: "One test result means more when you compare it. Testing a field and a nearby untouched fence line shows how management has changed the soil." },
            source: "nrcs-test-kit",
          },
          {
            heading: "The smell of healthy soil",
            body: [
              "The earthy smell of moist soil comes mostly from geosmin, a chemical made by soil bacteria called actinomycetes, especially the group Streptomyces. Human noses can detect geosmin at extremely tiny amounts.",
              "A strong earthy smell suggests active, well-aired soil. A sour or rotten-egg smell can mean the soil is waterlogged and short on oxygen.",
            ],
            source: "weil-brady",
          },
        ],
        activity: {
          title: "Slake and soak tests",
          time: "40 minutes",
          materials: ["Two dry soil clods about the size of a sugar cube, from different sites", "Two clear cups of water", "A piece of window screen or a small kitchen strainer", "An empty tin can with both ends removed", "A ruler and a marker", "A measuring cup and water", "A stopwatch or phone timer", "A small block of wood"],
          steps: [
            "Slake test: rest each dry clod on a piece of screen and lower it gently into its own cup of water. Watch for 5 minutes and record what happens.",
            "Infiltration: draw a line 3 inches from one end of the can. On a flat spot, set the can upright, place the wood block on top, and tap it gently until it sinks to the line.",
            "Mark 1 inch above the soil surface on the inside of the can. Pour water up to that mark and start the timer.",
            "Stop the timer when the soil surface just glistens with no standing water. Record the time.",
            "Repeat both tests at a second site, such as a lawn versus a packed path. Compare your results in a table.",
          ],
          lookFor: "Healthy soil crumbs hold together in water and the water stays fairly clear. Healthy soil also soaks up the inch of water faster than packed soil.",
          safety: "Ask an adult to remove the can ends and cover sharp edges with tape. Only test where you have permission, and wash your hands afterward.",
        },
        quiz: [
          { prompt: "According to the NRCS, soil health is the continued capacity of soil to function as a…", options: ["Pile of minerals", "Vital living ecosystem", "Storage place for water only", "Building material"], answer: 1, explain: "The NRCS definition stresses that soil is a living ecosystem that sustains plants, animals, and humans." },
          { prompt: "In a slake test, a clod quickly falls apart into a cloudy mess. What does that suggest?", options: ["The soil has very stable crumbs", "The soil has too many earthworms", "The soil has weak aggregate stability", "The soil is too acidic"], answer: 2, explain: "Crumbs that fall apart in water show weak aggregate stability, often from low organic matter or heavy tillage." },
          { prompt: "Which test kit measurement tells you about salts in soil?", options: ["Electrical conductivity", "Earthworm count", "Infiltration", "Slake test"], answer: 0, explain: "Dissolved salts carry electric current, so higher electrical conductivity means more salt." },
          { prompt: "What does soil respiration measure?", options: ["How many rocks are in soil", "How acidic soil is", "How deep roots grow", "Carbon dioxide given off by soil life"], answer: 3, explain: "Roots and soil organisms release carbon dioxide as they respire, so more respiration usually means more activity." },
          { prompt: "Where does the earthy smell of moist soil mostly come from?", options: ["Rocks dissolving", "Geosmin made by soil bacteria", "Rainwater itself", "Fertilizer"], answer: 1, explain: "Bacteria such as Streptomyces produce geosmin, which our noses detect easily." },
          { prompt: "Why compare a farm field with a nearby undisturbed fence line?", options: ["To see how management changed the soil", "Because fence lines are always unhealthy", "To find buried treasure", "Comparison is not useful"], answer: 0, explain: "The fence line shows what the same soil is like with little disturbance, so differences point to management effects." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Soil health is measured, not guessed. Physical, chemical, and biological indicators together show whether management is building or degrading a soil's ability to function.",
        objectives: [
          "I can distinguish inherent from dynamic soil properties and explain how that shapes the idea of soil health.",
          "I can explain the biological mechanisms that build aggregate stability and infiltration.",
          "I can select physical, chemical, and biological indicators and interpret field data from them.",
          "I can calculate an infiltration rate and use it to compare management systems.",
        ],
        vocab: [
          { term: "Inherent soil quality", def: "Properties set mainly by soil formation, such as texture, depth, and mineralogy, that management changes little." },
          { term: "Dynamic soil quality", def: "Properties that change with management over years, such as organic matter, aggregate stability, and bulk density." },
          { term: "Glomalin and microbial glues", def: "Sticky proteins and polysaccharides from fungi and bacteria that help bind particles into aggregates." },
          { term: "Bulk density", def: "Mass of dry soil per unit volume, in g/cm³. Higher values mean more compaction and less pore space." },
          { term: "Electrical conductivity (EC)", def: "How well a soil solution conducts electricity, used as a measure of dissolved salts." },
        ],
        sections: [
          {
            heading: "Defining soil health",
            body: [
              "The NRCS defines soil health, also referred to as soil quality, as \"the continued capacity of soil to function as a vital living ecosystem that sustains plants, animals, and humans.\" The functions it highlights are regulating water, sustaining plant and animal life, filtering and buffering pollutants, cycling nutrients, and providing physical stability and support.",
              "Soil scientists separate inherent properties (texture, depth, mineralogy) from dynamic ones (organic matter, structure, biological activity). A sandy soil will never hold water like a silt loam, so soil health is judged by comparing a soil to its own potential, not to a different soil.",
            ],
            source: "nrcs-soil-health",
          },
          {
            heading: "How life builds structure",
            body: [
              "Aggregates form in a hierarchy. Clay and organic molecules bind into microaggregates. Roots and fungal hyphae then wrap microaggregates into larger macroaggregates, and microbial polysaccharides and fungal proteins such as glomalin help glue them together. Earthworm casts are also highly stable aggregates.",
              "Stable macroaggregates create large pores that drain water and supply oxygen. When tillage breaks them apart, organic matter that was protected inside is exposed to microbes and decomposes faster. The result is fewer large pores, slower infiltration, and more surface crusting.",
            ],
            callout: { title: "Mechanism to remember", text: "More roots and fungi lead to more stable aggregates, which create more large pores. That means faster infiltration and less runoff." },
            source: "nrcs-soil-is-alive",
          },
          {
            heading: "Reading the indicators",
            body: [
              "The NRCS Soil Quality Test Kit pairs simple field methods with interpretation guides. Physical tests include infiltration, bulk density, aggregate stability, and slaking. Chemical tests include pH, electrical conductivity, and nitrate. Biological tests include soil respiration, measured as CO₂ released under a sealed cap, and an earthworm count.",
              "Each indicator has trade-offs. Respiration responds quickly to moisture and temperature, so it varies day to day. Organic matter changes slowly, often taking years to shift measurably. Good assessments sample several indicators, at the same season, and compare against a reference site.",
            ],
            source: "nrcs-test-kit",
          },
          {
            heading: "Chemistry and the senses",
            body: [
              "For many crops, a pH of roughly 6.0 to 7.5 keeps most nutrients available. Below about 5.5, aluminum and manganese can become soluble enough to harm roots, and phosphorus becomes less available. High EC signals salts that make it harder for roots to take up water.",
              "Geosmin, produced mainly by Streptomyces and related actinomycetes, gives moist soil its earthy smell. People can detect it at concentrations of parts per trillion, so smell is a surprisingly sensitive, if informal, sign of active aerobic soil life.",
            ],
            source: "weil-brady",
          },
        ],
        activity: {
          title: "Two-site soil health assessment",
          time: "60 minutes in the field plus 20 minutes of analysis",
          materials: ["Two tin cans (about 6 inches across if possible) with both ends removed", "A ruler and a marker", "A graduated cylinder or measuring cup", "Water in jugs", "A stopwatch", "A trowel or small shovel", "A tray for sorting soil", "pH test strips and distilled water", "Window screen and clear cups for a slake test", "A data table"],
          steps: [
            "Choose two sites with the same soil but different management, such as a garden bed and a heavily walked lawn edge. Record land use and recent weather.",
            "Measure the can's inside diameter. Calculate the volume for 1 inch of water: π × r² × 1 inch, then convert using 1 cubic inch ≈ 16.4 mL.",
            "Push each can 3 inches into the soil. Pour in 1 inch of water, time how long it takes to soak in, then repeat with a second inch (the second inch is closer to a saturated soil's rate).",
            "Run a slake test on dry clods from each site, rating them from 1 (falls apart in seconds) to 5 (holds together after 5 minutes).",
            "Dig out a block about 1 ft × 1 ft × 6 in deep at each site, count earthworms on the tray, then return soil and worms. Mix soil with distilled water and test pH.",
            "Convert infiltration times to inches per hour and write a short evidence-based claim about which site has healthier soil and why.",
          ],
          lookFor: "Better-managed soil typically shows faster infiltration, more stable aggregates, and more earthworms. pH should be similar at both sites if the soil type is the same.",
          safety: "Get permission before digging and call before digging near any utility lines. Tape sharp can edges and wear gloves. Wash hands after handling soil.",
        },
        quiz: [
          { prompt: "1 inch of water soaks into a test ring in 12 minutes. What is the infiltration rate?", options: ["0.2 inches per hour", "1 inch per hour", "5 inches per hour", "12 inches per hour"], answer: 2, explain: "60 minutes ÷ 12 minutes = 5, so 1 inch × 5 = 5 inches per hour." },
          { prompt: "Which property is an example of dynamic soil quality?", options: ["Aggregate stability", "Sand, silt, and clay content", "Depth to bedrock", "Parent material"], answer: 0, explain: "Aggregate stability changes with management over a few years. Texture and depth are inherent." },
          { prompt: "Why does long-term tillage often reduce infiltration?", options: ["It adds too many earthworms", "It breaks macroaggregates, so large pores collapse and the surface crusts", "It raises the pH", "It makes clay particles larger"], answer: 1, explain: "Broken aggregates lose large pores and protected organic matter, and fine particles seal the surface." },
          { prompt: "A soil test shows pH 5.0. Which problem is most likely?", options: ["Too much salt", "Too much lime", "No problem for most crops", "Aluminum toxicity and low phosphorus availability"], answer: 3, explain: "Below about pH 5.5, aluminum can become toxic to roots and phosphorus is less available." },
          { prompt: "Site A: infiltration 0.5 in/hr, bulk density 1.65 g/cm³, 1 earthworm. Site B: 4 in/hr, 1.25 g/cm³, 14 earthworms. Same soil type. What is the best conclusion?", options: ["Site A is healthier because it is denser", "Site B shows healthier, less compacted soil", "The sites are identical", "Earthworms make soil denser"], answer: 1, explain: "Lower bulk density, faster infiltration, and more earthworms all point to better structure and more life at Site B." },
          { prompt: "Why is soil respiration measured at the same season and moisture when comparing sites?", options: ["Respiration responds quickly to temperature and moisture", "Respiration never changes", "It only works in winter", "It measures rock content"], answer: 0, explain: "Microbial activity rises and falls with conditions, so fair comparisons control for weather." },
        ],
      },
    },
  },

  // ───────────────────────────── Lesson 2 ─────────────────────────────
  {
    slug: "soil-threats",
    unit: 5,
    title: "How Soil Gets Hurt",
    icon: "🌪️",
    bigIdea: "Soil that took centuries to form can be damaged in years by erosion, compaction, salt, and pollution, and history shows that people can also learn to protect it.",
    interactive: { type: "erosion-sim", title: "Rainstorm test", intro: "Make it rain on two fields and compare how much soil washes away." },
    sources: ["fao-swsr", "scs-history", "weil-brady", "sssa-kskl", "s4t", "smithsonian-dig-it"],
    standards: {
      elementary: ["2-ESS2-1", "4-ESS2-1", "4-ESS3-2"],
      middle: ["MS-ESS3-3", "MS-ESS3-4"],
      high: ["HS-ESS3-1", "HS-ESS3-4"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "Wind and rain can carry soil away, and heavy machines can squish it flat. Bare soil gets hurt the most!",
        objectives: [
          "I can explain what erosion is.",
          "I can tell how plants protect soil from rain and wind.",
          "I can name two other ways soil gets hurt.",
        ],
        vocab: [
          { term: "Erosion", def: "When wind or water carries soil away." },
          { term: "Bare soil", def: "Soil with no plants or leaves covering it." },
          { term: "Compaction", def: "When soil gets squished so tight that water and roots can't get in." },
          { term: "Dust storm", def: "A big wind that picks up dry soil and fills the air with dust." },
        ],
        sections: [
          {
            heading: "Raindrops are tiny hammers",
            body: [
              "When a raindrop hits bare soil, it smashes soil bits loose and splashes them up into the air. Then running water carries them away.",
              "Plants and fallen leaves catch raindrops like an umbrella. The soil underneath stays put.",
            ],
            callout: { title: "Wow!", text: "A single raindrop can splash soil bits up to about 2 feet into the air!" },
            source: "weil-brady",
          },
          {
            heading: "Wind blows soil away",
            body: [
              "Wind can pick up dry, bare soil and blow it far away. Long ago, in the 1930s, farmers in the middle of the United States plowed up the prairie grass.",
              "Then it stopped raining for years. Strong winds blew the dry soil into giant dust storms. People called this time the Dust Bowl.",
            ],
            source: "scs-history",
          },
          {
            heading: "Squished soil",
            body: [
              "Heavy trucks, tractors, and lots of feet can squish soil flat. Squished soil is called compacted.",
              "Roots can't push through it, and rain can't soak in. It is like trying to drink through a squished straw.",
            ],
            source: "s4t",
          },
          {
            heading: "Other ways soil gets hurt",
            body: [
              "Sometimes trash or chemicals get spilled on soil and make it unsafe. Sometimes soil gets covered with roads and parking lots, so no plants can grow there.",
              "Good news: people can protect soil by keeping it covered with plants.",
            ],
            source: "smithsonian-dig-it",
          },
        ],
        activity: {
          title: "Splash board",
          time: "20 minutes",
          materials: ["Two pie pans", "Soil", "A handful of grass clippings or leaves", "Two sheets of white paper", "Tape", "A spray bottle or watering can with a sprinkler head"],
          steps: [
            "Fill both pans with soil. Cover one pan with leaves or grass. Leave the other bare.",
            "Tape a sheet of white paper to a wall or box behind each pan.",
            "Sprinkle the same amount of water on each pan from the same height.",
            "Look at the white paper. Which one has more brown spots?",
          ],
          lookFor: "The paper behind the bare soil gets many more muddy splash spots. The covered soil stays put.",
          safety: "Do this outside or on a tray to keep floors dry. Wash your hands after.",
        },
        quiz: [
          { prompt: "What is erosion?", options: ["Soil being carried away by wind or water", "Soil growing bigger", "Worms making tunnels", "Plants drinking water"], answer: 0, explain: "Erosion is when wind or water moves soil away." },
          { prompt: "Which soil is MOST likely to wash away in rain?", options: ["Soil covered with grass", "Soil under a thick layer of leaves", "Bare soil with nothing on it", "Soil in a forest"], answer: 2, explain: "Bare soil has nothing to catch the raindrops or hold it in place." },
          { prompt: "What was the Dust Bowl?", options: ["A big soup bowl", "A time of giant dust storms in the 1930s", "A football game", "A kind of rock"], answer: 1, explain: "Plowed land plus years without rain led to huge dust storms." },
          { prompt: "Compacted soil is…", options: ["Full of air", "Soft and fluffy", "Covered in leaves", "Squished so tight water can't soak in"], answer: 3, explain: "Heavy machines and lots of feet can squish soil flat." },
          { prompt: "How do plants protect soil?", options: ["They catch raindrops and hold soil with roots", "They make the wind stronger", "They pull soil away", "They don't help"], answer: 0, explain: "Leaves act like an umbrella and roots hold soil in place." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "Soil forms at a snail's pace but can be lost quickly. Erosion, compaction, salt buildup, and pollution are damaging soils worldwide, and the Dust Bowl showed Americans what is at stake.",
        objectives: [
          "I can explain how water and wind erosion happen, starting with raindrop splash.",
          "I can describe compaction, salinization, acidification, nutrient depletion, contamination, and sealing.",
          "I can explain how the Dust Bowl led to the Soil Conservation Service.",
          "I can use evidence from the FAO to describe the global state of soils.",
        ],
        vocab: [
          { term: "Splash erosion", def: "Soil particles knocked loose and tossed by the impact of raindrops." },
          { term: "Runoff", def: "Rainwater that flows over the land surface instead of soaking in." },
          { term: "Salinization", def: "The buildup of salts in soil, often when irrigation water evaporates in dry climates." },
          { term: "Soil degradation", def: "A decline in soil's ability to do its jobs, caused by things like erosion, compaction, or pollution." },
          { term: "Soil sealing", def: "Covering soil with pavement or buildings so water, air, and life can't reach it." },
        ],
        sections: [
          {
            heading: "How erosion works",
            body: [
              "Water erosion starts with raindrop splash. A drop hitting bare soil breaks aggregates apart and can toss particles up to about 2 feet into the air. The loose fine particles clog pores and form a crust, so less water soaks in and more runs off.",
              "Runoff first moves soil in thin sheets, then cuts small channels called rills, and finally carves deep gullies. Wind erosion lifts dry, loose, bare soil and can carry fine particles hundreds of miles. Plant cover, residue, and roots slow both kinds of erosion dramatically.",
            ],
            source: "weil-brady",
          },
          {
            heading: "More ways soil is damaged",
            body: [
              "Compaction: heavy machines, livestock, or working wet soil squeeze pores closed, blocking roots and water.",
              "Salinization: in dry regions, irrigation water evaporates and leaves salts behind that make it hard for plants to take up water. Acidification: some nitrogen fertilizers and acid rain slowly lower soil pH.",
              "Nutrient depletion: harvesting crops year after year without returning nutrients wears soil out. Contamination: lead, oil, and other pollutants can make soil unsafe. Sealing: roads, parking lots, and buildings cover soil completely.",
            ],
            source: "sssa-kskl",
          },
          {
            heading: "The Dust Bowl and a new agency",
            body: [
              "In the early 1900s, settlers plowed millions of acres of native grassland on the southern Great Plains. When severe drought struck in the 1930s, the bare soil dried out and blew away in huge dust storms. On April 14, 1935, remembered as Black Sunday, an enormous storm swept across the plains.",
              "Hugh Hammond Bennett, a USDA soil scientist now called the father of soil conservation, had warned for years that erosion was a national threat. In spring 1935, while he urged Congress to act, dust from the plains darkened the sky over Washington, D.C. On April 27, 1935, Congress created the Soil Conservation Service, with Bennett as its first chief. In 1994 it was renamed the Natural Resources Conservation Service (NRCS).",
            ],
            callout: { title: "Lesson learned", text: "The Soil Conservation Service helped farmers use cover, contour plowing, terraces, and windbreaks to hold soil in place." },
            source: "scs-history",
          },
          {
            heading: "A global problem",
            body: [
              "In 2015, the FAO and its Intergovernmental Technical Panel on Soils published the Status of the World's Soil Resources. It found that about a third (roughly 33%) of the world's land is moderately to highly degraded, due to erosion, salinization, compaction, acidification, and chemical pollution of soils.",
              "The report also concluded that most of the world's soils are only in fair, poor, or very poor condition, but that degradation can be slowed and reversed with good management.",
            ],
            source: "fao-swsr",
          },
        ],
        activity: {
          title: "Bottle erosion model",
          time: "45 minutes",
          materials: ["Three 2-liter plastic bottles, cut open lengthwise along one side", "Three clear cups", "String or tape to hang the cups at the bottle necks", "Soil", "Mulch (dry leaves or wood chips)", "A piece of grass sod or soil with sprouted seeds", "A watering can", "A measuring cup"],
          steps: [
            "Lay the three bottles on their sides with the openings facing up and the necks hanging over a table edge. Tie a cup under each neck.",
            "Fill bottle 1 with bare soil, bottle 2 with soil topped with mulch, and bottle 3 with sod or soil with plants. Pack them the same.",
            "Tilt all three at the same angle using a book under the back end.",
            "Slowly pour 500 mL of water onto the back of each bottle from the same height.",
            "Compare how muddy the water in each cup is, and measure how much water came out.",
          ],
          lookFor: "Water from bare soil is the muddiest. Mulch and plants give clearer runoff, and the planted bottle often lets less water run off because more soaks in.",
          safety: "An adult should cut the bottles. Cover cut edges with tape. Wash hands after handling soil.",
        },
        quiz: [
          { prompt: "What usually happens FIRST in water erosion of bare soil?", options: ["Gullies form", "Raindrops splash and break apart soil crumbs", "Rivers flood", "Wind lifts the soil"], answer: 1, explain: "Raindrop impact detaches particles and seals the surface, which leads to runoff." },
          { prompt: "Which threat is most likely in a dry region that relies on irrigation?", options: ["Salinization", "Sealing", "Splash erosion", "Too many earthworms"], answer: 0, explain: "Irrigation water evaporates and leaves salts behind in the soil." },
          { prompt: "Which agency did Congress create on April 27, 1935?", options: ["The National Park Service", "The Environmental Protection Agency", "The Forest Service", "The Soil Conservation Service"], answer: 3, explain: "The Soil Conservation Service, led by Hugh Hammond Bennett, is today's NRCS." },
          { prompt: "According to the FAO's 2015 report, about how much of the world's land is moderately to highly degraded?", options: ["About 3%", "About 10%", "About one third", "About 90%"], answer: 2, explain: "The report estimated roughly 33%, from erosion, salinization, compaction, acidification, and pollution." },
          { prompt: "Why did the Great Plains soil blow away in the 1930s?", options: ["Native grass was plowed up and drought left soil bare and dry", "There were too many trees", "Floods covered it", "Volcanoes erupted"], answer: 0, explain: "Without deep-rooted grasses, dry plowed soil was easy for wind to lift." },
          { prompt: "Which is an example of soil sealing?", options: ["Planting a cover crop", "Paving a field for a parking lot", "Adding compost", "Spreading mulch"], answer: 1, explain: "Pavement cuts soil off from water, air, and living things." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Soil degradation is a slow-motion crisis. Erosion can outpace soil formation by orders of magnitude, and a third of the world's land is already degraded. Science and policy can reverse it.",
        objectives: [
          "I can explain the physics of splash, sheet, rill, gully, and wind erosion and the factors that control erosion rates.",
          "I can explain the chemical mechanisms of salinization and acidification.",
          "I can analyze how the Dust Bowl shaped U.S. conservation policy.",
          "I can calculate soil loss and compare it to tolerable loss and soil formation rates.",
        ],
        vocab: [
          { term: "Universal Soil Loss Equation (USLE)", def: "A model, A = R × K × LS × C × P, that estimates average annual soil loss from rainfall, soil erodibility, slope, cover, and conservation practices." },
          { term: "Soil loss tolerance (T)", def: "The maximum average annual erosion rate, typically about 1 to 5 tons per acre per year in the U.S., that still lets productivity be sustained." },
          { term: "Saltation", def: "Wind erosion in which sand-sized grains bounce along the surface, knocking other particles loose." },
          { term: "Sodicity", def: "A high proportion of sodium on soil exchange sites, which disperses clay and destroys structure." },
          { term: "Nitrification", def: "The microbial conversion of ammonium to nitrate, which releases hydrogen ions and acidifies soil." },
        ],
        sections: [
          {
            heading: "The mechanics of erosion",
            body: [
              "Water erosion is detachment plus transport. Raindrop kinetic energy breaks aggregates, splashes particles, and fills surface pores to form a seal. Infiltration drops, runoff builds, and flowing water removes soil as sheet, then rill, then gully erosion. Wind erosion moves soil by saltation of sand-sized grains, which knock finer particles into suspension and roll larger ones along the surface.",
              "The USLE, A = R × K × LS × C × P, summarizes the controls: rainfall erosivity (R), soil erodibility (K), slope length and steepness (LS), cover and management (C), and support practices like contouring and terraces (P). Farmers can do little about R or K, but C and P are management choices. A field with full residue cover can have a C factor many times lower than clean-tilled bare soil.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Chemical and physical degradation",
            body: [
              "Salinization occurs where evaporation exceeds leaching, so irrigation water concentrates dissolved salts near the surface. High salt lowers the soil solution's osmotic potential, making water harder for roots to take up. Sodium-dominated soils (sodic soils) also disperse clay, sealing pores. Electrical conductivity is the standard measure of salinity.",
              "Acidification happens naturally in wet climates as rain leaches base cations, but ammonium-based fertilizers speed it up: nitrification of ammonium releases hydrogen ions. Compaction from heavy axle loads can persist in the subsoil for years. Contaminants such as lead from old paint and leaded gasoline are common in urban soils. Sealing by pavement removes soil function entirely.",
            ],
            source: "sssa-kskl",
          },
          {
            heading: "From Dust Bowl to policy",
            body: [
              "Hugh Hammond Bennett co-authored the 1928 USDA bulletin Soil Erosion: A National Menace and led the temporary Soil Erosion Service from 1933. During the 1930s drought, plowed southern Plains soils blew away in storms like Black Sunday (April 14, 1935). That spring, as Bennett pressed Congress for a permanent program, dust from the plains reached Washington, D.C.",
              "Public Law 74-46, signed April 27, 1935, recognized soil erosion as a menace to the national welfare and created the Soil Conservation Service in USDA, with Bennett as chief. Local, farmer-led conservation districts soon followed. In 1994 Congress renamed the agency the Natural Resources Conservation Service to reflect its broader mission.",
            ],
            source: "scs-history",
          },
          {
            heading: "The global picture",
            body: [
              "The FAO's 2015 Status of the World's Soil Resources, written by about 200 soil scientists, identified ten major threats: erosion, loss of organic carbon, nutrient imbalance, acidification, contamination, waterlogging, compaction, sealing, salinization, and loss of soil biodiversity. It estimated that about 33% of land is moderately to highly degraded and that erosion removes roughly 25 to 40 billion tonnes of topsoil per year.",
              "Because soil forms at rates often estimated at well under a millimeter per year, losses on that scale are effectively permanent on human timescales. The report stresses that sustainable management can halt and reverse degradation.",
            ],
            callout: { title: "Think like a policymaker", text: "Erosion's costs (lost yields, muddy rivers, filled reservoirs) often fall on people downstream or in the future, which is one reason governments fund conservation." },
            source: "fao-swsr",
          },
        ],
        activity: {
          title: "Measuring sediment loss",
          time: "60 minutes plus overnight drying",
          materials: ["Three 2-liter bottles cut open lengthwise", "Three collection cups", "Soil", "Mulch", "Grass sod or a tray of sprouted seeds", "A measuring cup", "Coffee filters", "A kitchen or lab scale (0.1 g if possible)", "A protractor and books for setting slope"],
          steps: [
            "Set up bare, mulched, and planted bottles at the same slope (for example 15°), each draining into a cup.",
            "Weigh three dry coffee filters and record their masses.",
            "Pour 500 mL of water evenly over each bottle. Record the volume of runoff collected.",
            "Pour each cup's runoff through its filter. Let the filters dry overnight, then weigh them and subtract the filter mass to get sediment mass.",
            "Calculate percent reduction in sediment for mulch and plants compared with bare soil. If time allows, repeat the bare treatment at a steeper slope to test the LS factor.",
          ],
          lookFor: "Covered soil should lose much less sediment, often well over half less than bare soil. Steeper slopes increase loss.",
          safety: "An adult should cut bottles. Tape sharp edges. Wipe spills promptly and wash hands after handling soil.",
        },
        quiz: [
          { prompt: "A field loses 15 tons of soil per acre per year. One inch of topsoil weighs about 150 tons per acre. How long until 1 inch is lost?", options: ["1 year", "10 years", "150 years", "2,250 years"], answer: 1, explain: "150 ÷ 15 = 10 years. Soil formation may take hundreds of years to replace that inch." },
          { prompt: "In the USLE, switching from bare soil to cover crops lowers C from 0.4 to 0.1. If nothing else changes, predicted soil loss…", options: ["Doubles", "Stays the same", "Falls by 25%", "Falls by 75%"], answer: 3, explain: "A is proportional to C, so 0.1 ÷ 0.4 = 0.25. Loss drops to a quarter, a 75% reduction." },
          { prompt: "Why does nitrification acidify soil?", options: ["Converting ammonium to nitrate releases hydrogen ions", "It adds calcium", "It removes all water", "It produces salt"], answer: 0, explain: "Each ammonium ion oxidized to nitrate releases hydrogen ions, lowering pH." },
          { prompt: "What did Public Law 74-46 (April 27, 1935) do?", options: ["Banned all farming on the Plains", "Created the Environmental Protection Agency", "Created the Soil Conservation Service in USDA", "Ended the drought"], answer: 2, explain: "It declared soil erosion a national menace and created the SCS, now the NRCS." },
          { prompt: "Which pair of USLE factors can a farmer most directly change?", options: ["R and K", "C and P", "R and LS", "K only"], answer: 1, explain: "Cover and management (C) and support practices (P) are management choices. Rainfall (R) and soil erodibility (K) are not." },
          { prompt: "In a bottle model, bare soil yields 24 g of sediment and mulched soil yields 6 g. What is the percent reduction from mulch?", options: ["25%", "40%", "75%", "400%"], answer: 2, explain: "(24 − 6) ÷ 24 = 0.75, a 75% reduction." },
        ],
      },
    },
  },

  // ───────────────────────────── Lesson 3 ─────────────────────────────
  {
    slug: "regenerative-principles",
    unit: 5,
    title: "Regenerative Principles",
    icon: "🌿",
    bigIdea: "Farms and gardens can rebuild soil instead of using it up by keeping soil covered, disturbing it less, growing diversity, keeping living roots in the ground, and managing animals well.",
    interactive: { type: "principles", title: "Match the practice", intro: "Each card shows a farm practice. Flip it to see which principle it follows." },
    sources: ["nrcs-soil-health", "nrcs-soil-is-alive", "weil-brady", "sssa-kskl", "s4t"],
    standards: {
      elementary: ["K-ESS3-3", "2-ESS2-1", "5-ESS3-1"],
      middle: ["MS-LS2-5", "MS-ESS3-3"],
      high: ["HS-LS2-7", "HS-ESS3-4"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "Farmers can help soil get healthier every year. They keep it covered, dig less, and grow lots of different plants!",
        objectives: [
          "I can name ways farmers and gardeners help soil.",
          "I can explain why soil needs a cover, like a blanket.",
          "I can explain why roots are good for soil.",
        ],
        vocab: [
          { term: "Cover crop", def: "A plant grown to protect and feed the soil, not to sell." },
          { term: "Compost", def: "Old food scraps and leaves that rot into rich, dark soil food." },
          { term: "Mulch", def: "A blanket of leaves, straw, or wood chips spread on top of soil." },
          { term: "Regenerate", def: "To grow back or make healthy again." },
        ],
        sections: [
          {
            heading: "Give soil a blanket",
            body: [
              "Soil does not like to be bare. Plants, straw, or leaves on top work like a blanket. They stop rain from splashing soil away and keep soil from getting too hot.",
              "Farmers plant cover crops, like clover or oats, to keep soil covered when they are not growing food.",
            ],
            source: "nrcs-soil-health",
          },
          {
            heading: "Dig less, grow more",
            body: [
              "Digging and plowing break apart soil crumbs and the homes of soil life. Some farmers plant seeds without plowing at all. This is called no-till.",
              "Living roots feed tiny soil creatures with sugary juice. So farmers try to keep something growing as much of the year as they can.",
            ],
            source: "nrcs-soil-is-alive",
          },
          {
            heading: "Lots of different plants and animals",
            body: [
              "Growing many kinds of plants feeds many kinds of soil life. Changing crops each year is called crop rotation.",
              "Some farmers move cows or sheep from field to field. The animals eat some grass, leave manure, and move on so the grass can grow back.",
            ],
            callout: { title: "Play and learn", text: "Try these ideas in the game Regenerate the Field. Can you make a tired farm healthy again?" },
            source: "s4t",
          },
        ],
        activity: {
          title: "Soil blanket test",
          time: "20 minutes plus 1 day of watching",
          materials: ["Two small pots or cups of damp soil", "A handful of straw, leaves, or wood chips", "Two craft-stick thermometers or one regular thermometer", "A sunny windowsill"],
          steps: [
            "Fill both pots with the same damp soil.",
            "Cover the top of one pot with a thick layer of leaves or straw. Leave the other one bare.",
            "Set both pots in the same sunny spot.",
            "After a few hours, feel each soil with your finger and check the temperature. The next day, check which soil is still damp.",
          ],
          lookFor: "The covered soil stays cooler and damper. The bare soil gets hotter and dries out faster.",
          safety: "Wash your hands after touching soil. Don't put soil in your mouth.",
        },
        quiz: [
          { prompt: "Why do farmers keep soil covered?", options: ["To hide it", "To protect it from rain, wind, and heat", "To make it bare", "To scare worms"], answer: 1, explain: "A cover works like a blanket that protects soil." },
          { prompt: "What is a cover crop?", options: ["A plant grown to protect and feed the soil", "A kind of hat", "A crop with a lid", "A weed"], answer: 0, explain: "Cover crops like clover or oats protect soil between food crops." },
          { prompt: "What does no-till mean?", options: ["Watering every day", "Growing only one plant", "Planting without plowing the soil", "Picking all the plants"], answer: 2, explain: "No-till farmers plant seeds without plowing, so soil crumbs stay together." },
          { prompt: "How do living roots help soil?", options: ["They make soil bare", "They feed soil life with sugary juice", "They eat worms", "They don't help"], answer: 1, explain: "Roots leak sugars that feed tiny soil creatures." },
          { prompt: "What is compost made from?", options: ["Plastic and glass", "Old food scraps and leaves", "Rocks and metal", "Sand only"], answer: 1, explain: "Food scraps and leaves rot into rich soil food." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "Regenerative farming aims to leave soil healthier each year. It rests on a few simple principles that copy how natural grasslands and forests build soil.",
        objectives: [
          "I can describe the NRCS soil health principles and the livestock principle many farmers add.",
          "I can match farm practices to the principles they follow.",
          "I can explain how each practice improves soil.",
          "I can compare organic and regenerative farming accurately.",
        ],
        vocab: [
          { term: "No-till", def: "Planting crops without plowing or turning the soil." },
          { term: "Crop rotation", def: "Growing different crops in the same field in a planned sequence over seasons or years." },
          { term: "Legume", def: "A plant such as clover, peas, or beans that hosts bacteria in root nodules that turn nitrogen from the air into plant food." },
          { term: "Managed grazing", def: "Moving livestock through small pastures so plants are grazed briefly and then get time to regrow." },
          { term: "Buffer strip", def: "A strip of grass, shrubs, or trees along a field edge or stream that slows runoff and traps soil." },
        ],
        sections: [
          {
            heading: "The soil health principles",
            body: [
              "The NRCS builds soil health management around four principles: maximize soil cover, minimize disturbance, maximize biodiversity, and maximize the presence of living roots.",
              "Many farmers and conservation groups add a fifth: integrate livestock. Together these copy a native prairie, where soil is always covered, rarely disturbed, full of diverse plants, rooted year-round, and grazed by animals.",
            ],
            source: "nrcs-soil-health",
          },
          {
            heading: "Practices that follow the principles",
            body: [
              "Cover: cover crops and mulch shield soil from raindrop impact, wind, and heat. Disturbance: no-till and reduced tillage keep aggregates and fungal networks intact.",
              "Biodiversity: crop rotations, cover crop mixes, and hedgerows support more kinds of soil life and beneficial insects. Living roots: cover crops and perennials feed microbes when cash crops are not growing. Livestock: managed grazing recycles plants into manure and stimulates regrowth.",
              "Some practices mainly guard against erosion: contour farming (plowing and planting across a slope), terraces (step-like ridges on slopes), and buffer strips. Compost adds organic matter and microbes.",
            ],
            callout: { title: "Try it in the game", text: "Open Regenerate the Field at /soil/game. Choose practices for a worn-out farm and watch how soil health changes over three years." },
            source: "nrcs-soil-is-alive",
          },
          {
            heading: "Roots, fungi, and nitrogen",
            body: [
              "Plant roots release sugars and other compounds into the soil. Bacteria and fungi feed on them, and in return help plants get nutrients. Mycorrhizal fungi grow threads that reach far beyond roots, carrying water and phosphorus back to the plant.",
              "Legumes such as clover and peas host rhizobia bacteria in root nodules. These bacteria convert nitrogen gas from the air into forms plants can use, which can reduce the need for nitrogen fertilizer.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Organic vs. regenerative",
            body: [
              "Organic farming in the United States is a legal standard. Certified organic farms must avoid most synthetic fertilizers and pesticides and follow USDA rules that include building soil health.",
              "Regenerative agriculture has no single legal definition. It is defined more by outcomes, like rising organic matter and better infiltration. A regenerative farm might use some synthetic inputs, and an organic farm might rely on tillage to control weeds. Many farms combine ideas from both.",
            ],
            source: "sssa-kskl",
          },
        ],
        activity: {
          title: "Compost in a bottle",
          time: "20 minutes to set up, then 3–4 weeks of observations",
          materials: ["A clear 2-liter bottle with the top cut off", "Garden soil", "Fruit and vegetable scraps (no meat or dairy)", "Dry leaves or shredded newspaper", "A spray bottle of water", "Plastic wrap with small holes poked in it", "A thermometer", "A notebook"],
          steps: [
            "Layer the bottle: 2 inches of soil, then scraps, then dry leaves. Repeat until nearly full, ending with soil.",
            "Spray each layer so it is damp like a wrung-out sponge. Cover with plastic wrap.",
            "Record the temperature in the middle of the bottle and draw what you see.",
            "Twice a week, stir gently, check moisture, and record temperature and changes for 3–4 weeks.",
            "At the end, compare the color, smell, and texture with the starting materials.",
          ],
          lookFor: "Scraps shrink and darken as microbes break them down. The mix may warm up at first, then turn dark and earthy smelling.",
          safety: "Do not add meat, dairy, or pet waste. Keep the bottle out of reach of pets. Wear gloves and wash hands after handling compost.",
        },
        quiz: [
          { prompt: "Which practice follows the principle 'minimize disturbance'?", options: ["No-till planting", "Plowing twice a year", "Leaving soil bare", "Burning crop residue"], answer: 0, explain: "No-till keeps aggregates and fungal networks from being broken apart." },
          { prompt: "Planting a cover crop after harvest mainly helps which principles?", options: ["Minimize biodiversity", "Soil cover and living roots", "Maximize disturbance", "None"], answer: 1, explain: "A cover crop covers soil and keeps roots alive when the cash crop is gone." },
          { prompt: "Which principle do many farmers add to the four NRCS principles?", options: ["Plow deeply", "Use only one crop", "Integrate livestock", "Keep soil bare in winter"], answer: 2, explain: "Managed grazing animals can recycle nutrients and stimulate plant growth." },
          { prompt: "How do legumes add nitrogen to soil?", options: ["They absorb it from rocks", "Rhizobia bacteria in their root nodules convert nitrogen from the air", "They make it from sunlight", "They pull it from earthworms"], answer: 1, explain: "Rhizobia change nitrogen gas into forms plants can use." },
          { prompt: "What does contour farming do?", options: ["Plants up and down the slope", "Removes all plants from hills", "Adds salt to soil", "Plants across the slope so rows slow runoff"], answer: 3, explain: "Rows that follow the land's contour act like small dams that slow water." },
          { prompt: "Which statement about organic and regenerative farming is accurate?", options: ["They are exactly the same thing", "Organic is a legal standard, while regenerative is defined more by soil outcomes", "Regenerative farms are always certified organic", "Organic farms never till"], answer: 1, explain: "Organic certification has USDA rules. Regenerative has no single legal definition, and the two often overlap." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Regenerative principles are not slogans. Each one targets a soil mechanism, from aggregate formation to the carbon flow from roots to microbes, and each comes with trade-offs farmers must manage.",
        objectives: [
          "I can explain the mechanism behind each soil health principle.",
          "I can evaluate conservation practices using evidence and their trade-offs.",
          "I can interpret multi-year soil data to judge whether a management change is working.",
          "I can distinguish organic certification from regenerative agriculture without overstating either.",
        ],
        vocab: [
          { term: "Rhizodeposition", def: "Carbon released by living roots into soil, including sugars, amino acids, and sloughed cells, that feeds microbes." },
          { term: "Arbuscular mycorrhizal fungi", def: "Fungi that live in partnership with most crop roots, trading phosphorus and water for plant carbon." },
          { term: "Biological nitrogen fixation", def: "Conversion of atmospheric N₂ to ammonia by bacteria such as rhizobia in legume nodules." },
          { term: "Adaptive grazing", def: "Grazing in which herd size, timing, and rest periods are adjusted to plant recovery and soil conditions." },
          { term: "Conservation practice standard", def: "An NRCS technical specification for a practice, such as cover crops or prescribed grazing, used in planning and cost-share programs." },
        ],
        sections: [
          {
            heading: "Principles and their mechanisms",
            body: [
              "The NRCS lists four soil health principles: maximize soil cover, minimize disturbance, maximize biodiversity, and maximize the presence of living roots. Many farmers and conservation organizations add a fifth, integrating livestock.",
              "Cover dissipates raindrop energy and moderates soil temperature and evaporation. Minimizing tillage protects macroaggregates and the organic matter inside them, and leaves fungal hyphae intact. Diversity in plants supports a more diverse microbial community and disrupts pest cycles. Living roots supply rhizodeposits that fuel microbial growth year-round, and microbial products then glue aggregates.",
            ],
            source: "nrcs-soil-health",
          },
          {
            heading: "The plant–microbe carbon pump",
            body: [
              "Plants send a meaningful share of the carbon they fix belowground, to roots, root exudates, and mycorrhizal partners. Microbes feeding on that carbon produce biomass and residues that can become longer-lived soil organic matter, especially when bound to clay and silt surfaces or protected inside aggregates.",
              "This is why a field without living roots for months loses biological activity, and why cover crops can raise microbial biomass. Soil Is Alive emphasizes that soil organisms need a constant food supply, cover, and limited disturbance to thrive.",
            ],
            source: "nrcs-soil-is-alive",
          },
          {
            heading: "Evaluating practices and trade-offs",
            body: [
              "No-till greatly reduces erosion and fuel use, but it can increase reliance on herbicides for weed control and may slow spring soil warming. Cover crops protect soil and can scavenge leftover nitrate, but they cost money to seed and, in dry regions, use water a cash crop might need. Legume covers fix nitrogen, while grasses such as cereal rye build more residue.",
              "Contour farming and terraces lower the USLE P factor by slowing runoff. Buffer strips and hedgerows trap sediment and provide habitat. Compost and manure add organic matter and nutrients but must be managed to avoid phosphorus buildup and runoff. Managed grazing can improve plant cover and nutrient cycling, but poorly managed grazing causes compaction and bare ground.",
            ],
            callout: { title: "Model it", text: "In Regenerate the Field (/soil/game), test combinations of practices. Which give the fastest gains, and which trade-offs show up?" },
            source: "weil-brady",
          },
          {
            heading: "Organic, regenerative, and the evidence",
            body: [
              "Organic is a process-based certification. Under the USDA National Organic Program, farms must avoid most synthetic fertilizers and pesticides and maintain or improve soil and natural resources. Regenerative agriculture is outcome-based and has no single legal definition, which makes claims harder to verify.",
              "Both approaches can build soil, and both can fall short. Organic systems that depend on frequent tillage for weeds may lose organic matter, while conventional no-till systems with cover crops may gain it. Soil scientists judge any system by measured changes in indicators over several years, not by labels.",
            ],
            source: "sssa-kskl",
          },
        ],
        activity: {
          title: "Living roots and aggregate stability",
          time: "30 minutes to set up, 4 weeks of growth, 40 minutes to test",
          materials: ["Six identical cups or small pots with drainage holes", "Garden soil that has been sifted to break up crumbs", "Oat or cereal rye seeds", "Water", "A ruler", "A kitchen scale", "Window screen and clear cups of water for slake tests"],
          steps: [
            "Fill all six cups with the same sifted soil. Plant oats or rye in three cups and leave three unplanted. Water all six equally.",
            "Grow for about 4 weeks in a sunny spot, recording plant height weekly.",
            "Let the cups dry for 2 days. Gently remove the soil. Clip and weigh the shoots from each planted cup.",
            "Take three dry clods from each cup and run slake tests, rating each clod from 1 (falls apart in seconds) to 5 (intact after 5 minutes).",
            "Calculate mean slake ratings for planted and unplanted soil, and write a claim linking the evidence to the 'living roots' principle.",
          ],
          lookFor: "Soil from planted cups usually forms more stable clods, held together by fine roots and microbial glues, than unplanted soil.",
          safety: "Wash hands after handling soil. Do not eat seeds treated with fungicide; check the seed packet.",
        },
        quiz: [
          { prompt: "Soil organic matter on a farm rose from 2.0% to 2.6% over 6 years after switching to no-till with cover crops. What was the average rate of change?", options: ["0.1 percentage points per year", "0.6 percentage points per year", "2.6 percentage points per year", "No change"], answer: 0, explain: "(2.6 − 2.0) ÷ 6 = 0.1 percentage points per year. Organic matter changes slowly, so multi-year data matter." },
          { prompt: "What is the main mechanism by which minimizing tillage helps soil?", options: ["It adds salt", "It protects macroaggregates, the organic matter inside them, and fungal hyphae", "It removes all microbes", "It raises the water table"], answer: 1, explain: "Less disturbance keeps the physical and biological structure intact." },
          { prompt: "A farmer in a dry region worries a cover crop will use too much soil water. What does this illustrate?", options: ["Cover crops never use water", "Practices have trade-offs that depend on local conditions", "Cover crops always fail", "Water has no effect on crops"], answer: 1, explain: "Benefits must be weighed against local constraints like rainfall." },
          { prompt: "Why are legume cover crops often chosen before a corn crop?", options: ["They add salt", "They compact soil", "Their rhizobia fix atmospheric nitrogen", "They kill all weeds permanently"], answer: 2, explain: "Biological nitrogen fixation can supply some of the next crop's nitrogen." },
          { prompt: "Which statement is most accurate?", options: ["Organic is always better for soil", "Regenerative has a strict legal definition", "Labels guarantee soil improvement", "Any system should be judged by measured changes in soil indicators"], answer: 3, explain: "Both approaches can build or degrade soil; evidence over time is the test." },
          { prompt: "In a pot trial, unplanted soil had a mean slake score of 1.7 and planted soil 4.0. What is the best interpretation?", options: ["Living roots likely increased aggregate stability", "The plants made the soil sandier", "Slake tests don't measure structure", "The difference proves nothing about roots"], answer: 0, explain: "With soil and water held constant, the main difference is roots and the microbes they fed, which build stable aggregates." },
        ],
      },
    },
  },

  // ───────────────────────────── Lesson 4 ─────────────────────────────
  {
    slug: "soil-food-climate",
    unit: 5,
    title: "Soil, Food, and Our Future",
    icon: "🌎",
    bigIdea: "Healthy soil grows our food, stores huge amounts of carbon, and supports cities and wildlife, so caring for soil is a job everyone can share.",
    sources: ["fao-soc", "fao-soils-climate", "fao-swsr", "nrcs-test-kit", "weil-brady", "sssa-kskl", "s4t", "smithsonian-dig-it", "ngss"],
    standards: {
      elementary: ["K-ESS3-3", "5-ESS3-1"],
      middle: ["MS-ESS3-3", "MS-ESS3-4"],
      high: ["HS-ESS3-6", "HS-LS2-7"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "Most of the food you eat starts in soil. Soil also holds carbon, a building block of life. You can be a Soil Steward and help take care of it!",
        objectives: [
          "I can explain how soil helps make my food.",
          "I can name a job where people work with soil.",
          "I can do one thing to help soil at school or home.",
        ],
        vocab: [
          { term: "Steward", def: "Someone who takes good care of something." },
          { term: "Carbon", def: "A building block found in all living things. Soil holds lots of it." },
          { term: "Garden", def: "A place where people grow plants for food or beauty." },
          { term: "Soil scientist", def: "A person whose job is to study soil." },
        ],
        sections: [
          {
            heading: "From soil to your plate",
            body: [
              "Think about your lunch. Bread comes from wheat. Apples grow on trees. Milk comes from cows that eat grass. All of those plants grew in soil!",
              "Healthy soil helps farmers grow enough food for everyone.",
            ],
            source: "smithsonian-dig-it",
          },
          {
            heading: "Soil holds carbon",
            body: [
              "Plants use air and sunlight to make food. When old leaves and roots rot, some of their carbon stays in the soil.",
              "Healthy soil holds more carbon than all the plants on land. Keeping soil healthy helps keep that carbon in the ground.",
            ],
            source: "fao-soils-climate",
          },
          {
            heading: "Soil helpers",
            body: [
              "Many people work with soil. Farmers grow our food. Soil scientists study soil to learn how to keep it healthy. Soil conservationists help farmers protect their land.",
              "Even kids can help. You can plant a garden, make compost, and keep soil covered.",
            ],
            callout: { title: "Soil Steward project", text: "Help your class care for a garden bed, or make a poster that teaches others how to care for soil." },
            source: "s4t",
          },
        ],
        activity: {
          title: "Soil Steward project: class garden bed or soil-care poster",
          time: "Two or three 30-minute class sessions",
          materials: ["A garden bed, large planter, or big pots", "Compost", "Mulch such as straw or leaves", "Easy seeds like beans, radishes, or sunflowers", "A watering can", "Poster paper and markers (for the poster option)"],
          steps: [
            "Check your soil first: look for crumbs, worms, and roots, and smell it.",
            "Mix a little compost into the top of the soil to feed soil life.",
            "Plant your seeds and water them gently.",
            "Spread mulch around the seeds like a blanket, leaving a little space right where each seed is.",
            "Or make a poster with three tips for helping soil, like 'Keep soil covered,' 'Add compost,' and 'Don't stomp on garden beds.' Share it with another class.",
          ],
          lookFor: "Seeds sprout in a week or two. Mulched soil stays damp longer. Count worms you see over the season.",
          safety: "Wear gloves when handling compost and wash your hands after. An adult should handle any tools with sharp edges.",
        },
        quiz: [
          { prompt: "Where does the wheat in bread grow?", options: ["In soil", "In the ocean", "In the clouds", "Inside rocks"], answer: 0, explain: "Wheat plants grow their roots in soil." },
          { prompt: "What is a steward?", options: ["Someone who breaks things", "Someone who takes good care of something", "A type of soil", "A kind of plant"], answer: 1, explain: "A Soil Steward takes good care of soil." },
          { prompt: "What does a soil scientist do?", options: ["Builds rockets", "Bakes bread", "Studies soil", "Drives buses"], answer: 2, explain: "Soil scientists study soil so we can keep it healthy." },
          { prompt: "Which helps soil in a garden?", options: ["Stomping on it", "Leaving it bare", "Pouring soda on it", "Adding compost and mulch"], answer: 3, explain: "Compost feeds soil life and mulch protects the soil." },
          { prompt: "Soil holds lots of…", options: ["Carbon", "Plastic", "Glass", "Candy"], answer: 0, explain: "Rotting roots and leaves leave carbon in the soil." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "Soil connects your dinner plate to the global climate. Feeding a growing population and storing carbon both depend on keeping soil healthy.",
        objectives: [
          "I can explain why healthy soil is important for food security.",
          "I can describe how soil stores carbon and how management can add or release it.",
          "I can describe soil issues in cities and several soil careers.",
          "I can plan and carry out a schoolyard soil health survey.",
        ],
        vocab: [
          { term: "Food security", def: "When all people at all times have access to enough safe, nutritious food." },
          { term: "Soil organic carbon", def: "The carbon in soil organic matter, from roots, residues, and microbes." },
          { term: "Carbon sequestration", def: "Moving carbon dioxide from the air into long-term storage, such as soil organic matter." },
          { term: "Urban soil", def: "Soil in cities and towns, often disturbed, compacted, or mixed with fill and debris." },
          { term: "Soil conservationist", def: "A professional who helps landowners plan practices that protect soil and water." },
        ],
        sections: [
          {
            heading: "Soil and food security",
            body: [
              "Nearly all of our food comes from crops grown in soil or from animals that eat those crops. As the world's population grows, farmers need to grow more food on land that is already being farmed.",
              "The FAO's 2015 report warned that soil degradation, including erosion and nutrient loss, threatens food production in many regions. Protecting soil is one of the most important ways to keep food supplies secure.",
            ],
            source: "fao-swsr",
          },
          {
            heading: "Soil carbon and climate",
            body: [
              "The FAO describes healthy soils as the largest store of carbon on land, holding more carbon than all land plants. Plants pull carbon dioxide from the air and send some of that carbon into the soil through roots and residues, where microbes turn part of it into organic matter.",
              "When soil is plowed often, eroded, or converted from forest or grassland to cropland, some of that carbon returns to the air as carbon dioxide. Practices that build organic matter can store more carbon and also improve water holding and fertility, though how much carbon soils can store, and for how long, varies a lot.",
            ],
            source: "fao-soils-climate",
          },
          {
            heading: "City soils and soil careers",
            body: [
              "Urban soils are often compacted, mixed with construction debris, or contaminated with lead from old paint and past leaded gasoline. Gardeners in cities often test their soil first and may use raised beds filled with clean soil and compost.",
              "Soil careers include soil scientists, who study and map soils; soil conservationists, who help farmers plan practices; farmers and ranchers; environmental engineers, who clean up polluted sites; and urban planners and landscape designers.",
            ],
            source: "sssa-kskl",
          },
          {
            heading: "Your capstone: schoolyard soil health survey",
            body: [
              "As a Soil Steward, you will survey soils around your school using methods from the NRCS Soil Quality Test Kit: an infiltration test, a slake test, an earthworm count, and observations of color, smell, and structure.",
              "You will compare at least three spots, such as a garden, a lawn, and a well-worn path, then present your results and suggest one change to improve the worst site.",
            ],
            source: "nrcs-test-kit",
          },
        ],
        activity: {
          title: "Soil Steward project: schoolyard soil health survey",
          time: "Two 45-minute sessions",
          materials: ["Tin cans with both ends removed and a ruler", "A measuring cup and water jugs", "A stopwatch", "A trowel", "A tray for sorting soil", "Window screen and clear cups for slake tests", "pH strips and distilled water (optional)", "A clipboard with a data table", "A map of the schoolyard"],
          steps: [
            "With your teacher, pick at least three survey sites and mark them on a map. Predict which site has the healthiest soil.",
            "At each site, run an infiltration test: push the can 3 inches into the soil, add 1 inch of water, and time how long it takes to soak in.",
            "Dig a small block of soil, count earthworms, and note color, smell, roots, and crumb structure. Return the soil and worms.",
            "Take a few dry clods back to class and run slake tests.",
            "Organize results in a table and bar graph. Present which site is healthiest, which needs help, and one practical fix such as mulch, a path, or a cover planting.",
          ],
          lookFor: "Sites with plant cover and little foot traffic usually soak up water faster and have more worms and stable crumbs.",
          safety: "Get permission for every site and avoid digging near pipes, sprinklers, or wires. Tape sharp can edges. Wear gloves and wash hands afterward.",
        },
        quiz: [
          { prompt: "According to the FAO, what is the largest store of carbon on land?", options: ["Forests' tree trunks", "Healthy soils", "Lakes", "Farm animals"], answer: 1, explain: "Soils hold more carbon than all land plants combined." },
          { prompt: "Which action is most likely to release soil carbon to the air?", options: ["Planting cover crops", "Adding compost", "Frequently plowing and leaving soil bare", "Mulching a garden"], answer: 2, explain: "Tillage breaks aggregates and speeds decomposition of organic matter." },
          { prompt: "Why do many city gardeners test their soil before planting food?", options: ["Urban soil may contain lead from old paint or gasoline", "City soil is always perfect", "Testing makes plants grow faster", "It is required for flowers only"], answer: 0, explain: "Lead and other contaminants are common in urban soils." },
          { prompt: "What does a soil conservationist do?", options: ["Designs airplanes", "Helps landowners plan practices that protect soil and water", "Only sells fertilizer", "Paves fields"], answer: 1, explain: "Conservationists, including many at the NRCS, help plan conservation practices." },
          { prompt: "In your survey, the garden soaks in 1 inch of water in 3 minutes and the path takes 30 minutes. What does this suggest?", options: ["The path soil is healthier", "Both soils are the same", "Water can't soak into any soil", "The path soil is compacted"], answer: 3, explain: "Slow infiltration is a sign of compaction from foot traffic." },
          { prompt: "Which best describes food security?", options: ["Locking food in a safe", "All people having reliable access to enough safe, nutritious food", "Growing only one crop", "Eating only at school"], answer: 1, explain: "Food security means reliable access to enough safe, nutritious food." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Soil management sits at the center of food security, climate policy, and community health. Your capstone asks you to design a data-driven conservation plan for a real place.",
        objectives: [
          "I can explain the links between soil degradation, crop yields, and food security.",
          "I can quantify soil organic carbon stocks and explain the uncertainties in soil carbon sequestration.",
          "I can evaluate urban soil risks and describe careers in soil science and conservation.",
          "I can design a soil conservation plan for a real local site using soil survey data and field measurements.",
        ],
        vocab: [
          { term: "Soil organic carbon (SOC) stock", def: "The mass of organic carbon in a soil layer per unit area, often in tonnes per hectare." },
          { term: "Saturation (of soil carbon)", def: "The idea that a soil's capacity to gain carbon slows as it approaches a new equilibrium for its climate, texture, and management." },
          { term: "Permanence", def: "How long stored carbon stays in the soil; it can be lost again if management changes." },
          { term: "Web Soil Survey", def: "A free NRCS online tool that maps soils and their properties for any area in the United States." },
          { term: "Conservation plan", def: "A site-specific set of practices, with goals and monitoring, designed to protect soil, water, and other resources." },
        ],
        sections: [
          {
            heading: "Soil and food security",
            body: [
              "Most human calories come from crops grown in soil. The FAO's 2015 Status of the World's Soil Resources concluded that most of the world's soils are in fair, poor, or very poor condition and identified erosion, nutrient imbalance, and loss of organic carbon among the most serious threats to food production.",
              "Because farmland can expand only by clearing forests and grasslands, which releases carbon and destroys habitat, maintaining the productivity of existing soils is central to feeding a growing population.",
            ],
            source: "fao-swsr",
          },
          {
            heading: "Soil carbon: potential and caution",
            body: [
              "The FAO estimates that soils store roughly 1,500 billion tonnes of organic carbon in the top meter, more than the atmosphere and all vegetation combined, making soils the largest store of organic carbon on land. Historic conversion of grasslands and forests to cropland released a large share of the original carbon in many agricultural soils.",
              "Practices such as cover crops, reduced tillage, and adding organic amendments can raise SOC, improving fertility and water holding. But gains are often slow, can level off as soils approach a new equilibrium, are hard to measure against natural variability, and can be reversed if management changes. Scientists see soil carbon as one helpful part of climate solutions, not a replacement for cutting emissions.",
            ],
            callout: { title: "Unit check", text: "SOC stock (t/ha) = bulk density (g/cm³) × depth (cm) × SOC fraction × 100. To convert carbon to CO₂, multiply by 44/12 ≈ 3.67." },
            source: "fao-soc",
          },
          {
            heading: "Urban soils, careers, and policy",
            body: [
              "Urban soils are shaped by construction, fill, compaction, and sealing, and many contain elevated lead from historic paint and gasoline. They also provide stormwater infiltration, cooling, and space for gardens and trees, so cities increasingly plan green infrastructure that depends on healthy soil.",
              "Careers include soil scientists who map and classify soils, soil conservationists and agronomists who advise farmers, environmental consultants who remediate contaminated land, and farmers who manage soil daily. Policy tools range from NRCS cost-share programs to local zoning that limits sealing of prime farmland.",
            ],
            source: "sssa-kskl",
          },
          {
            heading: "Capstone: design a soil conservation plan",
            body: [
              "Choose a real local site: a farm field, school grounds, a park slope, or a community garden. Use the NRCS Web Soil Survey to identify the soil map units, texture, slope, drainage class, and erosion hazard. Then collect field data with test-kit methods such as infiltration, slake tests, and earthworm counts.",
              "Identify the main resource concern, set measurable goals, select practices matched to the site, estimate costs and trade-offs, and propose a monitoring schedule. Present your plan to a real audience such as a landowner, school facilities staff, or a local conservation district.",
            ],
            source: "nrcs-test-kit",
          },
        ],
        activity: {
          title: "Soil Steward project: conservation plan for a local site",
          time: "2 to 3 weeks of class and field time",
          materials: ["Computer access to the NRCS Web Soil Survey", "Field kit: tin cans, ruler, measuring cup, water, stopwatch, trowel, screen, cups", "pH strips or a soil test from a local extension lab", "A phone camera for site photos", "Spreadsheet software", "A plan template with sections for goals, practices, costs, and monitoring"],
          steps: [
            "Get permission for your site. Look it up in Web Soil Survey and record soil names, texture, slope, drainage, and erosion hazard ratings.",
            "Visit the site. Photograph signs of erosion, compaction, bare soil, or ponding. Collect infiltration, slake, and earthworm data at three or more spots.",
            "Analyze your data in a spreadsheet. Identify the top resource concern, such as erosion on a slope or compaction on a path.",
            "Choose two to four practices (for example cover crops, mulch, a buffer strip, a rain garden, or rerouting foot traffic). Use evidence to justify each and note trade-offs and costs.",
            "Write measurable goals (for example, double infiltration rate in two years) and a monitoring plan. Present to your class and, if possible, to the site manager or conservation district.",
          ],
          lookFor: "A strong plan connects specific data to a specific problem, chooses practices that fit the soil and slope, and includes a realistic way to check whether it worked.",
          safety: "Work in teams with adult supervision, get landowner permission, call before you dig near utilities, and wear gloves. Avoid digging in soil suspected of contamination without guidance.",
        },
        quiz: [
          { prompt: "A soil has a bulk density of 1.3 g/cm³ and 2% organic carbon in the top 30 cm. What is its SOC stock?", options: ["7.8 t C/ha", "26 t C/ha", "78 t C/ha", "780 t C/ha"], answer: 2, explain: "1.3 × 30 × 0.02 × 100 = 78 tonnes of carbon per hectare." },
          { prompt: "A practice adds 0.5 t of soil carbon per hectare per year. About how much CO₂ is that?", options: ["About 1.8 t CO₂", "About 0.14 t CO₂", "About 0.5 t CO₂", "About 18 t CO₂"], answer: 0, explain: "0.5 × 44/12 ≈ 1.8 tonnes of CO₂ per hectare per year." },
          { prompt: "Why do scientists describe soil carbon storage cautiously?", options: ["Soils store no carbon", "Gains can be slow, level off, be hard to measure, and be reversed", "Carbon in soil is always permanent", "Soil carbon only exists in deserts"], answer: 1, explain: "Saturation, measurement uncertainty, and permanence all limit how much we can count on soil carbon." },
          { prompt: "Which statement about soil carbon is best supported by FAO sources?", options: ["The atmosphere holds more carbon than soils and plants combined", "Soils hold less carbon than land plants", "Soil carbon cannot change", "Soils are the largest store of organic carbon on land"], answer: 3, explain: "The FAO describes soils as the largest terrestrial organic carbon pool." },
          { prompt: "A Web Soil Survey report shows a silt loam on an 8% slope with a severe erosion hazard. Field data show bare soil and slow infiltration. Which plan fits best?", options: ["Add pavement", "Cover crops or permanent vegetation plus contour practices or a buffer strip", "Plow more often", "Remove all plants to dry the soil"], answer: 1, explain: "Cover reduces raindrop impact, and contour practices or buffers slow runoff on slopes." },
          { prompt: "Why is protecting existing farmland important for both food and climate?", options: ["Expanding farmland usually means clearing forests and grasslands, which releases carbon", "Existing farmland stores no carbon", "Food can be grown without soil everywhere", "Clearing forests adds soil carbon"], answer: 0, explain: "Keeping current soils productive reduces pressure to clear carbon-rich ecosystems." },
        ],
      },
    },
  },
];
