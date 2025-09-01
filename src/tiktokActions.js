import { chromium } from "playwright";
import fs from "fs";
import aiReply from "./aiReply.js";

const SESSION_FILE = "./storage/session.json";

// ---------------------- UTILITY ----------------------
function randomDelay(min = 1000, max = 3000) {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min)) + min));
}

async function humanScroll(page, times = 3) {
  for (let i = 0; i < times; i++) {
    const distance = Math.floor(Math.random() * 400) + 200;
    await page.mouse.wheel(0, distance);
    await randomDelay(1000, 2500);
  }
}

async function moveMouseLikeHuman(page) {
  const { width, height } = page.viewportSize() || { width: 1200, height: 800 };
  const x = Math.floor(Math.random() * width);
  const y = Math.floor(Math.random() * height);
  await page.mouse.move(x, y, { steps: 10 });
}

// ---------------------- CONFIG LOADER ----------------------
export async function loadConfig(path = "./config.json") {
  if (fs.existsSync(path)) return JSON.parse(fs.readFileSync(path, "utf-8"));
  return { videosToPost: [], videosToMonitor: [] };
}

// ---------------------- BROWSER ----------------------
export async function startBrowser() {
  const browser = await chromium.launch({ headless: false });
  let context;

  if (fs.existsSync(SESSION_FILE)) {
    context = await browser.newContext({ storageState: SESSION_FILE });
    console.log(" Loaded existing TikTok session");
  } else {
    context = await browser.newContext();
    console.warn(" No saved session found, run login.js first!");
  }

  const page = await context.newPage();
  await page.goto("https://www.tiktok.com", { waitUntil: "domcontentloaded" });
  await randomDelay(2000, 5000);
  await moveMouseLikeHuman(page);
  return { browser, context, page };
}

export async function saveSession(context) {
  await context.storageState({ path: SESSION_FILE });
  console.log(" Session saved:", SESSION_FILE);
}

// ---------------------- VIDEO INTERACTIONS ----------------------
export async function likeVideo(page, url) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await randomDelay(2000, 4000);
  const likeBtn = page.locator('[data-e2e="like-icon"]');
  if (await likeBtn.count()) {
    await moveMouseLikeHuman(page);
    await likeBtn.click();
    console.log(` Liked video: ${url}`);
  }
}

export async function commentVideo(page, url, text) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await randomDelay(2000, 4000);
  const input = page.locator('[data-e2e="comment-input"]');
  await input.waitFor({ timeout: 15000 });
  await moveMouseLikeHuman(page);
  await input.fill(text);
  await randomDelay(1000, 2000);
  await page.click('[data-e2e="comment-post"]');
  console.log(` Commented on video: ${url}`);
}

export async function uploadVideo(page, file, caption) {
  await page.goto("https://www.tiktok.com/upload", { waitUntil: "domcontentloaded" });
  await randomDelay(2000, 4000);
  const uploadInput = page.locator('input[type="file"]');
  await uploadInput.setInputFiles(file);
  await page.fill('[placeholder="Add a caption"]', caption || "");
  await randomDelay(1000, 2000);
  await page.click('[data-e2e="post-button"]');
  console.log(` Uploaded video: ${file}`);
}

// ---------------------- COMMENTS ----------------------
export async function replyToComments(page, videoUrl) {
  await page.goto(videoUrl, { waitUntil: "domcontentloaded" });
  await humanScroll(page, 2);
  const comments = await page.locator('[data-e2e="comment-item"]').all();

  for (let comment of comments) {
    try {
      const username = await comment.locator('[data-e2e="comment-username"]').innerText();
      const text = await comment.locator('[data-e2e="comment-text"]').innerText();
      console.log(` Comment from ${username}: ${text}`);

      const reply = await aiReply(text);

      const replyBtn = comment.locator('[data-e2e="comment-reply"]');
      if (await replyBtn.count()) {
        await moveMouseLikeHuman(page);
        await replyBtn.click();
        await randomDelay(500, 1500);
        await page.fill('[data-e2e="comment-input"]', reply);
        await randomDelay(500, 1500);
        await page.click('[data-e2e="comment-post"]');
        console.log(` Replied to ${username} with: ${reply}`);
      }

      const likeBtn = comment.locator('[data-e2e="like-icon"]');
      if (await likeBtn.count()) {
        await moveMouseLikeHuman(page);
        await likeBtn.click();
        console.log(` Liked ${username}'s comment`);
      }

      await randomDelay(1000, 3000);
    } catch (err) {
      console.error(" Error handling a comment:", err);
    }
  }
}

// ---------------------- DMS ----------------------
export async function replyToDMs(page) {
  await page.goto("https://www.tiktok.com/messages", { waitUntil: "domcontentloaded" });
  const chats = await page.locator('[data-e2e="chat-list-item"]').all();

  for (let chat of chats) {
    try {
      await chat.click();
      const acceptBtn = page.locator('[data-e2e="chat-accept"]');
      if (await acceptBtn.count()) {
        await moveMouseLikeHuman(page);
        await acceptBtn.click();
        console.log(" Accepted new message request");
      }

      const messages = await page.locator('[data-e2e="chat-message"]').all();
      if (messages.length === 0) continue;

      const lastMsg = await messages[messages.length - 1].innerText();
      const reply = await aiReply(lastMsg);

      const input = page.locator('[data-e2e="chat-input"]');
      await moveMouseLikeHuman(page);
      await input.fill(reply);
      await randomDelay(500, 1500);
      await page.click('[data-e2e="chat-send"]');

      console.log(` Replied in DM with: ${reply}`);
      await randomDelay(1000, 3000);
    } catch (err) {
      console.error(" Error replying to a DM:", err);
    }
  }
}

// ---------------------- STORIES ----------------------
export async function viewStories(page) {
  await page.goto("https://www.tiktok.com/stories", { waitUntil: "domcontentloaded" });
  const stories = await page.locator('[data-e2e="story-item"]').all();

  for (let story of stories) {
    await moveMouseLikeHuman(page);
    await story.click();
    console.log(" Viewed a story");
    await randomDelay(2000, 4000);
  }
}

// ---------------------- MAIN RUNNER ----------------------
export async function runTasks(page, config) {
  // Upload videos
  if (config.videosToPost?.length) {
    for (let v of config.videosToPost) await uploadVideo(page, v.file, v.caption || "");
  }

  // Reply to comments
  if (config.videosToMonitor?.length) {
    for (let videoUrl of config.videosToMonitor) await replyToComments(page, videoUrl);
  }

  // Handle DMs
  await replyToDMs(page);

  // Watch stories
  await viewStories(page);
}