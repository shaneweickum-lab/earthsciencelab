# Content sources and accuracy notes

The educational content is written for ages 11–14 and simplified on purpose. It is based on these references:

- **Texture classes:** USDA NRCS *Soil Survey Manual* (Handbook 18), texture triangle rules. `src/lib/soil/textureTriangle.ts` implements the standard class boundaries, and tests check known points.
- **Soil orders:** USDA *Keys to Soil Taxonomy*, which defines 12 orders. The name origins follow the NRCS "Twelve Orders of Soil Taxonomy" guide.
- **Horizons (O, A, E, B, C, R):** USDA NRCS master horizon definitions.
- **Regenerative principles:** the five NRCS / Soil Health Institute soil health principles (minimize disturbance, keep soil covered, diversity, living roots, integrate livestock).

## Globe regions

Each of the 50 regions in `src/data/soilRegions.ts` shows one well-known or dominant soil for that area. Real landscapes are mosaics of many soils. The sand/silt/clay numbers are typical examples chosen to fall inside the stated texture class (a test enforces this), not field measurements.

## Facts worth a teacher's second look

These are widely cited but rounded or popularized. Verify them before using them in assessments:

- "A teaspoon of healthy soil holds more microbes than there are people on Earth." Commonly cited; actual counts vary widely by soil.
- "Each 1% of organic matter helps an acre hold ~20,000 more gallons of water." This NRCS figure is popular, but published estimates range widely.
- "Hawaii has 10 of the 12 soil orders." Sources say 10 or 11.
- "A chernozem sample is kept in Paris as a reference." This traces to Dokuchaev's 1900 exhibit and is often retold loosely.
- "The Congo peat swamps hold about 3 years of global emissions." Based on Dargie et al. (2017), about 30 billion tonnes of carbon compared with fossil-fuel emissions.
- "Raindrop splash can travel up to 2 feet." Distances vary with drop size and slope.
- "Central Valley grows about a quarter of U.S. food." This is a commonly cited USGS figure.

## Game model

*Regenerate the Field* is a teaching model, not an agronomic simulator. Its directions of effect are realistic: tillage reduces structure and organic matter, cover keeps soil from eroding, and synthetic nitrogen leaches and acidifies soil. Its magnitudes and timescales are compressed so that change shows up within 12 seasons. In reality, building organic matter by a full percentage point often takes many years.
