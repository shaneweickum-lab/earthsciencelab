/**
 * The 118 elements, written for middle schoolers.
 * Masses are IUPAC standard atomic weights (rounded). Bracketed masses in real tables
 * (synthetic or radioactive elements) are the mass number of the longest-lived isotope.
 * crustPpm is approximate abundance in Earth's crust (CRC Handbook), parts per million.
 */

export type ElementCategory =
  | "alkali"
  | "alkaline-earth"
  | "transition"
  | "post-transition"
  | "metalloid"
  | "nonmetal"
  | "noble-gas"
  | "lanthanide"
  | "actinide"
  | "unknown";

export type Phase = "solid" | "liquid" | "gas" | "unknown";

export interface FoundIn {
  universe: string;
  earth: string;
  life: string;
  uses: string;
}

export interface ChemElement {
  z: number;
  symbol: string;
  name: string;
  mass: number;
  /** True when mass is the mass number of the longest-lived isotope, not a standard weight. */
  massIsIsotope: boolean;
  /** Mass number of the most common (or longest-lived) isotope, used for neutron count. */
  isotope: number;
  category: ElementCategory;
  /** null for lanthanides and actinides, which sit in their own rows below the table. */
  group: number | null;
  period: number;
  shells: number[];
  phase: Phase;
  discovered: string;
  crustPpm: number;
  summary: string;
  foundIn: FoundIn;
}

export const CATEGORY_INFO: Record<ElementCategory, { label: string; color: string; blurb: string }> = {
  alkali: { label: "Alkali metals", color: "#e8735a", blurb: "Soft, super-reactive metals. Some explode in water." },
  "alkaline-earth": { label: "Alkaline earth metals", color: "#f0a04b", blurb: "Reactive metals found in rocks, bones, and shells." },
  transition: { label: "Transition metals", color: "#e9c46a", blurb: "Strong, shiny metals used in tools, wires, and coins." },
  "post-transition": { label: "Post-transition metals", color: "#8ab17d", blurb: "Softer metals like aluminum, tin, and lead." },
  metalloid: { label: "Metalloids", color: "#5fb3a1", blurb: "Part metal, part nonmetal. Great for computer chips." },
  nonmetal: { label: "Reactive nonmetals", color: "#5b9bd5", blurb: "The building blocks of life and air, plus the fierce halogens." },
  "noble-gas": { label: "Noble gases", color: "#9b7fd4", blurb: "Calm gases that almost never react. They glow in signs." },
  lanthanide: { label: "Lanthanides", color: "#d97fb0", blurb: "Rare earth metals used in magnets, screens, and lasers." },
  actinide: { label: "Actinides", color: "#c66b8f", blurb: "Radioactive heavy metals, including nuclear fuels." },
  unknown: { label: "Unknown properties", color: "#a3a3a3", blurb: "Superheavy elements that last only fractions of a second." },
};

/** Most common isotope where rounding the atomic weight would give the wrong mass number. */
const ISOTOPE_OVERRIDES: Record<number, number> = {
  28: 58, 29: 63, 30: 64, 31: 69, 32: 74, 34: 80, 35: 79, 40: 90, 42: 98, 44: 102, 47: 107,
  48: 114, 50: 120, 51: 121, 52: 130, 54: 132, 56: 138, 60: 142, 62: 152, 63: 153, 64: 158,
  66: 164, 68: 166, 70: 174, 72: 180, 75: 187, 76: 192, 77: 193, 80: 202, 81: 205, 82: 208,
};

function e(
  z: number, symbol: string, name: string, mass: number, category: ElementCategory,
  group: number | null, period: number, shells: number[], phase: Phase, discovered: string,
  crustPpm: number, summary: string, foundIn: FoundIn, massIsIsotope = false,
): ChemElement {
  return {
    z, symbol, name, mass, massIsIsotope, isotope: ISOTOPE_OVERRIDES[z] ?? Math.round(mass),
    category, group, period, shells, phase, discovered, crustPpm, summary, foundIn,
  };
}

const SUPERHEAVY: FoundIn = {
  universe: "Not found in nature. It may never have existed anywhere before scientists made it.",
  earth: "Only a few atoms have ever been made, by smashing lighter atoms together in particle accelerators.",
  life: "No role in living things. It falls apart far too quickly.",
  uses: "Only for research into how atoms hold together.",
};

export const ELEMENTS: ChemElement[] = [
  e(1, "H", "Hydrogen", 1.008, "nonmetal", 1, 1, [1], "gas", "1766", 1400,
    "The lightest and most common element in the universe.",
    { universe: "About three-quarters of all normal matter. Stars, including the Sun, are mostly hydrogen.", earth: "Mostly locked up in water (H₂O). Very little floats free in the air.", life: "In water and in every sugar, fat, and protein in your body.", uses: "Rocket fuel, fuel cells, and making fertilizer (ammonia)." }),
  e(2, "He", "Helium", 4.0026, "noble-gas", 18, 1, [2], "gas", "1868", 0.008,
    "A light, calm gas first discovered in the Sun before it was found on Earth.",
    { universe: "The second most common element. Made in the Big Bang and by stars fusing hydrogen.", earth: "Collects underground in natural gas deposits from radioactive decay. It escapes to space once released.", life: "No role in living things.", uses: "Party balloons, cooling MRI magnets, and deep-sea diving gas." }),
  e(3, "Li", "Lithium", 6.94, "alkali", 1, 2, [2, 1], "solid", "1817", 20,
    "The lightest metal. It's so light it floats on oil.",
    { universe: "Made in small amounts in the Big Bang and by cosmic rays.", earth: "In salty brines under dry lakes in South America and in rocks like spodumene.", life: "Tiny traces only. It's used as a medicine for some mood disorders.", uses: "Rechargeable batteries in phones, laptops, and electric cars." }),
  e(4, "Be", "Beryllium", 9.0122, "alkaline-earth", 2, 2, [2, 2], "solid", "1798", 2.8,
    "A strong, light metal found in emeralds.",
    { universe: "Made when cosmic rays break apart bigger atoms in space.", earth: "In the mineral beryl, which includes emerald and aquamarine.", life: "Toxic. Breathing its dust is harmful.", uses: "Space telescope mirrors (like James Webb) and X-ray windows." }),
  e(5, "B", "Boron", 10.81, "metalloid", 13, 2, [2, 3], "solid", "1808", 10,
    "A hard metalloid that plants need in tiny amounts.",
    { universe: "Made by cosmic rays splitting heavier atoms.", earth: "In borax deposits in dry lakebeds, like Death Valley.", life: "A micronutrient plants need to build cell walls.", uses: "Heat-proof glass (Pyrex), slime, and detergents." }),
  e(6, "C", "Carbon", 12.011, "nonmetal", 14, 2, [2, 4], "solid", "ancient", 200,
    "The backbone of all known life. It can be soft graphite or hard diamond.",
    { universe: "Made inside stars by fusing helium. The 4th most common element.", earth: "In limestone rocks, coal, oil, CO₂ in the air, and soil organic matter.", life: "Every living cell is built on carbon. About 18% of your body.", uses: "Pencils (graphite), diamonds, steel, and plastics." }),
  e(7, "N", "Nitrogen", 14.007, "nonmetal", 15, 2, [2, 5], "gas", "1772", 19,
    "Makes up most of the air you breathe.",
    { universe: "Made in stars. Common in nebulas and planet atmospheres.", earth: "78% of the air. Soil bacteria turn it into a form plants can use.", life: "In every protein and in DNA. The 'N' in N-P-K plant food.", uses: "Fertilizer, keeping chips fresh in bags, and freezing things with liquid nitrogen." }),
  e(8, "O", "Oxygen", 15.999, "nonmetal", 16, 2, [2, 6], "gas", "1774", 461000,
    "The gas you breathe and the most common element in Earth's crust.",
    { universe: "The 3rd most common element, made in big stars.", earth: "Almost half of Earth's crust by weight, in rocks and minerals. 21% of the air.", life: "About 65% of your body's weight, mostly in water.", uses: "Hospitals, welding torches, and rocket fuel." }),
  e(9, "F", "Fluorine", 18.998, "nonmetal", 17, 2, [2, 7], "gas", "1886", 585,
    "The most reactive element of all. It attacks almost anything.",
    { universe: "Rare. Made in stars but easily destroyed.", earth: "In the minerals fluorite and apatite.", life: "Strengthens tooth enamel.", uses: "Toothpaste (fluoride), nonstick pans, and refrigerants." }),
  e(10, "Ne", "Neon", 20.18, "noble-gas", 18, 2, [2, 8], "gas", "1898", 0.005,
    "A noble gas famous for its bright red-orange glow.",
    { universe: "Common in stars and space, about the 5th most abundant element.", earth: "A tiny part of the air (0.0018%).", life: "No role in living things.", uses: "Glowing neon signs and lasers." }),
  e(11, "Na", "Sodium", 22.99, "alkali", 1, 3, [2, 8, 1], "solid", "1807", 23600,
    "A soft metal that fizzes in water. Half of table salt.",
    { universe: "Made in stars. It gives some stars and streetlights their yellow color.", earth: "Dissolved in seawater as salt, and in feldspar rocks.", life: "Helps nerves send signals. Too much salt in soil hurts plants.", uses: "Table salt, baking soda, and yellow streetlights." }),
  e(12, "Mg", "Magnesium", 24.305, "alkaline-earth", 2, 3, [2, 8, 2], "solid", "1755", 23300,
    "A light metal that burns with a blinding white light.",
    { universe: "Made in big stars. Common in planets and meteorites.", earth: "In seawater and in rocks like dolomite and olivine.", life: "The center of every chlorophyll molecule, so plants need it to be green.", uses: "Fireworks, light car and bike parts, and antacids." }),
  e(13, "Al", "Aluminum", 26.982, "post-transition", 13, 3, [2, 8, 3], "solid", "1825", 82300,
    "The most common metal in Earth's crust.",
    { universe: "Made in big stars and supernovae.", earth: "In clay minerals and bauxite ore. Clay soils are full of it.", life: "No known use. Too much in acidic soil harms plant roots.", uses: "Soda cans, foil, airplanes, and window frames." }),
  e(14, "Si", "Silicon", 28.085, "metalloid", 14, 3, [2, 8, 4], "solid", "1824", 282000,
    "The second most common element in Earth's crust. Sand is made of it.",
    { universe: "Made in big stars. Common in rocky planets.", earth: "Quartz sand and most rocks are silicate minerals. It's in sand, silt, and clay.", life: "Some grasses and tiny ocean algae (diatoms) build with it.", uses: "Computer chips, solar panels, and glass." }),
  e(15, "P", "Phosphorus", 30.974, "nonmetal", 15, 3, [2, 8, 5], "solid", "1669", 1050,
    "A key plant nutrient, first discovered by boiling down urine.",
    { universe: "Made in exploding stars.", earth: "In phosphate rock (apatite). Soils slowly release it to plants.", life: "In DNA, bones, teeth, and ATP, the energy molecule. The 'P' in N-P-K.", uses: "Fertilizer, matches, and fireworks." }),
  e(16, "S", "Sulfur", 32.06, "nonmetal", 16, 3, [2, 8, 6], "solid", "ancient", 350,
    "A yellow element famous for its rotten-egg smell (in compounds).",
    { universe: "Made in big stars. Jupiter's moon Io is covered in sulfur volcanoes.", earth: "Near volcanoes and hot springs, and in minerals like gypsum and pyrite.", life: "In some proteins. It gives onions, garlic, and skunks their smell.", uses: "Fertilizer, matches, rubber tires, and batteries." }),
  e(17, "Cl", "Chlorine", 35.45, "nonmetal", 17, 3, [2, 8, 7], "gas", "1774", 145,
    "A greenish, poisonous gas. The other half of table salt.",
    { universe: "Made in exploding stars.", earth: "Dissolved in seawater as salt.", life: "Helps make stomach acid and balance fluids.", uses: "Cleaning pool and drinking water, bleach, and PVC pipes." }),
  e(18, "Ar", "Argon", 39.95, "noble-gas", 18, 3, [2, 8, 8], "gas", "1894", 3.5,
    "A noble gas that makes up about 1% of the air.",
    { universe: "Made in stars.", earth: "Nearly 1% of air, mostly from radioactive potassium in rocks decaying.", life: "No role in living things.", uses: "Inside light bulbs, welding, and double-pane windows." }),
  e(19, "K", "Potassium", 39.098, "alkali", 1, 4, [2, 8, 8, 1], "solid", "1807", 20900,
    "A soft metal that bursts into purple flame in water.",
    { universe: "Made in exploding stars.", earth: "In feldspar and mica rocks and in clay. Weathering releases it into soil.", life: "Keeps your heart and nerves working. The 'K' in N-P-K plant food.", uses: "Fertilizer (potash), and bananas are full of it." }),
  e(20, "Ca", "Calcium", 40.078, "alkaline-earth", 2, 4, [2, 8, 8, 2], "solid", "1808", 41500,
    "The metal that builds bones, shells, and limestone.",
    { universe: "Made in exploding stars.", earth: "Limestone, marble, chalk, and gypsum. Farmers add lime to fix acidic soil.", life: "Bones, teeth, shells, and strong plant cell walls.", uses: "Cement, chalk, and antacid tablets." }),
  e(21, "Sc", "Scandium", 44.956, "transition", 3, 4, [2, 8, 9, 2], "solid", "1879", 22,
    "A light, rare metal that makes aluminum stronger.",
    { universe: "Made in exploding stars.", earth: "Spread thinly through many rocks. Rarely concentrated.", life: "No role in living things.", uses: "Strong aluminum mixes for bikes, baseball bats, and jets." }),
  e(22, "Ti", "Titanium", 47.867, "transition", 4, 4, [2, 8, 10, 2], "solid", "1791", 5650,
    "As strong as steel but much lighter, and it doesn't rust.",
    { universe: "Made in exploding stars.", earth: "In the minerals rutile and ilmenite, often in beach sands.", life: "Not needed, but the body accepts it well.", uses: "Hip replacements, airplanes, and white paint and sunscreen." }),
  e(23, "V", "Vanadium", 50.942, "transition", 5, 4, [2, 8, 11, 2], "solid", "1801", 120,
    "A metal that makes steel super tough.",
    { universe: "Made in exploding stars.", earth: "In magnetite ores and crude oil.", life: "A trace element for some sea creatures, like sea squirts.", uses: "Tough steel for tools and big batteries for storing solar power." }),
  e(24, "Cr", "Chromium", 51.996, "transition", 6, 4, [2, 8, 13, 1], "solid", "1797", 102,
    "The shiny metal that makes stainless steel stainless.",
    { universe: "Made in exploding stars.", earth: "In the mineral chromite. It gives rubies and emeralds their color.", life: "Tiny traces may help the body use sugar.", uses: "Stainless steel and shiny chrome car parts." }),
  e(25, "Mn", "Manganese", 54.938, "transition", 7, 4, [2, 8, 13, 2], "solid", "1774", 950,
    "A metal that plants need to split water during photosynthesis.",
    { universe: "Made in exploding stars.", earth: "In black manganese oxides in soil and lumpy nodules on the ocean floor.", life: "A plant micronutrient used in photosynthesis.", uses: "Steel, batteries, and fertilizers." }),
  e(26, "Fe", "Iron", 55.845, "transition", 8, 4, [2, 8, 14, 2], "solid", "ancient", 56300,
    "The metal of tools, cars, and your blood.",
    { universe: "The last element made by fusion in big stars. Meteorites are often iron.", earth: "Earth's core is mostly iron. Rusty iron oxides make soils red and yellow.", life: "In hemoglobin, which carries oxygen in your blood. Plants need it for chlorophyll.", uses: "Steel for buildings, bridges, cars, and nails." }),
  e(27, "Co", "Cobalt", 58.933, "transition", 9, 4, [2, 8, 15, 2], "solid", "1735", 25,
    "A metal famous for making deep blue glass.",
    { universe: "Made in exploding stars.", earth: "In ores mined with copper and nickel.", life: "At the center of vitamin B12. Bacteria on legume roots need it.", uses: "Batteries, magnets, and cobalt-blue paint." }),
  e(28, "Ni", "Nickel", 58.693, "transition", 10, 4, [2, 8, 16, 2], "solid", "1751", 84,
    "A tough metal that doesn't rust easily.",
    { universe: "Made in exploding stars. Iron meteorites contain lots of it.", earth: "Earth's core is iron mixed with nickel.", life: "Some plants and microbes need a tiny bit.", uses: "Stainless steel, batteries, and coins." }),
  e(29, "Cu", "Copper", 63.546, "transition", 11, 4, [2, 8, 18, 1], "solid", "ancient", 60,
    "A reddish metal that carries electricity well. It turns green over time.",
    { universe: "Made in exploding stars.", earth: "In ores in mountain belts. Sometimes found as pure nuggets.", life: "A micronutrient for plants and people. Some sea creatures have copper-based blue blood.", uses: "Electrical wires, pipes, and the Statue of Liberty's green skin." }),
  e(30, "Zn", "Zinc", 65.38, "transition", 12, 4, [2, 8, 18, 2], "solid", "1746", 70,
    "A bluish metal that protects steel from rust.",
    { universe: "Made in exploding stars.", earth: "In the ore sphalerite.", life: "Helps your immune system and helps plants grow.", uses: "Galvanized steel, sunscreen, and batteries." }),
  e(31, "Ga", "Gallium", 69.723, "post-transition", 13, 4, [2, 8, 18, 3], "solid", "1875", 19,
    "A metal that melts in your hand.",
    { universe: "Made in exploding stars.", earth: "Collected as a byproduct of making aluminum and zinc.", life: "No role in living things.", uses: "LEDs, smartphone chips, and solar cells." }),
  e(32, "Ge", "Germanium", 72.63, "metalloid", 14, 4, [2, 8, 18, 4], "solid", "1886", 1.5,
    "A metalloid whose existence was predicted before it was found.",
    { universe: "Made in giant and exploding stars.", earth: "Collected from zinc ores and coal ash.", life: "No role in living things.", uses: "Fiber optic cables and night-vision lenses." }),
  e(33, "As", "Arsenic", 74.922, "metalloid", 15, 4, [2, 8, 18, 5], "solid", "1250", 1.8,
    "A famous poison that also makes fast electronics.",
    { universe: "Made in exploding stars.", earth: "In minerals with sulfur. It can leak into groundwater.", life: "Toxic to people. Rice can absorb it from soil and water.", uses: "Computer chips (gallium arsenide) and old wood preservatives." }),
  e(34, "Se", "Selenium", 78.971, "nonmetal", 16, 4, [2, 8, 18, 6], "solid", "1817", 0.05,
    "Needed in tiny amounts, but toxic in larger ones.",
    { universe: "Made in exploding stars.", earth: "In some soils. Soils in some regions have too much or too little.", life: "A trace nutrient for people and animals. Brazil nuts are full of it.", uses: "Glass coloring, solar cells, and supplements." }),
  e(35, "Br", "Bromine", 79.904, "nonmetal", 17, 4, [2, 8, 18, 7], "liquid", "1826", 2.4,
    "One of only two elements that are liquid at room temperature.",
    { universe: "Made in exploding stars.", earth: "Dissolved in seawater and very salty lakes like the Dead Sea.", life: "Tiny amounts help build tissue in animals.", uses: "Fire retardants and pool cleaners." }),
  e(36, "Kr", "Krypton", 83.798, "noble-gas", 18, 4, [2, 8, 18, 8], "gas", "1898", 0.0001,
    "A real noble gas, not just Superman's home planet.",
    { universe: "Made in giant and exploding stars.", earth: "A tiny trace in the air.", life: "No role in living things.", uses: "Bright flash bulbs and energy-saving windows." }),
  e(37, "Rb", "Rubidium", 85.468, "alkali", 1, 5, [2, 8, 18, 8, 1], "solid", "1861", 90,
    "A soft metal that catches fire in air.",
    { universe: "Made in exploding stars.", earth: "Spread through granite and other rocks, often with potassium.", life: "No known role. Plants take it up because it acts like potassium.", uses: "Super-accurate atomic clocks used in GPS." }),
  e(38, "Sr", "Strontium", 87.62, "alkaline-earth", 2, 5, [2, 8, 18, 8, 2], "solid", "1790", 370,
    "The element that makes fireworks red.",
    { universe: "Made in giant stars.", earth: "In the minerals celestine and strontianite.", life: "Acts like calcium and can build into bones.", uses: "Red fireworks and flares, and glow-in-the-dark toys." }),
  e(39, "Y", "Yttrium", 88.906, "transition", 3, 5, [2, 8, 18, 9, 2], "solid", "1794", 33,
    "Named after a tiny Swedish village, Ytterby.",
    { universe: "Made in giant and exploding stars.", earth: "In rare earth minerals. Moon rocks have lots of it.", life: "No role in living things.", uses: "LEDs, lasers, and superconductors." }),
  e(40, "Zr", "Zirconium", 91.224, "transition", 4, 5, [2, 8, 18, 10, 2], "solid", "1789", 165,
    "A metal that resists heat and corrosion.",
    { universe: "Made in giant stars.", earth: "In zircon crystals, some of the oldest minerals on Earth (4.4 billion years old).", life: "No role in living things.", uses: "Nuclear reactor parts, fake diamonds (cubic zirconia), and ceramic knives." }),
  e(41, "Nb", "Niobium", 92.906, "transition", 5, 5, [2, 8, 18, 12, 1], "solid", "1801", 20,
    "A metal used in superconducting magnets.",
    { universe: "Made in exploding stars.", earth: "Mostly mined in Brazil.", life: "No role in living things.", uses: "Strong steel for pipelines and MRI magnets." }),
  e(42, "Mo", "Molybdenum", 95.95, "transition", 6, 5, [2, 8, 18, 13, 1], "solid", "1778", 1.2,
    "A metal plants need to use nitrogen.",
    { universe: "Made in exploding stars.", earth: "In the mineral molybdenite.", life: "Bacteria in legume roots need it to grab nitrogen from the air.", uses: "Super-strong steel and engine lubricants." }),
  e(43, "Tc", "Technetium", 98, "transition", 7, 5, [2, 8, 18, 13, 2], "solid", "1937", 0,
    "The first element made by humans. All of its forms are radioactive.",
    { universe: "Seen in some giant red stars, which proved stars make new elements.", earth: "Almost none in nature. It's made in nuclear reactors.", life: "No natural role.", uses: "Medical scans that show bones and organs." }, true),
  e(44, "Ru", "Ruthenium", 101.07, "transition", 8, 5, [2, 8, 18, 15, 1], "solid", "1844", 0.001,
    "A rare, hard metal related to platinum.",
    { universe: "Made in exploding stars and neutron star collisions.", earth: "Mined with platinum in South Africa and Russia.", life: "No role in living things.", uses: "Hard drives and electrical contacts." }),
  e(45, "Rh", "Rhodium", 102.91, "transition", 9, 5, [2, 8, 18, 16, 1], "solid", "1804", 0.001,
    "One of the rarest and most expensive metals.",
    { universe: "Made in exploding stars and neutron star collisions.", earth: "Mined with platinum.", life: "No role in living things.", uses: "Car catalytic converters that clean exhaust." }),
  e(46, "Pd", "Palladium", 106.42, "transition", 10, 5, [2, 8, 18, 18], "solid", "1802", 0.015,
    "A metal that can soak up hydrogen like a sponge.",
    { universe: "Made in exploding stars and neutron star collisions.", earth: "Mined with platinum and nickel.", life: "No role in living things.", uses: "Catalytic converters, electronics, and dental fillings." }),
  e(47, "Ag", "Silver", 107.87, "transition", 11, 5, [2, 8, 18, 18, 1], "solid", "ancient", 0.075,
    "The best conductor of electricity of any metal.",
    { universe: "Made in exploding stars and neutron star collisions.", earth: "In ores with lead and copper, sometimes as pure veins.", life: "No role. It kills many germs.", uses: "Jewelry, mirrors, solar panels, and electronics." }),
  e(48, "Cd", "Cadmium", 112.41, "transition", 12, 5, [2, 8, 18, 18, 2], "solid", "1817", 0.15,
    "A toxic metal that can build up in soil.",
    { universe: "Made in giant and exploding stars.", earth: "With zinc ores. Some phosphate fertilizers add it to soil.", life: "Toxic. Some plants absorb it from polluted soil.", uses: "Old rechargeable batteries and some solar panels." }),
  e(49, "In", "Indium", 114.82, "post-transition", 13, 5, [2, 8, 18, 18, 3], "solid", "1863", 0.25,
    "A soft metal that 'cries' (squeaks) when you bend it.",
    { universe: "Made in giant and exploding stars.", earth: "Collected from zinc ores.", life: "No role in living things.", uses: "Touchscreens (indium tin oxide) and solar cells." }),
  e(50, "Sn", "Tin", 118.71, "post-transition", 14, 5, [2, 8, 18, 18, 4], "solid", "ancient", 2.3,
    "Mixed with copper to make bronze, which started the Bronze Age.",
    { universe: "Made in giant and exploding stars.", earth: "In the mineral cassiterite.", life: "No known role.", uses: "Solder for electronics and coatings on food cans." }),
  e(51, "Sb", "Antimony", 121.76, "metalloid", 15, 5, [2, 8, 18, 18, 5], "solid", "ancient", 0.2,
    "Used since ancient Egypt as black eye makeup.",
    { universe: "Made in exploding stars.", earth: "In the mineral stibnite.", life: "Toxic in large amounts.", uses: "Fire retardants and lead batteries." }),
  e(52, "Te", "Tellurium", 127.6, "metalloid", 16, 5, [2, 8, 18, 18, 6], "solid", "1782", 0.001,
    "A rare metalloid. Eating a bit makes your breath smell like garlic.",
    { universe: "Made in exploding stars.", earth: "Very rare. Collected when refining copper.", life: "No known role.", uses: "Solar panels and heat-powered generators." }),
  e(53, "I", "Iodine", 126.9, "nonmetal", 17, 5, [2, 8, 18, 18, 7], "solid", "1811", 0.45,
    "A purple-black solid that turns into a violet gas.",
    { universe: "Made in exploding stars.", earth: "In seawater and seaweed.", life: "Your thyroid needs it, which is why salt is often 'iodized'.", uses: "Iodized salt and cleaning cuts." }),
  e(54, "Xe", "Xenon", 131.29, "noble-gas", 18, 5, [2, 8, 18, 18, 8], "gas", "1898", 0.00003,
    "A heavy noble gas that glows blue.",
    { universe: "Made in exploding stars.", earth: "A tiny trace in the air.", life: "Not needed, but it can put people to sleep (an anesthetic).", uses: "Bright car headlights and ion engines on spacecraft." }),
  e(55, "Cs", "Cesium", 132.91, "alkali", 1, 6, [2, 8, 18, 18, 8, 1], "solid", "1860", 3,
    "A golden metal that explodes in water and melts on a hot day.",
    { universe: "Made in exploding stars.", earth: "In the mineral pollucite.", life: "No role in living things.", uses: "Atomic clocks that define the second." }),
  e(56, "Ba", "Barium", 137.33, "alkaline-earth", 2, 6, [2, 8, 18, 18, 8, 2], "solid", "1774", 425,
    "Makes fireworks green.",
    { universe: "Made in giant stars.", earth: "In the mineral barite.", life: "Most forms are toxic.", uses: "Green fireworks, X-ray 'barium drinks', and oil drilling mud." }),
  e(57, "La", "Lanthanum", 138.91, "lanthanide", null, 6, [2, 8, 18, 18, 9, 2], "solid", "1839", 39,
    "The first of the rare earth metals.",
    { universe: "Made in giant and exploding stars.", earth: "In monazite and bastnäsite minerals.", life: "No role in living things.", uses: "Camera lenses and hybrid car batteries." }),
  e(58, "Ce", "Cerium", 140.12, "lanthanide", null, 6, [2, 8, 18, 19, 9, 2], "solid", "1803", 66.5,
    "The most common rare earth. It sparks when scratched.",
    { universe: "Made in giant and exploding stars.", earth: "More common in the crust than copper.", life: "No role in living things.", uses: "Lighter flints and polishing glass." }),
  e(59, "Pr", "Praseodymium", 140.91, "lanthanide", null, 6, [2, 8, 18, 21, 8, 2], "solid", "1885", 9.2,
    "A rare earth that makes glass yellow-green.",
    { universe: "Made in giant and exploding stars.", earth: "In rare earth minerals.", life: "No role in living things.", uses: "Strong magnets and welders' goggles." }),
  e(60, "Nd", "Neodymium", 144.24, "lanthanide", null, 6, [2, 8, 18, 22, 8, 2], "solid", "1885", 41.5,
    "Makes the strongest permanent magnets.",
    { universe: "Made in giant and exploding stars.", earth: "In rare earth minerals, mostly mined in China.", life: "No role in living things.", uses: "Magnets in earbuds, electric cars, and wind turbines." }),
  e(61, "Pm", "Promethium", 145, "lanthanide", null, 6, [2, 8, 18, 23, 8, 2], "solid", "1945", 0,
    "A radioactive rare earth, almost absent from nature.",
    { universe: "Spotted in the light of one unusual star.", earth: "Only tiny traces in uranium ore. Mostly made in reactors.", life: "No role in living things.", uses: "Long-lasting nuclear batteries and glowing paint." }, true),
  e(62, "Sm", "Samarium", 150.36, "lanthanide", null, 6, [2, 8, 18, 24, 8, 2], "solid", "1879", 7.05,
    "Makes magnets that keep working when hot.",
    { universe: "Made in giant and exploding stars.", earth: "In rare earth minerals.", life: "No role in living things.", uses: "Heat-proof magnets and cancer treatments." }),
  e(63, "Eu", "Europium", 151.96, "lanthanide", null, 6, [2, 8, 18, 25, 8, 2], "solid", "1901", 2,
    "Glows red under UV light and helps stop fake money.",
    { universe: "Made in exploding stars and neutron star collisions.", earth: "In rare earth minerals.", life: "No role in living things.", uses: "Red colors in screens and glowing marks on euro banknotes." }),
  e(64, "Gd", "Gadolinium", 157.25, "lanthanide", null, 6, [2, 8, 18, 25, 9, 2], "solid", "1880", 6.2,
    "Strongly magnetic when cold.",
    { universe: "Made in exploding stars.", earth: "In rare earth minerals.", life: "Not needed, but doctors inject it to make MRI scans clearer.", uses: "MRI contrast dye and nuclear reactor control rods." }),
  e(65, "Tb", "Terbium", 158.93, "lanthanide", null, 6, [2, 8, 18, 27, 8, 2], "solid", "1843", 1.2,
    "Glows bright green.",
    { universe: "Made in exploding stars.", earth: "In rare earth minerals.", life: "No role in living things.", uses: "Green colors in screens and sonar devices." }),
  e(66, "Dy", "Dysprosium", 162.5, "lanthanide", null, 6, [2, 8, 18, 28, 8, 2], "solid", "1886", 5.2,
    "Its name means 'hard to get' in Greek.",
    { universe: "Made in exploding stars.", earth: "In rare earth minerals.", life: "No role in living things.", uses: "Magnets for electric car motors." }),
  e(67, "Ho", "Holmium", 164.93, "lanthanide", null, 6, [2, 8, 18, 29, 8, 2], "solid", "1878", 1.3,
    "Has the strongest magnetic pull of any element.",
    { universe: "Made in exploding stars.", earth: "In rare earth minerals.", life: "No role in living things.", uses: "Medical lasers and powerful magnets." }),
  e(68, "Er", "Erbium", 167.26, "lanthanide", null, 6, [2, 8, 18, 30, 8, 2], "solid", "1843", 3.5,
    "Gives glass a pink color.",
    { universe: "Made in exploding stars.", earth: "In rare earth minerals.", life: "No role in living things.", uses: "Boosting signals in internet fiber optic cables." }),
  e(69, "Tm", "Thulium", 168.93, "lanthanide", null, 6, [2, 8, 18, 31, 8, 2], "solid", "1879", 0.52,
    "One of the rarest rare earths.",
    { universe: "Made in exploding stars.", earth: "In rare earth minerals.", life: "No role in living things.", uses: "Portable X-ray machines and lasers." }),
  e(70, "Yb", "Ytterbium", 173.05, "lanthanide", null, 6, [2, 8, 18, 32, 8, 2], "solid", "1878", 3.2,
    "The fourth element named after the village of Ytterby.",
    { universe: "Made in exploding stars.", earth: "In rare earth minerals.", life: "No role in living things.", uses: "The world's most precise atomic clocks." }),
  e(71, "Lu", "Lutetium", 174.97, "lanthanide", null, 6, [2, 8, 18, 32, 9, 2], "solid", "1907", 0.8,
    "The last and heaviest rare earth.",
    { universe: "Made in exploding stars.", earth: "In rare earth minerals.", life: "No role in living things.", uses: "Medical PET scanners and cancer treatment." }),
  e(72, "Hf", "Hafnium", 178.49, "transition", 4, 6, [2, 8, 18, 32, 10, 2], "solid", "1923", 3,
    "A metal that's great at absorbing neutrons.",
    { universe: "Made in giant and exploding stars.", earth: "Always found mixed with zirconium.", life: "No role in living things.", uses: "Nuclear reactor control rods and computer chips." }),
  e(73, "Ta", "Tantalum", 180.95, "transition", 5, 6, [2, 8, 18, 32, 11, 2], "solid", "1802", 2,
    "A tough metal that resists almost all acids.",
    { universe: "Made in exploding stars.", earth: "In the ore coltan.", life: "Not needed, but safe inside the body.", uses: "Tiny capacitors in phones and medical implants." }),
  e(74, "W", "Tungsten", 183.84, "transition", 6, 6, [2, 8, 18, 32, 12, 2], "solid", "1783", 1.25,
    "Has the highest melting point of any metal (3,422 °C).",
    { universe: "Made in exploding stars.", earth: "In the minerals wolframite and scheelite. That's why its symbol is W.", life: "Some microbes use it.", uses: "Old light bulb filaments and drill bits." }),
  e(75, "Re", "Rhenium", 186.21, "transition", 7, 6, [2, 8, 18, 32, 13, 2], "solid", "1925", 0.0007,
    "One of the rarest elements in Earth's crust.",
    { universe: "Made in exploding stars.", earth: "Collected when refining molybdenum.", life: "No role in living things.", uses: "Jet engine parts that survive extreme heat." }),
  e(76, "Os", "Osmium", 190.23, "transition", 8, 6, [2, 8, 18, 32, 14, 2], "solid", "1803", 0.0015,
    "The densest element. A soda can full of it would weigh about 8 kg.",
    { universe: "Made in exploding stars and neutron star collisions.", earth: "Mined with platinum.", life: "Some forms are toxic.", uses: "Fountain pen tips and electrical contacts." }),
  e(77, "Ir", "Iridium", 192.22, "transition", 9, 6, [2, 8, 18, 32, 15, 2], "solid", "1803", 0.001,
    "A layer of it in rocks helped show an asteroid wiped out the dinosaurs.",
    { universe: "Common in asteroids and meteorites.", earth: "Very rare in the crust, but found in a thin worldwide layer from 66 million years ago.", life: "No role in living things.", uses: "Spark plugs and the old standard kilogram." }),
  e(78, "Pt", "Platinum", 195.08, "transition", 10, 6, [2, 8, 18, 32, 17, 1], "solid", "1735", 0.005,
    "A precious metal rarer than gold.",
    { universe: "Made in exploding stars and neutron star collisions.", earth: "Mostly mined in South Africa.", life: "No natural role. Some cancer drugs contain it.", uses: "Catalytic converters, jewelry, and lab equipment." }),
  e(79, "Au", "Gold", 196.97, "transition", 11, 6, [2, 8, 18, 32, 18, 1], "solid", "ancient", 0.004,
    "A shiny metal that never rusts, treasured for thousands of years.",
    { universe: "Made mostly when neutron stars collide.", earth: "In quartz veins and as flakes in river sands.", life: "No role in living things.", uses: "Jewelry, coins, and electronics connectors." }),
  e(80, "Hg", "Mercury", 200.59, "transition", 12, 6, [2, 8, 18, 32, 18, 2], "liquid", "ancient", 0.085,
    "The only metal that is liquid at room temperature.",
    { universe: "Made in giant and exploding stars.", earth: "In the red mineral cinnabar.", life: "Toxic. It builds up in big fish like tuna.", uses: "Old thermometers. Now replaced by safer materials." }),
  e(81, "Tl", "Thallium", 204.38, "post-transition", 13, 6, [2, 8, 18, 32, 18, 3], "solid", "1861", 0.85,
    "A very toxic soft metal.",
    { universe: "Made in giant and exploding stars.", earth: "In traces in zinc and lead ores.", life: "Highly toxic.", uses: "Special glass and some medical heart scans." }),
  e(82, "Pb", "Lead", 207.2, "post-transition", 14, 6, [2, 8, 18, 32, 18, 4], "solid", "ancient", 14,
    "A heavy, soft metal once used in water pipes.",
    { universe: "Made in giant stars. It's also where uranium's decay ends.", earth: "In the mineral galena. Old paint and gasoline left lead in city soils.", life: "Toxic, especially to children's brains.", uses: "Car batteries and X-ray shields." }),
  e(83, "Bi", "Bismuth", 208.98, "post-transition", 15, 6, [2, 8, 18, 32, 18, 5], "solid", "1753", 0.0085,
    "Forms rainbow-colored staircase crystals.",
    { universe: "Made in giant stars.", earth: "Collected when refining lead.", life: "Safe enough to use in stomach medicine.", uses: "Pink stomach medicine and lead-free fishing weights." }),
  e(84, "Po", "Polonium", 209, "post-transition", 16, 6, [2, 8, 18, 32, 18, 6], "solid", "1898", 2e-10,
    "Discovered by Marie and Pierre Curie, named after Poland.",
    { universe: "Made as uranium decays.", earth: "Tiny traces in uranium ores.", life: "Extremely radioactive and toxic.", uses: "Removing static dust in factories." }, true),
  e(85, "At", "Astatine", 210, "metalloid", 17, 6, [2, 8, 18, 32, 18, 7], "solid", "1940", 0,
    "The rarest natural element. Less than a gram exists on Earth at any time.",
    { universe: "Made briefly as uranium and thorium decay.", earth: "Only fleeting traces in uranium ore.", life: "Being tested to fight cancer.", uses: "Cancer research." }, true),
  e(86, "Rn", "Radon", 222, "noble-gas", 18, 6, [2, 8, 18, 32, 18, 8], "gas", "1899", 4e-13,
    "A radioactive gas that can seep up from the ground.",
    { universe: "Made as uranium decays.", earth: "Rises from soil and rock containing uranium, and can collect in basements.", life: "Breathing a lot over many years can harm lungs.", uses: "Studying earthquakes and groundwater." }, true),
  e(87, "Fr", "Francium", 223, "alkali", 1, 7, [2, 8, 18, 32, 18, 8, 1], "solid", "1939", 0,
    "So radioactive that no one has ever seen a visible piece.",
    { universe: "Made briefly as actinium decays.", earth: "Maybe 30 grams exist in the whole crust at any moment.", life: "No role in living things.", uses: "Only research." }, true),
  e(88, "Ra", "Radium", 226, "alkaline-earth", 2, 7, [2, 8, 18, 32, 18, 8, 2], "solid", "1898", 9e-7,
    "Glows faintly in the dark from its own radioactivity.",
    { universe: "Made as uranium decays.", earth: "Tiny amounts in uranium ores.", life: "Dangerous. It acts like calcium and lodges in bones.", uses: "Cancer treatment. It was once used in glowing watch dials." }, true),
  e(89, "Ac", "Actinium", 227, "actinide", null, 7, [2, 8, 18, 32, 18, 9, 2], "solid", "1899", 5.5e-10,
    "Glows blue in the dark. The first actinide.",
    { universe: "Made as uranium decays.", earth: "Tiny traces in uranium ores.", life: "Being tested to treat cancer.", uses: "Cancer research and neutron sources." }, true),
  e(90, "Th", "Thorium", 232.04, "actinide", null, 7, [2, 8, 18, 32, 18, 10, 2], "solid", "1829", 9.6,
    "A slightly radioactive metal that could be a future nuclear fuel.",
    { universe: "Made in neutron star collisions.", earth: "In monazite sand. Its slow decay helps heat Earth's interior.", life: "No role in living things.", uses: "Old camping lantern mantles and possible future reactors." }),
  e(91, "Pa", "Protactinium", 231.04, "actinide", null, 7, [2, 8, 18, 32, 20, 9, 2], "solid", "1913", 1.4e-6,
    "A rare, radioactive metal.",
    { universe: "Made as uranium decays.", earth: "Tiny amounts in uranium ores.", life: "No role. Toxic and radioactive.", uses: "Dating ocean sediments." }),
  e(92, "U", "Uranium", 238.03, "actinide", null, 7, [2, 8, 18, 32, 21, 9, 2], "solid", "1789", 2.7,
    "The heavy metal that powers nuclear reactors.",
    { universe: "Made in neutron star collisions billions of years ago.", earth: "In pitchblende ore and granite. Its decay helps heat Earth's interior.", life: "No role. Toxic and radioactive.", uses: "Nuclear power fuel and dating very old rocks." }),
  e(93, "Np", "Neptunium", 237, "actinide", null, 7, [2, 8, 18, 32, 22, 9, 2], "solid", "1940", 0,
    "The first element heavier than uranium, named after Neptune.",
    { universe: "Not really found in nature.", earth: "Tiny traces in uranium ore. Mostly made in reactors.", life: "No role in living things.", uses: "Research and making plutonium-238." }, true),
  e(94, "Pu", "Plutonium", 244, "actinide", null, 7, [2, 8, 18, 32, 24, 8, 2], "solid", "1940", 0,
    "Named after Pluto. It powers some space probes.",
    { universe: "Not really found in nature.", earth: "Made in nuclear reactors. Tiny natural traces exist.", life: "Very toxic and radioactive.", uses: "Batteries for space probes like Voyager and the Mars rovers, and nuclear fuel." }, true),
  e(95, "Am", "Americium", 243, "actinide", null, 7, [2, 8, 18, 32, 25, 8, 2], "solid", "1944", 0,
    "Probably in your house right now, inside a smoke detector.",
    { universe: "Not found in nature.", earth: "Made in nuclear reactors.", life: "Radioactive. The tiny amount in smoke detectors is sealed and safe.", uses: "Smoke detectors." }, true),
  e(96, "Cm", "Curium", 247, "actinide", null, 7, [2, 8, 18, 32, 25, 9, 2], "solid", "1944", 0,
    "Named after Marie and Pierre Curie.",
    { universe: "Not found in nature.", earth: "Made in nuclear reactors.", life: "Radioactive. No role in living things.", uses: "Instruments on Mars rovers that study rocks." }, true),
  e(97, "Bk", "Berkelium", 247, "actinide", null, 7, [2, 8, 18, 32, 27, 8, 2], "solid", "1949", 0,
    "Named after Berkeley, California, where it was made.",
    { universe: "Not found in nature.", earth: "Made in tiny amounts in special reactors.", life: "No role in living things.", uses: "Making even heavier elements." }, true),
  e(98, "Cf", "Californium", 251, "actinide", null, 7, [2, 8, 18, 32, 28, 8, 2], "solid", "1950", 0,
    "One of the most expensive substances on Earth.",
    { universe: "Not found in nature.", earth: "Made in special reactors.", life: "No role in living things.", uses: "Neutron sources that find oil and gold underground and start up reactors." }, true),
  e(99, "Es", "Einsteinium", 252, "actinide", null, 7, [2, 8, 18, 32, 29, 8, 2], "solid", "1952", 0,
    "First found in the debris of the first hydrogen bomb test. Named after Einstein.",
    { universe: "Not found in nature.", earth: "Made in tiny amounts in reactors.", life: "No role in living things.", uses: "Research only." }, true),
  e(100, "Fm", "Fermium", 257, "actinide", null, 7, [2, 8, 18, 32, 30, 8, 2], "unknown", "1952", 0,
    "Named after physicist Enrico Fermi.",
    { ...SUPERHEAVY, earth: "First found in hydrogen bomb debris. Now made in reactors in tiny amounts." }, true),
  e(101, "Md", "Mendelevium", 258, "actinide", null, 7, [2, 8, 18, 32, 31, 8, 2], "unknown", "1955", 0,
    "Named after Dmitri Mendeleev, who invented the periodic table.",
    SUPERHEAVY, true),
  e(102, "No", "Nobelium", 259, "actinide", null, 7, [2, 8, 18, 32, 32, 8, 2], "unknown", "1958", 0,
    "Named after Alfred Nobel, founder of the Nobel Prize.",
    SUPERHEAVY, true),
  e(103, "Lr", "Lawrencium", 266, "actinide", null, 7, [2, 8, 18, 32, 32, 8, 3], "unknown", "1961", 0,
    "Named after Ernest Lawrence, inventor of the cyclotron.",
    SUPERHEAVY, true),
  e(104, "Rf", "Rutherfordium", 267, "transition", 4, 7, [2, 8, 18, 32, 32, 10, 2], "unknown", "1969", 0,
    "Named after Ernest Rutherford, who discovered the atom's nucleus.", SUPERHEAVY, true),
  e(105, "Db", "Dubnium", 268, "transition", 5, 7, [2, 8, 18, 32, 32, 11, 2], "unknown", "1970", 0,
    "Named after Dubna, a Russian science city.", SUPERHEAVY, true),
  e(106, "Sg", "Seaborgium", 269, "transition", 6, 7, [2, 8, 18, 32, 32, 12, 2], "unknown", "1974", 0,
    "Named after Glenn Seaborg while he was still alive.", SUPERHEAVY, true),
  e(107, "Bh", "Bohrium", 270, "transition", 7, 7, [2, 8, 18, 32, 32, 13, 2], "unknown", "1981", 0,
    "Named after Niels Bohr, who imagined electrons in shells.", SUPERHEAVY, true),
  e(108, "Hs", "Hassium", 269, "transition", 8, 7, [2, 8, 18, 32, 32, 14, 2], "unknown", "1984", 0,
    "Named after the German state of Hesse.", SUPERHEAVY, true),
  e(109, "Mt", "Meitnerium", 278, "unknown", 9, 7, [2, 8, 18, 32, 32, 15, 2], "unknown", "1982", 0,
    "Named after Lise Meitner, who helped discover nuclear fission.", SUPERHEAVY, true),
  e(110, "Ds", "Darmstadtium", 281, "unknown", 10, 7, [2, 8, 18, 32, 32, 16, 2], "unknown", "1994", 0,
    "Named after the German city of Darmstadt.", SUPERHEAVY, true),
  e(111, "Rg", "Roentgenium", 282, "unknown", 11, 7, [2, 8, 18, 32, 32, 17, 2], "unknown", "1994", 0,
    "Named after Wilhelm Röntgen, who discovered X-rays.", SUPERHEAVY, true),
  e(112, "Cn", "Copernicium", 285, "unknown", 12, 7, [2, 8, 18, 32, 32, 18, 2], "unknown", "1996", 0,
    "Named after Copernicus, who said Earth goes around the Sun.", SUPERHEAVY, true),
  e(113, "Nh", "Nihonium", 286, "unknown", 13, 7, [2, 8, 18, 32, 32, 18, 3], "unknown", "2004", 0,
    "The first element discovered in Asia. 'Nihon' means Japan.", SUPERHEAVY, true),
  e(114, "Fl", "Flerovium", 289, "unknown", 14, 7, [2, 8, 18, 32, 32, 18, 4], "unknown", "1998", 0,
    "Named after the Flerov Laboratory in Russia.", SUPERHEAVY, true),
  e(115, "Mc", "Moscovium", 290, "unknown", 15, 7, [2, 8, 18, 32, 32, 18, 5], "unknown", "2003", 0,
    "Named after the Moscow region.", SUPERHEAVY, true),
  e(116, "Lv", "Livermorium", 293, "unknown", 16, 7, [2, 8, 18, 32, 32, 18, 6], "unknown", "2000", 0,
    "Named after Lawrence Livermore National Laboratory in California.", SUPERHEAVY, true),
  e(117, "Ts", "Tennessine", 294, "unknown", 17, 7, [2, 8, 18, 32, 32, 18, 7], "unknown", "2010", 0,
    "Named after the state of Tennessee.", SUPERHEAVY, true),
  e(118, "Og", "Oganesson", 294, "unknown", 18, 7, [2, 8, 18, 32, 32, 18, 8], "unknown", "2002", 0,
    "The heaviest element known, named after physicist Yuri Oganessian.", SUPERHEAVY, true),
];

export function getElement(z: number): ChemElement | undefined {
  return ELEMENTS[z - 1];
}

/** Grid position (column 1–18, row 1–10). Lanthanides go on row 9 and actinides on row 10. */
export function tilePosition(el: ChemElement): { col: number; row: number } {
  if (el.group !== null) return { col: el.group, row: el.period };
  const first = el.category === "lanthanide" ? 57 : 89;
  return { col: 3 + (el.z - first), row: el.period === 6 ? 9 : 10 };
}

export function neutrons(el: ChemElement): number {
  return el.isotope - el.z;
}

export function findElements(query: string): ChemElement[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const n = Number(q);
  if (Number.isInteger(n) && n >= 1 && n <= 118) return [ELEMENTS[n - 1]];
  return ELEMENTS.filter(
    (el) => el.symbol.toLowerCase() === q || el.name.toLowerCase().startsWith(q),
  ).sort((a, b) => Number(b.symbol.toLowerCase() === q) - Number(a.symbol.toLowerCase() === q));
}
