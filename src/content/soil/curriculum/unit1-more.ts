import type { CurriculumLesson } from "./types";

/** Unit 1 (continued): how soil forms and the layers it builds. */
export const UNIT1_MORE: CurriculumLesson[] = [
  {
    slug: "soil-formation",
    unit: 1,
    title: "How Soil Forms",
    icon: "⛰️",
    bigIdea: "Soil forms very slowly as rock is weathered and living things, water, and air change it in place, so an inch of topsoil can take hundreds of years to build.",
    interactive: { type: "formation-timeline", title: "Soil time machine", intro: "Step through time and watch bare rock become soil." },
    sources: ["jenny-1941", "nrcs-ssm", "weil-brady", "smithsonian-dig-it", "s4t"],
    standards: {
      elementary: ["4-ESS2-1", "5-ESS2-1"],
      middle: ["MS-ESS2-1", "MS-ESS2-2"],
      high: ["HS-ESS2-5", "HS-ESS2-7"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "Every bit of soil started out as rock! Water, ice, plants, and tiny living things slowly break rock into crumbs and turn it into soil.",
        objectives: [
          "I can explain that soil comes from rock that breaks into tiny pieces.",
          "I can name three things that break down rock.",
          "I can explain why soil takes a very long time to form.",
        ],
        vocab: [
          { term: "Weathering", def: "When rock slowly breaks into smaller and smaller pieces." },
          { term: "Bedrock", def: "The solid rock deep under the soil." },
          { term: "Lichen", def: "A living thing, part fungus and part algae, that grows on bare rock and helps break it down." },
          { term: "Parent material", def: "The rock or other material that a soil forms from." },
        ],
        sections: [
          {
            heading: "Soil starts as rock",
            body: [
              "Long ago, the ground in many places was bare rock. No plants could grow there.",
              "Little by little, the rock cracked and crumbled into tiny bits. Those bits became the start of soil. Scientists call this breaking down weathering.",
            ],
            source: "smithsonian-dig-it",
          },
          {
            heading: "Rock breakers",
            body: [
              "Water gets into cracks in rock. When it freezes, the ice pushes the crack wider. Freeze, melt, freeze, melt, and pop! The rock breaks.",
              "Plant roots grow into cracks and push them apart. Wind and rushing water bump grains of sand against rock and rub it away.",
              "Some living things, like lichens, make weak acids that slowly eat away at rock.",
            ],
            callout: { title: "Try it!", text: "Look for cracks in an old sidewalk. Do you see any plants growing in them? They are rock breakers too!" },
            source: "weil-brady",
          },
          {
            heading: "A very slow recipe",
            body: [
              "When plants and animals die, they rot and mix into the rock bits. Worms and bugs stir it all together.",
              "Making soil is very slow. It can take hundreds of years to make just one inch of soil. That's why we take care of the soil we have.",
            ],
            source: "smithsonian-dig-it",
          },
        ],
        activity: {
          title: "Shake a rock",
          time: "20 minutes",
          materials: ["A plastic jar with a lid", "4 sugar cubes", "A dark piece of paper", "A magnifying glass", "A timer"],
          steps: [
            "Pretend the sugar cubes are rocks. Look at their sharp corners with the magnifying glass.",
            "Put the cubes in the jar and close the lid.",
            "Shake the jar hard for 2 minutes. This is like rocks bumping in a river.",
            "Pour everything onto the dark paper. Look at the cubes and the powder with the magnifying glass.",
            "Put the cubes back and shake for 2 more minutes. What changed?",
          ],
          lookFor: "The corners get round and a pile of tiny grains builds up. Rocks that bump and rub get smaller in the same way, just much more slowly.",
          safety: "Don't eat the sugar cubes after the activity. Use a plastic jar, not glass.",
        },
        quiz: [
          { prompt: "Where does soil come from?", options: ["Rock that breaks into tiny pieces", "Clouds", "Melted plastic", "The moon"], answer: 0, explain: "Soil starts as rock that slowly weathers into tiny pieces and mixes with old plants and animals." },
          { prompt: "What happens when water freezes in a crack in a rock?", options: ["The crack gets smaller", "The ice pushes the crack wider", "The rock turns into water", "Nothing happens"], answer: 1, explain: "Water takes up more space when it freezes, so ice pushes cracks wider." },
          { prompt: "How can plant roots help make soil?", options: ["They paint the rock", "They make rock hotter", "They grow into cracks and push rock apart", "They cannot help"], answer: 2, explain: "Roots grow into cracks and pry rock apart. When they die, they add organic matter too." },
          { prompt: "About how long can it take to make one inch of soil?", options: ["One day", "One week", "Hundreds of years", "One minute"], answer: 2, explain: "Soil forms very slowly. One inch can take hundreds of years." },
          { prompt: "What is weathering?", options: ["A rainy day", "Rock slowly breaking into smaller pieces", "A kind of worm", "Planting seeds"], answer: 1, explain: "Weathering is the slow breaking down of rock into smaller and smaller pieces." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "Soil is rock that has been broken down and remade by climate and living things. Five factors decide what kind of soil forms, and the work happens on a scale of centuries.",
        objectives: [
          "I can compare physical, chemical, and biological weathering and give an example of each.",
          "I can name the five soil-forming factors and explain how each one affects soil.",
          "I can describe the four kinds of processes that change soil over time.",
          "I can explain why soil is a slowly renewing resource.",
        ],
        vocab: [
          { term: "Physical weathering", def: "Breaking rock into smaller pieces without changing what it is made of, for example by freeze-thaw or abrasion." },
          { term: "Chemical weathering", def: "Changing the minerals in rock into new substances, for example by dissolving them or by rusting iron." },
          { term: "Parent material", def: "The weathered rock or deposited sediment (such as river silt or windblown dust) that a soil develops from." },
          { term: "Topography", def: "The shape of the land, including slope steepness and which way a slope faces." },
          { term: "Leaching", def: "Water carrying dissolved materials down and out of the soil." },
        ],
        sections: [
          {
            heading: "Three ways to break a rock",
            body: [
              "Physical weathering breaks rock into smaller pieces. In freeze-thaw (frost wedging), water seeps into cracks and expands by about 9% as it freezes, prying the rock apart. Roots growing in cracks do the same thing. Abrasion happens when wind, water, or ice grinds particles against rock.",
              "Chemical weathering changes the minerals themselves. Rainwater picks up carbon dioxide and becomes a weak acid that can dissolve limestone. Iron in minerals reacts with oxygen and rusts, turning soil red or yellow. Feldspar minerals slowly react with water to form clay.",
              "Biological weathering is done by living things. Lichens and microbes release acids, roots pry and release acids, and burrowing animals bring fresh rock fragments to the surface.",
            ],
            callout: { title: "Surface area matters", text: "Breaking a rock into smaller pieces exposes more surface. That speeds up chemical weathering, so physical and chemical weathering work as a team." },
            source: "weil-brady",
          },
          {
            heading: "The five soil-forming factors",
            body: [
              "In 1941 soil scientist Hans Jenny described five factors that control what kind of soil forms. Students often remember them as CLORPT.",
              "Climate: temperature and rainfall set how fast weathering and decay happen. Organisms: plants, animals, and microbes add organic matter and mix soil. Relief (topography): steep slopes lose soil to erosion, while low spots collect water and sediment. Parent material: the starting rock or sediment controls texture and minerals. Time: older soils usually have more developed layers.",
            ],
            source: "jenny-1941",
          },
          {
            heading: "Four kinds of change",
            body: [
              "The USDA Soil Survey Manual describes soil layers as forming through four kinds of processes. Additions: materials come in, such as fallen leaves, rain, or windblown dust. Losses: materials leave, through leaching or erosion. Transfers (translocations): materials move within the soil, such as clay washing from the top layer into a lower one. Transformations: materials change form, such as leaves decaying into humus or minerals weathering into clay.",
              "Over time these processes sort the soil into horizons, the layers you'll explore in the next lesson.",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "Measured in centuries",
            body: [
              "Soil formation is slow. Estimates are commonly in the hundreds of years for one inch of topsoil, and the rate depends on climate and parent material. Warm, wet places generally weather rock faster than cold or dry places.",
              "Erosion on bare land can remove an inch of soil in just a few years or even one storm, so soil lost today is not replaced in a human lifetime.",
            ],
            source: "smithsonian-dig-it",
          },
        ],
        activity: {
          title: "Weathering race",
          time: "30 minutes plus overnight soaking",
          materials: ["4 pieces of white chalk (calcium carbonate sidewalk or classroom chalk)", "2 clear plastic cups", "Water", "White vinegar", "A plastic jar with a lid", "A paper towel", "A notebook"],
          steps: [
            "Physical weathering: put 1 piece of chalk in the jar with a little water. Shake hard for 3 minutes. Pour it out onto a paper towel and compare it to a fresh piece.",
            "Chemical weathering: put 1 piece of chalk in a cup of water and 1 piece in a cup of vinegar. Watch for 5 minutes and record what you see.",
            "Leave both cups overnight. Compare the size of the chalk in each cup the next day.",
            "Break the last piece of chalk into small bits and drop them into fresh vinegar. Does it react faster than the whole piece?",
          ],
          lookFor: "Shaking rounds and wears down the chalk (abrasion). Vinegar makes bubbles of carbon dioxide and dissolves the chalk, much like acidic rain dissolving limestone. Smaller pieces react faster because they have more surface area.",
          safety: "Wear safety glasses with vinegar and don't rub your eyes. Use plastic, not glass. Wash hands when done.",
        },
        quiz: [
          { prompt: "Which is an example of chemical weathering?", options: ["Ice wedging a crack open", "Iron in a rock rusting", "Sand grinding a rock", "A root splitting a rock"], answer: 1, explain: "Rusting changes iron minerals into new substances, so it's chemical. The others break rock without changing its minerals." },
          { prompt: "In CLORPT, what does the R stand for?", options: ["Rain", "Rocks", "Relief, or topography", "Roots"], answer: 2, explain: "Jenny's five factors are climate, organisms, relief (topography), parent material, and time." },
          { prompt: "Clay washing from the top layer down into a lower layer is which kind of soil process?", options: ["Addition", "Transfer (translocation)", "Transformation", "Loss"], answer: 1, explain: "The clay stays in the soil but moves from one layer to another, so it's a transfer." },
          { prompt: "Why does breaking rock into small pieces speed up chemical weathering?", options: ["Small pieces have more surface area exposed", "Small pieces are colder", "Small pieces have no minerals", "It doesn't speed it up"], answer: 0, explain: "More surface area means more contact with water, acids, and air, so reactions happen faster." },
          { prompt: "Two hillsides have the same rock and climate. One is steep and one is gentle. Which factor explains why the steep one has thinner soil?", options: ["Parent material", "Climate", "Organisms", "Relief (topography)"], answer: 3, explain: "On steep slopes, more soil washes away, so relief controls soil thickness here." },
          { prompt: "Fallen leaves landing on the soil surface are an example of…", options: ["A loss", "An addition", "A transfer", "Erosion"], answer: 1, explain: "Leaves bring new material into the soil from outside, so they're an addition." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Soil is a natural body built by the interaction of climate, life, landscape, parent material, and time. Pedogenesis runs on chemistry and biology, and its slow pace makes soil effectively non-renewable for people.",
        objectives: [
          "I can explain the mechanisms of physical, chemical (hydrolysis, oxidation, dissolution), and biological weathering.",
          "I can use Jenny's state-factor model to predict how changing one factor changes the soil.",
          "I can classify soil processes as additions, losses, transfers, or transformations.",
          "I can calculate formation and loss timescales and argue why soil is non-renewable on human timescales.",
        ],
        vocab: [
          { term: "Pedogenesis", def: "The set of processes by which soil forms and develops horizons." },
          { term: "State factors", def: "Jenny's five independent controls on soil formation: climate, organisms, relief, parent material, and time." },
          { term: "Hydrolysis", def: "A chemical weathering reaction in which water reacts with minerals such as feldspar, releasing cations and forming clay minerals." },
          { term: "Translocation", def: "Movement of material (clay, iron, organic matter, salts) from one part of a soil profile to another." },
          { term: "Residual vs. transported parent material", def: "Residual parent material weathered in place from bedrock. Transported material was moved by water, wind, ice, or gravity before soil formed in it." },
        ],
        sections: [
          {
            heading: "Weathering mechanisms",
            body: [
              "Physical weathering reduces particle size without changing mineralogy. Frost wedging works because water expands about 9% on freezing, and repeated freeze-thaw cycles pry joints open. Root wedging, abrasion, and thermal expansion and contraction also fracture rock.",
              "Chemical weathering alters minerals. In hydrolysis, water reacts with silicate minerals such as feldspar, releasing cations like K⁺ and forming clay minerals such as kaolinite. Carbonic acid (H₂CO₃), formed when CO₂ dissolves in water, dissolves calcite in limestone. Oxidation of Fe²⁺ in minerals to Fe³⁺ forms iron oxides that color soils red and yellow.",
              "Biological weathering links the two. Roots and microbes release CO₂ and organic acids, and lichens and fungi pull nutrients out of mineral surfaces. Soil air often has much higher CO₂ than the atmosphere because of root and microbial respiration, which boosts carbonic acid weathering.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Jenny's state-factor model",
            body: [
              "In Factors of Soil Formation (1941), Hans Jenny proposed that soil properties are a function of five state factors: S = f(cl, o, r, p, t). Climate, organisms, relief, parent material, and time.",
              "The power of the model is in comparisons. A climosequence holds four factors roughly constant and varies climate. A chronosequence compares soils of different ages, such as terraces or glacial deposits of known age. These natural experiments let scientists isolate the effect of one factor.",
            ],
            callout: { title: "Life and land evolved together", text: "Soils as we know them depend on organisms. As life spread onto land, it sped up weathering and built soils, which in turn supported more plant life. Soil is a record of Earth's systems and life changing together." },
            source: "jenny-1941",
          },
          {
            heading: "Additions, losses, transfers, transformations",
            body: [
              "The USDA Soil Survey Manual defines soil partly by its horizons, which form through additions, losses, transfers, and transformations of energy and matter.",
              "Additions include organic litter, dust, and dissolved ions in rain. Losses include leaching of soluble ions below the root zone, CO₂ released by decomposition, and erosion. Transfers move clay, iron and aluminum oxides, humus, or carbonates downward in percolating water, or upward through capillary rise and animal burrowing. Transformations include decomposition of litter into humus and weathering of primary minerals into secondary clays and oxides.",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "Rates and human impact",
            body: [
              "Soil formation rates vary widely with climate and parent material, but they are slow: commonly hundreds of years per inch of topsoil. Erosion from bare or intensively tilled fields can remove soil many times faster than it forms.",
              "When loss outpaces formation, the gap is effectively permanent on human timescales. Protecting soil cover, adding organic matter, and reducing erosion are how land managers keep formation and loss closer to balance.",
            ],
            source: "smithsonian-dig-it",
          },
        ],
        activity: {
          title: "Surface area and weathering rate",
          time: "40 minutes",
          materials: ["2 equal pieces of chalk (calcium carbonate)", "White vinegar", "2 clear plastic cups", "A kitchen scale (0.1 g if possible)", "Paper towels", "A plastic bag and a spoon for crushing", "A timer"],
          steps: [
            "Weigh both chalk pieces and record their masses. They should be close to equal.",
            "Seal one piece in the plastic bag and crush it into small fragments with the back of a spoon.",
            "Pour 100 mL of vinegar into each cup. Add the whole piece to one cup and the crushed piece to the other at the same moment.",
            "After 10 minutes, carefully pour off the vinegar, blot the remaining chalk dry on paper towels, and weigh it. Do this for both cups.",
            "Calculate percent mass lost = (starting mass − final mass) ÷ starting mass × 100% for each. Repeat with fresh vinegar for a second 10-minute interval if time allows.",
          ],
          lookFor: "The crushed chalk loses a larger percent of its mass because more surface is exposed to acid. This models how physical weathering speeds up chemical weathering. Explain the reaction: CaCO₃ + acid releases CO₂ gas and dissolved calcium.",
          safety: "Wear safety glasses. Use plastic cups. Do not taste materials. Wash hands when finished.",
        },
        quiz: [
          { prompt: "Feldspar reacting with water to form clay and release potassium ions is an example of…", options: ["Frost wedging", "Hydrolysis", "Abrasion", "Oxidation of iron"], answer: 1, explain: "Hydrolysis is the reaction of water with silicate minerals, producing clay minerals and releasing cations." },
          { prompt: "Using a hypothetical rate of 1 inch per 500 years, how long would it take to form a 6-inch layer of topsoil?", options: ["83 years", "506 years", "3,000 years", "30,000 years"], answer: 2, explain: "6 inches × 500 years per inch = 3,000 years." },
          { prompt: "A field loses topsoil at 0.05 inch per year while forming it at 1 inch per 500 years (0.002 inch per year). How many times faster is loss than formation?", options: ["25 times", "2.5 times", "250 times", "0.04 times"], answer: 0, explain: "0.05 ÷ 0.002 = 25. Loss outpaces formation by 25 times." },
          { prompt: "Scientists compare soils on river terraces of different known ages while climate, vegetation, slope, and parent material stay similar. Which factor are they isolating?", options: ["Climate", "Organisms", "Parent material", "Time"], answer: 3, explain: "This is a chronosequence. Holding the other factors roughly constant isolates the effect of time." },
          { prompt: "Why does soil air with high CO₂ speed up weathering of limestone?", options: ["CO₂ freezes in cracks", "CO₂ makes soil heavier", "CO₂ dissolves in water to form carbonic acid, which dissolves calcite", "CO₂ adds iron"], answer: 2, explain: "Dissolved CO₂ forms carbonic acid, and carbonic acid dissolves calcium carbonate." },
          { prompt: "Soluble ions carried below the root zone by percolating water is best classified as a…", options: ["Loss", "Addition", "Transformation", "Transfer within the profile"], answer: 0, explain: "The ions leave the soil profile, so leaching is a loss." },
        ],
      },
    },
  },
  {
    slug: "soil-horizons",
    unit: 1,
    title: "Soil Horizons",
    icon: "🪨",
    bigIdea: "Over time, soil-forming processes sort soil into layers called horizons, and each layer tells the story of how that soil formed.",
    interactive: { type: "soil-profile", title: "Explore a 3D soil profile", intro: "Drag to spin the soil column. Click a layer to learn about it." },
    sources: ["nrcs-ssm", "weil-brady", "smithsonian-dig-it", "s4t", "nrcs-soil-health", "sssa-kskl"],
    standards: {
      elementary: ["5-ESS2-1", "2-ESS2-1"],
      middle: ["MS-ESS2-2"],
      high: ["HS-ESS2-5"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "If you dig a deep hole, soil has stripes! Each stripe is a layer with its own job, like floors in a building.",
        objectives: [
          "I can tell that soil has layers called horizons.",
          "I can name the topsoil layer and tell why it matters.",
          "I can put the main soil layers in order from top to bottom.",
        ],
        vocab: [
          { term: "Horizon", def: "One layer of soil." },
          { term: "Topsoil", def: "The dark top layer of soil where most roots and soil animals live." },
          { term: "Subsoil", def: "The layer under topsoil. It is often lighter in color or reddish." },
          { term: "Bedrock", def: "The solid rock at the very bottom." },
        ],
        sections: [
          {
            heading: "Soil has stripes",
            body: [
              "When people dig a deep hole, they see bands of color on the side. Each band is a layer called a horizon.",
              "All the layers together, from the top down to the rock, are called a soil profile.",
            ],
            source: "smithsonian-dig-it",
          },
          {
            heading: "From top to bottom",
            body: [
              "On top, there are fallen leaves and bits of plants. Under that is topsoil. It is dark and full of worms, bugs, and roots.",
              "Below topsoil is subsoil. It has fewer roots and is often lighter or reddish. Deeper still is broken rock, and at the very bottom is solid bedrock.",
            ],
            callout: { title: "Letters for layers", text: "Scientists give each layer a letter. Topsoil is the A horizon. Bedrock is the R horizon, R for rock!" },
            source: "nrcs-ssm",
          },
          {
            heading: "Take care of topsoil",
            body: [
              "Topsoil is where most of our food grows. It is often less than a foot thick.",
              "Wind and rain can carry topsoil away when the ground is bare. Plants and leaves cover the soil like a blanket and keep it in place.",
            ],
            source: "nrcs-soil-health",
          },
        ],
        activity: {
          title: "Edible soil profile",
          time: "20 minutes",
          materials: ["A clear plastic cup", "Crushed chocolate cookies", "Chocolate pudding", "Vanilla pudding or yogurt", "Crunchy nut-free cereal", "Shredded coconut or green sprinkles", "A spoon"],
          steps: [
            "Put a layer of cereal on the bottom. This is the broken rock above bedrock.",
            "Add a layer of vanilla pudding. This is the lighter subsoil.",
            "Add a thick layer of chocolate pudding mixed with cookie crumbs. This is dark topsoil.",
            "Sprinkle coconut or sprinkles on top. These are the leaves and plant bits.",
            "Look at your cup from the side and name each layer. Then enjoy!",
          ],
          lookFor: "Each layer looks different from the side, just like a real soil profile. The dark topsoil layer sits near the top.",
          safety: "Check for food allergies first. Use only clean food and clean hands. Never eat real soil.",
        },
        quiz: [
          { prompt: "What is a soil horizon?", options: ["A sunset over a farm", "A layer in the soil", "A kind of worm", "A cloud"], answer: 1, explain: "A horizon is one layer of soil." },
          { prompt: "Which layer is dark and full of roots and worms?", options: ["Bedrock", "Subsoil", "Topsoil", "Broken rock"], answer: 2, explain: "Topsoil is dark because it has lots of rotting plant bits, and it's where most roots and soil animals live." },
          { prompt: "What is at the very bottom of a soil profile?", options: ["Solid bedrock", "Leaves", "Topsoil", "Air"], answer: 0, explain: "The R horizon is solid rock at the bottom." },
          { prompt: "Why is topsoil important?", options: ["It is always frozen", "It has no living things", "It is the hardest layer", "Most of our food grows in it"], answer: 3, explain: "Plants grow their roots in topsoil, and that's where most food crops get water and nutrients." },
          { prompt: "What helps keep topsoil from blowing or washing away?", options: ["Leaving the ground bare", "Plants and leaves covering the soil", "Digging it up every day", "Nothing can help"], answer: 1, explain: "Plants and leaf cover protect soil from wind and rain." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "Dig a deep hole and soil shows its layers, like pages in a history book. Each horizon formed as water, roots, and creatures moved and changed materials over thousands of years.",
        objectives: [
          "I can describe the O, A, E, B, C, and R horizons and how each forms.",
          "I can explain how water moving down through soil creates the E and B horizons.",
          "I can describe a soil profile using color, texture, and thickness.",
          "I can explain why losing topsoil is a serious problem.",
        ],
        vocab: [
          { term: "Soil horizon", def: "A layer of soil, roughly parallel to the surface, with properties different from the layers above and below." },
          { term: "Soil profile", def: "A vertical cross-section of soil showing all its horizons, from the surface down to the parent material or bedrock." },
          { term: "Topsoil (A horizon)", def: "The mineral surface layer, darkened by organic matter, where most roots and soil life are found." },
          { term: "Subsoil (B horizon)", def: "The layer below the A or E horizon, where clay, iron, and other materials from above often collect." },
          { term: "Parent material (C horizon)", def: "Loose, weathered rock or sediment that has been changed little by soil-forming processes." },
        ],
        sections: [
          {
            heading: "Reading a soil profile",
            body: [
              "The side of a deep hole shows bands of different colors and textures. Each band is a horizon, and together they make a soil profile.",
              "Horizons form over thousands of years as water, roots, and creatures move materials up and down. They are evidence of the additions, losses, transfers, and transformations you learned about in the last lesson.",
            ],
            source: "smithsonian-dig-it",
          },
          {
            heading: "Meet the master horizons",
            body: [
              "O horizon: a layer of leaves and rotting plant material, mostly organic matter. It is thickest in forests.",
              "A horizon: topsoil. A mineral layer darkened by humus and full of roots and life.",
              "E horizon: a pale layer where water has washed clay, iron, and aluminum down and out, leaving sand and silt behind. Not every soil has one. It is common in forest soils.",
              "B horizon: subsoil, where clay, iron, and minerals from above pile up. Often reddish, brown, or more clayey.",
              "C horizon: broken-up rock or sediment, the parent material the soil formed from. R horizon: solid bedrock.",
            ],
            callout: { title: "Memory trick", text: "From the top: O, A, E, B, C, R. Try \"Old Ants Eat Big Crunchy Rocks.\"" },
            source: "nrcs-ssm",
          },
          {
            heading: "Water is the mover",
            body: [
              "When rain soaks into the soil, it carries tiny clay particles and dissolved materials with it. Upper layers lose material, and deeper layers gain it. That's why the E horizon is pale and the B horizon below it often has more clay.",
              "Thickness varies a lot. A whole profile can be less than a foot deep on a rocky hillside or many feet deep in a river valley.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Topsoil is precious",
            body: [
              "The A horizon is often less than a foot thick, but it grows most of our food. It holds most of the soil's organic matter, nutrients, and living things.",
              "Topsoil takes hundreds of years per inch to form, but erosion can strip it away in a few storms when the ground is bare. Keeping the soil covered with plants or residue is one of the best ways to protect it.",
            ],
            source: "nrcs-soil-health",
          },
        ],
        activity: {
          title: "Profile detective",
          time: "45 minutes",
          materials: ["A trowel or small shovel", "A ruler or tape measure", "A spray bottle of water", "Golf tees or craft sticks", "Colored pencils and paper", "A camera or phone (optional)"],
          steps: [
            "With an adult's permission, find a place to look at a soil profile: the side of a garden bed, a fresh hole at least 30 cm deep, or a road cut viewed from a safe spot.",
            "Scrape the side of the hole smooth with the trowel and mist it with water so colors show up.",
            "Push a golf tee in wherever color or texture changes. Measure the depth of each boundary from the surface.",
            "For each layer, record its color, feel (gritty, smooth, or sticky), and whether you see roots or animals.",
            "Draw your profile to scale and label each layer with your best guess of its horizon letter (O, A, E, B, or C).",
            "Fill the hole back in when you're done.",
          ],
          lookFor: "A darker layer near the top (A horizon) with the most roots, and a lighter or redder layer below (B horizon) that may feel stickier from extra clay.",
          safety: "Only dig where an adult says it's okay, and have them call 811 before digging deeper than a garden bed so you avoid buried pipes and cables. Stay away from the edges of steep cuts. Wash hands afterward.",
        },
        quiz: [
          { prompt: "Which horizon is called topsoil?", options: ["O", "A", "B", "R"], answer: 1, explain: "The A horizon is the mineral topsoil, darkened by organic matter." },
          { prompt: "Why is the E horizon pale?", options: ["It is made of snow", "It has the most humus", "Water has washed clay, iron, and aluminum out of it", "It is solid bedrock"], answer: 2, explain: "Clay and iron are carried down and out, leaving lighter-colored sand and silt behind." },
          { prompt: "Where do clay and iron washed down from above often collect?", options: ["O horizon", "E horizon", "R horizon", "B horizon"], answer: 3, explain: "The B horizon (subsoil) is where materials washed down from above pile up." },
          { prompt: "What is the C horizon?", options: ["Weathered rock or sediment little changed by soil processes", "Leaf litter", "Topsoil", "The air above the soil"], answer: 0, explain: "The C horizon is the parent material, loose rock or sediment that has changed little." },
          { prompt: "Which order runs from the surface down?", options: ["R, C, B, E, A, O", "O, A, E, B, C, R", "A, O, B, E, R, C", "O, B, A, C, E, R"], answer: 1, explain: "From top to bottom: O, A, E, B, C, R." },
          { prompt: "Why is losing topsoil to erosion such a big deal?", options: ["Topsoil holds most organic matter and life, and it takes hundreds of years per inch to form", "Topsoil is the deepest layer", "Topsoil has no nutrients", "Erosion only affects bedrock"], answer: 0, explain: "Topsoil grows most food and forms very slowly, so it can't be quickly replaced." },
        ],
      },
      high: {
        minutes: 20,
        summary: "A soil profile is a record of pedogenesis. Horizons form as materials are added, lost, moved, and transformed, and reading them lets scientists classify soils and predict how land will behave.",
        objectives: [
          "I can identify the master horizons O, A, E, B, C, and R and the processes that form each.",
          "I can distinguish a soil profile from a pedon and explain why soil scientists use the pedon.",
          "I can explain eluviation and illuviation and use lab data to identify eluvial and illuvial horizons.",
          "I can evaluate the consequences of topsoil loss for productivity and ecosystem services.",
        ],
        vocab: [
          { term: "Master horizon", def: "One of the main horizon types (O, A, E, B, C, R) recognized in the USDA Soil Survey Manual, each defined by dominant processes and properties." },
          { term: "Pedon", def: "The smallest three-dimensional body of soil that shows the full range of a soil's horizons, typically about 1 to 10 square meters in surface area." },
          { term: "Eluviation", def: "The removal of material such as clay, iron, aluminum, or humus from a horizon by downward-moving water." },
          { term: "Illuviation", def: "The accumulation in a lower horizon of material moved in from above." },
          { term: "Subordinate distinction", def: "A lowercase letter added to a master horizon to describe a specific feature, such as Bt for a B horizon with illuvial clay." },
        ],
        sections: [
          {
            heading: "Profile and pedon",
            body: [
              "A soil profile is a two-dimensional vertical face, like the wall of a pit. But soil is a three-dimensional body, and horizons can vary in thickness over short distances.",
              "The USDA Soil Survey Manual uses the pedon as the basic sampling unit: the smallest volume of soil large enough to show the nature and arrangement of its horizons and their variability. A pedon typically has a surface area of about 1 to 10 square meters. Groups of similar, contiguous pedons form a polypedon, which is what soil maps describe.",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "The master horizons and how they form",
            body: [
              "O horizons are dominated by organic material such as litter and partly decomposed plant matter. A horizons are mineral horizons at or near the surface where humified organic matter accumulates mixed with minerals, making them darker than layers below.",
              "E horizons have lost silicate clay, iron, aluminum, or some combination, leaving a concentration of sand and silt particles. They are usually lighter in color. B horizons form below an A, E, or O horizon and show illuvial accumulation of clay, iron, aluminum, humus, carbonates, or gypsum, or evidence of alteration such as development of color and structure.",
              "C horizons are layers little affected by pedogenic processes, usually the parent material. R is hard bedrock. Lowercase suffixes add detail: Bt (illuvial clay), Bk (carbonates), and Ap (an A horizon disturbed by plowing).",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "Eluviation and illuviation",
            body: [
              "Water percolating through soil carries fine clay particles in suspension and dissolved ions in solution. The horizon that loses material is eluvial (E). The horizon where material accumulates is illuvial (often Bt for clay, Bs for iron and aluminum oxides with humus, or Bk for carbonates).",
              "Where clay accumulates depends on factors such as how deep water typically penetrates, soil pH, and changes in pore size. In drier climates, water rarely moves deep, so carbonates accumulate at shallower depths. In humid forests, strong leaching can produce a bleached E horizon over a dark, iron-rich B horizon.",
            ],
            callout: { title: "Clay skins", text: "In a Bt horizon you can often see shiny coatings of clay on the faces of soil peds and in pores, direct evidence that clay was carried down and deposited." },
            source: "weil-brady",
          },
          {
            heading: "Why topsoil matters",
            body: [
              "The A horizon holds a large share of a soil's organic matter, biological activity, and plant-available nutrients. It also has better structure and infiltration than most subsoils, so losing it lowers water-holding capacity and productivity.",
              "When erosion strips the A horizon, plowing mixes subsoil into the surface. The new surface is often lower in organic matter and higher in clay, so it crusts, sheds water, and needs more inputs to grow the same crop. Because topsoil forms at rates of hundreds of years per inch, the NRCS soil health principles focus on keeping soil covered, minimizing disturbance, and maintaining living roots to protect it.",
            ],
            source: "nrcs-soil-health",
          },
        ],
        activity: {
          title: "Model eluviation and illuviation",
          time: "40 minutes",
          materials: ["A clear 2-liter plastic bottle with the bottom cut off (have an adult cut it)", "A coffee filter and rubber band", "Clean play sand", "1 tablespoon of fine powdered clay or unscented cornstarch", "Powdered drink mix or a few drops of food coloring", "A measuring cup", "A ruler and a marker", "A tray or bowl to catch drainage"],
          steps: [
            "Cover the bottle's mouth with the coffee filter and rubber band. Set it upside down in a tray or bowl.",
            "Add about 15 cm of sand. On top, add a 2 cm layer of sand mixed with the powdered clay and drink mix. This represents a surface horizon with fine particles and soluble ions.",
            "Mark the bottom of the colored layer on the bottle.",
            "Slowly pour 100 mL of water on top. When it stops draining, mark how deep the color and the cloudy fine particles have moved.",
            "Repeat with four more 100 mL additions, marking the depth each time. Graph depth of the color front versus total water added.",
          ],
          lookFor: "The top layer becomes paler (eluviation) while color and fine particles collect at a lower depth (illuviation). Dissolved color usually moves farther than clay particles, which tend to lodge in smaller pores. More water moves the front deeper, like soils in wetter climates.",
          safety: "An adult should cut the bottle. Avoid breathing powdered clay dust; mix it gently. Wipe up water spills.",
        },
        quiz: [
          { prompt: "What is a pedon?", options: ["A single soil particle", "The smallest 3D body of soil that shows the full set of horizons, about 1 to 10 m²", "A type of bedrock", "A map of a whole county's soils"], answer: 1, explain: "The pedon is the basic 3D sampling unit used by the USDA Soil Survey." },
          { prompt: "A horizon labeled Bt has accumulated what?", options: ["Organic litter", "Carbonates", "Illuvial silicate clay", "Nothing; it's bedrock"], answer: 2, explain: "The t suffix marks accumulation of silicate clay moved in from above." },
          { prompt: "Clay content by horizon in one pedon: A 14%, E 7%, Bt 31%, C 16%. Which horizon is the main zone of illuviation?", options: ["A", "E", "C", "Bt"], answer: 3, explain: "The Bt has far more clay than the horizons above it and the parent material below, so clay has accumulated there." },
          { prompt: "Using the same data (E 7% clay, Bt 31% clay), about how many times more clay does the Bt horizon have than the E horizon?", options: ["About 4.4 times", "About 2 times", "About 24 times", "About the same"], answer: 0, explain: "31 ÷ 7 ≈ 4.4, strong evidence that clay moved from the E into the Bt." },
          { prompt: "Which process removes clay and iron from a horizon, leaving it pale?", options: ["Illuviation", "Eluviation", "Addition", "Weathering of bedrock"], answer: 1, explain: "Eluviation is the removal of material by downward-moving water, which leaves the E horizon bleached." },
          { prompt: "A field loses its A horizon to erosion, and plowing now mixes B horizon into the surface. What is the most likely result?", options: ["Higher organic matter at the surface", "More earthworms", "Lower organic matter, poorer infiltration, and lower yields", "No change"], answer: 2, explain: "Subsoil usually has less organic matter and more clay, so the new surface crusts, sheds water, and is less productive." },
        ],
      },
    },
  },
];
