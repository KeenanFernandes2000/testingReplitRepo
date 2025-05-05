import type { Express } from "express";
import { google, youtube_v3 } from "googleapis";
import { storage } from "./storage";
import { db } from "@db";
import { vlogs, vlogTags, tags, insertVlogSchema } from "@shared/schema";
import { addDays } from "date-fns";
import { ZodError } from "zod";
import { eq } from "drizzle-orm";

// Constants
const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.upload";
const VIDEO_EXPIRATION_HOURS = 72;

// Function to get a configured OAuth2 client for a user
async function getOAuth2Client(userId: number) {
  const user = await storage.getUserById(userId);
  
  if (!user || !user.googleAccessToken) {
    throw new Error("User not found or missing Google credentials");
  }
  
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL || "http://localhost:5000"}/api/auth/google/callback`
  );
  
  // Set credentials
  oauth2Client.setCredentials({
    access_token: user.googleAccessToken,
    refresh_token: user.googleRefreshToken,
    expiry_date: user.googleTokenExpiry ? user.googleTokenExpiry.getTime() : undefined
  });
  
  // Check if token needs refreshing
  if (user.googleTokenExpiry && storage.isTokenExpired(user.googleTokenExpiry)) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await storage.updateGoogleTokens(
        user.id,
        credentials.access_token!,
        credentials.refresh_token || user.googleRefreshToken,
        new Date(credentials.expiry_date!)
      );
      
      // Update the client with fresh credentials
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw new Error("Failed to refresh YouTube access token");
    }
  }
  
  return oauth2Client;
}

export function setupYouTubeRoutes(app: Express) {
  // Route to get upload URL
  app.post("/api/vlogs/presigned", async (req: any, res) => {
    // This is just a placeholder since we're not using direct upload
    // In a real implementation, this would generate a presigned URL for S3/GCS
    res.json({
      uploadUrl: "#", // Not used since we're uploading directly to YouTube
      fileKey: Date.now().toString() // Simple unique identifier
    });
  });
  
  // Route to initiate YouTube upload
  app.post("/api/vlogs/upload", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { title, description, tags: tagNames, fileKey } = req.body;
      
      if (!title) {
        return res.status(400).json({ message: "Title is required" });
      }
      
      // Validate YouTube OAuth access
      const oauth2Client = await getOAuth2Client(req.user.id);
      const youtube = google.youtube({ version: "v3", auth: oauth2Client });
      
      // In a real implementation, we would now either:
      // 1. Have the client upload directly to YouTube using the OAuth token
      // 2. Upload a file that was previously uploaded to our server to YouTube
      
      // For this prototype, we'll simulate a successful upload and create a placeholder
      // YouTube video that would expire after 72 hours
      
      // These would be the actual parameters for a real YouTube upload
      const videoParams: youtube_v3.Params$Resource$Videos$Insert = {
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title,
            description,
            tags: tagNames,
            categoryId: "22" // People & Blogs category
          },
          status: {
            privacyStatus: "unlisted" // Make the video unlisted on YouTube
          }
        },
        // In a real implementation, we would have:
        // media: {
        //   body: fs.createReadStream(filePath)
        // }
      };
      
      // For our prototype, we'll use a placeholder video ID
      // In a real implementation, this would come from the YouTube API response
      const mockYouTubeId = `youtube_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const mockThumbnailUrl = `https://i.ytimg.com/vi/default/hqdefault.jpg`;
      const mockDuration = "10:30"; // Placeholder duration
      
      // Calculate expiration date (72 hours from now)
      const expiresAt = addDays(new Date(), 3); // 72 hours = 3 days
      
      // Create vlog record in database
      const vlogData = {
        userId: req.user.id,
        title,
        description,
        youtubeId: mockYouTubeId, // In real app, from YouTube API response
        thumbnailUrl: mockThumbnailUrl, // In real app, from YouTube API
        duration: mockDuration, // In real app, from YouTube API
        expiresAt,
        likesCount: 0
      };
      
      // Validate vlog data
      const validatedVlogData = insertVlogSchema.parse(vlogData);
      
      // Insert vlog into database
      const [newVlog] = await db.insert(vlogs).values(validatedVlogData).returning();
      
      // Process tags
      if (Array.isArray(tagNames) && tagNames.length > 0) {
        for (const tagName of tagNames) {
          // Find or create tag
          let tag = await db.query.tags.findFirst({
            where: eq(tags.name, tagName)
          });
          
          if (!tag) {
            const [newTag] = await db.insert(tags).values({ name: tagName }).returning();
            tag = newTag;
          }
          
          // Associate tag with vlog
          await db.insert(vlogTags).values({
            vlogId: newVlog.id,
            tagId: tag.id
          });
        }
      }
      
      // In a real application, we'd fetch additional details from YouTube API
      // and update the vlog record with accurate information
      
      res.status(201).json({
        message: "Vlog uploaded successfully",
        vlog: newVlog
      });
      
    } catch (error) {
      console.error("Upload error:", error);
      
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid vlog data", 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: "Failed to upload vlog to YouTube",
        error: (error as Error).message
      });
    }
  });
  
  // Route to get YouTube video details
  app.get("/api/vlogs/:id/youtube-details", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { id } = req.params;
      const vlogId = parseInt(id);
      
      // Get vlog from database
      const vlog = await db.query.vlogs.findFirst({
        where: eq(vlogs.id, vlogId),
      });
      
      if (!vlog) {
        return res.status(404).json({ message: "Vlog not found" });
      }
      
      // Check if user is authorized to see this vlog
      if (vlog.userId !== req.user.id) {
        // For non-owners, check if vlog has expired
        if (new Date(vlog.expiresAt) < new Date()) {
          return res.status(403).json({ message: "This vlog has expired" });
        }
        
        // For non-owners, check if user is following the vlog owner
        // This check would be implemented here in a full app
      }
      
      // Get OAuth client for the vlog owner (not current user)
      const oauth2Client = await getOAuth2Client(vlog.userId);
      const youtube = google.youtube({ version: "v3", auth: oauth2Client });
      
      // In a real implementation, we'd fetch current details from YouTube
      // For now, return the stored data
      res.json({
        youtubeId: vlog.youtubeId,
        thumbnailUrl: vlog.thumbnailUrl,
        duration: vlog.duration,
        // Additional fields from YouTube API would be included here
      });
      
    } catch (error) {
      console.error("Error fetching YouTube details:", error);
      res.status(500).json({ 
        message: "Failed to get YouTube video details",
        error: (error as Error).message
      });
    }
  });
  
  // Route to reupload an expired vlog
  app.post("/api/vlogs/:id/reupload", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { id } = req.params;
      const vlogId = parseInt(id);
      
      // Get vlog from database
      const vlog = await db.query.vlogs.findFirst({
        where: eq(vlogs.id, vlogId),
      });
      
      if (!vlog) {
        return res.status(404).json({ message: "Vlog not found" });
      }
      
      // Check if user is the owner
      if (vlog.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to reupload this vlog" });
      }
      
      // Check if vlog is expired
      if (new Date(vlog.expiresAt) > new Date()) {
        return res.status(400).json({ message: "This vlog hasn't expired yet" });
      }
      
      // Calculate new expiration date (72 hours from now)
      const newExpiresAt = addDays(new Date(), 3);
      
      // Update vlog record with new expiration date
      const [updatedVlog] = await db
        .update(vlogs)
        .set({ expiresAt: newExpiresAt })
        .where(eq(vlogs.id, vlogId))
        .returning();
      
      res.json({
        message: "Vlog reuploaded successfully",
        vlog: updatedVlog
      });
      
    } catch (error) {
      console.error("Reupload error:", error);
      res.status(500).json({ 
        message: "Failed to reupload vlog",
        error: (error as Error).message
      });
    }
  });
  
  // Setup scheduled job to expire old vlogs
  // In a production app, this would be a cron job
  setInterval(async () => {
    try {
      const expiredCount = await storage.expireOldVlogs();
      if (expiredCount > 0) {
        console.log(`Expired ${expiredCount} vlogs`);
      }
    } catch (error) {
      console.error("Error expiring vlogs:", error);
    }
  }, 60 * 60 * 1000); // Check every hour
}
