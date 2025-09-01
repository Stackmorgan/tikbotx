import { startBrowser, saveSession, runTasks } from "./tiktokActions.js";
import { monitorQueue, uploadQueue } from "./config.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Graceful shutdown
let running = true;
process.on("SIGINT", async () => {
  console.log("Shutting down bot gracefully...");
  running = false;
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function ensureStorage() {
  const storageDir = path.join(__dirname, "storage");
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir);
}

export async function runBot() {
  ensureStorage();

  const { browser, context, page } = await startBrowser();

  try {
    while (running) {
      // Run all TikTok bot tasks
      await runTasks(page, {
        videosToPost: uploadQueue,
        videosToMonitor: monitorQueue
      });

      // Wait 5 seconds before next iteration
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (err) {
    console.error("Error in bot:", err);
  } finally {
    await saveSession(context);
    await browser.close();
    console.log("Bot stopped.");
  }
}

// Auto-start if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBot();
}