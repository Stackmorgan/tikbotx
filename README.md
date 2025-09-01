# TikBotX - TikTok Automation Library

![TikBotX Logo](https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/tiktok.svg) 

![Node.js](https://img.shields.io/badge/Node.js-v20.0.0-brightgreen)
![npm](https://img.shields.io/badge/npm-v8.0.0-blue)
![Playwright](https://img.shields.io/badge/Playwright-v1.0.0-orange)

---

## Description
TikBotX is a powerful library for automating TikTok interactions using **Playwright**. It simulates human behavior to perform actions like uploading videos, liking posts, commenting, viewing stories, replying to DMs, and more.  

The library includes a built-in **Express server** that exposes API endpoints for seamless integration and task control.

---

## Features
- **Human Simulation**: Randomized delays, scrolling, and mouse movements for realistic behavior.
- **Persistent Login**: Saves and reuses sessions automatically.
- **Queue Management**: Add videos to monitor or upload queues.
- **Automated Bot Loop**: Processes tasks at intervals with minimal supervision.
- **Express API**: Expose endpoints for external apps or scripts.
- **AI Replies**: Automatically reply to comments and DMs with AI-generated responses.

---

## Requirements
- Node.js >= 20
- npm or yarn
- TikTok account
- Playwright library
- `fs` module for session storage

---

## Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/tiktok-automation.git
cd tiktok-automation
npm install
npx playwright install


---

Usage

1. Login & Session Handling

The Express server uses launchBrowser() from playwright.js for login.

Visit: http://localhost:4000/login

Opens TikTok in a non-headless browser for manual login.

Waits until the For You feed loads.

Automatically saves session to ./storage/session.json.

Starts the bot loop automatically after login.


app.get("/login", async (req, res) => {
  const result = await launchBrowser(false); // no session
  browser = result.browser;
  context = result.context;
  page = result.page;

  res.send("Login page opened. Complete login manually. Bot will start automatically after login.");

  await page.waitForURL("**/foryou*", { timeout: 0 });
  await saveSession(context);
  runBotLoop();
});


---

2. Queue Management via API

Add videos to monitor or upload queues using REST endpoints:

Monitor video

POST /monitor
Content-Type: application/json

{
  "videoUrl": "https://www.tiktok.com/@user/video/1234567890"
}

Upload video

POST /upload
Content-Type: application/json

{
  "videoPath": "./videos/video1.mp4",
  "caption": "My new video"
}

Check status

GET /status

Returns JSON:

{
  "monitoring": ["https://www.tiktok.com/@user/video/1234567890"],
  "uploading": [{"file": "./videos/video1.mp4","caption":"My new video"}],
  "running": true
}


---

3. Bot Loop Integration

The server continuously runs the bot:

async function runBotLoop() {
  if (isRunning) return;
  isRunning = true;

  if (!page || !context) {
    if (!fs.existsSync(SESSION_FILE)) return console.log("Visit /login first");
    const result = await startBrowser();
    browser = result.browser;
    context = result.context;
    page = result.page;
  }

  while (true) {
    if (uploadQueue.length || monitorQueue.length) {
      await runTasks(page, { videosToPost: uploadQueue, videosToMonitor: monitorQueue });
    }
    await new Promise(r => setTimeout(r, 30000));
  }
}

This automatically processes upload and monitor queues every 30 seconds.


---

4. Graceful Shutdown

The server handles SIGINT and SIGTERM:

async function shutdown() {
  if (context) await saveSession(context);
  if (browser) await browser.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

Ensures session and queue data are saved before exit.


---

5. Running the Server

Start the server:

node server.js

Server URL: http://localhost:4000

Visit /login if no session exists.

Add videos via /monitor and /upload.

Bot starts automatically after login or session load.



---

6. Config File (config.json)

Initialize bot tasks at startup:

{
  "videosToPost": [
    { "file": "./videos/video1.mp4", "caption": "My first video" }
  ],
  "videosToMonitor": [
    "https://www.tiktok.com/@user/video/1234567890"
  ]
}

Load with loadConfig() in tiktokActions.js.


---

7. Notes

Always run login headless=false for OTP and captcha.

Human-like behavior includes scrolls, mouse movements, and random delays.

Session persistence prevents repeated logins.

Easily extendable with AI, scheduling, or analytics.



---

Conclusion

TikBotX is a complete solution for TikTok automation.
It provides a robust server, human-like interactions, queue management, AI-driven replies, and easy integration for developers to automate TikTok accounts efficiently.
