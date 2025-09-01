// config.js
// In-memory queues for videos
let monitorQueue = [];   // videos to monitor for comments
let uploadQueue = [];    // videos to upload

// --- Functions to manipulate queues ---

/**
 * Add a video to the monitor queue
 * @param {string} videoUrl
 */
function addMonitor(videoUrl) {
  if (!videoUrl) throw new Error("videoUrl is required");
  monitorQueue.push({ videoUrl, addedAt: new Date() });
}

/**
 * Add a video to the upload queue
 * @param {string} videoPath
 * @param {string} caption
 */
function addUpload(videoPath, caption = "") {
  if (!videoPath) throw new Error("videoPath is required");
  uploadQueue.push({ videoPath, caption, addedAt: new Date() });
}

/**
 * Get current queue status
 * @returns {Object} { monitoring: [], uploading: [] }
 */
function getStatus() {
  return {
    monitoring: monitorQueue,
    uploading: uploadQueue
  };
}

/**
 * Clear queues (optional utility)
 */
function clearQueues() {
  monitorQueue = [];
  uploadQueue = [];
}

// Export as a library for TikTokActions.js or any API server
export { monitorQueue, uploadQueue, addMonitor, addUpload, getStatus, clearQueues };