/** The 12 soil orders of USDA Soil Taxonomy, described for middle schoolers. */

export type SoilOrderId =
  | "alfisol" | "andisol" | "aridisol" | "entisol" | "gelisol" | "histosol"
  | "inceptisol" | "mollisol" | "oxisol" | "spodosol" | "ultisol" | "vertisol";

export interface SoilOrder {
  id: SoilOrderId;
  name: string;
  color: string;
  nickname: string;
  description: string;
  nameMeaning: string;
}

export const SOIL_ORDERS: Record<SoilOrderId, SoilOrder> = {
  alfisol: {
    id: "alfisol", name: "Alfisols", color: "#4f9d69", nickname: "Fertile forest soils",
    description: "Formed under forests, with clay that has washed down into a lower layer. Fairly fertile and used for a lot of farming.",
    nameMeaning: "From \"Al\" and \"Fe\", the chemical symbols for aluminum and iron.",
  },
  andisol: {
    id: "andisol", name: "Andisols", color: "#8f5bd6", nickname: "Volcanic soils",
    description: "Made from volcanic ash. Light, fluffy, and able to hold a lot of water. Often very fertile.",
    nameMeaning: "From the Japanese \"an do\", meaning dark soil.",
  },
  aridisol: {
    id: "aridisol", name: "Aridisols", color: "#e0a83a", nickname: "Desert soils",
    description: "Too dry for much leaching or plant growth. Low in organic matter and can build up salt or lime.",
    nameMeaning: "From the Latin \"aridus\", meaning dry.",
  },
  entisol: {
    id: "entisol", name: "Entisols", color: "#e6d7a3", nickname: "Brand-new soils",
    description: "Very young soils with almost no layers yet, like river sand, fresh floodplain mud, or dunes.",
    nameMeaning: "From \"recent\". These soils have barely started forming.",
  },
  gelisol: {
    id: "gelisol", name: "Gelisols", color: "#7fc8e8", nickname: "Frozen soils",
    description: "Have permafrost, ground that stays frozen all year. They store huge amounts of carbon.",
    nameMeaning: "From the Latin \"gelare\", to freeze.",
  },
  histosol: {
    id: "histosol", name: "Histosols", color: "#3b2a20", nickname: "Peat and muck",
    description: "Made mostly of partly rotted plants in soggy places like bogs and swamps. They're more organic matter than minerals.",
    nameMeaning: "From the Greek \"histos\", meaning tissue.",
  },
  inceptisol: {
    id: "inceptisol", name: "Inceptisols", color: "#a7c957", nickname: "Teenage soils",
    description: "Young soils that are just beginning to form layers. Common on mountain slopes and river valleys.",
    nameMeaning: "From the Latin \"inceptum\", meaning beginning.",
  },
  mollisol: {
    id: "mollisol", name: "Mollisols", color: "#2f5d3a", nickname: "Grassland soils",
    description: "Thick, dark, crumbly topsoil built by grass roots over thousands of years. Some of the best farmland on Earth.",
    nameMeaning: "From the Latin \"mollis\", meaning soft.",
  },
  oxisol: {
    id: "oxisol", name: "Oxisols", color: "#c0392b", nickname: "Ancient tropical soils",
    description: "Very old, deeply weathered red soils of the tropics. Rain has washed out most nutrients, leaving iron and aluminum.",
    nameMeaning: "From \"oxide\", for their iron and aluminum oxides.",
  },
  spodosol: {
    id: "spodosol", name: "Spodosols", color: "#9aa5b1", nickname: "Ashy forest soils",
    description: "Sandy, acidic soils under pine and spruce forests. They often have a pale gray layer that looks like ash.",
    nameMeaning: "From the Greek \"spodos\", meaning wood ash.",
  },
  ultisol: {
    id: "ultisol", name: "Ultisols", color: "#e07a5f", nickname: "Red clay soils",
    description: "Old, weathered, acidic soils with red or yellow clay below. Need lime and organic matter to farm well.",
    nameMeaning: "From the Latin \"ultimus\", meaning last, because they are heavily weathered.",
  },
  vertisol: {
    id: "vertisol", name: "Vertisols", color: "#5c5470", nickname: "Shrink-swell clays",
    description: "Full of clay that swells when wet and cracks open when dry. The cracks can be deep enough to lose a shoe in.",
    nameMeaning: "From the Latin \"verto\", to turn, because the soil churns itself.",
  },
};

export const SOIL_ORDER_IDS = Object.keys(SOIL_ORDERS) as SoilOrderId[];
