/**
 * Captures product screenshots for the README.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 PROJECT_ID=<uuid> CHANNEL_ID=<uuid> node scripts/screenshot.mjs
 *
 * Set SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD for the pre-seeded demo account.
 */
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PROJECT_ID = process.env.PROJECT_ID;
const CHANNEL_ID = process.env.CHANNEL_ID;
const SCREENSHOT_EMAIL = process.env.SCREENSHOT_EMAIL;
const SCREENSHOT_PASSWORD = process.env.SCREENSHOT_PASSWORD;
const OUT_DIR = new URL("../docs/screenshots/", import.meta.url);

if (!SCREENSHOT_EMAIL || !SCREENSHOT_PASSWORD) {
  throw new Error("Set SCREENSHOT_EMAIL and SCREENSHOT_PASSWORD before capturing screenshots.");
}

mkdirSync(OUT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

async function settle(ms = 900) {
  await new Promise((r) => setTimeout(r, ms));
}

/** Save a full-page screenshot into docs/screenshots. */
async function shot(name) {
  const file = fileURLToPath(new URL(`${name}.png`, OUT_DIR));
  await page.screenshot({ path: file, fullPage: false });
  console.log(`✓ ${name}.png`);
}

// ── Public pages ──────────────────────────────────────────────────────────
await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
await settle(1200);
await shot("login");

await page.goto(`${BASE}/signup`, { waitUntil: "networkidle0" });
await settle(1200);
await shot("signup");

// ── Log in ────────────────────────────────────────────────────────────────
await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
await page.waitForSelector('input[type="email"]', { timeout: 15000 });
await page.type('input[type="email"]', SCREENSHOT_EMAIL, { delay: 20 });
await page.type('input[type="password"]', SCREENSHOT_PASSWORD, { delay: 20 });

await Promise.all([
  page.waitForFunction(() => !window.location.pathname.startsWith("/login"), {
    timeout: 30000,
  }),
  page.evaluate(() => {
    const buttons = [...document.querySelectorAll("button")];
    const btn = buttons.find((b) => b.textContent?.trim() === "Log in");
    if (!btn) throw new Error("Log in button not found");
    btn.click();
  }),
]);
await page.waitForNetworkIdle({ idleTime: 800, timeout: 30000 });
await settle(1200);
await shot("dashboard");

// ── Command palette ───────────────────────────────────────────────────────
await page.keyboard.down("Control");
await page.keyboard.press("KeyK");
await page.keyboard.up("Control");
await settle(400);
await page.type('input[aria-label="Search"]', "acme", { delay: 60 });
await page.waitForNetworkIdle({ idleTime: 600, timeout: 15000 }).catch(() => {});
await settle(700);
await shot("command-palette");

// Press escape to close
await page.keyboard.press("Escape");

// ── App sections ──────────────────────────────────────────────────────────
async function visit(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle0", timeout: 45000 });
  await settle(1000);
}

if (PROJECT_ID) {
  await visit(`/crm/deals`);
  await shot("pipeline");
  await visit(`/projects/${PROJECT_ID}`);
  await shot("project-board");
} else {
  console.warn("PROJECT_ID not set — skipping pipeline/board shots");
}

if (CHANNEL_ID) {
  await visit(`/team/channels/${CHANNEL_ID}`);
  await shot("team-chat");
} else {
  console.warn("CHANNEL_ID not set — skipping chat shot");
}

await visit("/support");
await shot("support-queue");

await visit("/analytics");
await shot("analytics");

await browser.close();
console.log("DONE");
