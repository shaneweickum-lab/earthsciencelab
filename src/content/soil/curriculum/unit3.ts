import type { CurriculumLesson } from "./types";

/** Unit 3: Life in the Soil */
export const UNIT3: CurriculumLesson[] = [
  {
    slug: "soil-food-web",
    unit: 3,
    title: "The Soil Food Web",
    icon: "🕸️",
    bigIdea: "Soil is home to a huge web of living things that eat each other, and as they eat, they recycle nutrients that plants need to grow.",
    interactive: { type: "food-web", title: "Who eats whom underground?", intro: "Tap a living thing to see what it eats and what eats it." },
    sources: ["soil-biology-primer", "usda-healthy-soils", "fao-biodiversity", "nrcs-soil-is-alive", "weil-brady", "smithsonian-dig-it"],
    standards: {
      elementary: ["5-LS2-1", "5-PS3-1"],
      middle: ["MS-LS2-3", "MS-LS2-2"],
      high: ["HS-LS2-4", "HS-LS2-3"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "Under your feet, tiny living things are eating, hunting, and hiding. Together they make a food web that keeps plants healthy!",
        objectives: [
          "I can name at least four living things that live in soil.",
          "I can explain that plants make food from sunlight and feed the soil food web.",
          "I can tell what a decomposer does.",
        ],
        vocab: [
          { term: "Food web", def: "A map of who eats whom. It shows how living things are connected by food." },
          { term: "Producer", def: "A living thing, like a plant, that makes its own food from sunlight." },
          { term: "Decomposer", def: "A living thing, like a fungus or bacterium, that breaks down dead plants and animals." },
          { term: "Microbe", def: "A living thing too tiny to see without a microscope." },
        ],
        sections: [
          {
            heading: "It starts with plants",
            body: [
              "Plants use sunlight to make their own food. That is why they are called producers.",
              "Plants share some of that food with the soil. Old leaves fall down, roots die, and roots even leak a little sugar into the soil. Lots of soil creatures eat it!",
            ],
            source: "soil-biology-primer",
          },
          {
            heading: "Who lives down there?",
            body: [
              "Bacteria and fungi are tiny decomposers. They eat dead leaves and roots. A teaspoon of soil has more tiny living things than there are people on Earth!",
              "Bigger critters live there too. Tiny worms called nematodes, wiggly earthworms, mites, springtails, beetles, and centipedes all make soil their home.",
            ],
            callout: { title: "Wow!", text: "Some fungi grow long, thin threads through the soil. They can stretch much farther than the plant's roots." },
            source: "usda-healthy-soils",
          },
          {
            heading: "Eat and be eaten",
            body: [
              "Tiny hunters eat the bacteria and fungi. Bigger hunters, like centipedes and beetles, eat the smaller critters. Birds and moles eat earthworms and bugs.",
              "When soil critters eat and poop, they leave behind plant food in the soil. So the whole web helps plants grow!",
            ],
            source: "smithsonian-dig-it",
          },
        ],
        activity: {
          title: "Leaf litter critter hunt",
          time: "25 minutes",
          materials: ["A big handful of damp leaf litter and the top inch of soil under it", "A white sheet of paper or a white tray", "A magnifying glass", "A soft paintbrush", "A clear cup"],
          steps: [
            "Gently spread the leaf litter and soil on the white paper.",
            "Wait quietly for one minute. Watch for anything that moves.",
            "Use the paintbrush to gently move a critter into the clear cup so you can look closely with the magnifying glass.",
            "Count the legs. Draw each critter and guess if it eats plants, eats dead stuff, or hunts other critters.",
            "Put the leaves, soil, and critters back where you found them.",
          ],
          lookFor: "Look for springtails that hop, tiny round mites, worms, and fast centipedes. Try to find at least three different kinds of critters.",
          safety: "Wear gloves or wash your hands after. Do not pick up critters with your fingers, since some, like centipedes, can pinch or bite.",
        },
        quiz: [
          { prompt: "Where does the food in the soil food web first come from?", options: ["Rocks", "Plants that use sunlight", "Rain", "The moon"], answer: 1, explain: "Plants make food from sunlight. Their leaves, roots, and root sugars feed the soil food web." },
          { prompt: "Which of these is a decomposer?", options: ["A fungus", "A rock", "A bird", "A cloud"], answer: 0, explain: "Fungi and bacteria are decomposers. They break down dead leaves and roots." },
          { prompt: "A teaspoon of soil has more tiny living things than…", options: ["One ant", "Ten crayons", "The number of people on Earth", "Zero"], answer: 2, explain: "The USDA says a teaspoon of soil has more microbes than there are people on Earth." },
          { prompt: "Which animal eats earthworms?", options: ["A carrot", "A mushroom", "A grain of sand", "A mole"], answer: 3, explain: "Moles and birds are bigger hunters that eat earthworms and bugs." },
          { prompt: "How does the soil food web help plants?", options: ["It makes the soil cold", "It leaves plant food behind in the soil", "It turns soil into rock", "It blocks the sun"], answer: 1, explain: "As soil critters eat and poop, they leave nutrients that plant roots can take up." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "The soil food web is a community of producers, decomposers, grazers, and predators. Every bite moves energy and nutrients from one living thing to the next.",
        objectives: [
          "I can describe the main groups of organisms in the soil food web.",
          "I can model how energy and matter move through trophic levels in soil.",
          "I can explain how predators of bacteria and fungi release nitrogen that plants can use.",
        ],
        vocab: [
          { term: "Trophic level", def: "A feeding level in a food web, such as producers, organisms that eat producers, and predators." },
          { term: "Root exudates", def: "Sugars, amino acids, and other compounds that living roots release into the soil." },
          { term: "Protozoa", def: "Single-celled organisms that hunt bacteria and other microbes in soil water." },
          { term: "Nematodes", def: "Tiny roundworms. Different kinds eat bacteria, fungi, roots, or other nematodes." },
          { term: "Mineralization", def: "The change of nutrients from organic forms (in living or dead tissue) into inorganic forms plants can absorb." },
        ],
        sections: [
          {
            heading: "Producers power the web",
            body: [
              "According to the Soil Biology Primer, the soil food web starts with photosynthesizers: plants, lichens, moss, algae, and photosynthetic bacteria. They capture the sun's energy and store it in carbon compounds.",
              "That energy reaches the soil in three main ways: dead leaves and stems (residue), dead roots, and root exudates, which living roots leak into the soil around them.",
            ],
            source: "soil-biology-primer",
          },
          {
            heading: "The cast of characters",
            body: [
              "Bacteria and fungi are the decomposers. The USDA says there are more microorganisms in a teaspoon of soil than there are people on Earth. Fungi grow as long threads called hyphae that can reach water and nutrients far from roots.",
              "Protozoa and many nematodes graze on bacteria and fungi. Arthropods such as mites, springtails, and millipedes shred residue, and others, such as centipedes and spiders, are predators. Earthworms mix and tunnel through it all. At the top are higher-level predators like ground beetles, moles, and birds.",
            ],
            source: "usda-healthy-soils",
          },
          {
            heading: "Trophic levels underground",
            body: [
              "The Primer groups soil life into trophic levels. Level 1 is photosynthesizers. Level 2 is decomposers, mutualists such as mycorrhizal fungi, pathogens, and root feeders. Level 3 is shredders, grazers, and predators like protozoa and nematodes. Levels 4 and 5 are higher-level predators.",
              "At each step, most of the energy is used for living and is lost as heat. That's why there are far fewer predators than microbes.",
            ],
            source: "soil-biology-primer",
          },
          {
            heading: "Eating releases nitrogen",
            body: [
              "Bacteria and fungi hold a lot of nitrogen in their bodies. When a protozoan or nematode eats them, it gets more nitrogen than it needs. It releases the extra as ammonium (NH₄⁺), a form plant roots can take up.",
              "This release of plant-available nutrients from organic matter is called mineralization. It often happens right near roots, where microbes gather to feed on exudates.",
            ],
            callout: { title: "Hidden diversity", text: "A 2020 FAO report concluded that soils host more than a quarter of Earth's biological diversity, and that most soil organisms have not yet been described by scientists." },
            source: "soil-biology-primer",
          },
        ],
        activity: {
          title: "Berlese funnel critter trap",
          time: "20 minutes to set up plus 2 to 3 days of waiting",
          materials: ["A 2-liter plastic bottle", "Scissors (adult help)", "A piece of window screen or hardware cloth", "A cup of moist leaf litter and topsoil", "A small jar with a damp paper towel in the bottom", "A desk lamp with an LED or low-wattage bulb", "A magnifying glass or hand lens"],
          steps: [
            "With an adult, cut the bottle in half. Turn the top half upside down to make a funnel and set it in the bottom half.",
            "Place the screen inside the funnel, then put the leaf litter and soil on top of the screen.",
            "Set the small jar with the damp paper towel under the funnel opening.",
            "Place the lamp about 15 cm above the soil. Over 2 to 3 days, the light and drying push critters down into the jar.",
            "Examine the critters with the hand lens. Sort them by number of legs and body shape, and record whether each is likely a shredder, grazer, or predator.",
            "Release the critters outside when you are done.",
          ],
          lookFor: "Expect mites and springtails to be the most common, with fewer predators like centipedes or pseudoscorpions. Compare the number of prey to the number of predators.",
          safety: "An adult should do the cutting. Keep the lamp from touching the bottle or paper. Wash hands after handling soil.",
        },
        quiz: [
          { prompt: "Which group is at the first trophic level of the soil food web?", options: ["Earthworms", "Photosynthesizers like plants and algae", "Protozoa", "Centipedes"], answer: 1, explain: "Photosynthesizers capture the sun's energy and are the base of the food web." },
          { prompt: "What are root exudates?", options: ["Compounds such as sugars that living roots release into soil", "Dead insects", "Rocks around roots", "Rainwater in pores"], answer: 0, explain: "Roots leak sugars, amino acids, and other compounds that feed microbes near the root." },
          { prompt: "A nematode eats bacteria and releases extra nitrogen as ammonium. What is this process called?", options: ["Photosynthesis", "Erosion", "Mineralization", "Evaporation"], answer: 2, explain: "Mineralization turns nitrogen in organic matter into inorganic forms like ammonium that plants can use." },
          { prompt: "Why are there fewer predators than bacteria in soil?", options: ["Predators don't eat", "Bacteria are bigger", "Predators live only in water", "Energy is lost at each trophic level, so less is available higher up"], answer: 3, explain: "Most energy is used for life processes and lost as heat at each step, so higher levels support fewer organisms." },
          { prompt: "Which organism is mainly a shredder of dead leaves?", options: ["Millipede", "Bacterium", "Mole", "Algae"], answer: 0, explain: "Millipedes and many mites and springtails shred residue into smaller pieces that microbes can attack." },
          { prompt: "What did the FAO's 2020 report conclude about soil biodiversity?", options: ["Soils have almost no life", "Soils host more than a quarter of Earth's biological diversity", "All soil organisms have been named", "Soil life lives only in deserts"], answer: 1, explain: "The FAO report concluded soils host more than 25 percent of the world's biological diversity, much of it still undescribed." },
        ],
      },
      high: {
        minutes: 20,
        summary: "The soil food web is an energy-and-nutrient engine. Carbon fixed by plants flows through microbes and their predators, and predation on microbes is one of the main ways nitrogen becomes available to plants.",
        objectives: [
          "I can construct a soil food web model with trophic levels and functional groups.",
          "I can use proportional reasoning to estimate energy transfer between trophic levels.",
          "I can explain, using carbon-to-nitrogen ratios, why grazing on bacteria and fungi mineralizes nitrogen.",
          "I can evaluate how human land use affects soil biodiversity.",
        ],
        vocab: [
          { term: "Functional group", def: "A set of organisms that play a similar role in an ecosystem, such as decomposers, mutualists, grazers, or predators." },
          { term: "Rhizosphere", def: "The narrow zone of soil around roots that is directly influenced by root exudates and is rich in microbes." },
          { term: "Net mineralization", def: "Release of inorganic nutrients (such as NH₄⁺) from organic matter that exceeds what microbes take back up." },
          { term: "Immobilization", def: "Uptake of inorganic nutrients into microbial biomass, making them temporarily unavailable to plants." },
          { term: "Soil biodiversity", def: "The variety of life in soil, from genes and species to communities, and the roles they play." },
        ],
        sections: [
          {
            heading: "Energy in, energy out",
            body: [
              "The Soil Biology Primer describes the soil food web as the community of organisms living all or part of their lives in soil. Its energy comes almost entirely from photosynthesizers. Carbon enters as shoot and root residue and as root exudates, and much of the action concentrates in the rhizosphere.",
              "Decomposers (most bacteria and saprophytic fungi), mutualists (mycorrhizal fungi and nitrogen-fixing bacteria), pathogens, and root feeders form the second trophic level. Grazers such as protozoa and bacterial- or fungal-feeding nematodes, along with shredding arthropods, form the third. Predatory nematodes, mites, centipedes, and vertebrates occupy higher levels.",
            ],
            source: "soil-biology-primer",
          },
          {
            heading: "Proportional reasoning about trophic transfer",
            body: [
              "Ecologists often use a rough rule that around 10% of the energy at one trophic level ends up stored in the next, though real values vary widely. The rest is used for metabolism and released as heat, while carbon is released as CO₂ through respiration.",
              "Matter behaves differently from energy. Atoms like carbon and nitrogen are not lost. They are recycled, and that recycling is where the soil food web matters most to plants.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Why grazing mineralizes nitrogen",
            body: [
              "Bacteria have low carbon-to-nitrogen (C:N) ratios, meaning their cells are nitrogen-rich. Their grazers, such as protozoa and nematodes, need relatively more carbon than nitrogen. As the Soil Biology Primer explains, when nematodes eat bacteria or fungi, ammonium (NH₄⁺) is released because the prey contain more nitrogen than the nematodes need. Protozoa release excess nitrogen the same way.",
              "Because microbes cluster around roots, this ammonium is released right where roots can absorb it. Without grazers, much of that nitrogen would stay locked in microbial biomass (immobilized).",
            ],
            callout: { title: "Think like a soil scientist", text: "Remove the grazers and nitrogen cycling slows. Experiments that add protozoa or nematodes to soil with bacteria generally show more ammonium released than with bacteria alone." },
            source: "soil-biology-primer",
          },
          {
            heading: "Biodiversity and human impact",
            body: [
              "The FAO's 2020 State of Knowledge of Soil Biodiversity report concluded that soils host more than a quarter of the world's biological diversity and that more than 40% of living organisms in land ecosystems are associated with soil during their life cycle. It also stressed that most soil species remain undescribed.",
              "The report identified threats including land-use change, intensive tillage, compaction, pollution, erosion, and climate change. Practices such as keeping soil covered, reducing disturbance, and growing diverse plants help sustain the food web.",
            ],
            source: "fao-biodiversity",
          },
        ],
        activity: {
          title: "Berlese funnel biodiversity survey",
          time: "30 minutes to set up, 3 days of extraction, 40 minutes to analyze",
          materials: ["Two homemade Berlese funnels (2-liter bottles, screen, and a lamp with an LED or low-wattage bulb)", "Equal volumes (about 250 mL) of leaf litter and soil from two sites, such as a lawn and a wooded area", "Two small jars with damp paper towels", "Hand lens or a cheap clip-on phone microscope", "Data table"],
          steps: [
            "Collect equal volumes of surface soil and litter from two contrasting sites. Record each site's plant cover and how much it is disturbed.",
            "Set up one funnel per sample, with the lamp the same distance above each.",
            "After 3 days, sort organisms into groups: mites, springtails, insect larvae, centipedes, spiders or pseudoscorpions, worms, and other.",
            "Assign each group to a trophic role (shredder or grazer vs. predator) and count them.",
            "Calculate the percent of each group and the prey-to-predator ratio for each site. Compare the number of different groups (richness) between sites.",
            "Return organisms and soil outdoors.",
          ],
          lookFor: "Less disturbed sites with more litter often have more groups and more organisms. Prey should far outnumber predators at both sites, consistent with energy loss between trophic levels.",
          safety: "Get permission before sampling. Keep lamps away from flammable materials. Wear gloves or wash hands after handling soil.",
        },
        quiz: [
          { prompt: "Mycorrhizal fungi trade nutrients for plant sugars. In which trophic level and functional group does the Soil Biology Primer place them?", options: ["Level 4, predators", "Level 2, mutualists", "Level 1, photosynthesizers", "Level 3, shredders"], answer: 1, explain: "Mutualists such as mycorrhizal fungi sit at the second trophic level, feeding directly on plant carbon." },
          { prompt: "Bacteria in a soil sample hold 5,000 kJ of energy. Using a 10% transfer estimate, about how much energy reaches predatory nematodes that eat bacteria-feeding protozoa?", options: ["500 kJ", "5,000 kJ", "50 kJ", "5 kJ"], answer: 2, explain: "Bacteria to protozoa: 5,000 × 0.10 = 500 kJ. Protozoa to predatory nematodes: 500 × 0.10 = 50 kJ." },
          { prompt: "Why does a nematode release ammonium after eating bacteria?", options: ["Bacteria contain more nitrogen than the nematode needs", "Nematodes make nitrogen from sunlight", "Ammonium is a waste product of photosynthesis", "Bacteria contain no nitrogen"], answer: 0, explain: "Prey with a low C:N ratio supply excess nitrogen, which the grazer excretes as NH₄⁺." },
          { prompt: "A farmer removes residue and tills often. Based on the FAO report, what is the most likely effect on the soil food web?", options: ["More fungi and more predators", "No change", "More earthworms only", "Less food and habitat, reducing soil biodiversity"], answer: 3, explain: "Intensive tillage and loss of organic inputs are identified threats to soil biodiversity." },
          { prompt: "What happens to carbon atoms as energy is lost between trophic levels?", options: ["They are destroyed", "They are recycled, much of it released as CO₂ by respiration", "They turn into nitrogen", "They become sunlight"], answer: 1, explain: "Energy flows and is lost as heat, but matter cycles. Carbon is released as CO₂ and can be fixed again by plants." },
          { prompt: "Which statement about the FAO 2020 soil biodiversity report is accurate?", options: ["Soils hold less than 1% of biodiversity", "Every soil species has been described", "Soils host more than 25% of the world's biological diversity, and most species remain undescribed", "Soil biodiversity faces no threats"], answer: 2, explain: "The report found soils host more than a quarter of biodiversity, with much of it still unknown to science." },
        ],
      },
    },
  },
  {
    slug: "decomposition",
    unit: 3,
    title: "Decomposition and Organic Matter",
    icon: "🍂",
    bigIdea: "Decomposers break dead plants and animals down into humus and carbon dioxide, recycling nutrients and building the organic matter that makes soil fertile.",
    interactive: { type: "carbon-cycle", title: "Follow a carbon atom", intro: "Step through the carbon cycle from leaf to soil to air and back." },
    sources: ["soil-biology-primer", "weil-brady", "nrcs-cn-ratio", "fao-soc", "fao-soils-climate", "nrcs-soil-is-alive", "s4t"],
    standards: {
      elementary: ["5-LS2-1"],
      middle: ["MS-LS2-3", "MS-LS1-6"],
      high: ["HS-LS2-5", "HS-ESS2-6", "HS-LS2-3"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "What happens to a fallen leaf? Tiny living things eat it, and slowly it turns into dark, rich soil.",
        objectives: [
          "I can explain what decomposers do.",
          "I can describe how a leaf changes as it rots.",
          "I can tell why rotting leaves are good for soil.",
          "I can name things that rot and things that do not.",
        ],
        vocab: [
          { term: "Decompose", def: "To rot and break down into tiny pieces." },
          { term: "Decomposer", def: "A living thing, like a worm, fungus, or bacterium, that eats dead plants and animals." },
          { term: "Humus", def: "Dark, crumbly stuff made when dead plants and animals break down all the way." },
          { term: "Compost", def: "A pile of food scraps, leaves, and grass that rots into rich soil food." },
        ],
        sections: [
          {
            heading: "Nature's recyclers",
            body: [
              "When a leaf falls, it does not stay a leaf forever. Worms, bugs, fungi, and bacteria start to eat it.",
              "Bigger critters chew it into small bits. Then tiny microbes finish the job. These helpers are called decomposers.",
            ],
            source: "soil-biology-primer",
          },
          {
            heading: "From leaf to humus",
            body: [
              "First, the leaf gets soft and brown. Next, holes appear. After a while, you cannot tell it was ever a leaf.",
              "In the end, it turns into humus. Humus is dark and crumbly. It holds water like a sponge and feeds plants.",
            ],
            callout: { title: "Air breath", text: "Decomposers breathe out a gas called carbon dioxide, just like you do. Plants take that gas in to make food." },
            source: "weil-brady",
          },
          {
            heading: "Make your own soil food",
            body: [
              "People can help decomposers by making compost. Mix brown things, like dry leaves, with green things, like grass and fruit peels.",
              "Keep it damp and stir it. In a few months, the scraps turn into dark compost that helps gardens grow.",
            ],
            source: "s4t",
          },
        ],
        activity: {
          title: "The rot race",
          time: "10 minutes to set up, then 4 weeks of checking",
          materials: ["A clear plastic container with a lid that has air holes", "Moist garden soil", "A leaf, an apple slice, a piece of paper, and a plastic bottle cap", "A spray bottle of water", "A notebook for drawings"],
          steps: [
            "Fill the container halfway with moist soil.",
            "Push the leaf, apple slice, paper, and bottle cap against the side so you can see them. Cover them lightly with soil.",
            "Put the lid on and keep the container in a shady spot. Spray it with water if the soil dries out.",
            "Once a week, draw what each item looks like. Guess which one will rot first.",
          ],
          lookFor: "The apple should change fastest, then the paper and leaf. The plastic cap should not rot at all. You may see fuzzy mold, which is a fungus decomposer.",
          safety: "Keep the lid on and do not smell the container up close. Wash hands after. Throw the soil in an outdoor compost or garden when done.",
        },
        quiz: [
          { prompt: "What does a decomposer do?", options: ["Makes rain", "Eats dead plants and animals", "Turns soil into rock", "Makes sunlight"], answer: 1, explain: "Decomposers break down dead plants and animals into tiny pieces." },
          { prompt: "Which of these will NOT rot in soil?", options: ["An apple slice", "A leaf", "A plastic bottle cap", "A piece of paper"], answer: 2, explain: "Decomposers cannot eat plastic, so it stays in the soil for a very long time." },
          { prompt: "What do we call the dark, crumbly stuff made when leaves break down all the way?", options: ["Humus", "Sand", "Ice", "Glass"], answer: 0, explain: "Humus is dark, rich material that holds water and feeds plants." },
          { prompt: "Which pair makes a good compost mix?", options: ["Rocks and sand", "Plastic and metal", "Only water", "Dry leaves and fruit peels"], answer: 3, explain: "Compost needs browns, like dry leaves, and greens, like fruit peels and grass." },
          { prompt: "What gas do decomposers breathe out?", options: ["Carbon dioxide", "Helium", "Smoke", "Steam"], answer: 0, explain: "Decomposers breathe out carbon dioxide, which plants use to make food." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "Decomposition is how ecosystems recycle. Microbes turn dead material into humus, plant nutrients, and carbon dioxide, and the soil stores a huge amount of carbon along the way.",
        objectives: [
          "I can describe the stages of decomposition from fresh residue to humus.",
          "I can explain how the carbon-to-nitrogen ratio affects how fast things decompose.",
          "I can model how carbon moves from the air to plants to soil and back.",
          "I can describe benefits of soil organic matter.",
        ],
        vocab: [
          { term: "Residue", def: "Dead plant material, such as leaves, stems, and roots, left on or in the soil." },
          { term: "Soil organic matter", def: "All the material in soil that comes from living things, from fresh residue to humus." },
          { term: "C:N ratio", def: "The amount of carbon compared to the amount of nitrogen in a material." },
          { term: "Cellular respiration", def: "The process cells use to release energy from food, giving off carbon dioxide and water." },
          { term: "Humus", def: "Dark, well-decomposed organic matter that breaks down very slowly." },
        ],
        sections: [
          {
            heading: "The decomposition assembly line",
            body: [
              "The Soil Biology Primer describes a team effort. Shredders like earthworms, millipedes, and springtails break residue into smaller pieces, which gives microbes more surface to attack.",
              "Bacteria quickly eat the easy parts, like sugars. Fungi are especially good at breaking down tougher materials, like the lignin in woody stems. What is left after a long time is humus, which can last for many years.",
            ],
            source: "soil-biology-primer",
          },
          {
            heading: "Greens, browns, and the C:N ratio",
            body: [
              "Microbes need both carbon (for energy and building cells) and nitrogen (for proteins). Materials with lots of nitrogen, like grass clippings and food scraps, have a low C:N ratio. Gardeners call them greens. Dry leaves, straw, and wood chips have a high C:N ratio. They are browns.",
              "Greens break down quickly. Browns break down slowly because microbes run short of nitrogen. Composters often aim for a mix of roughly 25 to 30 parts carbon for every 1 part nitrogen.",
            ],
            callout: { title: "Why not just greens?", text: "A pile of only greens can get soggy, packed, and smelly. Browns add carbon and create air spaces." },
            source: "weil-brady",
          },
          {
            heading: "Decomposers breathe out CO₂",
            body: [
              "Plants pull carbon dioxide (CO₂) from the air during photosynthesis and build it into leaves and roots. When decomposers eat that material, they use cellular respiration to get energy, releasing much of the carbon back to the air as CO₂.",
              "Not all of it goes back to the air. Some becomes part of microbe bodies and humus, which can stay in the soil for years to centuries.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Soil, a giant carbon bank",
            body: [
              "The FAO describes healthy soils as the largest store of carbon on land, holding more carbon than all the world's plants. Soil organic matter is often only a few percent of a soil's weight, but it holds water, feeds soil life, supplies nutrients, and glues particles into crumbs.",
              "Managing soil to build organic matter, such as adding compost and keeping roots growing, can help keep more carbon in the ground instead of in the air.",
            ],
            source: "fao-soils-climate",
          },
        ],
        activity: {
          title: "Cotton strip decomposition test",
          time: "20 minutes to set up, 4 to 8 weeks of waiting",
          materials: ["Three strips of 100% cotton fabric (an old white T-shirt works), about 5 cm × 20 cm", "One strip of polyester fabric of the same size", "A trowel", "Craft sticks or flags to mark spots", "A ruler and camera"],
          steps: [
            "Photograph all strips before burying them.",
            "Bury cotton strips vertically about 15 cm deep at three spots, such as a garden bed, a lawn, and a packed path. Bury the polyester strip next to the garden strip as a control. Leave the top 2 cm showing and mark each spot.",
            "Predict which spot will decompose cotton fastest and why.",
            "After 4 to 8 weeks, dig up each strip carefully, rinse gently, and photograph it.",
            "Estimate the percent of each strip that was eaten away, and compare the sites.",
          ],
          lookFor: "Cotton is plant-based, so microbes eat it. Strips from moist soil with lots of organic matter usually lose the most. Polyester, a plastic, should barely change.",
          safety: "Check with an adult before digging so you avoid buried cables or pipes. Wear gloves and wash hands after.",
        },
        quiz: [
          { prompt: "Why do shredders like millipedes speed up decomposition?", options: ["They make residue wetter", "They break residue into smaller pieces with more surface for microbes", "They turn residue into rock", "They add plastic"], answer: 1, explain: "Smaller pieces give bacteria and fungi more surface area to attack." },
          { prompt: "Which material has a high C:N ratio (a brown)?", options: ["Grass clippings", "Food scraps", "Straw", "Fresh manure"], answer: 2, explain: "Straw is carbon-rich and nitrogen-poor, so it breaks down slowly." },
          { prompt: "What process releases CO₂ when decomposers eat dead leaves?", options: ["Cellular respiration", "Photosynthesis", "Evaporation", "Freezing"], answer: 0, explain: "Decomposers use cellular respiration to get energy, giving off CO₂." },
          { prompt: "According to the FAO, what is the largest store of carbon on land?", options: ["Trees", "Lakes", "Animals", "Soil"], answer: 3, explain: "The FAO describes healthy soils as the largest store of terrestrial carbon." },
          { prompt: "Which is a benefit of soil organic matter?", options: ["It holds water and nutrients", "It makes soil sterile", "It blocks roots", "It removes all air from soil"], answer: 0, explain: "Organic matter acts like a sponge for water and nutrients and feeds soil life." },
          { prompt: "Which group is especially good at breaking down tough, woody materials like lignin?", options: ["Algae", "Fungi", "Birds", "Rocks"], answer: 1, explain: "Fungi produce enzymes that break down tough compounds like lignin." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Decomposition is respiration at the scale of an ecosystem. How fast residue breaks down, and how much carbon stays in soil, depends on chemistry, climate, and management, with big consequences for the global carbon cycle.",
        objectives: [
          "I can explain decomposition as aerobic and anaerobic respiration that cycles carbon between the biosphere, geosphere, and atmosphere.",
          "I can use C:N ratios to predict nitrogen mineralization or immobilization.",
          "I can calculate the C:N ratio of a compost mix.",
          "I can evaluate how soil management affects soil organic carbon storage.",
        ],
        vocab: [
          { term: "Soil organic carbon (SOC)", def: "The carbon held in soil organic matter. Organic matter is roughly half carbon by mass." },
          { term: "Lignin", def: "A tough, complex compound in woody plant cell walls that decomposes slowly, mainly by fungi." },
          { term: "Nitrogen immobilization", def: "When microbes decomposing high C:N residue take up soil nitrogen, making it temporarily unavailable to plants." },
          { term: "Carbon sequestration", def: "Long-term storage of carbon removed from the atmosphere, for example in soil organic matter." },
          { term: "Anaerobic decomposition", def: "Breakdown of organic matter without oxygen, which is slower and can produce methane." },
        ],
        sections: [
          {
            heading: "Decomposition is respiration",
            body: [
              "Aerobic decomposers oxidize organic carbon for energy: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy. Simple sugars and proteins go first, then cellulose, and lignin last. Weil and Brady describe a typical result: of the carbon in fresh residue, roughly 60 to 80% is respired as CO₂ within a year, a small share becomes microbial biomass, and the rest becomes more stable humus.",
              "In waterlogged soils, oxygen runs short. Decomposition slows and some microbes produce methane (CH₄). That is why wetland soils such as peat can accumulate thick organic layers.",
            ],
            source: "weil-brady",
          },
          {
            heading: "The C:N ratio decides who wins the nitrogen",
            body: [
              "Microbial cells have a C:N ratio near 8:1. Because microbes respire about two-thirds of the carbon they consume, they need food with a C:N ratio of roughly 24:1 to meet their nitrogen needs.",
              "Residues well above that, like wheat straw (around 80:1), force microbes to pull mineral nitrogen out of the soil (immobilization), which can temporarily starve crops. Residues below it, like legume cover crops, release extra nitrogen (net mineralization). In compost, that's why greens and browns are blended, often to a starting C:N near 25 to 30:1.",
            ],
            callout: { title: "Compost math", text: "Add up carbon and nitrogen separately, then divide. Mixing 100 g of leaves (50 g C, 1 g N) with 100 g of grass (40 g C, 2 g N) gives 90 g C ÷ 3 g N = 30:1." },
            source: "nrcs-cn-ratio",
          },
          {
            heading: "Soil in the global carbon cycle",
            body: [
              "FAO describes soil organic carbon as the largest terrestrial pool of carbon, storing more than the vegetation growing on it. Estimates for the top meter of the world's soils are commonly around 1,500 billion tonnes of carbon, considerably more than the carbon in the atmosphere, though estimates vary.",
              "Because the pool is so large, small percentage changes matter. A soil that loses carbon through erosion, tillage, or drainage adds CO₂ to the air. A soil that gains it helps remove CO₂.",
            ],
            source: "fao-soc",
          },
          {
            heading: "Managing for organic matter",
            body: [
              "FAO highlights practices that tend to build or protect soil organic carbon: keeping soil covered with plants or residue, reducing tillage, adding compost and manure, using cover crops, and restoring degraded land. Benefits include better water holding, aggregate stability, nutrient supply, and habitat for soil organisms.",
              "Gains are slow and can be reversed. Warming can speed up decomposition, and a soil can reach a new balance after a few decades, so sequestration is real but limited.",
            ],
            source: "fao-soils-climate",
          },
        ],
        activity: {
          title: "Compost in a bottle: testing C:N ratio",
          time: "30 minutes to set up, 3 to 4 weeks of observations",
          materials: ["Three clear 2-liter bottles with the tops cut off and small holes poked in the sides and bottom", "Green materials (grass clippings, vegetable scraps)", "Brown materials (dry leaves, shredded paper)", "A handful of garden soil for each bottle", "A kitchen or soil thermometer", "A kitchen scale", "Plastic wrap and rubber bands"],
          steps: [
            "Using C:N values from a reference table, plan three mixes: mostly greens, mostly browns, and a blend that you calculate to be near 25 to 30:1. Show your math.",
            "Weigh and layer each mix into a bottle with a handful of soil. Moisten until it feels like a wrung-out sponge.",
            "Cover loosely with plastic wrap that has a few holes. Keep the bottles indoors at room temperature.",
            "Record the temperature in the center, the height of the material, the smell, and the appearance every two days.",
            "Graph temperature and height over time for each bottle and compare to your predictions.",
          ],
          lookFor: "The balanced blend should warm and shrink the most as microbes respire. The all-green bottle may get wet and smelly (low oxygen), and the all-brown bottle may barely change.",
          safety: "Do not add meat, dairy, or pet waste. Wear gloves, keep bottles away from food areas, and wash hands. Dispose of the compost outdoors.",
        },
        quiz: [
          { prompt: "A residue contains 400 g of carbon. If 70% is respired as CO₂ in the first year, how much carbon remains in the soil as microbial biomass and humus?", options: ["280 g", "120 g", "400 g", "70 g"], answer: 1, explain: "70% of 400 g = 280 g respired. 400 − 280 = 120 g remains in soil." },
          { prompt: "A gardener mixes 2 kg of straw (containing 800 g C and 10 g N) with 1 kg of food scraps (containing 300 g C and 20 g N). What is the C:N ratio of the mix?", options: ["About 15:1", "About 80:1", "About 37:1", "About 24:1"], answer: 2, explain: "Total C = 1,100 g and total N = 30 g. 1,100 ÷ 30 ≈ 37:1, still on the high side." },
          { prompt: "Wheat straw (C:N about 80:1) is tilled into a field just before planting corn. What is the likely short-term effect?", options: ["Microbes immobilize soil nitrogen, so corn may show nitrogen deficiency", "Corn gets a burst of extra nitrogen", "No microbes will grow", "The straw turns directly into humus overnight"], answer: 0, explain: "High C:N residue makes microbes take up soil nitrogen to decompose it, temporarily competing with the crop." },
          { prompt: "Why do peat soils in wetlands build up thick layers of organic matter?", options: ["Wetlands have no plants", "Peat is made of rock", "Plants grow faster in cold soil", "Waterlogging limits oxygen, slowing decomposition"], answer: 3, explain: "Without oxygen, aerobic decomposition slows and organic matter accumulates." },
          { prompt: "Which best describes soil's role in the terrestrial carbon cycle, according to FAO?", options: ["Soil holds almost no carbon", "Soil organic carbon is the largest pool of carbon on land", "Soil carbon cannot change", "All soil carbon comes from rocks"], answer: 1, explain: "FAO describes soils as the largest store of terrestrial carbon, larger than vegetation." },
          { prompt: "In which order do decomposers generally break down plant compounds?", options: ["Sugars, then cellulose, then lignin", "Lignin, then sugars, then cellulose", "Cellulose, then lignin, then sugars", "All at exactly the same rate"], answer: 0, explain: "Simple compounds go first; lignin is the most resistant and is broken down slowly, mainly by fungi." },
        ],
      },
    },
  },
  {
    slug: "roots-and-nitrogen",
    unit: 3,
    title: "Roots, Fungi, and the Nitrogen Cycle",
    icon: "🫘",
    bigIdea: "Roots partner with fungi and bacteria to get nutrients, and microbes move nitrogen between the air, soil, and living things in a cycle that farming can push out of balance.",
    interactive: { type: "nitrogen-cycle", title: "The nitrogen cycle", intro: "Step through how nitrogen moves from the air into plants and back." },
    sources: ["soil-biology-primer", "weil-brady", "nrcs-soil-is-alive", "sssa-kskl", "mdh-nitrate", "s4t"],
    standards: {
      elementary: ["5-LS2-1", "K-LS1-1"],
      middle: ["MS-LS2-2", "MS-LS2-3"],
      high: ["HS-LS2-3", "HS-LS2-4"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "Roots have secret helpers! Tiny fungi and bacteria help plants find food, and some even pull plant food out of the air.",
        objectives: [
          "I can explain that roots take in water and nutrients.",
          "I can describe how fungi help plant roots.",
          "I can find root nodules on a clover or bean plant.",
        ],
        vocab: [
          { term: "Root", def: "The part of a plant that grows underground and takes in water and food from the soil." },
          { term: "Nitrogen", def: "A nutrient plants need to grow green and strong. Most of the air is nitrogen gas." },
          { term: "Nodule", def: "A small bump on a root where helpful bacteria live." },
          { term: "Fungi", def: "Living things like mushrooms and molds. Many grow as tiny threads in soil." },
        ],
        sections: [
          {
            heading: "Roots are busy",
            body: [
              "Roots hold a plant in the ground. They also drink water and take in nutrients from the soil.",
              "Roots share sugar with the soil. Tiny microbes crowd around roots to eat it, like kids around a snack table!",
            ],
            source: "soil-biology-primer",
          },
          {
            heading: "Fungi friends",
            body: [
              "Some fungi grow right into plant roots. Their long, thin threads reach far out into the soil.",
              "The threads bring water and nutrients back to the plant. In return, the plant gives the fungi sugar. It's a fair trade!",
            ],
            source: "nrcs-soil-is-alive",
          },
          {
            heading: "Plant food from the air",
            body: [
              "Plants need nitrogen to grow, and air is mostly nitrogen. But plants can't use nitrogen gas from the air.",
              "Bean, pea, and clover plants have helpers. Bacteria live in little bumps on their roots called nodules. The bacteria turn nitrogen from the air into plant food.",
            ],
            callout: { title: "Look inside", text: "If you gently cut open a working nodule, it is often pink or red inside." },
            source: "s4t",
          },
        ],
        activity: {
          title: "Nodule hunt",
          time: "25 minutes",
          materials: ["A clover plant from a lawn, or a bean or pea plant that has grown for a few weeks", "A trowel", "A bucket of water", "A magnifying glass", "Paper towels"],
          steps: [
            "With an adult, dig around the plant and lift it out with lots of soil. Don't pull it, or the nodules may break off.",
            "Gently swish the roots in the bucket of water to wash off the soil.",
            "Lay the roots on a paper towel and look for small round bumps with the magnifying glass.",
            "Count the nodules and draw the roots. If an adult helps, cut one nodule open to see its color.",
          ],
          lookFor: "Look for small round or oval bumps stuck on the roots. Bumps that are pink or red inside are busy turning air nitrogen into plant food.",
          safety: "Ask permission before digging. An adult should do any cutting. Wash your hands after handling soil and plants.",
        },
        quiz: [
          { prompt: "What do roots take in from the soil?", options: ["Water and nutrients", "Sunlight", "Rocks", "Wind"], answer: 0, explain: "Roots take in water and nutrients that the plant needs to grow." },
          { prompt: "What do fungi get from plants in their trade?", options: ["Rocks", "Sugar", "Snow", "Nothing"], answer: 1, explain: "Plants give fungi sugar, and fungi bring back water and nutrients." },
          { prompt: "What lives inside root nodules?", options: ["Ants", "Rocks", "Helpful bacteria", "Water"], answer: 2, explain: "Helpful bacteria live in nodules and turn air nitrogen into plant food." },
          { prompt: "Which plant often has root nodules?", options: ["A cactus", "A pine tree", "A mushroom", "A clover"], answer: 3, explain: "Clover, beans, and peas are legumes that partner with nodule bacteria." },
          { prompt: "What color is a busy nodule often inside?", options: ["Blue", "Pink or red", "Black", "Clear like glass"], answer: 1, explain: "Working nodules are often pink or red inside." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "Plants can't do it alone. Roots trade sugar with fungi and bacteria, and soil microbes keep nitrogen cycling between the air, the soil, and living things.",
        objectives: [
          "I can describe the rhizosphere and why microbes gather there.",
          "I can explain the mutualism between plants and mycorrhizal fungi.",
          "I can explain how legumes and rhizobia bacteria fix nitrogen from the air.",
          "I can describe the main steps of the nitrogen cycle.",
        ],
        vocab: [
          { term: "Rhizosphere", def: "The thin zone of soil right around roots, packed with microbes feeding on root exudates." },
          { term: "Mycorrhizal fungi", def: "Fungi that live in partnership with plant roots, trading nutrients and water for plant sugars." },
          { term: "Mutualism", def: "A relationship between two species in which both benefit." },
          { term: "Rhizobia", def: "Bacteria that live in root nodules of legumes and fix nitrogen from the air." },
          { term: "Nitrogen fixation", def: "Changing nitrogen gas (N₂) from the air into forms living things can use, such as ammonium." },
        ],
        sections: [
          {
            heading: "The rhizosphere",
            body: [
              "Roots release exudates, such as sugars and amino acids, into the soil around them. This narrow zone, the rhizosphere, has far more microbes than the soil a few millimeters away.",
              "Those microbes, and the protozoa and nematodes that eat them, release nutrients right where roots can grab them.",
            ],
            source: "soil-biology-primer",
          },
          {
            heading: "Mycorrhizae: a fungal trade deal",
            body: [
              "Most land plants form partnerships with mycorrhizal fungi. The fungal threads (hyphae) are much thinner than roots and spread through soil far beyond them.",
              "The fungi gather water and nutrients, especially phosphorus, which moves very slowly in soil. In return, the plant feeds the fungi sugars made by photosynthesis. Both partners benefit, so this is mutualism.",
            ],
            source: "nrcs-soil-is-alive",
          },
          {
            heading: "Legumes and rhizobia",
            body: [
              "About 78% of the air is nitrogen gas (N₂), but plants can't use it directly because its two atoms are held together by a very strong bond.",
              "Legumes such as beans, peas, clover, and alfalfa partner with rhizobia bacteria. The bacteria live inside root nodules and fix N₂ into ammonium for the plant, and the plant supplies them with sugars. Farmers plant legumes as cover crops to add nitrogen to soil.",
            ],
            callout: { title: "Pink means working", text: "Active nodules are usually pink or red inside because of leghemoglobin, a protein that controls oxygen inside the nodule." },
            source: "weil-brady",
          },
          {
            heading: "Nitrogen keeps moving",
            body: [
              "After plants and animals die, decomposers release their nitrogen as ammonium (mineralization). Other bacteria convert ammonium into nitrate (nitrification). Plants take up both forms.",
              "In soggy soils with little oxygen, some bacteria turn nitrate back into nitrogen gas (denitrification). Nitrate also dissolves easily, so extra nitrate can wash down into groundwater or streams, where it becomes a pollutant.",
            ],
            source: "weil-brady",
          },
        ],
        activity: {
          title: "Inside a nodule",
          time: "30 minutes",
          materials: ["Two to four legume plants (clover from a lawn, or beans grown 4 to 6 weeks in garden soil)", "One non-legume plant, such as grass or a tomato seedling", "A trowel and a bucket of water", "A plastic knife or craft blade (adult use)", "A hand lens and a white paper plate"],
          steps: [
            "Dig up each plant with a wide ball of soil, then gently rinse the roots in the bucket.",
            "Compare the roots of the legumes and the non-legume. Count nodules on each legume.",
            "With adult help, slice several nodules in half on the paper plate and note the inside color: pink or red, white, or green or brown.",
            "Make a data table and calculate the percentage of nodules that are pink or red.",
            "Explain why the non-legume has no nodules and what that means for its nitrogen supply.",
          ],
          lookFor: "Legumes should have nodules, while the non-legume should not. Pink or red nodules are actively fixing nitrogen. White ones may be young, and green or brown ones may be old or inactive.",
          safety: "An adult should handle any blade. Get permission before digging, and wash hands after.",
        },
        quiz: [
          { prompt: "Why are there so many microbes in the rhizosphere?", options: ["It is colder there", "Roots release exudates that feed them", "There is no water there", "Sunlight reaches it"], answer: 1, explain: "Root exudates like sugars and amino acids feed microbes, so they cluster around roots." },
          { prompt: "Which nutrient do mycorrhizal fungi especially help plants get?", options: ["Oxygen", "Carbon dioxide", "Phosphorus", "Helium"], answer: 2, explain: "Phosphorus moves slowly in soil, and fungal hyphae reach beyond the roots to gather it." },
          { prompt: "The plant and mycorrhizal fungus both benefit. What kind of relationship is this?", options: ["Mutualism", "Predation", "Competition", "Parasitism"], answer: 0, explain: "In mutualism, both partners benefit: the fungus gets sugars and the plant gets nutrients." },
          { prompt: "About how much of the air is nitrogen gas?", options: ["1%", "21%", "50%", "78%"], answer: 3, explain: "Nitrogen gas makes up about 78% of the atmosphere, but plants can't use it directly." },
          { prompt: "What do rhizobia bacteria do in legume nodules?", options: ["Eat the roots", "Fix nitrogen gas into ammonium for the plant", "Make sunlight", "Turn nitrate into rock"], answer: 1, explain: "Rhizobia fix N₂ into ammonium and receive sugars from the plant in return." },
          { prompt: "Why can extra nitrate pollute water?", options: ["It dissolves easily and washes into groundwater and streams", "It turns into plastic", "It makes water freeze", "It sticks tightly to clay"], answer: 0, explain: "Nitrate dissolves and moves with water, so excess can leach to groundwater or run off into streams." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Nitrogen limits plant growth in many ecosystems, even though it fills the air. Microbes control every step of its cycle, and when people add more nitrogen than crops use, the excess pollutes water and air.",
        objectives: [
          "I can trace nitrogen through fixation, mineralization, nitrification, plant uptake, denitrification, and leaching using chemical forms.",
          "I can explain why nitrate leaches while ammonium is held by soil.",
          "I can explain how symbiotic partnerships with fungi and bacteria supply plant nutrients.",
          "I can interpret water quality data and evaluate how farming practices affect nitrate pollution.",
        ],
        vocab: [
          { term: "Ammonification (mineralization)", def: "Microbial conversion of organic nitrogen in dead tissue into ammonium (NH₄⁺)." },
          { term: "Nitrification", def: "Two-step aerobic microbial oxidation of NH₄⁺ to nitrite (NO₂⁻) and then nitrate (NO₃⁻)." },
          { term: "Denitrification", def: "Anaerobic microbial reduction of NO₃⁻ to nitrogen gases (N₂O and N₂) that escape to the air." },
          { term: "Leaching", def: "Downward loss of dissolved substances, like nitrate, from the root zone with draining water." },
          { term: "Nitrogenase", def: "The enzyme in nitrogen-fixing bacteria that breaks the triple bond of N₂ to make ammonia." },
        ],
        sections: [
          {
            heading: "The root and microbe marketplace",
            body: [
              "Roots release a meaningful share of the carbon they fix as exudates, feeding a dense microbial community in the rhizosphere. In exchange, plants gain mineralized nutrients and protection from some pathogens.",
              "Mycorrhizal fungi extend hyphae beyond the depletion zone that forms around roots. This matters most for phosphorus, which diffuses only short distances in soil. The plant pays in carbon, so mycorrhizae are most valuable to plants when phosphorus is scarce.",
            ],
            source: "nrcs-soil-is-alive",
          },
          {
            heading: "Fixation: cracking N₂",
            body: [
              "N₂ has a triple bond that takes a lot of energy to break. Nitrogen-fixing bacteria use the enzyme nitrogenase to reduce N₂ to ammonia (NH₃), which becomes ammonium (NH₄⁺) in cells. The process uses a lot of ATP, which legumes supply as sugars to rhizobia in nodules.",
              "Nitrogenase is damaged by oxygen. Leghemoglobin, which makes active nodules pink, binds oxygen to protect the enzyme while still supplying the bacteria's respiration. Industrial fixation (the Haber-Bosch process) now makes fertilizer from N₂ using high temperature and pressure.",
            ],
            source: "weil-brady",
          },
          {
            heading: "From ammonium to nitrate and back to air",
            body: [
              "Decomposers convert organic N to NH₄⁺ (ammonification, part of mineralization). In aerobic soils, nitrifying bacteria oxidize NH₄⁺ to NO₂⁻ and then quickly to NO₃⁻, releasing H⁺ ions that slowly acidify soil. Plants take up both NH₄⁺ and NO₃⁻.",
              "Charge controls movement. Positively charged NH₄⁺ is held on negatively charged clay and humus surfaces, but negatively charged NO₃⁻ is repelled and moves freely with water, so it leaches. In waterlogged, low-oxygen soil, denitrifying bacteria use NO₃⁻ instead of O₂ and reduce it to N₂O and N₂. N₂O is a potent greenhouse gas.",
            ],
            source: "weil-brady",
          },
          {
            heading: "When nitrogen becomes a pollutant",
            body: [
              "When fertilizer or manure supplies more nitrogen than crops take up, the extra nitrate can leach into groundwater or drain into streams. The U.S. drinking water limit for nitrate is 10 mg/L measured as nitrogen, set to protect infants from a condition that reduces the blood's ability to carry oxygen.",
              "In lakes and coastal waters, excess nutrients feed algal blooms. When the algae die and decompose, oxygen is used up, creating low-oxygen dead zones such as the one that forms in the Gulf of Mexico. Matching fertilizer to crop needs, timing applications carefully, and planting cover crops that soak up leftover nitrate all reduce losses.",
            ],
            source: "mdh-nitrate",
          },
        ],
        activity: {
          title: "Nitrate leaching test",
          time: "40 minutes plus 1 week of plant growth",
          materials: ["Four small pots or cut-off plastic bottles with drainage holes, filled with the same garden soil", "Grass or bean seedlings for two of the pots", "A small amount of garden fertilizer (adult measures)", "Cups to catch drainage water", "Aquarium or water-quality nitrate test strips", "A measuring cup"],
          steps: [
            "Set up four pots: (A) bare soil, (B) bare soil with fertilizer, (C) plants, (D) plants with fertilizer. Add the same amount of fertilizer to B and D following the label rate.",
            "Water all pots lightly for a week so plants can grow.",
            "Pour the same volume of water (for example, 250 mL) through each pot and collect the drainage water in a cup.",
            "Test each sample with a nitrate test strip and record the reading. Note whether the strip reports nitrate or nitrate-N.",
            "Compare the four results in a bar graph and compare them to the 10 mg/L nitrate-N drinking water limit.",
          ],
          lookFor: "Fertilized bare soil usually leaches the most nitrate. Pots with growing roots should leach less because plants take up nitrate. This models why cover crops reduce nitrate pollution.",
          safety: "An adult should handle and measure fertilizer. Wear gloves, do not drink any water samples, and dispose of the drainage water on a lawn or garden, not down a storm drain.",
        },
        quiz: [
          { prompt: "Which sequence shows nitrification?", options: ["NO₃⁻ → N₂", "NH₄⁺ → NO₂⁻ → NO₃⁻", "N₂ → NH₃", "Organic N → NH₄⁺"], answer: 1, explain: "Nitrifying bacteria oxidize ammonium to nitrite and then to nitrate in aerobic soil." },
          { prompt: "Why does nitrate leach more easily than ammonium?", options: ["Nitrate is heavier", "Ammonium is a gas", "Negatively charged nitrate is not held by negatively charged clay and humus", "Nitrate is insoluble"], answer: 2, explain: "Soil colloids are mostly negatively charged. They hold positive NH₄⁺ but repel negative NO₃⁻, which moves with water." },
          { prompt: "A field becomes waterlogged for a week after heavy rain. Which process is most likely to increase?", options: ["Denitrification", "Nitrification", "Photosynthesis by roots", "Mycorrhizal phosphorus uptake"], answer: 0, explain: "Low oxygen lets denitrifying bacteria use nitrate instead of O₂, releasing N₂O and N₂." },
          { prompt: "Nitrate (NO₃⁻) is about 23% nitrogen by mass (14 of 62). A well sample contains 62 mg/L of nitrate. Is it above the 10 mg/L nitrate-N limit?", options: ["No, it contains about 1.4 mg/L nitrate-N", "No, it contains 0 mg/L nitrate-N", "It's impossible to tell", "Yes, it contains about 14 mg/L nitrate-N"], answer: 3, explain: "62 mg/L × 14/62 = 14 mg/L nitrate-N, which is above the 10 mg/L limit." },
          { prompt: "Monitoring data show stream nitrate is highest in spring, after fertilizer is applied and before crops are large. Which practice would most directly reduce it?", options: ["Adding fertilizer earlier in winter", "Planting cover crops and matching fertilizer timing to crop uptake", "Removing all plants from the field", "Draining wetlands near the stream"], answer: 1, explain: "Cover crops absorb leftover nitrate, and timing fertilizer to when crops need it reduces the amount available to leach." },
          { prompt: "Why are active legume nodules pink inside?", options: ["Leghemoglobin binds oxygen to protect nitrogenase", "They are filled with nitrate", "Rhizobia photosynthesize", "Mycorrhizal fungi dye them"], answer: 0, explain: "Leghemoglobin controls oxygen levels so nitrogenase, which oxygen damages, can work." },
        ],
      },
    },
  },
];
