// login.js
import fs from "fs";
import { launchBrowser, saveSession } from "./playwright.js";

const SESSION_FILE = "./storage/session.json";

/**
 * Launch TikTok login page and wait until the user completes login manually.
 */
export async function launchLoginPage() {
  // Ensure storage folder exists
  if (!fs.existsSync("./storage")) fs.mkdirSync("./storage");

  // Launch a visible browser for manual login
  const { browser, context, page } = await launchBrowser(false); // false = don't auto-load session

  try {
    // Try to reuse session if it exists
    if (fs.existsSync(SESSION_FILE)) {
      console.log("Found existing session. Trying to reuse...");
      await page.goto("https://www.tiktok.com", { waitUntil: "domcontentloaded" });

      try {
        // Detect if user is already logged in
        await page.waitForURL("**/foryou*", { timeout: 15000 });
        console.log("Already logged in. Skipping login.");
        await browser.close();
        return;
      } catch {
        console.log("Session expired. Need manual login.");
        await context.close();
      }
    }

    // No valid session → open login page
    const loginPage = await context.newPage();
    console.log("Opening TikTok login page...");
    await loginPage.goto("https://www.tiktok.com/login", { waitUntil: "domcontentloaded" });

    console.log("Please complete login manually, including OTP/2FA if required...");

    // Wait indefinitely until TikTok redirects to For You page (i.e., login complete)
    await loginPage.waitForURL("**/foryou*", { timeout: 0 }); // wait forever

    console.log("Login detected! Saving session...");

    // Save cookies, localStorage, sessionStorage
    await saveSession(context);

    console.log("Session saved at", SESSION_FILE);
  } catch (err) {
    console.error("Error during login:", err);
  } finally {
    await browser.close();
  }
}