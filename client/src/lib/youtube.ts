// YouTube API helper functions

/**
 * Formats a YouTube video duration string to a human-readable format
 * @param duration ISO 8601 duration string (e.g., "PT5M30S")
 * @returns Formatted duration (e.g., "5:30")
 */
export function formatDuration(duration: string) {
  // YouTube API returns ISO 8601 duration format: PT1H2M3S
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  
  if (!match) return "0:00";
  
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Gets a high-quality thumbnail URL from YouTube video ID
 * @param videoId YouTube video ID
 * @returns URL to the highest quality thumbnail
 */
export function getYouTubeThumbnail(videoId: string) {
  // Try to get the highest quality thumbnail available
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * @param url YouTube URL
 * @returns YouTube video ID or null if invalid
 */
export function extractYouTubeId(url: string) {
  if (!url) return null;
  
  // Match for youtube.com/watch?v=VIDEO_ID
  const regularMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (regularMatch && regularMatch[1]) {
    return regularMatch[1];
  }
  
  // Match for youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([^/?]+)/);
  if (embedMatch && embedMatch[1]) {
    return embedMatch[1];
  }
  
  return null;
}
