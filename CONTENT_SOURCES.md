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

## Periodic table

- **Atomic masses:** IUPAC standard atomic weights, rounded. For radioactive and synthetic elements, the mass shown in brackets is the mass number of the longest-lived isotope.
- **Electron shells:** ground-state configurations, including real exceptions such as Cr, Cu, Nb, Pd (which has an empty 5th shell), Pt, and Au.
- **Neutron counts:** use the most common natural isotope (for example copper-63 and lead-208), so they don't always equal the rounded mass minus the protons.
- **Crust abundance:** approximate CRC Handbook values in ppm by mass. The "Found in Earth's crust" 3D view uses a log scale.
- **The atom model:** a teaching picture. The shell (Bohr) view puts electrons on circles. The cloud view hints at the modern probability picture. Nuclei with more than 300 particles are drawn with 300 representative particles.
- **"Where it's found" notes:** simplified. Discovery years follow the usual textbook dates, and several elements (like Mg, Ba, Pt, and Bi) have disputed or multi-step discovery stories.

## Soil Builders

- **Soil composition** (`src/data/soilElements.ts`): rounded world-average dry-weight values after Bowen (1979, *Environmental Chemistry of the Elements*) and Vinogradov (1959). Real soils vary a lot. A peat soil is mostly carbon, and a beach sand is mostly silicon and oxygen.
- **Hydrogen:** given no single percentage, because most of it is in soil water, which changes from day to day.
- **Roles are simplified.** Many elements do several jobs. Iron, for example, is both a framework element and a micronutrient. Co is listed as a micronutrient because legume root-nodule bacteria need it, even though most plants don't. Pb, Cd, As, and Hg occur naturally in trace amounts. They're grouped as "harmful" because pollution can raise them to toxic levels.
