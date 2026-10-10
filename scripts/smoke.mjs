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
await page.getByRole("button", { name: /Let's farm/ }).click();
await page.waitForTimeout(1500);
for (const name of ["Go No-Till", "Cover Crop"]) await page.getByRole("button", { name: new RegExp(name) }).first().click();
await shot("06-game");
await page.getByRole("button", { name: /^End / }).click();
await page.getByText("Why did that happen?").waitFor();
await shot("07-game-report");
await page.getByRole("button", { name: /next season/ }).click();

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

await page.goto(`${BASE}/soil`);
await page.waitForTimeout(500);
await shot("10-soil-home-after");

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/soil/game`);
await page.waitForTimeout(1500);
await shot("11-mobile-game");

await browser.close();
if (errors.length) {
  console.error("Console errors:\n" + errors.join("\n"));
  process.exit(1);
}
console.log("Smoke test passed. Screenshots in", OUT);
