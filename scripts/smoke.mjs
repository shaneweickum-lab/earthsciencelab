// Smoke test: loads each page in Chromium, plays a few game turns, clicks the globe,
// and fails on console errors. Usage: npm run build && npm start, then node scripts/smoke.mjs
import { chromium } from "playwright-core";
import { existsSync, mkdirSync, readdirSync } from "fs";
import path from "path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.env.SHOT_DIR ?? "screenshots";
mkdirSync(OUT, { recursive: true });

function findChromium() {
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH ?? "/opt/pw-browsers";
  if (!existsSync(root)) return undefined;
  for (const dir of readdirSync(root).filter((d) => d.startsWith("chromium"))) {
    for (const rel of ["chrome-linux/chrome", "chrome-linux64/chrome"]) {
      const p = path.join(root, dir, rel);
      if (existsSync(p)) return p;
    }
  }
  return undefined;
}

const browser = await chromium.launch({ executablePath: findChromium(), args: ["--use-gl=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
const errors = [];
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
page.on("console", (m) => { if (m.type() === "error") errors.push(`${page.url()}: ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

await page.goto(BASE);
await shot("01-hub");

await page.goto(`${BASE}/soil`);
await shot("02-soil-home");

await page.goto(`${BASE}/soil/learn/soil-texture`);
await page.getByText("The Soil Texture Triangle").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: /Pottery clay/ }).click();
await shot("03-texture-triangle");
// Answer the quiz with the first option each time.
for (let i = 0; i < 6; i++) {
  await page.locator("section.card button.rounded-xl").first().click();
  await page.getByRole("button", { name: /Next|Finish/ }).click();
}
await page.getByText(/You got \d of 6/).waitFor();
await shot("04-quiz-done");

await page.goto(`${BASE}/soil/learn/soil-horizons`);
await page.locator("canvas").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await shot("05-soil-profile");

await page.goto(`${BASE}/soil/game`);
await page.getByText("Congratulations! You inherited an organic garden!").waitFor();
await shot("06a-garden-intro");
await page.getByRole("button", { name: /Let's get gardening/ }).click();
await page.waitForTimeout(1500);
await shot("06b-weedy-garden");
// Every action opens a preview first, then you confirm it.
async function act(name, confirm) {
  await page.getByRole("button", { name: new RegExp(name) }).first().click();
  await page.getByText(/Preview · Plot/).waitFor();
  await page.getByRole("button", { name: confirm }).click();
  await page.getByText(/Preview · Plot/).waitFor({ state: "detached" });
}
await act("Pull Weeds", /Apply to Plot 1/);
await act("Shovel Test", /Run test on Plot 1/);
await act("Infiltration Test", /Run test on Plot 1/);
await act("Lab Soil Test", /Run test on Plot 1/);
await page.getByRole("button", { name: /Open the seed bag/ }).click();
await page.getByText("What will you plant?").waitFor();
await shot("06d-seed-bag");
await page.getByRole("button", { name: "Beans seed packet" }).click();
await page.getByRole("region", { name: "Planting preview" }).waitFor();
await shot("06e-seed-bag-beans");
await page.getByRole("button", { name: /Plant in Plot 1/ }).click();
await page.getByText("Beans growing").waitFor();
await page.getByRole("button", { name: /Compost 🪙/ }).click();
await page.getByText(/What it will do to this plot/).waitFor();
await shot("06c-preview-compost");
await page.getByRole("button", { name: /Apply to Plot 1/ }).click();
await act("Cover Crop", /Apply to Plot 1/);
await page.waitForTimeout(800);
await shot("06-game");
await page.getByRole("button", { name: /^End / }).click();
await page.getByText("Why did that happen?").waitFor();
await shot("07-game-report");
await page.getByRole("button", { name: /next season/ }).click();
// After harvest the plot is empty again and remembers what grew there.
await page.getByText("Empty plot").first().waitFor();
await page.getByText(/Last grown: Legume/).waitFor();

await page.goto(`${BASE}/soil/globe`);
await page.waitForTimeout(2000);
await page.getByLabel("Jump to a region").selectOption("amazon");
await page.getByText("What grows here").waitFor();
await page.waitForTimeout(1500);
await shot("08-globe");
await page.getByRole("button", { name: /Texture/ }).click();
await page.waitForTimeout(500);
await shot("08b-globe-texture");
await page.getByRole("button", { name: /Guess the Soil/ }).click();
await page.waitForTimeout(1500);
await page.locator("div.card button.rounded-xl").first().click();
await shot("09-globe-quiz");

// Periodic table: open over the game, search, inspect the atom, close, and confirm the game survived.
await page.goto(`${BASE}/soil/game`);
await page.waitForTimeout(1000);
await page.getByRole("button", { name: "Open the periodic table" }).click();
await page.getByRole("dialog", { name: /Periodic table/ }).waitFor();
await page.waitForTimeout(2000);
await shot("12-elements-overlay");
await page.getByLabel("Search elements").fill("iron");
await page.getByLabel("Search elements").press("Enter");
await page.getByRole("heading", { name: "Iron" }).waitFor();
await page.waitForTimeout(2000);
await shot("13-element-iron");
await page.getByRole("button", { name: "Cloud" }).click();
await page.waitForTimeout(800);
await shot("14-iron-cloud");
await page.getByRole("button", { name: "Atomic mass" }).click();
await page.waitForTimeout(1500);
await shot("15-mass-bars");
await page.keyboard.press("Escape");
await page.getByRole("dialog").waitFor({ state: "detached" });
await page.getByText("Soil Health Index").waitFor();

// Keyboard shortcut and lesson links.
await page.goto(`${BASE}/soil/learn/healthy-soil`);
await page.waitForLoadState("networkidle");
await page.keyboard.press("e");
await page.getByRole("dialog").waitFor();
await page.keyboard.press("Escape");
await page.getByRole("button", { name: /^nitrogen$/i }).first().click();
await page.getByRole("heading", { name: "Nitrogen" }).waitFor();
await page.keyboard.press("Escape");

// Only soil elements show "Where it's found" for now.
await page.goto(`${BASE}/elements?z=79`);
await page.getByRole("heading", { name: "Gold" }).waitFor();
if (await page.getByText("Where it's found").count()) throw new Error("Gold should not show Where it's found");
await page.goto(`${BASE}/elements?z=14`);
await page.getByRole("heading", { name: "Silicon" }).waitFor();
await page.getByText("Where it's found").waitFor();

await page.goto(`${BASE}/elements?z=92`);
await page.getByRole("heading", { name: "Uranium" }).waitFor();
await page.waitForTimeout(2000);
await shot("16-elements-page-uranium");

// Soil Builders lens on the periodic table.
await page.goto(`${BASE}/elements`);
await page.getByRole("button", { name: /Soil Builders/ }).click();
await page.getByRole("region", { name: "Soil builders" }).waitFor();
await page.waitForTimeout(2000);
await shot("18-soil-lens");
await page.getByRole("button", { name: /Silicon, about 33 percent/ }).click();
await page.getByRole("region", { name: "In soil" }).waitFor();
await page.waitForTimeout(1500);
await shot("19-silicon-in-soil");
await page.getByRole("button", { name: "In soil", exact: true }).click();
await page.getByRole("button", { name: /Micronutrients/ }).first().click();
await page.waitForTimeout(2000);
await shot("20-soil-height-micro");

await page.goto(`${BASE}/soil`);
await page.waitForTimeout(500);
await shot("10-soil-home-after");

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/soil/game`);
await page.waitForTimeout(1500);
await shot("11-mobile-game");
await page.goto(`${BASE}/elements?z=8`);
await page.getByRole("heading", { name: "Oxygen" }).waitFor();
await page.waitForTimeout(1500);
await shot("17-mobile-elements");
await page.getByRole("button", { name: /Soil Builders/ }).click();
await page.waitForTimeout(500);
await shot("21-mobile-soil-lens");

await browser.close();
if (errors.length) {
  console.error("Console errors:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("Smoke test passed. Screenshots in", OUT);
