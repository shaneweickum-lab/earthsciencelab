/**
 * Every source the soil curriculum cites. Lessons refer to these by id.
 * Prefer primary, authoritative sources: USDA NRCS, the Soil Science Society of America,
 * FAO, the Smithsonian, peer-reviewed textbooks, and the NGSS.
 */

export type SourceType = "government" | "scientific-society" | "international" | "museum" | "textbook" | "standards" | "classic";

export interface Source {
  id: string;
  title: string;
  org: string;
  year: string;
  url?: string;
  type: SourceType;
  /** What the curriculum uses this source for. */
  usedFor: string;
}

const list = [
  {
    id: "nrcs-ssm", title: "Soil Survey Manual (Agriculture Handbook No. 18)", org: "USDA Natural Resources Conservation Service, Soil Science Division Staff",
    year: "2017", url: "https://www.nrcs.usda.gov/resources/guides-and-instructions/soil-survey-manual", type: "government",
    usedFor: "Soil texture classes, horizons, structure, consistence, and Munsell soil color.",
  },
  {
    id: "nrcs-kst", title: "Keys to Soil Taxonomy, 13th edition", org: "USDA Natural Resources Conservation Service, Soil Survey Staff",
    year: "2022", url: "https://www.nrcs.usda.gov/resources/guides-and-instructions/keys-to-soil-taxonomy", type: "government",
    usedFor: "The 12 soil orders and how soils are classified in the United States.",
  },
  {
    id: "nrcs-12orders", title: "The Twelve Orders of Soil Taxonomy", org: "USDA Natural Resources Conservation Service",
    year: "n.d.", url: "https://www.nrcs.usda.gov/resources/education-and-teaching-materials/the-twelve-orders-of-soil-taxonomy", type: "government",
    usedFor: "Plain-language descriptions and name meanings of each soil order.",
  },
  {
    id: "nrcs-soil-health", title: "Soil Health", org: "USDA Natural Resources Conservation Service",
    year: "current", url: "https://www.nrcs.usda.gov/conservation-basics/natural-resource-concerns/soil/soil-health", type: "government",
    usedFor: "The definition of soil health and the four NRCS soil health principles (maximize soil cover, minimize disturbance, maximize biodiversity, maximize living roots).",
  },
  {
    id: "nrcs-test-kit", title: "Soil Quality Test Kit Guide", org: "USDA Agricultural Research Service and Natural Resources Conservation Service",
    year: "1999", url: "https://www.nrcs.usda.gov/resources/guides-and-instructions/soil-quality-test-kit", type: "government",
    usedFor: "Field tests such as infiltration, slake (aggregate stability), and earthworm counts.",
  },
  {
    id: "nrcs-texture-feel", title: "Guide to Texture by Feel (after Thien, 1979)", org: "USDA Natural Resources Conservation Service",
    year: "1979/2023", url: "https://www.nrcs.usda.gov/resources/education-and-teaching-materials/guide-to-texture-by-feel", type: "government",
    usedFor: "The ball-and-ribbon method for estimating soil texture by hand.",
  },
  {
    id: "nrcs-state-soils", title: "State Soils", org: "USDA Natural Resources Conservation Service",
    year: "current", url: "https://www.nrcs.usda.gov/resources/education-and-teaching-materials/state-soils", type: "government",
    usedFor: "Official state soils such as Houston Black (Texas) and Tama (Iowa).",
  },
  {
    id: "nrcs-soil-is-alive", title: "Soil Is Alive! (J. Stika)", org: "USDA Natural Resources Conservation Service",
    year: "n.d.", url: "https://www.nrcs.usda.gov/sites/default/files/2022-10/Soil%20is%20Alive_0.pdf", type: "government",
    usedFor: "How soil organisms build structure and cycle nutrients.",
  },
  {
    id: "usda-healthy-soils", title: "Healthy Soils Are Full of Life (fact sheet)", org: "U.S. Department of Agriculture",
    year: "n.d.", url: "https://www.ctahr.hawaii.edu/uhmg/AdvTraining/HealthySoils-fulloflife.pdf", type: "government",
    usedFor: "\"There are more soil microorganisms in a teaspoonful of soil than there are people on the earth.\"",
  },
  {
    id: "soil-biology-primer", title: "Soil Biology Primer (E. Ingham, A. Moldenke, C. Edwards; revised ed.)", org: "Soil and Water Conservation Society with USDA NRCS",
    year: "2000/2021", url: "https://swcs.org/resources/publications/soil-biology-primer", type: "scientific-society",
    usedFor: "The soil food web: bacteria, fungi, protozoa, nematodes, arthropods, and earthworms.",
  },
  {
    id: "s4t", title: "Soils 4 Teachers: lessons, activities, and soil science basics", org: "Soil Science Society of America, K-12 Committee",
    year: "current", url: "https://www.soils4teachers.org", type: "scientific-society",
    usedFor: "Peer-reviewed K-12 soil activities aligned to the NGSS.",
  },
  {
    id: "sssa-kskl", title: "Know Soil, Know Life (D. Lindbo, D. Kozlowski, C. Robinson, eds.)", org: "Soil Science Society of America",
    year: "2012", url: "https://www.soils4teachers.org/know-soil-know-life", type: "scientific-society",
    usedFor: "High-school level soil chemistry, biology, classification, and soil and society.",
  },
  {
    id: "smithsonian-dig-it", title: "Dig It! The Secrets of Soil", org: "Smithsonian National Museum of Natural History",
    year: "2008", url: "https://forces.si.edu/soils/", type: "museum",
    usedFor: "Kid-friendly explanations of soil formation, soil life, and state soils.",
  },
  {
    id: "fao-swsr", title: "Status of the World's Soil Resources: Main Report", org: "FAO and the Intergovernmental Technical Panel on Soils",
    year: "2015", url: "https://openknowledge.fao.org/server/api/core/bitstreams/c0991a62-d870-4c95-8f33-3ed0516abff6/content", type: "international",
    usedFor: "The ten major threats to soil, and that about a third of the world's soils are moderately to highly degraded.",
  },
  {
    id: "fao-biodiversity", title: "State of Knowledge of Soil Biodiversity: Status, Challenges and Potentialities", org: "FAO, ITPS, GSBI, CBD and European Commission",
    year: "2020", url: "https://openknowledge.fao.org/handle/20.500.14283/cb1928en", type: "international",
    usedFor: "How many kinds of life live in soil and the threats they face.",
  },
  {
    id: "fao-soc", title: "Soil Organic Carbon: the Hidden Potential", org: "Food and Agriculture Organization of the United Nations",
    year: "2017", url: "https://www.isric.org/sites/default/files/Carbon_the_hidden_Potential_FAO-GSP_i6937en.pdf", type: "international",
    usedFor: "Soil organic carbon and its role in fertility and climate.",
  },
  {
    id: "fao-soils-climate", title: "Soils Help to Combat and Adapt to Climate Change (International Year of Soils fact sheet)", org: "Food and Agriculture Organization of the United Nations",
    year: "2015", url: "https://www.fao.org/soils-portal", type: "international",
    usedFor: "Healthy soils as the largest store of carbon on land.",
  },
  {
    id: "jenny-1941", title: "Factors of Soil Formation: A System of Quantitative Pedology (H. Jenny)", org: "McGraw-Hill (reprinted by Dover)",
    year: "1941", type: "classic",
    usedFor: "The five soil-forming factors: climate, organisms, relief (topography), parent material, and time.",
  },
  {
    id: "weil-brady", title: "The Nature and Properties of Soils, 15th edition (R. Weil and N. Brady)", org: "Pearson",
    year: "2017", type: "textbook",
    usedFor: "High-school depth on cation exchange, pH, the nitrogen and carbon cycles, and soil classification.",
  },
  {
    id: "scs-history", title: "Hugh Hammond Bennett and the Creation of the Soil Conservation Service", org: "USDA Natural Resources Conservation Service (history)",
    year: "current", url: "https://www.nrcs.usda.gov/about/history", type: "government",
    usedFor: "The Dust Bowl and the founding of the Soil Conservation Service in 1935 (now the NRCS).",
  },
  {
    id: "noaa-permafrost", title: "Arctic Report Card: Terrestrial Permafrost Carbon Cycle (E. Schuur et al.)", org: "National Oceanic and Atmospheric Administration",
    year: "2016", url: "https://arctic.noaa.gov/2016/10/17/terrestrial-carbon-cycle", type: "government",
    usedFor: "Northern permafrost soils store more carbon than the atmosphere, and thawing could release some of it.",
  },
  {
    id: "nrcs-wss", title: "Web Soil Survey", org: "USDA Natural Resources Conservation Service",
    year: "2005–present", url: "https://websoilsurvey.nrcs.usda.gov", type: "government",
    usedFor: "Free online soil maps and data for the United States.",
  },
  {
    id: "nrcs-ph-guide", title: "Soil pH: Soil Health Guide for Educators", org: "USDA Natural Resources Conservation Service",
    year: "n.d.", url: "https://www.nrcs.usda.gov/sites/default/files/2022-11/pH%20-%20Soil%20Health%20Guide_0.pdf", type: "government",
    usedFor: "The pH range most crops prefer and nutrient problems in acidic and alkaline soils.",
  },
  {
    id: "nrcs-bulk-density", title: "Soil Quality Indicators: Bulk Density", org: "USDA Natural Resources Conservation Service",
    year: "n.d.", url: "https://www.nrcs.usda.gov/sites/default/files/2023-01/Soil%20Quality-Indicators-Bulk%20Density.pdf", type: "government",
    usedFor: "Bulk density, porosity, and root-restricting compaction levels.",
  },
  {
    id: "nrcs-cn-ratio", title: "Carbon to Nitrogen Ratios in Cropping Systems", org: "USDA Natural Resources Conservation Service",
    year: "2011", url: "https://sarep.ucdavis.edu/sites/g/files/dgvnsk9171/files/media/documents/NRCS-C_N_ratios_cropping_systems.pdf", type: "government",
    usedFor: "Microbes near 8:1 C:N need food near 24:1, and residue C:N values such as wheat straw near 80:1.",
  },
  {
    id: "mdh-nitrate", title: "Nitrate in Well Water (fact sheet)", org: "Minnesota Department of Health",
    year: "current", url: "https://www.health.mn.gov/communities/environment/water/docs/contaminants/nitratefctsht.pdf", type: "government",
    usedFor: "The U.S. EPA drinking water limit of 10 mg/L nitrate-nitrogen and why it protects infants.",
  },
  {
    id: "ngss", title: "Next Generation Science Standards", org: "NGSS Lead States (Achieve)",
    year: "2013", url: "https://www.nextgenscience.org", type: "standards",
    usedFor: "Grade-band standards each lesson supports.",
  },
] as const satisfies readonly Source[];

export type SourceId = (typeof list)[number]["id"];

export const SOURCES: Record<SourceId, Source> = Object.fromEntries(list.map((s) => [s.id, s])) as Record<SourceId, Source>;
export const SOURCE_IDS = list.map((s) => s.id) as SourceId[];
