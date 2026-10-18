// Smoke test: loads each page in Chromium, plays the farm game, clicks the globe,
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
// Leaving a page cancels its downloads, and three.js reports a cancelled texture as an error.
// Those come from the test moving on, not from the page, so they don't count.
let lastAbort = 0;
page.on("requestfailed", (r) => { if (r.failure()?.errorText === "net::ERR_ABORTED") lastAbort = Date.now(); });
page.on("console", (m) => {
  if (m.type() !== "error") return;
  if (/Couldn't load texture/.test(m.text()) && Date.now() - lastAbort < 1000) return;
  errors.push(`${page.url()}: ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`${page.url()}: ${e.message}`));

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

await page.goto(BASE);
await shot("01-hub");

await page.goto(`${BASE}/soil`);
await shot("02-soil-home");

// Curriculum: the grade level changes the lesson's depth.
await page.goto(`${BASE}/soil/learn`);
await page.getByRole("radio", { name: /Elementary/ }).click();
await shot("02b-learn-units");
await page.goto(`${BASE}/soil/learn/what-is-soil`);
await page.getByRole("heading", { name: "Soil is a recipe" }).waitFor();
await shot("02c-lesson-elementary");
await page.getByLabel("Grade level").first().selectOption("high");
await page.getByRole("heading", { name: "A scientist's definition" }).waitFor();
await page.getByText("Pedosphere").waitFor();
await shot("02d-lesson-high");
await page.getByLabel("Grade level").first().selectOption("middle");
await page.goto(`${BASE}/soil/teach`);
await page.getByRole("heading", { name: "Soil Science Teacher Guide" }).waitFor();
await shot("02e-teacher-guide");
await page.goto(`${BASE}/soil/sources`);
await page.getByRole("heading", { name: "Sources", exact: true }).waitFor();
await shot("02f-sources");

await page.goto(`${BASE}/soil/learn/soil-texture`);
await page.getByText("The Soil Texture Triangle").scrollIntoViewIfNeeded();
await page.getByRole("button", { name: /Pottery clay/ }).click();
await shot("03-texture-triangle");
// Answer the quiz with the first option each time.
const quiz = page.getByRole("region", { name: "Quiz" });
while (!(await page.getByText(/You got \d+ of \d+/).count())) {
  await quiz.locator("button.rounded-xl").first().click();
  await page.getByRole("button", { name: /^(Next|Finish)/ }).click();
}
await shot("04-quiz-done");

await page.goto(`${BASE}/soil/learn/soil-horizons`);
await page.locator("canvas").first().scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
await shot("05-soil-profile");

await page.goto(`${BASE}/soil/game`);
// Main menu → New Game setup: choose a farmer, science features, time speed, and calendar.
await page.getByRole("dialog", { name: "Main menu" }).waitFor();
await shot("06-main-menu");
await page.getByRole("button", { name: /New Game/ }).click();
await page.getByRole("radio", { name: /Farmer male-c/ }).click();
await page.getByRole("button", { name: /^Next/ }).click();
await page.getByRole("radio", { name: /Real Science/ }).click();
await page.getByText(/^Real Science · (\d+) of \1 science features on$/).waitFor();
await shot("06-setup-science");
await page.getByRole("button", { name: /^Next/ }).click();
await page.getByRole("button", { name: "30×", exact: true }).click();
await page.getByText("1 game hour = 2 real minutes").waitFor();
await page.getByRole("button", { name: /^Next/ }).click();
await page.getByLabel("Days per month").fill("10");
await page.getByText(/each season lasts 30 days/).waitFor();
await shot("06-setup-calendar");
await page.getByRole("button", { name: /Begin/ }).click();
await page.getByText("Congratulations! You inherited an organic garden!").waitFor();
await shot("06a-garden-intro");
await page.getByRole("button", { name: /Let's get gardening/ }).click();
await page.waitForTimeout(1500);
await shot("06b-farm");

// Walking is slow in a software-rendered browser, so tests move the player by editing the save.
const SAVE = "earthsciencelab-world";
const MAP_W = 76; // tiles per row (src/world/map.ts W)
async function teleport(x, y, facing, tiles = {}) {
  await page.goto(`${BASE}/soil/sources`); // leaving the game saves the farm
  await page.evaluate(({ SAVE, x, y, facing, tiles }) => {
    const w = JSON.parse(localStorage.getItem(SAVE));
    w.player = { x, y, facing };
    w.critters = [];
    for (const [i, patch] of Object.entries(tiles)) Object.assign(w.tiles[Number(i)], patch);
    localStorage.setItem(SAVE, JSON.stringify(w));
  }, { SAVE, x, y, facing, tiles });
  await page.goto(`${BASE}/soil/game`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByRole("toolbar", { name: "Hotbar" }).waitFor();
}
const inspector = page.getByLabel("Tile inspector");
// The bag starts empty: take Grandma Rosa's tools out of the chest beside the house.
await teleport(7, 10, "up");
await page.keyboard.press(" ");
await page.getByRole("dialog", { name: "Grandma Rosa's chest" }).waitFor();
await page.getByRole("button", { name: "Take all" }).click();
await shot("06b-chest");
await page.keyboard.press("Escape");
const clean = { obstacle: null, weeds: false, crop: null, tilled: false, mulch: false };
await teleport(10, 13, "down", { [13 * MAP_W + 10]: clean, [14 * MAP_W + 10]: { ...clean, weeds: true } });
await inspector.getByText("Weeds are growing here.").waitFor();
await page.keyboard.press("3"); // scythe
await page.keyboard.press(" ");
await page.getByText("Cut weeds (+1 fiber).").waitFor();
await page.keyboard.press("1"); // hoe
await inspector.getByText(/Till:/).waitFor();
await page.keyboard.press(" ");
await inspector.getByText("Tilled", { exact: true }).waitFor();
await page.keyboard.press("6"); // carrot seeds
await page.keyboard.press(" ");
await page.getByText(/^Planted Carrots\./).waitFor();
await page.keyboard.press("2"); // watering can
await page.keyboard.press(" ");
await page.keyboard.press("7"); // compost
await page.keyboard.press(" ");
await page.getByText(/Spread compost/).waitFor();
await page.waitForTimeout(800);
await shot("06c-planted");

// Sleep in the farmhouse: the night passes and the crop grows.
await teleport(10, 9, "up");
await page.keyboard.press(" ");
await page.getByRole("dialog", { name: "Your farmhouse" }).waitFor();
await page.getByRole("button", { name: /Watch the weather/ }).click();
await page.getByText(/Weather science/).waitFor();
await shot("06d-tv");
await page.getByRole("button", { name: "Close" }).click();
await page.getByRole("button", { name: /Go to bed/ }).click();
await page.getByRole("dialog", { name: "Good morning! Day 2" }).waitFor();
await shot("07-day-summary");
await page.getByRole("button", { name: "Start the day" }).click();
await teleport(10, 13, "down");
await inspector.getByText(/\d+%/).waitFor();
await inspector.getByText(/Expected grade [EDCBAS]/).waitFor();

// Harvest a ripe crop: you get a random amount at a grade set by the soil.
await teleport(10, 13, "down", { [14 * MAP_W + 10]: { crop: { id: "carrot", growth: 1, harvests: 0, dead: false, pests: false } } });
await page.keyboard.press("e");
await page.getByText(/^Harvested \d+ Carrots · Grade [EDCBAS]!/).waitFor();
await page.keyboard.press("i");
await page.getByRole("dialog", { name: "Your bag" }).waitFor();
await page.getByRole("dialog", { name: "Your bag" }).getByRole("button", { name: /Carrots grade [EDCBAS]/ }).click();
await page.getByText(/sells for ×/).waitFor();
await shot("07a-graded-harvest");
await page.keyboard.press("Escape");
await page.keyboard.press("j");
await page.getByRole("dialog", { name: /Nature Journal/ }).waitFor();
await shot("07b-journal");
await page.keyboard.press("Escape");

// Town: the notice board in the square and the quest log.
await teleport(58, 14, "up");
await page.keyboard.press("e");
await page.getByRole("dialog", { name: "Town notice board" }).waitFor();
await page.getByRole("button", { name: "Take this request" }).first().click();
await shot("07b2-notice-board");
await page.getByRole("button", { name: "Close" }).click();
await page.keyboard.press("q");
await page.getByRole("dialog", { name: "Quests" }).getByText(/Notice board/).first().waitFor();
await page.keyboard.press("Escape");

// The store in town: buy seeds and a compost bin, then build it back on the farm.
await teleport(45, 10, "up");
await page.keyboard.press("e");
await page.getByRole("dialog", { name: "Seed & Soil Co." }).waitFor();
await page.getByRole("button", { name: "Buy Carrot Seeds" }).click();
await page.getByText("🪙 285").first().waitFor();
await page.getByRole("button", { name: /Build/ }).click();
await page.getByRole("button", { name: "Buy Compost Bin" }).click();
await shot("07c-store");
await page.getByRole("button", { name: "Close" }).click();
await page.keyboard.press("i");
const bag = page.getByRole("dialog", { name: "Your bag" });
// Swap the kit into the 10th hotbar slot.
await bag.getByRole("button", { name: /Compost Bin ×1/ }).click();
await bag.locator(".grid > button").nth(9).click();
await page.keyboard.press("Escape");
await teleport(12, 11, "down", { [12 * MAP_W + 12]: clean });
await page.keyboard.press("0");
await page.keyboard.press(" ");
await page.getByText("Built a Compost Bin!").waitFor();
await page.waitForTimeout(800);
await shot("07d-built");
await page.getByLabel("Temperature").first().waitFor();

// Pause: switch a science feature off mid-game, then save and quit to the main menu.
await page.keyboard.press("Escape");
await page.getByRole("dialog", { name: "Paused" }).waitFor();
await page.getByRole("switch", { name: "Weeds" }).uncheck();
await page.getByText("Custom mix").waitFor();
await shot("07e-pause");
await page.getByRole("button", { name: /Save & quit/ }).click();
await page.getByRole("button", { name: /Continue/ }).waitFor();
await shot("07f-menu-continue");
await page.getByRole("button", { name: /Continue/ }).click();
await page.keyboard.press("Escape");
if (await page.getByRole("switch", { name: "Weeds" }).isChecked()) throw new Error("Weeds setting wasn't saved");
await page.keyboard.press("Escape");

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
await page.getByRole("dialog", { name: /Periodic table/ }).waitFor({ state: "detached" });
await page.getByRole("dialog", { name: "Main menu" }).waitFor();

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

// My Homestead: buy a chair with farm coins and set it down in the farmhouse room.
await page.evaluate((SAVE) => {
  const w = JSON.parse(localStorage.getItem(SAVE));
  w.coins = 500;
  delete w.homestead;
  localStorage.setItem(SAVE, JSON.stringify(w));
}, SAVE);
await page.goto(`${BASE}/homestead`, { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Wooden chair/ }).click();
{
  const box = await page.locator('canvas[aria-label="Your farmhouse room"], [aria-label="Your farmhouse room"] canvas').first().boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(500);
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}
await page.waitForFunction((SAVE) => {
  const w = JSON.parse(localStorage.getItem(SAVE));
  return w.coins === 470 && w.homestead?.room.some((p) => p.item === "chair");
}, SAVE, { timeout: 10000 });
await page.waitForTimeout(1000);
await shot("22-homestead");

// The Godot port (only when it's been built with npm run godot:export): it shares the farm
// save and the grade level, and its tools work. Software rendering runs it at a few frames
// a second, so the player is placed through the save instead of walked there.
if (existsSync("public/godot/index.html")) {
  await page.evaluate(({ SAVE, MAP_W }) => {
    const w = JSON.parse(localStorage.getItem(SAVE));
    w.player = { x: 12, y: 13, facing: "down" };
    w.selected = 2; // scythe
    Object.assign(w.tiles[14 * MAP_W + 12], { obstacle: null, weeds: true, crop: null });
    localStorage.setItem(SAVE, JSON.stringify(w));
  }, { SAVE, MAP_W });
  await page.goto(`${BASE}/soil/game/godot`);
  const canvas = page.frameLocator('iframe[title="Soil & Sprout"]').locator("canvas");
  await canvas.waitFor();
  const frame = page.frames().find((f) => f.url().includes("/godot/"));
  await frame.waitForFunction(() => window.__soil?.ready, null, { timeout: 90000 });
  const grade = await page.evaluate(() => JSON.parse(localStorage.getItem("earthsciencelab-progress")).state.gradeLevel);
  await frame.waitForFunction((g) => window.__soil.grade === g, grade, { timeout: 10000 });
  if (!(await frame.evaluate(() => window.__soil.save))) throw new Error("The Godot build didn't find the farm save.");
  // The main menu, then continue the farm and use the scythe with the keyboard.
  await frame.waitForFunction(() => window.__soil.screen === "menu", null, { timeout: 10000 });
  await shot("30-godot-menu");
  await frame.evaluate(() => window.__soilCommand("continue"));
  await frame.waitForFunction(() => window.__soil.day, null, { timeout: 60000 });
  await canvas.click({ position: { x: 640, y: 300 } });
  await page.keyboard.press(" ");
  await frame.waitForFunction(() => window.__soil.message === "Cut weeds (+1 fiber).", null, { timeout: 30000 });
  await page.waitForTimeout(1000);
  await shot("30-godot-farm");
  // Menus open from the keyboard and close with Escape.
  await page.keyboard.press("i");
  await frame.waitForFunction(() => window.__soil.menu === "bag", null, { timeout: 10000 });
  await page.waitForTimeout(800);
  await shot("31-godot-bag");
  await page.keyboard.press("Escape");
  await frame.waitForFunction(() => window.__soil.menu === "", null, { timeout: 10000 });
}

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(`${BASE}/soil/game`, { waitUntil: "networkidle" });
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
