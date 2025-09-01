// server.js
import express from "express";
import bodyParser from "body-parser";
import fs from "fs";

import { startBrowser, saveSession, runTasks } from "./src/tiktokActions.js";
import { launchBrowser } from "./src/playwright.js";
import { monitorQueue, uploadQueue, addMonitorVideo, addUploadVideo } from "./src/config.js";

const SESSION_FILE = "./storage/session.json";
const app = express();
app.use(bodyParser.json());

let browser, context, page;
let isRunning = false;

// ---------------- PUBLIC LOGIN PAGE ----------------
app.get("/login", async (req, res) => {
  try {
    const result = await launchBrowser(false); // launch without session
    browser = result.browser;
    context = result.context;
    page = result.page;

    res.send("Login page opened in browser. Complete login manually. Bot will start automatically after login.");
    
    // Wait until login is completed
    await page.waitForURL("**/foryou*", { timeout: 0 }); // wait indefinitely
    console.log("Login detected! Saving session...");

    await saveSession(context);
    console.log("Session saved. Starting bot loop...");
    runBotLoop();

  } catch (err) {
    console.error("Error opening login page:", err);
    res.status(500).send("Error opening login page.");
  }
});

// ---------------- API ENDPOINTS ----------------
app.post("/monitor", (req, res) => {
  const { videoUrl } = req.body;
  if (!videoUrl) return res.status(400).json({ error: "videoUrl is required" });

  addMonitorVideo(videoUrl);
  res.json({ success: true, message: "Video added to monitor queue", videoUrl });
});

app.post("/upload", (req, res) => {
  const { videoPath, caption } = req.body;
  if (!videoPath) return res.status(400).json({ error: "videoPath is required" });

  addUploadVideo(videoPath, caption || "");
  res.json({ success: true, message: "Video added to upload queue", videoPath });
});

app.get("/status", (req, res) => {
  res.json({
    monitoring: monitorQueue,
    uploading: uploadQueue,
    running: isRunning,
  });
});

// ---------------- BOT AUTO-RUN ----------------
async function runBotLoop() {
  if (isRunning) return;
  isRunning = true;

  try {
    // Launch browser with session if not already opened
    if (!page || !context) {
      if (!fs.existsSync(SESSION_FILE)) {
        console.log("No session found. Please visit /login to login first.");
        isRunning = false;
        return;
      }

      const result = await startBrowser();
      browser = result.browser;
      context = result.context;
      page = result.page;
    }

    console.log("Bot started. Monitoring and uploading...");

    while (true) {
      try {
        if (uploadQueue.length || monitorQueue.length) {
          await runTasks(page, { videosToPost: uploadQueue, videosToMonitor: monitorQueue });
        }
      } catch (taskErr) {
        console.error("Error in task loop:", taskErr);
      }

      await new Promise((r) => setTimeout(r, 30000));
    }
  } catch (err) {
    console.error("Bot loop error:", err);
  } finally {
    isRunning = false;
  }
}

// ---------------- GRACEFUL SHUTDOWN ----------------
async function shutdown() {
  try {
    console.log("Shutting down bot...");
    if (context) await saveSession(context);
    if (browser) await browser.close();
    console.log("Bot stopped gracefully.");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    process.exit(1);
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`Bot server running on http://localhost:${PORT}`);
  console.log(`Public login page: http://localhost:${PORT}/login`);

  // Auto-start bot loop if session exists
  if (fs.existsSync(SESSION_FILE)) {
    console.log("Session found. Starting bot automatically...");
    runBotLoop();
  } else {
    console.log("No session found. Please login at /login to start the bot.");
  }
});