import { chromium } from "playwright";
import fs from "fs";

const SESSION_FILE = "./storage/session.json";

const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/117.0.0.0 Safari/537.36";

function randomDelay(min = 1000, max = 3000) {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min)) + min));
}

export async function launchBrowser(persist = true) {
  const browser = await chromium.launch({ headless: false });

  let context;

  if (persist && fs.existsSync(SESSION_FILE)) {
    // Load session
    const storage = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: USER_AGENT,
      locale: "en-US",
      ...storage
    });
    console.log("Loaded existing session");
  } else {
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: USER_AGENT,
      locale: "en-US",
    });
    console.log("Started new browser context");
  }

  const page = await context.newPage();

  // Visit TikTok homepage for realism
  await page.goto("https://www.tiktok.com", { waitUntil: "domcontentloaded" });
  await randomDelay(2000, 4000);

  return { browser, context, page };
}

export async function saveSession(context) {
  const storageState = await context.storageState(); // cookies + localStorage + sessionStorage
  fs.writeFileSync(SESSION_FILE, JSON.stringify(storageState, null, 2));
  console.log("Session saved at", SESSION_FILE);
}