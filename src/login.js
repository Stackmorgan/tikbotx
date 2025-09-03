import fs from "fs";
import path from "path";
import { launchBrowser, saveSession, loadSession } from "./playwright.js";

const STORAGE_DIR = path.resolve("./storage");
const SESSION_FILE = path.join(STORAGE_DIR, "session.json");

/**
 * Launch TikTok login for production-ready headless environments.
 * If a session exists, reuse it. Otherwise, headless login with cookies.
 */
export async function launchLoginPage(headless = true) {
  // Ensure storage folder exists
  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

  // Try to reuse existing session
  const sessionExists = fs.existsSync(SESSION_FILE);

  const { browser, context, page } = await launchBrowser(headless);

  try {
    if (sessionExists) {
      console.log("[Login] Existing session found. Loading...");
      await loadSession(context);

      // Verify login
      await page.goto("https://www.tiktok.com", { waitUntil: "domcontentloaded" });
      try {
        await page.waitForURL("**/foryou*", { timeout: 10000 });
        console.log("[Login] Session is valid. Continuing with existing login.");
        return { browser, context, page };
      } catch {
        console.log("[Login] Session invalid. Manual login required.");
      }
    }

    if (headless) {
      console.log("[Login] Headless environment detected. Please provide session.json manually.");
      return { browser, context, page };
    }

    // Manual login (headful) for first-time login
    const loginPage = await context.newPage();
    console.log("[Login] Opening TikTok login page...");
    await loginPage.goto("https://www.tiktok.com/login", { waitUntil: "domcontentloaded" });

    console.log("[Login] Complete login manually. Waiting for redirect to For You page...");
    await loginPage.waitForURL("**/foryou*", { timeout: 0 });

    console.log("[Login] Login detected! Saving session...");
    await saveSession(context);
    console.log(`[Login] Session saved at ${SESSION_FILE}`);

    return { browser, context, page: loginPage };
  } catch (err) {
    console.error("[Login] Error during login:", err);
    throw err;
  }
}
