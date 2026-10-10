import type { TextureClass } from "@/lib/soil/textureTriangle";
import type { SoilOrderId } from "./soilOrders";

/**
 * Curated teaching regions. Each one shows a dominant or well-known soil for that area.
 * Real landscapes contain many soils, so these are simplified on purpose.
 * Sand/silt/clay values are typical surface-soil examples, not measurements.
 */
export interface SoilRegion {
  id: string;
  name: string;
  place: string;
  lat: number;
  lon: number;
  order: SoilOrderId;
  /** null for organic (peat/muck) soils, which aren't classed by mineral texture. */
  texture: TextureClass | null;
  sand?: number;
  silt?: number;
  clay?: number;
  traits: string;
  grows: string;
  fact: string;
}

export const SOIL_REGIONS: SoilRegion[] = [
  // North America
  {
    id: "corn-belt", name: "Corn Belt", place: "Iowa, USA", lat: 42, lon: -93.5,
    order: "mollisol", texture: "silt loam", sand: 15, silt: 65, clay: 20,
    traits: "Deep black topsoil formed from wind-blown dust (loess) under tallgrass prairie.",
    grows: "Corn, soybeans, oats", fact: "Prairie grass roots can reach 15 feet deep. They built this soil over 10,000 years.",
  },
  {
    id: "palouse", name: "The Palouse", place: "Washington, USA", lat: 46.8, lon: -117.2,
    order: "mollisol", texture: "silt loam", sand: 10, silt: 70, clay: 20,
    traits: "Rolling hills of loess silt piled up by ancient winds.",
    grows: "Wheat, lentils, chickpeas", fact: "Its steep hills made it one of the most eroded farm regions in the U.S. No-till farming is helping it recover.",
  },
  {
    id: "texas-blackland", name: "Blackland Prairie", place: "Texas, USA", lat: 31.5, lon: -97,
    order: "vertisol", texture: "clay", sand: 10, silt: 30, clay: 60,
    traits: "Dark, sticky clay that cracks wide open in summer.",
    grows: "Cotton, sorghum, wheat", fact: "Houston Black clay is the official state soil of Texas.",
  },
  {
    id: "georgia-piedmont", name: "Piedmont", place: "Georgia, USA", lat: 33.5, lon: -83.5,
    order: "ultisol", texture: "sandy loam", sand: 65, silt: 23, clay: 12,
    traits: "Sandy topsoil over bright red clay, colored by iron.",
    grows: "Peanuts, cotton, pine forests", fact: "Generations of cotton farming washed much of the topsoil away, exposing the red clay.",
  },
  {
    id: "florida", name: "Florida Flatwoods", place: "Florida, USA", lat: 28, lon: -81.5,
    order: "spodosol", texture: "sand", sand: 94, silt: 4, clay: 2,
    traits: "Nearly pure sand with a dark layer underneath where organic matter collects.",
    grows: "Citrus, pine, vegetables", fact: "Myakka fine sand is Florida's state soil. It's found almost nowhere else.",
  },
  {
    id: "everglades", name: "Everglades", place: "Florida, USA", lat: 26.3, lon: -80.7,
    order: "histosol", texture: null,
    traits: "Black muck made of sawgrass that rotted underwater for thousands of years.",
    grows: "Sawgrass, sugarcane", fact: "Once drained, this soil oxidizes and sinks. Some areas have lost over 5 feet of soil.",
  },
  {
    id: "sonoran", name: "Sonoran Desert", place: "Arizona, USA", lat: 33, lon: -112,
    order: "aridisol", texture: "sandy loam", sand: 70, silt: 20, clay: 10,
    traits: "Low in organic matter, with a hard lime layer called caliche below.",
    grows: "Saguaro cactus, creosote bush, irrigated cotton", fact: "A living crust of cyanobacteria, lichens, and moss covers undisturbed desert soil and keeps it from blowing away.",
  },
  {
    id: "central-valley", name: "Central Valley", place: "California, USA", lat: 36.7, lon: -119.8,
    order: "alfisol", texture: "loam", sand: 42, silt: 38, clay: 20,
    traits: "Old valley soils, some with a hard layer called hardpan.",
    grows: "Almonds, grapes, tomatoes", fact: "This one valley grows about a quarter of the food eaten in the U.S.",
  },
  {
    id: "rockies", name: "Rocky Mountains", place: "Colorado, USA", lat: 39.5, lon: -106,
    order: "inceptisol", texture: "sandy loam", sand: 60, silt: 28, clay: 12,
    traits: "Thin, rocky, young soils on steep mountain slopes.",
    grows: "Lodgepole pine, aspen, alpine wildflowers", fact: "Cold temperatures and steep slopes mean soil forms very slowly up here.",
  },
  {
    id: "alaska", name: "North Slope", place: "Alaska, USA", lat: 69, lon: -150,
    order: "gelisol", texture: "silt loam", sand: 20, silt: 60, clay: 20,
    traits: "A thin layer thaws each summer above permanently frozen ground.",
    grows: "Mosses, sedges, dwarf willows", fact: "As permafrost thaws, it releases carbon that was frozen for thousands of years.",
  },
  {
    id: "hawaii", name: "Big Island", place: "Hawaii, USA", lat: 19.6, lon: -155.5,
    order: "andisol", texture: "silt loam", sand: 25, silt: 55, clay: 20,
    traits: "Young volcanic soils next to fresh, bare lava.",
    grows: "Coffee, macadamia nuts, rainforest", fact: "Hawaii has 10 of the 12 soil orders in a small area.",
  },
  {
    id: "saskatchewan", name: "Canadian Prairies", place: "Saskatchewan, Canada", lat: 52, lon: -106,
    order: "mollisol", texture: "loam", sand: 40, silt: 37, clay: 23,
    traits: "Dark grassland soils, called Chernozems in Canada.",
    grows: "Wheat, canola, lentils", fact: "Canada grows more lentils than any other country, many of them here.",
  },
  {
    id: "canadian-shield", name: "Boreal Forest", place: "Ontario, Canada", lat: 50, lon: -85,
    order: "spodosol", texture: "sandy loam", sand: 68, silt: 25, clay: 7,
    traits: "Acidic soils under spruce and pine, with a gray ash-like layer.",
    grows: "Black spruce, jack pine, blueberries", fact: "Glaciers scraped this land bare about 10,000 years ago, so the soil is young and thin.",
  },
  // South America
  {
    id: "amazon", name: "Amazon Basin", place: "Brazil", lat: -3, lon: -60,
    order: "oxisol", texture: "clay", sand: 20, silt: 15, clay: 65,
    traits: "Deep, red, nutrient-poor soil. Most nutrients live in the plants, not the ground.",
    grows: "Rainforest, Brazil nuts, cassava", fact: "Ancient people made dark, rich 'terra preta' here by adding charcoal, which is basically biochar.",
  },
  {
    id: "cerrado", name: "Cerrado", place: "Brazil", lat: -15, lon: -47.5,
    order: "oxisol", texture: "clay loam", sand: 35, silt: 30, clay: 35,
    traits: "Old acidic soils of the tropical savanna that need lime to farm.",
    grows: "Soybeans, corn, savanna trees", fact: "Cerrado trees have such deep roots that it's called an 'upside-down forest'.",
  },
  {
    id: "pampas", name: "The Pampas", place: "Argentina", lat: -35, lon: -61,
    order: "mollisol", texture: "silt loam", sand: 20, silt: 58, clay: 22,
    traits: "Flat grasslands with thick, dark, fertile loess soils.",
    grows: "Soybeans, wheat, cattle pasture", fact: "Argentina is a world leader in no-till farming. Most of its cropland is no-till.",
  },
  {
    id: "andes-coffee", name: "Coffee Region", place: "Colombia", lat: 4.8, lon: -75.6,
    order: "andisol", texture: "loam", sand: 40, silt: 40, clay: 20,
    traits: "Fluffy volcanic ash soils on steep, wet mountain slopes.",
    grows: "Coffee, plantains, avocados", fact: "Volcanic ash soils can hold more than their own weight in water.",
  },
  {
    id: "atacama", name: "Atacama Desert", place: "Chile", lat: -24, lon: -69.5,
    order: "aridisol", texture: "loamy sand", sand: 82, silt: 13, clay: 5,
    traits: "Salty, gravelly soil in the driest non-polar desert on Earth.",
    grows: "Almost nothing", fact: "NASA tests Mars rovers here because the soil is so much like Martian soil.",
  },
  {
    id: "patagonia", name: "Patagonia", place: "Argentina", lat: -45, lon: -69,
    order: "aridisol", texture: "sandy loam", sand: 66, silt: 22, clay: 12,
    traits: "Cold, windy, dry steppe with thin soils.",
    grows: "Tough grasses, sheep pasture", fact: "Overgrazing by sheep has turned some Patagonian grassland into desert.",
  },
  // Europe
  {
    id: "ukraine", name: "Black Earth Steppe", place: "Ukraine", lat: 49, lon: 32,
    order: "mollisol", texture: "silty clay loam", sand: 12, silt: 55, clay: 33,
    traits: "Chernozem ('black earth'). Topsoil can be over 3 feet thick.",
    grows: "Wheat, sunflowers, corn", fact: "Chernozem is so famous that a sample is kept in Paris as a world reference soil.",
  },
  {
    id: "paris-basin", name: "Paris Basin", place: "France", lat: 49, lon: 2.5,
    order: "alfisol", texture: "silt loam", sand: 12, silt: 68, clay: 20,
    traits: "Deep loess soils with clay collected in a lower layer.",
    grows: "Wheat, sugar beets, barley", fact: "These soils have been farmed for over 7,000 years.",
  },
  {
    id: "ireland-bog", name: "Bog of Allen", place: "Ireland", lat: 53.3, lon: -7.0,
    order: "histosol", texture: null,
    traits: "Thick peat built from sphagnum moss in a cool, wet climate.",
    grows: "Sphagnum moss, heather", fact: "Bogs preserve things for thousands of years, including ancient butter and even people.",
  },
  {
    id: "finland", name: "Boreal Finland", place: "Finland", lat: 63, lon: 26,
    order: "spodosol", texture: "sandy loam", sand: 62, silt: 30, clay: 8,
    traits: "Podzols on glacial sand and gravel under conifer forest.",
    grows: "Scots pine, spruce, lingonberries", fact: "The bleached gray layer of a podzol looks like someone sprinkled ash into the soil.",
  },
  {
    id: "spain", name: "Central Plateau", place: "Spain", lat: 39.5, lon: -3.5,
    order: "alfisol", texture: "clay loam", sand: 30, silt: 35, clay: 35,
    traits: "Red Mediterranean soils with clay that has moved downward. Hot, dry summers.",
    grows: "Olives, grapes, wheat", fact: "The red color comes from iron that rusted during long, dry summers.",
  },
  {
    id: "iceland", name: "Iceland", place: "Iceland", lat: 64.5, lon: -19,
    order: "andisol", texture: "sandy loam", sand: 60, silt: 30, clay: 10,
    traits: "Volcanic soils that blow away easily once plants are removed.",
    grows: "Grasses, birch, mosses", fact: "Iceland lost much of its soil after early settlers cut its forests. It has one of the oldest soil-conservation services in the world.",
  },
  // Africa
  {
    id: "sahara", name: "Sahara Desert", place: "Algeria", lat: 25, lon: 5,
    order: "entisol", texture: "sand", sand: 95, silt: 3, clay: 2,
    traits: "Shifting sand dunes with almost no organic matter or layers.",
    grows: "Very little: date palms at oases", fact: "Dust from the Sahara blows across the ocean and fertilizes the Amazon rainforest.",
  },
  {
    id: "sahel", name: "The Sahel", place: "Niger", lat: 14, lon: 2,
    order: "entisol", texture: "loamy sand", sand: 85, silt: 10, clay: 5,
    traits: "Sandy soils at the dry edge of the Sahara.",
    grows: "Millet, sorghum, acacia trees", fact: "Farmers here regrew millions of trees by protecting stumps in their fields, which brought soil back to life.",
  },
  {
    id: "ghana", name: "Guinea Savanna", place: "Ghana", lat: 8.5, lon: -1,
    order: "alfisol", texture: "sandy loam", sand: 70, silt: 20, clay: 10,
    traits: "Sandy topsoil over reddish clay, under grassland with scattered trees.",
    grows: "Yams, maize, shea trees", fact: "Shea butter comes from shea trees that grow wild in these soils.",
  },
  {
    id: "congo", name: "Congo Basin", place: "DR Congo", lat: 0, lon: 22,
    order: "oxisol", texture: "clay", sand: 25, silt: 15, clay: 60,
    traits: "Deeply weathered red and yellow rainforest soils.",
    grows: "Rainforest, cassava, plantains", fact: "The Congo's peat swamps hold about as much carbon as the world emits in 3 years.",
  },
  {
    id: "ethiopia", name: "Ethiopian Highlands", place: "Ethiopia", lat: 9, lon: 38.7,
    order: "vertisol", texture: "clay", sand: 15, silt: 25, clay: 60,
    traits: "Black cracking clays on high volcanic plateaus.",
    grows: "Teff, wheat, chickpeas", fact: "Teff, the tiny grain used for injera bread, is one of the few crops that grows well in these waterlogged clays.",
  },
  {
    id: "nile", name: "Nile Delta", place: "Egypt", lat: 30.8, lon: 31,
    order: "entisol", texture: "silty clay", sand: 8, silt: 45, clay: 47,
    traits: "Fresh river sediment laid down by thousands of years of floods.",
    grows: "Cotton, rice, wheat", fact: "Ancient Egyptians called their land 'Kemet', the Black Land, for this dark river soil.",
  },
  {
    id: "kalahari", name: "Kalahari", place: "Botswana", lat: -23, lon: 22,
    order: "entisol", texture: "sand", sand: 93, silt: 4, clay: 3,
    traits: "Deep red sands that cover a huge part of southern Africa.",
    grows: "Grasses, acacia, wild melons", fact: "The Kalahari sand sheet is one of the largest continuous stretches of sand on Earth.",
  },
  {
    id: "madagascar", name: "Central Highlands", place: "Madagascar", lat: -19, lon: 47,
    order: "oxisol", texture: "clay", sand: 25, silt: 20, clay: 55,
    traits: "Bright red, ancient weathered soils.",
    grows: "Rice terraces, eucalyptus", fact: "Madagascar is called the 'Red Island' because eroding red soil turns its rivers rust-colored.",
  },
  // Asia
  {
    id: "siberia", name: "Siberian Tundra", place: "Russia", lat: 70, lon: 100,
    order: "gelisol", texture: "loam", sand: 40, silt: 40, clay: 20,
    traits: "Permafrost soils that churn as they freeze and thaw.",
    grows: "Mosses, lichens, sedges", fact: "Woolly mammoth remains have been found preserved in Siberian permafrost.",
  },
  {
    id: "gobi", name: "Gobi Desert", place: "Mongolia", lat: 43, lon: 105,
    order: "aridisol", texture: "loamy sand", sand: 80, silt: 15, clay: 5,
    traits: "Cold desert soils covered in gravel 'pavement'.",
    grows: "Saxaul shrubs, hardy grasses", fact: "Dust storms from the Gobi can reach Korea, Japan, and even North America.",
  },
  {
    id: "mongolia-steppe", name: "Mongolian Steppe", place: "Mongolia", lat: 47.5, lon: 106,
    order: "mollisol", texture: "sandy loam", sand: 60, silt: 28, clay: 12,
    traits: "Grassland soils with a dark topsoil, drier than the prairies.",
    grows: "Steppe grasses, herds of goats and horses", fact: "Herders move their animals between pastures, an ancient form of rotational grazing.",
  },
  {
    id: "loess-plateau", name: "Loess Plateau", place: "China", lat: 36.5, lon: 108,
    order: "inceptisol", texture: "silt loam", sand: 20, silt: 64, clay: 16,
    traits: "Loess silt over 300 feet deep, very easy to erode.",
    grows: "Millet, apples, restored forests", fact: "A huge restoration project here terraced hillsides and replanted plants, bringing a near-desert back to green.",
  },
  {
    id: "northeast-china", name: "Northeast Plain", place: "China", lat: 46, lon: 127,
    order: "mollisol", texture: "clay loam", sand: 30, silt: 38, clay: 32,
    traits: "One of the world's few big black soil regions.",
    grows: "Corn, soybeans, rice", fact: "The black soil here has thinned by about half since farming began. China now protects it by law.",
  },
  {
    id: "indo-gangetic", name: "Indo-Gangetic Plain", place: "India", lat: 27, lon: 80,
    order: "inceptisol", texture: "silt loam", sand: 25, silt: 60, clay: 15,
    traits: "Young soils from Himalayan river sediment.",
    grows: "Rice, wheat, sugarcane", fact: "Hundreds of millions of people are fed from this one river plain.",
  },
  {
    id: "deccan", name: "Deccan Plateau", place: "India", lat: 19, lon: 76,
    order: "vertisol", texture: "clay", sand: 15, silt: 30, clay: 55,
    traits: "'Black cotton soil' formed from ancient lava rock.",
    grows: "Cotton, sorghum, pigeon peas", fact: "In the dry season, cracks in this soil can open over 3 feet deep.",
  },
  {
    id: "mekong", name: "Mekong Delta", place: "Vietnam", lat: 10, lon: 105.8,
    order: "inceptisol", texture: "silty clay", sand: 5, silt: 45, clay: 50,
    traits: "Flooded river clays perfect for rice paddies.",
    grows: "Rice, fruit, shrimp ponds", fact: "Rice paddies here have been farmed in standing water for centuries without wearing out.",
  },
  {
    id: "borneo", name: "Borneo Rainforest", place: "Malaysia", lat: 1, lon: 114,
    order: "ultisol", texture: "sandy clay loam", sand: 55, silt: 15, clay: 30,
    traits: "Weathered, acidic rainforest soils.",
    grows: "Dipterocarp trees, oil palm", fact: "Clearing rainforest for plantations exposes these soils to heavy tropical rain and fast erosion.",
  },
  {
    id: "java", name: "Java", place: "Indonesia", lat: -7.5, lon: 110,
    order: "andisol", texture: "loam", sand: 38, silt: 40, clay: 22,
    traits: "Rich volcanic soils refreshed by ash from active volcanoes.",
    grows: "Rice, tea, coffee", fact: "Java's volcanic soils feed more than 150 million people on one island.",
  },
  {
    id: "kanto", name: "Kanto Plain", place: "Japan", lat: 36, lon: 139.5,
    order: "andisol", texture: "loam", sand: 35, silt: 42, clay: 23,
    traits: "'Kanto loam', thick layers of ash from Mount Fuji.",
    grows: "Vegetables, rice, tea", fact: "The word 'Andisol' comes from Japanese, because these volcanic soils are so common in Japan.",
  },
  {
    id: "arabia", name: "Empty Quarter", place: "Saudi Arabia", lat: 20, lon: 50,
    order: "entisol", texture: "sand", sand: 96, silt: 2, clay: 2,
    traits: "The largest continuous sand desert in the world.",
    grows: "Almost nothing", fact: "Some dunes here are over 800 feet tall.",
  },
  // Oceania
  {
    id: "outback", name: "Australian Outback", place: "Australia", lat: -25, lon: 133,
    order: "aridisol", texture: "loamy sand", sand: 84, silt: 9, clay: 7,
    traits: "Red, iron-rich sandy soils that are very old and low in nutrients.",
    grows: "Spinifex grass, mulga, saltbush", fact: "Australian soils are among the oldest on Earth because the land has been stable for so long.",
  },
  {
    id: "murray-darling", name: "Murray-Darling Basin", place: "Australia", lat: -32, lon: 146,
    order: "vertisol", texture: "clay", sand: 20, silt: 20, clay: 60,
    traits: "Gray cracking clays on wide river plains.",
    grows: "Cotton, wheat, rice", fact: "Irrigation here has raised salty groundwater in places, making soils too salty to farm.",
  },
  {
    id: "wa-wheatbelt", name: "Wheatbelt", place: "Western Australia", lat: -31.5, lon: 117.5,
    order: "alfisol", texture: "sandy loam", sand: 72, silt: 15, clay: 13,
    traits: "Sandy topsoil over clay, ancient and low in nutrients.",
    grows: "Wheat, barley, canola", fact: "Clearing native plants let the water table rise and bring up salt. Farmers now plant trees to pull it back down.",
  },
  {
    id: "waikato", name: "Waikato", place: "New Zealand", lat: -37.8, lon: 175.3,
    order: "andisol", texture: "silt loam", sand: 25, silt: 58, clay: 17,
    traits: "Soft volcanic ash soils, great for pasture.",
    grows: "Dairy pasture, kiwifruit", fact: "These soils formed from ash of the huge Taupō eruptions.",
  },
  // Antarctica
  {
    id: "dry-valleys", name: "McMurdo Dry Valleys", place: "Antarctica", lat: -77.5, lon: 162,
    order: "gelisol", texture: "sand", sand: 92, silt: 5, clay: 3,
    traits: "Frozen, salty, and almost lifeless gravelly sands.",
    grows: "Only tiny worms called nematodes and microbes", fact: "Some of the toughest animals on Earth, microscopic nematodes, live in these freezing soils.",
  },
];
