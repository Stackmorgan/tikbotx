// server.js
import express from "express";
import bodyParser from "body-parser";
import fs from "fs";
import cors from "cors";

import { startBrowser, saveSession, runTasks } from "./src/tiktokActions.js";
import { launchBrowser } from "./src/playwright.js";
import { monitorQueue, uploadQueue, addMonitor, addUpload } from "./src/config.js"; //  corrected

const SESSION_FILE = "./storage/session.json";
const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(bodyParser.json());

let browser, context, page;
let isRunning = false;

// ---------------- UTILITY ----------------
const log = (...args) => console.log(new Date().toISOString(), ...args);

// ---------------- PUBLIC LOGIN PAGE ----------------
app.get("/login", async (req, res) => {
  try {
    const result = await launchBrowser(false); // launch without session
    browser = result.browser;
    context = result.context;
    page = result.page;

    res.send(
      "Login page opened in browser. Complete login manually. Bot will start automatically after login."
    );

    log("Waiting for login...");
    await page.waitForURL("**/foryou*", { timeout: 0 }); // wait indefinitely
    log("Login detected! Saving session...");

    await saveSession(context);
    log("Session saved. Starting bot loop...");
    runBotLoop();
  } catch (err) {
    console.error("Error opening login page:", err);
    res.status(500).send("Error opening login page.");
  }
});

// ---------------- API ENDPOINTS ----------------
app.post("/monitor", async (req, res) => {
  try {
    const { videoUrl } = req.body;
    if (!videoUrl) return res.status(400).json({ error: "videoUrl is required" });

    addMonitor(videoUrl); //  updated
    res.json({ success: true, message: "Video added to monitor queue", videoUrl });
  } catch (err) {
    console.error("Error in /monitor:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/upload", async (req, res) => {
  try {
    const { videoPath, caption } = req.body;
    if (!videoPath) return res.status(400).json({ error: "videoPath is required" });

    addUpload(videoPath, caption || ""); //  updated
    res.json({ success: true, message: "Video added to upload queue", videoPath });
  } catch (err) {
    console.error("Error in /upload:", err);
    res.status(500).json({ error: "Internal server error" });
  }
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
    if (!page || !context) {
      if (!fs.existsSync(SESSION_FILE)) {
        log("No session found. Please visit /login to login first.");
        isRunning = false;
        return;
      }

      const result = await startBrowser();
      browser = result.browser;
      context = result.context;
      page = result.page;
    }

    log("Bot started. Monitoring and uploading...");

    while (true) {
      try {
        if (uploadQueue.length || monitorQueue.length) {
          await runTasks(page, { videosToPost: uploadQueue, videosToMonitor: monitorQueue });
        }
      } catch (taskErr) {
        console.error("Error in task loop:", taskErr);
      }

      await new Promise((r) => setTimeout(r, 30000 + Math.random() * 5000));
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
    log("Shutting down bot...");
    if (context) await saveSession(context);
    if (browser) await browser.close();
    log("Bot stopped gracefully.");
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
  log(`Bot server running on http://localhost:${PORT}`);
  log(`Public login page: http://localhost:${PORT}/login`);

  if (fs.existsSync(SESSION_FILE)) {
    log("Session found. Starting bot automatically...");
    runBotLoop();
  } else {
    log("No session found. Please login at /login to start the bot.");
  }
});