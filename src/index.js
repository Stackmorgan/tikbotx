
import { startBrowser, saveSession, runTasks, loadConfig } from "./tiktokActions.js";

let browser, context, page;

async function runBot() {
  try {
    // Start browser and page
    const result = await startBrowser();
    browser = result.browser;
    context = result.context;
    page = result.page;

    // Load local config
    const config = await loadConfig();

    // Run main tasks
    await runTasks(page, config);

    // Keep the bot running for periodic tasks if needed
    console.log("Bot started. Press Ctrl+C to exit.");
  } catch (err) {
    console.error("Error running bot:", err);
    await shutdown();
  }
}

// Graceful shutdown: saves session and closes browser
async function shutdown() {
  try {
    if (context) await saveSession(context);
    if (browser) await browser.close();
    console.log("Bot stopped gracefully.");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
}

// Handle termination signals
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

(async () => {
  await runBot();
})();