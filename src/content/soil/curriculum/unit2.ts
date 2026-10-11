import type { CurriculumLesson } from "./types";

/** Unit 2: Soil Properties */
export const UNIT2: CurriculumLesson[] = [
  // ───────────────────────────── Soil Texture ─────────────────────────────
  {
    slug: "soil-texture",
    unit: 2,
    title: "Soil Texture",
    icon: "🤏",
    bigIdea: "Every soil is a mix of sand, silt, and clay, and that mix (its texture) controls how the soil feels, drains, and holds water and nutrients.",
    interactive: {
      type: "texture-triangle",
      title: "The Soil Texture Triangle",
      intro: "Slide the sand and clay amounts. Silt fills in the rest. Watch which texture class you land in.",
    },
    sources: ["nrcs-ssm", "nrcs-texture-feel", "weil-brady", "s4t"],
    standards: {
      elementary: ["2-PS1-1", "5-PS1-3"],
      middle: ["MS-ESS2-1"],
      high: ["HS-ESS2-5"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "Rub some soil between your fingers. Is it gritty, smooth, or sticky? That feeling is called soil texture!",
        objectives: [
          "I can name the three sizes of soil bits: sand, silt, and clay.",
          "I can tell how sand, silt, and clay feel.",
          "I can use the ribbon test to guess if a soil has lots of clay.",
          "I can explain why sandy soil dries out fast.",
        ],
        vocab: [
          { term: "Texture", def: "How soil feels, based on how much sand, silt, and clay it has." },
          { term: "Sand", def: "The biggest soil bits. Sand feels gritty, like sugar." },
          { term: "Silt", def: "Medium soil bits. Silt feels smooth, like flour." },
          { term: "Clay", def: "The tiniest soil bits. Clay feels sticky when wet." },
        ],
        sections: [
          {
            heading: "Three sizes of soil bits",
            body: [
              "Soil is full of tiny pieces of rock. Scientists sort them by size. Sand is the biggest. You can see sand grains with your eyes.",
              "Silt is smaller. Clay is the tiniest of all. Clay bits are so small you need a strong microscope to see one!",
            ],
            callout: { title: "Wow!", text: "If a clay bit were as big as a coin, a sand grain could be bigger than a house!" },
            source: "weil-brady",
          },
          {
            heading: "Feel the difference",
            body: [
              "Sand feels gritty and scratchy. Silt feels smooth and soft, like flour. Wet clay feels sticky and you can squish it like play dough.",
              "Most soils have some of all three. Soil with a nice mix is called loam. Gardeners love loam!",
            ],
            source: "nrcs-texture-feel",
          },
          {
            heading: "Why texture matters",
            body: [
              "Water runs right through sandy soil, like water through a pile of marbles. Sandy soil dries out fast.",
              "Clay soil holds water for a long time. It can get muddy when wet and hard when dry. Loam holds some water but lets the extra drain away.",
            ],
            source: "weil-brady",
          },
        ],
        activity: {
          title: "Make a soil ribbon",
          time: "20 minutes",
          materials: ["A spoonful of soil from outside", "A small cup of water", "A paper towel", "A ruler"],
          steps: [
            "Put a spoonful of soil in your hand. Pick out any rocks and roots.",
            "Add a few drops of water and squish the soil until it feels like soft play dough.",
            "Roll it into a ball. Does it stay together, or fall apart?",
            "Gently push the soil between your thumb and finger to make a flat ribbon. Measure how long it gets before it breaks.",
          ],
          lookFor: "Falls apart and feels gritty? Lots of sand. A short ribbon? A mix like loam. A long, sticky ribbon? Lots of clay.",
          safety: "Wash your hands after touching soil. Don't put soil in your mouth.",
        },
        quiz: [
          { prompt: "Which soil bits are the biggest?", options: ["Clay", "Silt", "Sand"], answer: 2, explain: "Sand grains are the biggest. Clay bits are the tiniest." },
          { prompt: "How does silt feel?", options: ["Smooth, like flour", "Sharp, like glass", "Bumpy, like rocks", "Wet, like water"], answer: 0, explain: "Silt bits are medium-sized and feel smooth and soft, like flour." },
          { prompt: "Wet soil makes a long, sticky ribbon. What does it have lots of?", options: ["Sand", "Clay", "Air", "Leaves"], answer: 1, explain: "Clay is sticky, so it can stretch into a long ribbon." },
          { prompt: "Why does sandy soil dry out fast?", options: ["It is always cold", "Water runs through the big spaces between sand grains", "Sand drinks the water", "Sand is purple"], answer: 1, explain: "Big sand grains leave big spaces, so water drains away quickly." },
          { prompt: "What do we call soil with a nice mix of sand, silt, and clay?", options: ["Rock", "Mud", "Loam"], answer: 2, explain: "Loam has a good balance of all three sizes, so it holds water but still drains." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "Sand, silt, and clay are the building blocks of soil. Their proportions, called texture, decide whether a soil drains like a sieve or holds water like a sponge.",
        objectives: [
          "I can give the USDA size limits for sand, silt, and clay.",
          "I can use the texture triangle to find a soil's texture class.",
          "I can estimate texture by feel using the ball and ribbon method.",
          "I can explain how texture affects water and nutrient holding.",
        ],
        vocab: [
          { term: "Soil texture", def: "The relative proportions of sand, silt, and clay in a soil." },
          { term: "Sand", def: "Mineral particles 2 to 0.05 mm across. They feel gritty." },
          { term: "Silt", def: "Mineral particles 0.05 to 0.002 mm across. They feel smooth like flour." },
          { term: "Clay", def: "Mineral particles smaller than 0.002 mm. They feel sticky when wet." },
          { term: "Texture triangle", def: "A USDA diagram that uses the percentages of sand, silt, and clay to name one of 12 texture classes." },
        ],
        sections: [
          {
            heading: "Sizing up particles",
            body: [
              "The USDA sorts mineral particles smaller than 2 mm into three groups. Sand is 2 to 0.05 mm, silt is 0.05 to 0.002 mm, and clay is smaller than 0.002 mm. Anything bigger than 2 mm, like gravel, is not part of texture.",
              "That means the largest sand grain is a thousand times wider than the largest clay particle. Because clay particles are so tiny and flat, a handful of clay has an enormous amount of surface area.",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "The texture triangle",
            body: [
              "Soil scientists measure the percent sand, silt, and clay in a sample, then use the texture triangle to name it. Each side of the triangle is one particle size, and the three percentages always add up to 100%.",
              "The USDA uses 12 texture classes: sand, loamy sand, sandy loam, loam, silt loam, silt, sandy clay loam, clay loam, silty clay loam, sandy clay, silty clay, and clay. For example, a soil with 40% sand, 40% silt, and 20% clay lands in the loam class.",
            ],
            callout: { title: "Not just equal thirds", text: "Loam isn't a perfect one-third mix. Clay has such a strong effect that a soil only needs about 40% clay to be called a clay." },
            source: "nrcs-ssm",
          },
          {
            heading: "Texture by feel",
            body: [
              "You can estimate texture without a lab. Moisten a walnut-sized lump of soil until it feels like putty. If it won't hold together in a ball, it's sand. If it forms a ball, push it between your thumb and finger to make a ribbon.",
              "No ribbon means loamy sand. A ribbon under 1 inch suggests a loam family soil, 1 to 2 inches suggests a clay loam family soil, and over 2 inches suggests a clay family soil. Then rub a wet pinch: very gritty means add the word sandy, very smooth means add silty.",
            ],
            source: "nrcs-texture-feel",
          },
          {
            heading: "Why texture matters",
            body: [
              "Sandy soils have large pores, so water drains quickly and the soil dries out fast. They also hold few nutrients. Clay soils have tiny pores that hold water tightly, and clay surfaces grab onto nutrients. But clay soils can drain slowly and get sticky or hard.",
              "Texture is a permanent property. You can't practically change the amount of sand, silt, and clay in a field. You can improve how any soil behaves by adding organic matter, which helps sandy soils hold water and helps clay soils drain.",
            ],
            source: "weil-brady",
          },
        ],
        activity: {
          title: "Texture by feel challenge",
          time: "30 minutes",
          materials: ["Three soil samples (for example, sandbox sand, garden soil, and clay-rich subsoil)", "A spray bottle of water", "A ruler", "Paper towels", "A printed texture-by-feel flowchart"],
          steps: [
            "Take a walnut-sized lump of the first sample and remove rocks and roots.",
            "Spray a little water and knead until it feels like moist putty. Squeeze it. Does it hold a ball?",
            "If it does, push the soil between your thumb and finger into a ribbon. Measure the ribbon length when it breaks.",
            "Wet a small pinch and rub it in your palm. Decide if it feels very gritty, very smooth, or neither.",
            "Use the flowchart to name the texture class. Repeat for the other samples and compare with classmates.",
          ],
          lookFor: "Sand won't make a ball. Loam family soils ribbon less than 1 inch, clay loams 1 to 2 inches, and clays more than 2 inches.",
          safety: "Wash hands after handling soil. Don't use soil from places that might be contaminated, such as near roads or old buildings.",
        },
        quiz: [
          { prompt: "40% sand, 40% silt, 20% clay is which texture class?", options: ["Sand", "Loam", "Clay", "Silt"], answer: 1, explain: "That mix lands in the loam zone of the USDA texture triangle." },
          { prompt: "What is the USDA size range for silt?", options: ["2 to 0.05 mm", "0.05 to 0.002 mm", "Smaller than 0.002 mm", "Larger than 2 mm"], answer: 1, explain: "Silt is 0.05 to 0.002 mm. Sand is larger and clay is smaller." },
          { prompt: "A moist soil sample won't stay together in a ball. What texture class is it?", options: ["Clay", "Silt loam", "Sand"], answer: 2, explain: "In the texture-by-feel method, soil that won't form a ball is classified as sand." },
          { prompt: "A soil makes a ribbon longer than 2 inches. Which family is it in?", options: ["Loam family", "Clay family", "Sand family", "Gravel family"], answer: 1, explain: "Ribbons longer than about 2 inches mean lots of clay." },
          { prompt: "Which soil will hold the most water and nutrients?", options: ["Loamy sand", "Sand", "Clay loam"], answer: 2, explain: "Clay has tiny pores and huge surface area, so clay-rich soils hold more water and nutrients than sandy ones." },
          { prompt: "A gardener has very sandy soil. What's the best way to help it hold water?", options: ["Add more sand", "Add organic matter like compost", "Change its texture to clay", "Leave it bare"], answer: 1, explain: "Texture is permanent, but organic matter acts like a sponge and improves how sandy soil holds water." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Particle size controls surface area, pore size, and how tightly water and ions are held. Texture is the one property a farmer inherits and can't practically change, so it shapes every management decision.",
        objectives: [
          "I can classify a soil from particle-size data using the USDA texture triangle.",
          "I can explain how particle size controls surface area, pore size, and water retention.",
          "I can connect texture to nutrient holding and leaching risk.",
          "I can evaluate how texture limits land use and management.",
        ],
        vocab: [
          { term: "Fine earth fraction", def: "Soil particles smaller than 2 mm (sand, silt, and clay). Texture is measured only on this fraction." },
          { term: "Particle-size analysis", def: "A lab method that separates sand by sieving and measures silt and clay by how fast they settle in water." },
          { term: "Specific surface area", def: "The surface area of particles per gram of soil. It rises sharply as particles get smaller." },
          { term: "Plant-available water", def: "The water a soil holds after draining that roots can still pull out before the plant wilts." },
          { term: "Texture class", def: "One of 12 USDA names, such as silty clay loam, given to a soil based on its sand, silt, and clay percentages." },
        ],
        sections: [
          {
            heading: "Measuring texture",
            body: [
              "Texture is the percent by weight of sand (2 to 0.05 mm), silt (0.05 to 0.002 mm), and clay (less than 0.002 mm) in the fine earth fraction. Gravel and larger rock fragments are recorded separately as modifiers, such as gravelly loam.",
              "In the lab, organic matter is removed, the soil is dispersed in water, and sand is sieved off. Silt and clay are measured by how fast they settle, using a hydrometer or pipette. Larger particles settle faster, following Stokes' law, so after a few hours only clay is still suspended.",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "Reading the triangle",
            body: [
              "The USDA texture triangle divides all possible sand-silt-clay combinations into 12 classes. To use it, find the clay percentage on its axis and follow that line across, then do the same for sand. The class where the lines meet is the soil's texture.",
              "The boundaries are not evenly spaced. Sand needs at least 85% sand. Clay starts at 40% clay, because clay's properties dominate a soil even when it's a minority. Loam is roughly 7 to 27% clay, 28 to 50% silt, and no more than 52% sand.",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "Surface area, pores, and water",
            body: [
              "As particles shrink, surface area per gram explodes. Sand has well under 1 square meter per gram, while some clays (like smectite) can have hundreds of square meters per gram. That surface holds films of water and carries electric charges that attract nutrient ions.",
              "Small particles pack into small pores, and small pores hold water by capillary forces. So clay soils retain the most water overall, but some of it is held too tightly for roots. Loams and silt loams usually have the most plant-available water. Sands drain freely and leach nutrients like nitrate quickly.",
            ],
            callout: { title: "Quick field check", text: "The NRCS texture-by-feel method (after Thien, 1979) uses ball formation, ribbon length (under 1 inch, 1 to 2 inches, over 2 inches), and grittiness or smoothness to estimate the class within a few minutes." },
            source: "weil-brady",
          },
          {
            heading: "Texture and human decisions",
            body: [
              "Because texture is permanent on human timescales, engineers and farmers plan around it. Sandy soils need frequent, smaller irrigations and careful fertilizer timing to avoid leaching into groundwater. Clay-rich soils can stay waterlogged, compact easily when worked wet, and may shrink and crack when dry, which can damage foundations and roads.",
              "Septic systems, building sites, and irrigation schedules all depend on texture data from soil surveys. Managers can't change texture, but they can change structure and organic matter, which control much of how a soil actually behaves.",
            ],
            source: "weil-brady",
          },
        ],
        activity: {
          title: "Jar test to texture class",
          time: "30 minutes plus 2 days of settling",
          materials: ["A straight-sided clear jar with lid", "About 1 cup of dry, sifted soil (rocks and roots removed)", "Water", "1 tablespoon of powdered dishwasher detergent or a spoon of dish soap (disperses clay)", "A ruler and marker", "A printed USDA texture triangle"],
          steps: [
            "Fill the jar about one-third with soil. Add water to about three-quarters full and add the detergent.",
            "Shake hard for 3 to 5 minutes until no clumps remain. Set the jar down and start a timer.",
            "At 1 minute, mark the height of the settled layer (sand). At about 2 hours, mark again (sand plus silt).",
            "After 1 to 2 days, when the water is mostly clear, mark the top of the final layer (sand plus silt plus clay).",
            "Calculate each layer as a percent of the total height, then plot the clay and sand percentages on the texture triangle. Compare with a ribbon test of the same soil.",
          ],
          lookFor: "The jar test gives a rough estimate. Clay may stay cloudy for days and settled layers aren't perfectly packed, so expect your class to be close to, but not always identical with, the ribbon result.",
          safety: "Wear goggles when shaking the jar, keep detergent away from eyes and mouth, and wash hands afterward.",
        },
        quiz: [
          { prompt: "After particle-size analysis, a 50 g sample contains 15 g sand and 22.5 g clay. What is its texture class?", options: ["Loam", "Sandy clay loam", "Clay", "Silt loam"], answer: 2, explain: "Sand is 30%, clay is 45%, and silt is 25%. With 40% or more clay, less than 45% sand, and less than 40% silt, it falls in the clay class." },
          { prompt: "Why does a clay soil hold more total water than a sandy soil?", options: ["Clay particles are heavier", "Clay has much more surface area and smaller pores that hold water by capillary forces", "Sand repels all water", "Clay contains more organic matter by definition"], answer: 1, explain: "Tiny clay particles create huge surface area and small pores that hold water films tightly." },
          { prompt: "Which texture class usually has the most plant-available water?", options: ["Sand", "Silt loam", "Clay"], answer: 1, explain: "Silt loams hold plenty of water in medium pores, and less of it is held too tightly for roots than in clay." },
          { prompt: "In a settling test, why does sand reach the bottom first?", options: ["Larger particles settle faster in water", "Sand is magnetic", "Clay floats because it is hollow", "Sand dissolves"], answer: 0, explain: "Settling speed rises with particle size (Stokes' law), so sand settles in seconds and clay can take hours to days." },
          { prompt: "A farm field is a loamy sand. Which management choice best fits its texture?", options: ["Apply all fertilizer at once in early spring", "Use smaller, more frequent irrigations and split fertilizer applications", "Drain it with tile lines because it stays waterlogged", "Plow it while wet"], answer: 1, explain: "Sandy soils hold little water and leach nutrients, so smaller, more frequent applications reduce losses." },
          { prompt: "Why is texture called a permanent soil property?", options: ["Particle sizes can't be changed in practical amounts on human timescales", "It never affects plants", "Rain removes all clay every year", "Organic matter turns into sand"], answer: 0, explain: "Changing a field's sand, silt, and clay would mean moving huge amounts of material. Structure and organic matter, unlike texture, can be managed." },
        ],
      },
    },
  },

  // ───────────────────────────── Soil Structure ─────────────────────────────
  {
    slug: "soil-structure",
    unit: 2,
    title: "Soil Structure: Crumbs and Pores",
    icon: "🧱",
    bigIdea: "Living things glue soil particles into crumbs called aggregates, and the pores between those crumbs let air, water, and roots move through the soil.",
    sources: ["nrcs-ssm", "nrcs-test-kit", "nrcs-bulk-density", "nrcs-soil-is-alive", "weil-brady", "s4t"],
    standards: {
      elementary: ["2-PS1-1", "4-ESS2-1"],
      middle: ["MS-ESS2-1", "MS-ESS3-3"],
      high: ["HS-ESS2-5", "HS-ESS3-4"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "Healthy soil looks like chocolate cake crumbs. Those crumbs are full of tiny holes where air and water live!",
        objectives: [
          "I can describe soil crumbs and the spaces between them.",
          "I can name living things that help glue soil crumbs together.",
          "I can test whether soil crumbs fall apart in water.",
        ],
        vocab: [
          { term: "Crumb", def: "A small clump of soil bits stuck together." },
          { term: "Pore", def: "A tiny space in soil that holds air or water." },
          { term: "Roots", def: "The parts of a plant that grow underground and hold soil together." },
          { term: "Compacted", def: "Squished down hard, with very few spaces left." },
        ],
        sections: [
          {
            heading: "Soil is like cake crumbs",
            body: [
              "Pick up a handful of healthy soil. It breaks into soft little crumbs. Scientists call this soil structure.",
              "Between the crumbs are tiny spaces called pores. Air and water fill the pores, and roots and worms move through them.",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "Nature's glue",
            body: [
              "What holds a crumb together? Living things! Roots wrap around soil bits. Tiny threads of fungi act like strings. Microbes make sticky goo.",
              "Earthworms eat soil and leave behind poop called castings. Castings are strong little crumbs.",
            ],
            callout: { title: "Fun fact", text: "Worm tunnels are like straws. They help rain soak deep into the ground." },
            source: "nrcs-soil-is-alive",
          },
          {
            heading: "Don't squish the soil",
            body: [
              "When people, cars, or big machines press on wet soil, the crumbs get squished. The pores get small. That is called compacted soil.",
              "Rain can't soak in, and roots have a hard time growing. That's why it's good to walk on paths and keep plants growing on soil.",
            ],
            source: "weil-brady",
          },
        ],
        activity: {
          title: "Crumb dunk test",
          time: "20 minutes",
          materials: ["A dry soil clump from under grass or a garden", "A dry soil clump from a bare, packed spot like a path", "Two clear cups of water", "Two small squares of window screen or a kitchen strainer"],
          steps: [
            "Let both soil clumps dry for a day. Each should be about the size of a grape.",
            "Set each clump on a piece of screen.",
            "Gently lower each screen into its own cup of water at the same time.",
            "Watch for 5 minutes. Draw what each clump looks like at the start and the end.",
          ],
          lookFor: "Crumbs from under plants often stay together. Crumbs from bare, packed soil often fall apart and make the water cloudy.",
          safety: "Wash your hands after touching soil. Wipe up spills.",
        },
        quiz: [
          { prompt: "What are the tiny spaces in soil called?", options: ["Pores", "Rocks", "Leaves"], answer: 0, explain: "Pores are the spaces between crumbs. They hold air and water." },
          { prompt: "Which of these helps glue soil crumbs together?", options: ["Plastic", "Plant roots", "Sunlight", "Snow"], answer: 1, explain: "Roots wrap around soil bits and help hold crumbs together." },
          { prompt: "What do earthworms leave behind that makes strong crumbs?", options: ["Feathers", "Castings", "Shells"], answer: 1, explain: "Worm castings are little crumbs of soil that have passed through a worm." },
          { prompt: "What happens when soil gets compacted?", options: ["It gets more pores", "It turns into sand", "Rain can't soak in well", "It turns blue"], answer: 2, explain: "Squished soil has small pores, so water runs off instead of soaking in." },
          { prompt: "In the dunk test, which crumb will probably stay together best?", options: ["One from a packed path", "One from under grass", "One from a parking lot"], answer: 1, explain: "Roots, fungi, and microbes under grass glue crumbs together so they hold up in water." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "Texture is the ingredients, but structure is how they're put together. Well-built soil crumbs create a network of pores that soaks up rain and lets roots breathe.",
        objectives: [
          "I can explain what soil aggregates are and what holds them together.",
          "I can identify common soil structure types.",
          "I can explain how compaction changes pores and infiltration.",
          "I can measure aggregate stability with a slake test.",
        ],
        vocab: [
          { term: "Soil structure", def: "The way sand, silt, and clay particles are grouped together into larger units called aggregates." },
          { term: "Aggregate", def: "A clump of soil particles bound together by roots, fungi, microbial glues, and other materials." },
          { term: "Infiltration", def: "The movement of water from the surface down into the soil." },
          { term: "Compaction", def: "The squeezing of soil so that pore space, especially large pores, is reduced." },
          { term: "Aggregate stability", def: "How well soil aggregates hold together when they get wet or are disturbed." },
        ],
        sections: [
          {
            heading: "Building blocks of soil",
            body: [
              "Soil particles rarely sit alone. They clump into aggregates, also called peds. Plant roots and fungal threads (hyphae) wrap around particles like a net. Bacteria and fungi release sticky gums that cement particles together. Earthworm casts are especially stable aggregates.",
              "Scientists have also found a sticky protein-rich material linked to certain fungi, called glomalin-related soil protein. Many studies suggest it helps hold aggregates together, though researchers are still working out exactly what it is.",
            ],
            source: "nrcs-soil-is-alive",
          },
          {
            heading: "Shapes of structure",
            body: [
              "The USDA describes several structure types. Granular structure looks like crumbs and is common in topsoil full of roots. Blocky structure forms cube-like chunks, often in subsoil. Platy structure is flat, stacked plates, sometimes caused by compaction. Prismatic and columnar structures are tall pillars found deeper in some soils.",
              "Some soils have no structure. Single grain soils are loose, like beach sand. Massive soils are one solid lump with no natural cracks.",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "Pores, rain, and compaction",
            body: [
              "Spaces between aggregates form large pores that let water soak in and drain, and let air reach roots. Smaller pores inside aggregates hold water for plants. A well-structured soil has both.",
              "Heavy machines, foot traffic, and tilling wet soil crush aggregates and squeeze out large pores. Water then runs off the surface, carrying soil with it, and roots struggle to push through.",
            ],
            callout: { title: "Structure can change", text: "Unlike texture, structure can be improved. Keeping roots growing, adding organic matter, and disturbing soil less all help build aggregates." },
            source: "weil-brady",
          },
          {
            heading: "The slake test",
            body: [
              "The NRCS Soil Quality Test Kit includes a test of aggregate stability. A dry aggregate is placed on a screen and lowered into water. Weak aggregates slake, meaning they slump and fall apart as water rushes in. Strong aggregates keep their shape.",
              "Soils with lots of roots, fungi, and organic matter usually pass. Bare, heavily tilled soils often fall apart within seconds.",
            ],
            source: "nrcs-test-kit",
          },
        ],
        activity: {
          title: "Infiltration race",
          time: "40 minutes",
          materials: ["A large can (about 6 inches wide) with both ends removed", "A block of wood and a hammer", "A measuring cup", "Water (about 450 mL per test)", "A stopwatch", "Plastic wrap", "A ruler"],
          steps: [
            "Choose two spots: a lawn or garden, and a packed path or playground edge.",
            "Place the can on the ground, set the wood on top, and tap it in about 3 inches deep.",
            "Line the inside of the can with plastic wrap, pour in about 450 mL of water (about 1 inch deep), then gently pull the wrap out and start the timer.",
            "Stop the timer when the soil surface just looks shiny instead of covered with water. Record the time.",
            "Repeat at the second spot and compare. Explain the difference using the words pores and compaction.",
          ],
          lookFor: "Water usually soaks in much faster where soil has good structure and has not been compacted.",
          safety: "Have an adult remove can lids and check for sharp edges. Wear gloves when handling the can, and wash hands afterward.",
        },
        quiz: [
          { prompt: "What is a soil aggregate?", options: ["A single grain of sand", "A clump of particles bound together", "A layer of rock", "A type of fertilizer"], answer: 1, explain: "Aggregates are clumps of sand, silt, and clay held together by roots, hyphae, and microbial glues." },
          { prompt: "Which structure type looks like crumbs and is common in topsoil?", options: ["Platy", "Massive", "Granular", "Single grain"], answer: 2, explain: "Granular structure forms crumbs, often where roots and organisms are active." },
          { prompt: "Flat, stacked plates under a tractor path probably mean…", options: ["Compaction", "Lots of earthworms", "Very sandy soil"], answer: 0, explain: "Platy structure can form when soil is squeezed by traffic." },
          { prompt: "In a slake test, an aggregate falls apart in 10 seconds. What does this tell you?", options: ["It has high aggregate stability", "It has low aggregate stability", "It is pure clay", "It has too much organic matter"], answer: 1, explain: "Quick slaking means weak glue between particles, which is common in bare or heavily tilled soil." },
          { prompt: "Why does compacted soil cause more runoff?", options: ["It has fewer large pores for water to soak into", "It has more worms", "It is always frozen", "It is warmer"], answer: 0, explain: "Compaction crushes large pores, so water can't infiltrate and flows across the surface." },
          { prompt: "Which is a way to improve soil structure?", options: ["Tilling wet soil often", "Keeping living roots in the soil", "Driving heavy equipment on wet fields", "Removing all organic matter"], answer: 1, explain: "Roots, fungi, and organic matter build and stabilize aggregates." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Structure turns a pile of particles into a functioning network of pores. It controls infiltration, aeration, root growth, and erosion, and unlike texture, people can build it up or break it down.",
        objectives: [
          "I can explain the biological and chemical processes that form and stabilize aggregates.",
          "I can compare macropores and micropores and their roles in water and air movement.",
          "I can calculate bulk density and porosity and interpret compaction.",
          "I can evaluate management practices that build or destroy structure.",
        ],
        vocab: [
          { term: "Ped", def: "A natural soil aggregate, described by its type (such as granular or blocky), size, and grade (strength)." },
          { term: "Macropore", def: "A large pore, roughly wider than 0.08 mm, that drains freely and carries air, water, and roots." },
          { term: "Micropore", def: "A small pore that holds water by capillary forces and is often too small for roots." },
          { term: "Bulk density", def: "The dry mass of soil divided by its total volume, including pores, in g/cm³." },
          { term: "Slaking", def: "The breakdown of dry aggregates when they are suddenly wetted and air trapped inside bursts them apart." },
        ],
        sections: [
          {
            heading: "How aggregates form",
            body: [
              "Clay particles flocculate, or cluster, when calcium and other cations bridge their negative charges. Biology then binds these clusters into larger aggregates. Fine roots and fungal hyphae enmesh particles, while microbial polysaccharides (gums) and root exudates cement them. Earthworm casts mix mineral and organic material into stable units.",
              "Arbuscular mycorrhizal fungi are associated with a protein-rich fraction that labs measure as glomalin-related soil protein. Many studies link it to aggregate stability, but its exact chemistry and how much it contributes are still debated, so scientists treat it as one factor among many.",
            ],
            source: "nrcs-soil-is-alive",
          },
          {
            heading: "Describing structure",
            body: [
              "The Soil Survey Manual describes peds by type, size, and grade. Types include granular (A horizons with active roots), angular and subangular blocky (common in B horizons), platy (E horizons or compacted layers), prismatic, and columnar (prisms with rounded tops, often in sodium-rich soils).",
              "Structureless soils are either single grain (loose particles, like dune sand) or massive (a coherent mass with no natural planes of weakness, often from compaction or puddling).",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "Pores, bulk density, and compaction",
            body: [
              "Macropores between aggregates conduct water during rain and refill with air afterward. Micropores inside aggregates store plant-available water. Compaction mostly destroys macropores, so a compacted soil may hold water but drain and breathe poorly.",
              "Bulk density measures compaction. With a mineral particle density of about 2.65 g/cm³, porosity = 1 − (bulk density ÷ 2.65). A medium-textured soil at about 1.33 g/cm³ is roughly 50% pore space. NRCS guidance suggests root growth is restricted above about 1.47 g/cm³ in clayey soils and about 1.8 g/cm³ in sandy soils.",
            ],
            source: "nrcs-bulk-density",
          },
          {
            heading: "People and structure",
            body: [
              "Intensive tillage breaks aggregates and speeds up decomposition of the organic matter that glues them. Bare soil also suffers raindrop impact, which disperses surface aggregates into a crust. The result is less infiltration, more runoff, and more erosion.",
              "No-till, cover crops, perennial roots, and controlled traffic lanes rebuild structure over several years. The slake test is a quick, visual way to compare fields, and aggregate stability often responds to management sooner than total organic matter does.",
            ],
            source: "weil-brady",
          },
        ],
        activity: {
          title: "Measure bulk density",
          time: "45 minutes plus overnight drying",
          materials: ["A clean metal can with both ends removed (about 3 inches across and 3 inches tall)", "A block of wood and a rubber mallet", "A garden trowel and a flat knife", "Resealable bags and a marker", "A kitchen scale (0.1 g if possible)", "A paper plate and access to a microwave or warm oven (teacher only)"],
          steps: [
            "Measure the can's inside diameter and height, and calculate its volume in cm³ (π × r² × h).",
            "At two sites (for example, a lawn and a packed path), tap the can straight down until its top is level with the soil, using the wood block to protect it.",
            "Dig around the can, lift it out, trim the soil flush with both ends, and empty all the soil into a labeled bag.",
            "Have the teacher dry each sample on a paper plate (a few short microwave bursts or overnight in a low oven) until its mass stops changing. Weigh the dry soil.",
            "Calculate bulk density = dry mass ÷ volume, then porosity = 1 − (bulk density ÷ 2.65). Compare sites and with NRCS root-restriction values.",
          ],
          lookFor: "Packed paths usually have higher bulk density and lower porosity than lawns or gardens. Values for most surface soils fall roughly between 1.0 and 1.7 g/cm³.",
          safety: "Check cans for sharp edges and wear gloves. Only the teacher should operate the oven or microwave, and dried soil may be hot. Remove any rocks before microwaving.",
        },
        quiz: [
          { prompt: "A 200 cm³ core holds 300 g of oven-dry soil. What are its bulk density and approximate porosity (particle density 2.65 g/cm³)?", options: ["1.5 g/cm³ and about 43%", "0.67 g/cm³ and about 75%", "1.5 g/cm³ and about 57%", "2.65 g/cm³ and 0%"], answer: 0, explain: "300 ÷ 200 = 1.5 g/cm³. Porosity = 1 − 1.5 ÷ 2.65 ≈ 0.43, or about 43%." },
          { prompt: "Compaction mainly destroys which pores, and with what effect?", options: ["Micropores, so the soil holds no water", "Macropores, so drainage and aeration drop", "Both equally, so nothing changes", "Neither; compaction only changes color"], answer: 1, explain: "Large pores collapse first, reducing infiltration and oxygen supply even if small pores remain." },
          { prompt: "Why do dry aggregates slake when dropped into water?", options: ["Water dissolves the sand", "Water rushing in compresses trapped air and the weak bonds burst apart", "Water freezes inside them", "Aggregates are magnetic"], answer: 1, explain: "Rapid wetting traps and compresses air. Without strong organic glues, the aggregate breaks apart." },
          { prompt: "Which statement about glomalin-related soil protein is most accurate?", options: ["It is proven to be the only glue in soil", "It is a type of clay mineral", "Studies link it to aggregate stability, but its exact chemistry and role are still debated", "It is made by earthworms"], answer: 2, explain: "Research associates it with mycorrhizal fungi and stable aggregates, but scientists are still refining what it is." },
          { prompt: "Two fields have bulk densities of 1.25 and 1.55 g/cm³ in the same clay loam. Which is more likely to restrict roots?", options: ["The 1.25 g/cm³ field", "The 1.55 g/cm³ field", "Neither, bulk density doesn't affect roots"], answer: 1, explain: "Higher bulk density means less pore space and more resistance to root growth, and 1.55 is near NRCS restriction values for clay loams." },
          { prompt: "Which practice would best rebuild structure in a compacted, tilled field?", options: ["Switching to no-till with cover crops", "Tilling more often", "Leaving the field bare over winter", "Driving across it when wet"], answer: 0, explain: "Less disturbance plus living roots feed soil organisms that build and stabilize aggregates." },
        ],
      },
    },
  },

  // ───────────────────────────── Soil Color ─────────────────────────────
  {
    slug: "soil-color",
    unit: 2,
    title: "What Soil Color Tells Us",
    icon: "🎨",
    bigIdea: "Soil color is a clue: it reveals how much organic matter a soil has, how well it drains, and what minerals coat its particles.",
    interactive: {
      type: "color-chart",
      title: "Read the colors",
      intro: "Match each soil color to what it tells a soil scientist.",
    },
    sources: ["nrcs-ssm", "weil-brady", "sssa-kskl", "s4t"],
    standards: {
      elementary: ["2-PS1-1"],
      middle: ["MS-ESS2-1", "MS-PS1-2"],
      high: ["HS-ESS2-5"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "Soil comes in black, brown, red, yellow, gray, and even white. Each color is a clue about what's happening underground!",
        objectives: [
          "I can describe soil colors I see.",
          "I can tell what dark soil usually means.",
          "I can explain that red soil gets its color from iron, like rust.",
          "I can tell what gray soil often means.",
        ],
        vocab: [
          { term: "Color", def: "What we see when light bounces off something, like red, brown, or gray." },
          { term: "Organic matter", def: "Old bits of plants and animals in soil. It makes soil dark." },
          { term: "Iron", def: "A metal found in rocks. When it rusts, it turns red or yellow." },
          { term: "Waterlogged", def: "So full of water that there is almost no air left." },
        ],
        sections: [
          {
            heading: "Dark soil",
            body: [
              "Dark brown or black soil usually has lots of rotted plant and animal bits. Scientists call this organic matter.",
              "Dark topsoil is often full of food for plants. Many worms and bugs live there too.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Red and yellow soil",
            body: [
              "Have you seen a rusty nail? Rust is iron mixed with air. Red and yellow soils get their color from rusty iron coating the soil bits.",
              "Red and yellow soils usually drain well, so air can get in.",
            ],
            callout: { title: "Painted by iron", text: "Just a little bit of rusty iron can make a whole soil red!" },
            source: "sssa-kskl",
          },
          {
            heading: "Gray and white soil",
            body: [
              "Gray soil is often soggy soil. When soil stays full of water, there is no air. The rusty color washes away and leaves gray behind.",
              "Pale or white soil can mean water has washed things out of it. In dry places, white can be salt or chalky minerals.",
            ],
            source: "nrcs-ssm",
          },
        ],
        activity: {
          title: "Soil color match",
          time: "20 minutes",
          materials: ["Two or three soil samples from different places", "A white paper plate for each sample", "Paint color sample cards in browns, reds, yellows, and grays (free at hardware stores)", "A spray bottle of water", "Crayons and paper"],
          steps: [
            "Put a spoonful of each soil on its own plate.",
            "Hold a paint card next to each soil. Find the closest color.",
            "Spray the soil with a little water. Does the color change? Find a new match.",
            "Color a picture of each soil and write one clue the color tells you.",
          ],
          lookFor: "Wet soil looks darker than dry soil. Dark soils may have lots of organic matter. Red or yellow soils have rusty iron.",
          safety: "Wash your hands after touching soil.",
        },
        quiz: [
          { prompt: "Dark brown or black topsoil usually has lots of…", options: ["Organic matter", "Plastic", "Snow"], answer: 0, explain: "Rotted plant and animal bits make soil dark." },
          { prompt: "What makes some soils red?", options: ["Red paint", "Rusty iron", "Strawberries", "Sunlight"], answer: 1, explain: "Iron that has rusted coats soil bits and colors them red or yellow." },
          { prompt: "Gray soil is often a sign that the soil is…", options: ["Very dry", "On fire", "Soggy with water"], answer: 2, explain: "When soil stays waterlogged, there's no air, and the rusty iron color goes away." },
          { prompt: "What happens to soil color when you spray it with water?", options: ["It gets lighter", "It gets darker", "It turns green", "It stays exactly the same"], answer: 1, explain: "Wet soil almost always looks darker than dry soil." },
          { prompt: "In a very dry place, white soil might be…", options: ["Salt or chalky minerals", "Chocolate", "Worms"], answer: 0, explain: "In dry areas, salts and chalky minerals can collect in soil and look white." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "Soil scientists read color like a detective reads fingerprints. Dark, red, gray, and white each tell a story about organic matter, oxygen, and water.",
        objectives: [
          "I can explain how organic matter affects soil color.",
          "I can explain why iron oxides make well-drained soils red or yellow-brown.",
          "I can use gray colors and mottles to identify soils that stay wet.",
          "I can describe what pale soil colors can mean.",
        ],
        vocab: [
          { term: "Humus", def: "Well-decomposed organic matter that gives topsoil a dark color." },
          { term: "Iron oxide", def: "A compound of iron and oxygen, like rust, that colors soils red, orange, or yellow-brown." },
          { term: "Mottles", def: "Spots or blotches of a different color in a soil, often orange and gray patches." },
          { term: "Drainage", def: "How quickly water leaves a soil after it gets wet." },
          { term: "Leaching", def: "The washing of dissolved materials downward through the soil by water." },
        ],
        sections: [
          {
            heading: "Dark means organic matter",
            body: [
              "Humus is dark brown to black, and even a few percent of it can darken a soil. That's why topsoil (the A horizon) is usually darker than the subsoil below it.",
              "The deep, dark soils of the prairies built up over thousands of years as grass roots grew and decomposed. Dark color often signals a soil that's rich in nutrients and life.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Red and yellow mean iron and oxygen",
            body: [
              "When iron in minerals weathers in a soil with plenty of oxygen, it forms iron oxides that coat soil particles. Hematite is bright red. Goethite is yellowish-brown. A small amount of these minerals is enough to color a whole horizon.",
              "Red and yellow-brown subsoils are usually a sign that water drains away and air gets in. Hematite red is especially common in warm, well-drained soils, like many in the southeastern United States.",
            ],
            source: "sssa-kskl",
          },
          {
            heading: "Gray means water and low oxygen",
            body: [
              "When soil stays saturated, microbes use up the oxygen. Some then use iron in place of oxygen, changing it into a form that dissolves in water. The dissolved iron moves away and leaves behind gray soil particles.",
              "Where some iron moves and then re-forms rust in air-filled spots, you get mottles: orange or red blotches mixed with gray. Soil scientists call these redoximorphic features, and they show where the water table sits for part of the year.",
            ],
            callout: { title: "Why it matters", text: "Mottles help scientists find wetlands and decide where it's safe to put a house basement or a septic system." },
            source: "nrcs-ssm",
          },
          {
            heading: "Pale means something's missing or added",
            body: [
              "A pale gray or whitish layer under the topsoil, called an E horizon, forms where water has washed clay, iron, and organic matter downward, leaving light-colored sand and silt.",
              "In dry regions, white layers often come from minerals that build up instead: calcium carbonate (lime) or salts left behind as water evaporates.",
            ],
            source: "nrcs-ssm",
          },
        ],
        activity: {
          title: "Build a class soil color chart",
          time: "40 minutes",
          materials: ["Soil samples from several places or depths (labeled)", "Paint color sample cards in browns, reds, yellows, and grays", "White paper plates", "A spray bottle of water", "A data table", "A few drops of vinegar in a dropper (optional)"],
          steps: [
            "Spread a small amount of each sample on a labeled plate. Break up clumps.",
            "Match each dry sample to the closest paint card and record the color name.",
            "Spray each sample until just moist and match it again. Soil scientists usually record moist color.",
            "For pale samples, add a few drops of vinegar. Fizzing means calcium carbonate is present.",
            "Arrange all samples from darkest to lightest and write an interpretation for each: organic matter, iron oxides, wetness, or leaching.",
          ],
          lookFor: "Topsoil is usually darker than subsoil. Red or yellow-brown suggests good drainage. Gray or mottled samples suggest wetness. Fizzing pale soil contains carbonates.",
          safety: "Wear goggles when using vinegar and wash hands after handling soil.",
        },
        quiz: [
          { prompt: "Why is topsoil usually darker than subsoil?", options: ["It has more organic matter", "It has more sand", "It is always wetter", "It has more iron"], answer: 0, explain: "Humus from decomposing roots and leaves darkens the A horizon." },
          { prompt: "Which mineral makes soil bright red?", options: ["Quartz", "Goethite", "Hematite", "Calcite"], answer: 2, explain: "Hematite is a red iron oxide. Goethite is yellowish-brown." },
          { prompt: "A subsoil is gray with orange blotches. What does this most likely mean?", options: ["It drains very well", "It is saturated with water for part of the year", "It has been burned", "It is full of humus"], answer: 1, explain: "Gray colors and orange mottles are redoximorphic features caused by periods of saturation and low oxygen." },
          { prompt: "Why do waterlogged soils lose their red or yellow color?", options: ["Iron is changed into a form that dissolves and moves away", "Water paints them gray", "Worms eat the iron", "Sunlight bleaches them"], answer: 0, explain: "With no oxygen, microbes change iron into a dissolvable form that is carried away, leaving gray particles." },
          { prompt: "A pale layer just below the topsoil in a forest is most likely…", options: ["A salt crust", "An E horizon where materials were leached out", "Fresh volcanic ash", "A layer of humus"], answer: 1, explain: "E horizons are pale because clay, iron, and organic matter have been washed downward." },
          { prompt: "A white soil layer in a desert fizzes with vinegar. What is it?", options: ["Calcium carbonate", "Iron oxide", "Organic matter"], answer: 0, explain: "Vinegar reacts with calcium carbonate to release carbon dioxide gas, which causes fizzing." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Color is the fastest data a soil scientist collects. Using the Munsell system, a few numbers reveal organic carbon, oxidation state, drainage history, and leaching, all without a lab.",
        objectives: [
          "I can read and record soil color using Munsell hue, value, and chroma.",
          "I can explain the chemistry of iron oxidation and reduction behind red, yellow, and gray soils.",
          "I can interpret redoximorphic features to estimate seasonal saturation.",
          "I can explain how soil color data guide wetland and land-use decisions.",
        ],
        vocab: [
          { term: "Munsell color system", def: "A standard way to describe color with three variables: hue, value, and chroma, written like 10YR 3/2." },
          { term: "Hue", def: "The dominant spectral color, such as R (red), YR (yellow-red), or Y (yellow), with a number like 2.5YR or 10YR." },
          { term: "Value and chroma", def: "Value is lightness from 0 (black) to 10 (white). Chroma is color strength, where low numbers are grayish and high numbers are vivid." },
          { term: "Redoximorphic features", def: "Color patterns, like gray depletions and orange concentrations, formed by the reduction and oxidation of iron and manganese." },
          { term: "Gleyed", def: "Describes soil with gray, bluish, or greenish colors caused by long periods of saturation and reduced iron." },
        ],
        sections: [
          {
            heading: "The Munsell system",
            body: [
              "Soil scientists match a moist soil sample to chips in a Munsell soil color book. Each page is a hue, such as 10YR. On each page, chips are arranged by value (lightness, vertically) and chroma (strength, horizontally).",
              "The notation 10YR 3/2 means hue 10YR, value 3, chroma 2: a very dark grayish brown. Recording color this way lets scientists anywhere compare soils precisely. Color is usually recorded moist, and sometimes dry, because moisture lowers value.",
            ],
            source: "nrcs-ssm",
          },
          {
            heading: "Organic carbon and value",
            body: [
              "Humus strongly absorbs light, so organic-rich horizons have low value and low chroma. Dark surface horizons in grassland soils (Mollisols) are defined partly by moist value and chroma of about 3 or less.",
              "Color isn't a perfect measure, though. Sandy soils look lighter at the same carbon content, and some dark parent materials, like basalt, can darken a soil without much organic matter.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Iron chemistry: oxidized vs. reduced",
            body: [
              "In aerated soils, iron is in the Fe³⁺ (ferric) state and forms insoluble oxides. Hematite (Fe₂O₃) gives red hues, like 2.5YR or 10R. Goethite (FeOOH) gives yellowish-brown hues, like 7.5YR or 10YR. Hematite tends to form in warmer, drier, well-drained settings, and goethite in cooler or moister ones.",
              "When soil is saturated and microbes have organic matter to consume, oxygen runs out. Microbes then use Fe³⁺ as an electron acceptor, reducing it to soluble Fe²⁺. The iron migrates, leaving gray depletions with low chroma (2 or less). Where Fe²⁺ meets oxygen again, along root channels or cracks, it re-oxidizes into orange concentrations.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Reading color for decisions",
            body: [
              "Because redoximorphic features persist for years, they record the depth and duration of seasonal saturation even during a dry season. The depth to the first low-chroma depletions is used to estimate the seasonal high water table.",
              "Agencies use these features to delineate hydric soils and wetlands, to rate sites for septic systems and basements, and to plan drainage. Pale E horizons signal strong leaching, and white calcic or salic layers in dry regions signal carbonate or salt accumulation that can limit crops.",
            ],
            source: "nrcs-ssm",
          },
        ],
        activity: {
          title: "Make a soil turn gray",
          time: "30 minutes to set up, then 2 to 3 weeks of observations",
          materials: ["Red, orange, or brown soil (subsoil works well)", "Two clear plastic bottles or jars with lids", "Water", "1 teaspoon of sugar or a spoonful of shredded grass clippings (food for microbes)", "Paint color cards or a Munsell chart if available", "A notebook"],
          steps: [
            "Record the starting color of the soil using paint cards or Munsell notation.",
            "Fill both containers halfway with soil. In container A, mix in the sugar or grass and add water until the soil is fully covered by a few centimeters of water. Close the lid loosely.",
            "In container B, keep the soil just moist (not flooded) and leave the lid off so air can reach it.",
            "Every few days, record the color at the bottom and sides of each container without opening container A.",
            "After 2 to 3 weeks, compare. Explain any color change using oxidation, reduction, and the role of microbes.",
          ],
          lookFor: "Flooded soil with added food may develop gray or bluish-gray zones as microbes use up oxygen and reduce iron. Any orange rims near the air-water surface show iron re-oxidizing. Results vary with soil type and temperature.",
          safety: "Keep lids loose so gas can escape. Open container A only outdoors or in a well-ventilated area, away from your face, since it may smell bad. Wash hands and dispose of soil outside.",
        },
        quiz: [
          { prompt: "In the Munsell notation 7.5YR 4/6, what does the 6 represent?", options: ["Hue", "Value (lightness)", "Chroma (color strength)", "Moisture content"], answer: 2, explain: "The format is hue value/chroma, so 6 is the chroma, a fairly strong color." },
          { prompt: "Which horizon color most strongly suggests high organic matter?", options: ["2.5YR 4/8", "10YR 2/1", "10YR 7/2", "5Y 6/1"], answer: 1, explain: "A value of 2 and chroma of 1 is nearly black, typical of humus-rich topsoil." },
          { prompt: "A profile description reads: 0–25 cm 10YR 3/2; 25–60 cm 10YR 5/6; 60–90 cm 10YR 5/6 with many 10YR 6/1 depletions; below 90 cm 5GY 5/1. At about what depth does seasonal saturation begin?", options: ["At the surface", "About 25 cm", "About 60 cm", "Below 150 cm"], answer: 2, explain: "Low-chroma (chroma 1) depletions first appear at about 60 cm, marking the top of seasonal saturation. The gleyed color below 90 cm suggests near-permanent saturation." },
          { prompt: "Why does iron become mobile in a saturated soil?", options: ["Fe²⁺ is oxidized to insoluble Fe³⁺", "Microbes reduce insoluble Fe³⁺ to soluble Fe²⁺ when oxygen runs out", "Water melts iron oxides", "Iron is lighter than water"], answer: 1, explain: "Under anaerobic conditions, microbes use Fe³⁺ as an electron acceptor, producing soluble Fe²⁺ that moves with water." },
          { prompt: "Which pairing of iron oxide and color is correct?", options: ["Goethite: red", "Hematite: red", "Hematite: gray", "Goethite: black"], answer: 1, explain: "Hematite produces red hues. Goethite produces yellowish-brown hues." },
          { prompt: "A builder plans a basement. Why would a soil scientist check for gray depletions in the subsoil?", options: ["They show the depth of seasonal saturation, which could flood the basement", "They show where gold is buried", "They mean the soil is rich in humus", "They show the soil is very sandy"], answer: 0, explain: "Redoximorphic features record where the water table rises for part of the year, even if the soil is dry when inspected." },
        ],
      },
    },
  },

  // ───────────────────────────── Soil Chemistry ─────────────────────────────
  {
    slug: "soil-chemistry",
    unit: 2,
    title: "Soil Chemistry: pH and Nutrients",
    icon: "⚗️",
    bigIdea: "Soil pH controls which nutrients plants can reach, and clay and humus act like magnets that hold nutrients until roots take them up.",
    interactive: {
      type: "ph-scale",
      title: "The pH scale",
      intro: "Slide along the pH scale and see which nutrients plants can reach.",
    },
    sources: ["weil-brady", "nrcs-ph-guide", "sssa-kskl", "nrcs-test-kit", "s4t"],
    standards: {
      elementary: ["5-PS1-3"],
      middle: ["MS-PS1-2"],
      high: ["HS-PS1-2", "HS-ESS2-5"],
    },
    levels: {
      elementary: {
        minutes: 10,
        summary: "Soil can be a little sour like lemon juice, or a little bitter like baking soda. Plants care a lot about which one it is!",
        objectives: [
          "I can tell that pH tells us if something is an acid or a base.",
          "I can name some foods plants get from soil.",
          "I can use red cabbage juice to test if soil water is an acid or a base.",
        ],
        vocab: [
          { term: "pH", def: "A number from 0 to 14 that tells if something is an acid, neutral, or a base." },
          { term: "Acid", def: "Something with a low pH, like lemon juice or vinegar." },
          { term: "Base", def: "Something with a high pH, like baking soda in water." },
          { term: "Nutrients", def: "Things plants need from soil to grow, like nitrogen, phosphorus, and potassium." },
        ],
        sections: [
          {
            heading: "The pH scale",
            body: [
              "Scientists use a number line called the pH scale. It goes from 0 to 14. Low numbers are acids, like lemon juice. High numbers are bases, like baking soda in water. Pure water is in the middle at 7. That's called neutral.",
              "Soil has a pH too. Most soils are somewhere in the middle of the scale.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Plant food in the soil",
            body: [
              "Plants make their own sugar from sunlight, but they also need nutrients from soil. Three big ones are nitrogen, phosphorus, and potassium. Plants also need calcium, magnesium, and sulfur, plus tiny amounts of others like iron and zinc.",
              "Plant roots take in nutrients with water from the soil.",
            ],
            source: "sssa-kskl",
          },
          {
            heading: "Plants like the middle",
            body: [
              "Most garden plants and crops grow best when soil is just a little acid or near neutral. If soil is too acid or too much of a base, plants can't get all the nutrients they need, even if the nutrients are there.",
              "Farmers can add ground-up limestone to make sour soil less acid.",
            ],
            callout: { title: "Picky plants", text: "Blueberries are different. They like acid soil!" },
            source: "weil-brady",
          },
        ],
        activity: {
          title: "Red cabbage color test",
          time: "30 minutes",
          materials: ["Red cabbage juice (made ahead by an adult: chopped red cabbage soaked in hot water, then strained and cooled)", "Clear cups", "Vinegar", "Baking soda", "Two soil samples", "Distilled or bottled water", "Spoons"],
          steps: [
            "Pour a little cabbage juice into three cups. Add vinegar to one and a spoon of baking soda to another. Leave the third plain. These are your color guides.",
            "Mix a spoon of each soil with a half cup of distilled water. Stir and wait 10 minutes for the dirt to settle.",
            "Carefully pour some of the clear water from the top of each soil cup into a new cup of cabbage juice.",
            "Compare the colors with your color guides.",
          ],
          lookFor: "Pink or red means acid. Purple means close to neutral. Blue or green means a base. Soil colors are often faint, so look closely against white paper.",
          safety: "An adult should handle the hot water. Don't drink any of the liquids. Wash hands when done.",
        },
        quiz: [
          { prompt: "What is the pH of pure water?", options: ["0", "7", "14"], answer: 1, explain: "Pure water is neutral, with a pH of 7." },
          { prompt: "Vinegar is an example of…", options: ["A base", "An acid", "A nutrient", "A rock"], answer: 1, explain: "Vinegar has a low pH, so it is an acid." },
          { prompt: "Which of these is a nutrient plants get from soil?", options: ["Plastic", "Nitrogen", "Sugar cubes", "Light"], answer: 1, explain: "Nitrogen is one of the big three plant nutrients, along with phosphorus and potassium." },
          { prompt: "Cabbage juice turns pink when mixed with soil water. The soil water is…", options: ["A base", "Neutral", "An acid"], answer: 2, explain: "Red cabbage juice turns pink or red in acids." },
          { prompt: "What can farmers add to make sour, acid soil less acid?", options: ["Ground limestone", "Lemon juice", "More rain", "Vinegar"], answer: 0, explain: "Limestone raises soil pH, making it less acid." },
        ],
      },
      middle: {
        minutes: 15,
        summary: "A soil can be packed with nutrients that plants still can't use. pH is the key that unlocks them, and farmers manage it carefully.",
        objectives: [
          "I can explain the pH scale and why it is logarithmic.",
          "I can name the major plant nutrients and give examples of micronutrients.",
          "I can explain how soil pH affects nutrient availability.",
          "I can describe how lime and sulfur change soil pH.",
        ],
        vocab: [
          { term: "pH", def: "A measure of how acidic or basic a solution is. Each step on the scale is a tenfold change." },
          { term: "Macronutrients", def: "Nutrients plants need in large amounts: nitrogen, phosphorus, potassium, calcium, magnesium, and sulfur." },
          { term: "Micronutrients", def: "Nutrients plants need in tiny amounts, such as iron, manganese, zinc, copper, boron, and molybdenum." },
          { term: "Nutrient availability", def: "Whether a nutrient is in a form plant roots can actually take up." },
          { term: "Lime", def: "Ground limestone (mostly calcium carbonate) added to raise soil pH." },
        ],
        sections: [
          {
            heading: "A tenfold scale",
            body: [
              "pH runs from 0 (very acidic) to 14 (very basic), with 7 neutral. The scale is logarithmic: each whole number is a tenfold change in acidity. A soil at pH 5 is 10 times more acidic than one at pH 6 and 100 times more acidic than one at pH 7.",
              "Most soils fall roughly between pH 4 and 9. Soils in rainy climates tend to be acidic because rain leaches away calcium and magnesium. Soils in dry climates are often neutral to basic.",
            ],
            source: "weil-brady",
          },
          {
            heading: "What plants need",
            body: [
              "Plants get carbon, hydrogen, and oxygen from air and water. Everything else comes from soil. The primary macronutrients are nitrogen (N), phosphorus (P), and potassium (K), the three numbers on a fertilizer bag. Calcium (Ca), magnesium (Mg), and sulfur (S) are secondary macronutrients.",
              "Micronutrients like iron, manganese, zinc, copper, boron, and molybdenum are needed in tiny amounts, but a shortage of any one can still stunt a plant.",
            ],
            source: "sssa-kskl",
          },
          {
            heading: "pH unlocks nutrients",
            body: [
              "Most crops grow best in slightly acidic to neutral soil, roughly pH 6 to 7.5. In that range, most nutrients are available. In strongly acidic soils, calcium, magnesium, and phosphorus can run short, and aluminum can dissolve and become toxic to roots. In strongly basic soils, iron, zinc, manganese, and phosphorus become hard for plants to take up.",
              "That's why yellowing leaves can sometimes be a pH problem, not a lack of nutrients in the soil.",
            ],
            callout: { title: "Exceptions", text: "Blueberries, azaleas, and potatoes do well in more acidic soil. Each crop has its own preferred range." },
            source: "nrcs-ph-guide",
          },
          {
            heading: "Changing pH",
            body: [
              "To raise pH, farmers spread lime. The calcium carbonate reacts with acids in the soil and neutralizes them. To lower pH, gardeners can add elemental sulfur, which soil bacteria slowly turn into sulfuric acid.",
              "Some fertilizers also change pH. Nitrogen fertilizers containing ammonium tend to make soil more acidic over time as microbes convert ammonium to nitrate. Regular soil testing tells farmers when to act.",
            ],
            source: "weil-brady",
          },
        ],
        activity: {
          title: "Soil pH and fizz tests",
          time: "40 minutes",
          materials: ["Red cabbage indicator (made ahead) or pH test strips", "Three soil samples from different places", "Distilled water", "Clear cups and spoons", "Vinegar", "Baking soda", "Goggles"],
          steps: [
            "Mix 2 spoons of each soil with 2 spoons of distilled water (equal parts, as in the NRCS test kit). Stir and let settle for 10 minutes.",
            "Test the clear liquid with a pH strip, or add it to cabbage indicator and compare with vinegar (acid) and baking soda (base) reference cups. Record an estimated pH.",
            "Put a small spoonful of dry soil from each sample on a plate and add a few drops of vinegar. Fizzing means carbonates, so the soil is likely basic.",
            "Mix another small spoonful of each soil with water to make mud, then sprinkle on baking soda. Fizzing suggests an acidic soil.",
            "Make a table and decide which sample would be best for most crops and which would be best for blueberries.",
          ],
          lookFor: "Most garden soils test between about 5.5 and 7.5. Carbonate-rich soils fizz with vinegar, and strongly acidic soils may fizz with baking soda.",
          safety: "Wear goggles. Don't taste anything, and wash hands after handling soil.",
        },
        quiz: [
          { prompt: "Soil A has pH 5 and soil B has pH 7. How many times more acidic is soil A?", options: ["2 times", "10 times", "100 times", "1,000 times"], answer: 2, explain: "Each pH unit is a tenfold change. Two units means 10 × 10 = 100 times." },
          { prompt: "Which three nutrients are shown by the numbers on a fertilizer bag?", options: ["Nitrogen, phosphorus, potassium", "Iron, zinc, copper", "Carbon, hydrogen, oxygen"], answer: 0, explain: "N-P-K stands for nitrogen, phosphorus, and potassium, the primary macronutrients." },
          { prompt: "In what pH range do most crops grow best?", options: ["About 3 to 4", "About 6 to 7.5", "About 9 to 10", "Exactly 14"], answer: 1, explain: "Most crops prefer slightly acidic to neutral soil, where most nutrients are available." },
          { prompt: "A farmer's soil is pH 4.8. What should they add to raise it?", options: ["Elemental sulfur", "Lime", "Ammonium fertilizer", "Vinegar"], answer: 1, explain: "Lime (calcium carbonate) neutralizes soil acidity and raises pH." },
          { prompt: "Why might a plant in very basic soil show iron deficiency even when the soil has iron?", options: ["At high pH, iron is in forms roots can't take up", "Iron dissolves and floats away", "Basic soils contain no minerals", "Plants don't need iron"], answer: 0, explain: "Iron becomes much less available as pH rises, even if plenty is present." },
          { prompt: "Which of these is a micronutrient?", options: ["Nitrogen", "Potassium", "Zinc", "Calcium"], answer: 2, explain: "Zinc is needed in tiny amounts. Nitrogen, potassium, and calcium are macronutrients." },
        ],
      },
      high: {
        minutes: 20,
        summary: "Soil chemistry happens on charged surfaces. Clay and humus hold cations like a bank holds money, and pH decides which nutrients stay available and which turn toxic.",
        objectives: [
          "I can calculate differences in hydrogen ion concentration from pH values.",
          "I can explain the chemical reasons pH controls nutrient availability.",
          "I can explain cation exchange capacity and why clay and humus hold nutrients.",
          "I can write and explain the reactions behind liming and acidification.",
        ],
        vocab: [
          { term: "Cation exchange capacity (CEC)", def: "The total amount of exchangeable cations a soil can hold on its negatively charged surfaces, in cmolc/kg (equal to meq/100 g)." },
          { term: "Exchangeable cation", def: "A positively charged ion, such as Ca²⁺, Mg²⁺, K⁺, or NH₄⁺, held on a soil surface that can swap with ions in the soil water." },
          { term: "Base saturation", def: "The percentage of CEC occupied by nonacid cations such as Ca²⁺, Mg²⁺, K⁺, and Na⁺." },
          { term: "Aluminum toxicity", def: "Damage to roots from dissolved Al³⁺, which becomes soluble in strongly acidic soils (below about pH 5.5)." },
          { term: "Nitrification", def: "The microbial conversion of ammonium (NH₄⁺) to nitrate (NO₃⁻), which releases hydrogen ions and acidifies soil." },
        ],
        sections: [
          {
            heading: "pH as a logarithm",
            body: [
              "pH = −log[H⁺], where [H⁺] is the hydrogen ion concentration in moles per liter. A one-unit drop means ten times more H⁺. Soil pH is usually measured in a 1:1 mix of soil and water, as in the NRCS Soil Quality Test Kit.",
              "Acidity builds naturally as rain leaches base cations, roots and microbes release CO₂ and organic acids, and organic matter decomposes. Human inputs like ammonium fertilizers and acid deposition can speed it up. Soils with lots of clay and humus resist pH change because their exchange sites buffer added acid or base.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Why pH controls availability",
            body: [
              "pH changes the chemical form of nutrients. Below about pH 5.5, aluminum and manganese dissolve and can reach toxic levels, while phosphate binds to iron and aluminum. Above about pH 7.5, phosphate reacts with calcium to form insoluble compounds, and iron, manganese, zinc, and copper form insoluble hydroxides.",
              "So most crops do best around pH 6 to 7.5, where phosphorus is most available and toxic metals stay locked up. Molybdenum is an exception: it becomes more available as pH rises.",
            ],
            source: "weil-brady",
          },
          {
            heading: "Cation exchange capacity",
            body: [
              "Clay minerals carry permanent negative charges because of substitutions inside their crystal layers (for example, Mg²⁺ replacing Al³⁺). Humus carries negative charges from carboxyl and phenolic groups that lose H⁺ as pH rises. These charges attract and hold cations so they don't wash away, yet can trade them with soil water when roots take nutrients up.",
              "CEC varies widely. Very sandy soils may be below about 5 cmolc/kg. Kaolinite clay is low (roughly 2 to 15), smectite is high (roughly 80 to 120), and humus is highest (often 150 or more). Cations with higher charge and smaller hydrated size hold on more tightly, roughly Al³⁺ > Ca²⁺ > Mg²⁺ > K⁺ ≈ NH₄⁺ > Na⁺. Anions like nitrate aren't held, so they leach easily.",
            ],
            callout: { title: "Nutrient bank", text: "CEC works like a bank account. A high-CEC soil stores more nutrients, but it also takes more lime to change its pH." },
            source: "sssa-kskl",
          },
          {
            heading: "Managing soil chemistry",
            body: [
              "Liming neutralizes acidity: CaCO₃ + 2H⁺ → Ca²⁺ + H₂O + CO₂. The calcium also replaces H⁺ and Al³⁺ on exchange sites. To lower pH, elemental sulfur is oxidized by bacteria to sulfuric acid, a process that takes weeks to months.",
              "Ammonium fertilizers acidify soil through nitrification: NH₄⁺ + 2O₂ → NO₃⁻ + 2H⁺ + H₂O. Over-fertilizing wastes money, acidifies soil, and lets nitrate leach into groundwater and phosphorus run off into lakes, feeding algal blooms. Soil testing lets farmers match lime and fertilizer to what the soil actually needs.",
            ],
            source: "weil-brady",
          },
        ],
        activity: {
          title: "Test pH and model liming",
          time: "45 minutes",
          materials: ["pH test strips or a pH meter", "Two or three soil samples, including one acidic soil (such as potting mix with peat, or soil from under pine trees)", "Distilled water", "Clear cups, spoons, and a measuring spoon", "Powdered chalk or garden lime (calcium carbonate)", "Goggles and gloves", "A data table"],
          steps: [
            "Make a 1:1 mix of each soil and distilled water by volume. Stir for 30 seconds, wait 10 minutes, stir again, and let settle.",
            "Measure and record the pH of each liquid.",
            "To the acidic sample, add a small pinch (about 1/8 teaspoon) of calcium carbonate. Stir well and wait 10 minutes. Measure pH again.",
            "Repeat with another pinch, recording pH each time, for three or four additions.",
            "Graph pH against amount of lime added. Calculate how many times the H⁺ concentration dropped from start to finish, and explain your graph using the liming reaction and buffering.",
          ],
          lookFor: "pH should rise as calcium carbonate is added, then level off as the soil's buffering and the limited solubility of carbonate take effect. Soils with more clay or organic matter often need more lime for the same change.",
          safety: "Wear goggles and gloves when handling lime and avoid breathing the powder. Don't taste anything, and wash hands afterward.",
        },
        quiz: [
          { prompt: "A soil's pH drops from 6.5 to 4.5 after years of heavy ammonium fertilizer use. By what factor did [H⁺] increase?", options: ["2", "20", "100", "1,000"], answer: 2, explain: "A 2-unit drop means 10² = 100 times more hydrogen ions." },
          { prompt: "A soil has a CEC of 20 cmolc/kg with 12 Ca²⁺, 3 Mg²⁺, and 1 K⁺ (all in cmolc/kg). What is its base saturation?", options: ["60%", "75%", "80%", "100%"], answer: 2, explain: "(12 + 3 + 1) ÷ 20 = 16 ÷ 20 = 0.80, or 80%." },
          { prompt: "Why do clay and humus hold nutrient cations?", options: ["They carry negative surface charges that attract cations", "They are positively charged", "They are magnetic", "They dissolve nutrients into gas"], answer: 0, explain: "Isomorphous substitution in clays and dissociated acid groups in humus create negative charges that hold cations like Ca²⁺ and K⁺." },
          { prompt: "Why does nitrate leach more easily than ammonium?", options: ["Nitrate is heavier", "Nitrate is a negatively charged anion and isn't held on negative exchange sites", "Ammonium is a gas", "Nitrate binds to calcium"], answer: 1, explain: "Exchange sites are mostly negative, so cations like NH₄⁺ are held but anions like NO₃⁻ move with water." },
          { prompt: "What happens to aluminum in strongly acidic soil (below about pH 5.5)?", options: ["It dissolves as Al³⁺ and can damage roots", "It turns into calcium", "It becomes a nutrient plants need in large amounts", "It evaporates"], answer: 0, explain: "Low pH dissolves aluminum minerals, releasing toxic Al³⁺ that stunts root growth." },
          { prompt: "Two fields both have pH 5.2. Field A is a sandy loam with low organic matter. Field B is a clay loam with high organic matter. Which needs more lime to reach pH 6.5, and why?", options: ["Field A, because sand holds more acid", "Field B, because its higher CEC stores more exchangeable acidity", "Neither, both need the same amount", "Field A, because it has more humus"], answer: 1, explain: "Higher CEC means more H⁺ and Al³⁺ on exchange sites (higher buffer capacity), so more lime is needed to neutralize it." },
        ],
      },
    },
  },
];
