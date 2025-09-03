// login.js
import fs from "fs";
import path from "path";
import { launchBrowser, saveSession } from "./playwright.js";

const STORAGE_DIR = path.resolve("./storage");
const SESSION_FILE = path.join(STORAGE_DIR, "session.json");

/**
 * Launch TikTok login page for manual login and capture session.
 */
export async function launchLoginPage() {
  // Ensure storage folder exists
  if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

  // Launch a visible browser (headful) for user login
  const { browser, context, page } = await launchBrowser(false); // false = don't auto-load session

  try {
    // If a session already exists, try reusing it
    if (fs.existsSync(SESSION_FILE)) {
      console.log("[Login] Found existing session. Attempting reuse...");
      await page.goto("https://www.tiktok.com", { waitUntil: "domcontentloaded" });

      try {
        // Check if already logged in by waiting for For You page
        await page.waitForURL("**/foryou*", { timeout: 15000 });
        console.log("[Login] Already logged in. Using existing session.");
        await browser.close();
        return;
      } catch {
        console.log("[Login] Existing session expired. Manual login required.");
        await context.close();
      }
    }

    // Open TikTok login page for manual login
    const loginPage = await context.newPage();
    console.log("[Login] Opening TikTok login page...");
    await loginPage.goto("https://www.tiktok.com/login", { waitUntil: "domcontentloaded" });

    console.log("[Login] Please login manually. Complete OTP/2FA if needed...");

    // Wait indefinitely until TikTok redirects to For You page (i.e., login complete)
    await loginPage.waitForURL("**/foryou*", { timeout: 0 });

    console.log("[Login] Login detected! Saving session...");

    // Save cookies, localStorage, and sessionStorage
    await saveSession(context);

    console.log(`[Login] Session saved at ${SESSION_FILE}`);
  } catch (err) {
    console.error("[Login] Error during login:", err);
  } finally {
    await browser.close();
  }
}
