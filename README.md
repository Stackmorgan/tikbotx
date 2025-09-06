# TikBotX - TikTok Automation Library

<p align="center">
  <img src="https://upload.wikimedia.org/wikipedia/commons/0/08/TikTok_logo.svg" alt="TikTok Logo" width="120"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v20.0.0-brightgreen?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/npm-v8.0.0-blue?style=for-the-badge&logo=npm" />
  <img src="https://img.shields.io/badge/Playwright-v1.0.0-orange?style=for-the-badge&logo=playwright" />
</p>

---

## 📖 Table of Contents
- [Description](#-description)
- [Features](#-features)
- [Requirements](#-requirements)
- [Installation](#-installation)
- [Usage](#-usage)
  - [Login & Session Handling](#1-login--session-handling)
  - [Queue Management via API](#2-queue-management-via-api)
  - [Bot Loop Integration](#3-bot-loop-integration)
  - [Graceful Shutdown](#4-graceful-shutdown)
  - [Running the Server](#5-running-the-server)
  - [Config File](#6-config-file-configjson)
- [Notes](#-notes)
- [Conclusion](#-conclusion)

---

## 📌 Description
**TikBotX** is a powerful library for automating TikTok interactions using **Playwright**.  
It simulates human behavior to perform actions like uploading videos, liking posts, commenting, viewing stories, replying to DMs, and more.  

The library includes a built-in **Express server** that exposes API endpoints for seamless integration and task control.

---

## ✨ Features
- 🤖 **Human Simulation**: Randomized delays, scrolling, and mouse movements for realistic behavior.  
- 🔑 **Persistent Login**: Saves and reuses sessions automatically.  
- 📂 **Queue Management**: Add videos to monitor or upload queues.  
- 🔄 **Automated Bot Loop**: Processes tasks at intervals with minimal supervision.  
- 🌐 **Express API**: Expose endpoints for external apps or scripts.  
- 🧠 **AI Replies**: Automatically reply to comments and DMs with AI-generated responses.  

---

## ⚡ Requirements
- Node.js >= 20  
- npm or yarn  
- TikTok account  
- Playwright library  
- `fs` module for session storage  

---

## 🚀 Installation
Clone the repository and install dependencies:

```bash
git clone https://github.com/stackmorgan/tikbotx.git
cd tikbotx
```
npm install
npx playwright install

___

🛠 Usage
1. Login & Session Handling
Start the Express server and visit the login route:
Copy code
Http
GET http://localhost:4000/login
Opens TikTok in a non-headless browser for manual login.
Waits until the For You feed loads.
Automatically saves the session to ./storage/session.json.
Starts the bot loop automatically after login.
Copy code
Js
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
___

2. Queue Management via API
📺 Monitor video
Copy code
Http
POST /monitor
Content-Type: application/json

{
  "videoUrl": "https://www.tiktok.com/@user/video/1234567890"
}
⬆️ Upload video
Copy code
Http
POST /upload
Content-Type: application/json

{
  "videoPath": "./videos/video1.mp4",
  "caption": "My new video"
}
___

📊 Check status
Copy code
Http
GET /status
Response:
Copy code
Json
{
  "monitoring": ["https://www.tiktok.com/@user/video/1234567890"],
  "uploading": [
    { "file": "./videos/video1.mp4", "caption": "My new video" }
  ],
  "running": true
}
3. Bot Loop Integration
Copy code
Js
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
      await runTasks(page, { 
        videosToPost: uploadQueue, 
        videosToMonitor: monitorQueue 
      });
    }
    await new Promise(r => setTimeout(r, 30000)); // every 30s
  }
}
4. Graceful Shutdown
Copy code
Js
async function shutdown() {
  if (context) await saveSession(context);
  if (browser) await browser.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
Ensures session and queue data are saved before exit. ✅
5. Running the Server
Copy code
Bash
___

node server.js
Server URL: http://localhost:4000
Visit /login if no session exists.
Add videos via /monitor and /upload.
Bot starts automatically after login or session load.
6. Config File (config.json)
Initialize bot tasks at startup:
Copy code
Json
{
  "videosToPost": [
    { "file": "./videos/video1.mp4", "caption": "My first video" }
  ],
  "videosToMonitor": [
    "https://www.tiktok.com/@user/video/1234567890"
  ]
}
Load with loadConfig() in tiktokActions.js.
___

📝 Notes
Always run login with headless=false for OTP and captcha.
Human-like behavior includes scrolls, mouse movements, and random delays.
Session persistence prevents repeated logins.
Easily extendable with AI, scheduling, or analytics.
___

✅ Conclusion
TikBotX is a complete solution for TikTok automation.
It provides a robust server, human-like interactions, queue management, AI-driven replies, and easy integration for developers to automate TikTok accounts efficiently.
Copy code
---