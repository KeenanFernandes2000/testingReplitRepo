import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuthRoutes } from "./auth";
import { setupYouTubeRoutes } from "./youtube";
import session from "express-session";
import passport from "passport";
import { pgSession } from "./storage";
import { db } from "@db";
import { 
  users, vlogs, vlogLikes, follows, comments, tags, vlogTags, 
  insertVlogSchema, insertCommentSchema 
} from "@shared/schema";
import { and, count, desc, eq, gt, sql } from "drizzle-orm";
import { addDays } from "date-fns";
import { z } from "zod";
import { ZodError } from "zod";

// Configure maximum age for session cookies (30 days)
const MAX_SESSION_AGE = 30 * 24 * 60 * 60 * 1000;

export async function registerRoutes(app: Express): Promise<Server> {
  // Session and auth setup
  app.use(session({
    store: pgSession,
    secret: process.env.SESSION_SECRET || "vlog72-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: MAX_SESSION_AGE,
      secure: process.env.NODE_ENV === "production",
    }
  }));
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Set up auth routes (Google OAuth)
  setupAuthRoutes(app);
  
  // Set up YouTube API routes
  setupYouTubeRoutes(app);
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };
  
  // User routes
  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  // Get user profile
  app.get("/api/users/:username", isAuthenticated, async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if current user is following this user
      const followData = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, req.user.id),
          eq(follows.followingId, user.id)
        )
      });
      
      const isFollowing = !!followData;
      
      res.json({ 
        user,
        isFollowing
      });
    } catch (error) {
      console.error("Error getting user profile:", error);
      res.status(500).json({ message: "Error fetching user profile" });
    }
  });
  
  // Follow/unfollow user
  app.post("/api/users/:id/follow", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      
      // Check if user exists
      const targetUser = await storage.getUserById(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if already following
      const existingFollow = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, req.user.id),
          eq(follows.followingId, userId)
        )
      });
      
      if (existingFollow) {
        return res.status(409).json({ message: "Already following this user" });
      }
      
      // Create follow relationship
      await db.insert(follows).values({
        followerId: req.user.id,
        followingId: userId
      });
      
      // Update follower and following counts
      await db.update(users)
        .set({ followersCount: sql`${users.followersCount} + 1` })
        .where(eq(users.id, userId));
        
      await db.update(users)
        .set({ followingCount: sql`${users.followingCount} + 1` })
        .where(eq(users.id, req.user.id));
      
      res.status(201).json({ message: "User followed successfully" });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Error following user" });
    }
  });
  
  app.delete("/api/users/:id/follow", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      
      // Check if follow relationship exists
      const existingFollow = await db.query.follows.findFirst({
        where: and(
          eq(follows.followerId, req.user.id),
          eq(follows.followingId, userId)
        )
      });
      
      if (!existingFollow) {
        return res.status(404).json({ message: "Not following this user" });
      }
      
      // Delete follow relationship
      await db.delete(follows).where(
        and(
          eq(follows.followerId, req.user.id),
          eq(follows.followingId, userId)
        )
      );
      
      // Update follower and following counts
      await db.update(users)
        .set({ followersCount: sql`${users.followersCount} - 1` })
        .where(eq(users.id, userId));
        
      await db.update(users)
        .set({ followingCount: sql`${users.followingCount} - 1` })
        .where(eq(users.id, req.user.id));
      
      res.status(200).json({ message: "User unfollowed successfully" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Error unfollowing user" });
    }
  });
  
  // Get users for discovery
  app.get("/api/users/discover", isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      const searchQuery = q ? String(q) : "";
      
      let usersQuery = db.query.users.findMany({
        limit: 20,
        orderBy: desc(users.id),
        where: undefined // Will be set conditionally below
      });
      
      if (searchQuery) {
        usersQuery = db.query.users.findMany({
          limit: 20,
          orderBy: desc(users.id),
          where: sql`${users.displayName} ILIKE ${'%' + searchQuery + '%'} OR ${users.username} ILIKE ${'%' + searchQuery + '%'}`
        });
      }
      
      const discoveredUsers = await usersQuery;
      
      // Check which users the current user is following
      const followingData = await db.query.follows.findMany({
        where: eq(follows.followerId, req.user.id)
      });
      
      const followingIds = new Set(followingData.map(f => f.followingId));
      
      // Augment users with isFollowing property
      const usersWithFollowingStatus = discoveredUsers
        .filter(user => user.id !== req.user.id) // Exclude current user
        .map(user => ({
          ...user,
          isFollowing: followingIds.has(user.id)
        }));
      
      res.json({ users: usersWithFollowingStatus });
    } catch (error) {
      console.error("Error discovering users:", error);
      res.status(500).json({ message: "Error fetching users for discovery" });
    }
  });
  
  // Get user's active vlogs
  app.get("/api/users/:username/vlogs/active", isAuthenticated, async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get active vlogs (not expired)
      const activeVlogs = await db.query.vlogs.findMany({
        where: and(
          eq(vlogs.userId, user.id),
          gt(vlogs.expiresAt, new Date())
        ),
        orderBy: desc(vlogs.createdAt),
        with: {
          user: true
        }
      });
      
      // Get like counts
      const vlogsWithLikes = await Promise.all(
        activeVlogs.map(async (vlog) => {
          const likeCount = await db.select({ count: count() })
            .from(vlogLikes)
            .where(eq(vlogLikes.vlogId, vlog.id));
          
          return {
            ...vlog,
            likes: likeCount[0].count
          };
        })
      );
      
      res.json({ vlogs: vlogsWithLikes });
    } catch (error) {
      console.error("Error fetching active vlogs:", error);
      res.status(500).json({ message: "Error fetching active vlogs" });
    }
  });
  
  // Get user's expired vlogs (only accessible by the owner)
  app.get("/api/users/:username/vlogs/expired", isAuthenticated, async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Ensure the user is requesting their own expired vlogs
      if (user.id !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view these vlogs" });
      }
      
      // Get expired vlogs
      const expiredVlogs = await db.query.vlogs.findMany({
        where: and(
          eq(vlogs.userId, user.id),
          sql`${vlogs.expiresAt} <= NOW()`
        ),
        orderBy: desc(vlogs.createdAt),
        with: {
          user: true
        }
      });
      
      res.json({ vlogs: expiredVlogs });
    } catch (error) {
      console.error("Error fetching expired vlogs:", error);
      res.status(500).json({ message: "Error fetching expired vlogs" });
    }
  });
  
  // Get vlogs feed
  app.get("/api/vlogs/feed", isAuthenticated, async (req, res) => {
    try {
      const { filter } = req.query;
      
      // Get the list of users that the current user is following
      const following = await db.query.follows.findMany({
        where: eq(follows.followerId, req.user.id),
        columns: {
          followingId: true
        }
      });
      
      const followingIds = following.map(f => f.followingId);
      
      // Add current user's ID to see own vlogs in feed
      followingIds.push(req.user.id);
      
      // Get active vlogs from followed users
      let vlogsQuery = db.query.vlogs.findMany({
        where: and(
          sql`${vlogs.userId} = ANY(ARRAY[${followingIds}])`,
          gt(vlogs.expiresAt, new Date())
        ),
        orderBy: desc(vlogs.createdAt),
        with: {
          user: true
        }
      });
      
      // Apply tag filter if specified
      if (filter && filter !== "all") {
        const tag = await db.query.tags.findFirst({
          where: eq(tags.name, String(filter))
        });
        
        if (tag) {
          const vlogsWithTag = await db.query.vlogTags.findMany({
            where: eq(vlogTags.tagId, tag.id),
            columns: {
              vlogId: true
            }
          });
          
          const vlogIds = vlogsWithTag.map(vt => vt.vlogId);
          
          vlogsQuery = db.query.vlogs.findMany({
            where: and(
              sql`${vlogs.userId} = ANY(ARRAY[${followingIds}])`,
              gt(vlogs.expiresAt, new Date()),
              sql`${vlogs.id} = ANY(ARRAY[${vlogIds}])`
            ),
            orderBy: desc(vlogs.createdAt),
            with: {
              user: true
            }
          });
        }
      }
      
      const feedVlogs = await vlogsQuery;
      
      // Check if current user has liked each vlog and get comments
      const vlogsWithDetails = await Promise.all(
        feedVlogs.map(async (vlog) => {
          const userLike = await db.query.vlogLikes.findFirst({
            where: and(
              eq(vlogLikes.userId, req.user.id),
              eq(vlogLikes.vlogId, vlog.id)
            )
          });
          
          const vlogComments = await db.query.comments.findMany({
            where: eq(comments.vlogId, vlog.id),
            orderBy: desc(comments.createdAt),
            with: {
              user: true
            }
          });
          
          const vlogTags = await db.query.vlogTags.findMany({
            where: eq(vlogTags.vlogId, vlog.id),
            with: {
              tag: true
            }
          });
          
          const tagNames = vlogTags.map(vt => vt.tag.name);
          
          return {
            ...vlog,
            hasLiked: !!userLike,
            comments: vlogComments,
            likes: vlog.likesCount,
            tags: tagNames
          };
        })
      );
      
      res.json({ vlogs: vlogsWithDetails });
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ message: "Error fetching feed" });
    }
  });
  
  // Get single vlog
  app.get("/api/vlogs/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const vlogId = parseInt(id);
      
      const vlog = await db.query.vlogs.findFirst({
        where: eq(vlogs.id, vlogId),
        with: {
          user: true
        }
      });
      
      if (!vlog) {
        return res.status(404).json({ message: "Vlog not found" });
      }
      
      // Check if expired
      if (new Date(vlog.expiresAt) < new Date()) {
        // Only allow the owner to view expired vlogs
        if (vlog.userId !== req.user.id) {
          return res.status(403).json({ message: "This vlog has expired" });
        }
      }
      
      // Check if user has liked the vlog
      const userLike = await db.query.vlogLikes.findFirst({
        where: and(
          eq(vlogLikes.userId, req.user.id),
          eq(vlogLikes.vlogId, vlogId)
        )
      });
      
      // Get comments
      const vlogComments = await db.query.comments.findMany({
        where: eq(comments.vlogId, vlogId),
        orderBy: desc(comments.createdAt),
        with: {
          user: true
        }
      });
      
      // Get tags
      const vlogTags = await db.query.vlogTags.findMany({
        where: eq(vlogTags.vlogId, vlogId),
        with: {
          tag: true
        }
      });
      
      const tagNames = vlogTags.map(vt => vt.tag.name);
      
      res.json({
        vlog: {
          ...vlog,
          hasLiked: !!userLike,
          comments: vlogComments,
          likes: vlog.likesCount,
          tags: tagNames
        }
      });
    } catch (error) {
      console.error("Error fetching vlog:", error);
      res.status(500).json({ message: "Error fetching vlog" });
    }
  });
  
  // Like/unlike vlog
  app.post("/api/vlogs/:id/like", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const vlogId = parseInt(id);
      
      // Check if vlog exists and is not expired
      const vlog = await db.query.vlogs.findFirst({
        where: and(
          eq(vlogs.id, vlogId),
          gt(vlogs.expiresAt, new Date())
        )
      });
      
      if (!vlog) {
        return res.status(404).json({ message: "Vlog not found or expired" });
      }
      
      // Check if already liked
      const existingLike = await db.query.vlogLikes.findFirst({
        where: and(
          eq(vlogLikes.userId, req.user.id),
          eq(vlogLikes.vlogId, vlogId)
        )
      });
      
      if (existingLike) {
        return res.status(409).json({ message: "Already liked this vlog" });
      }
      
      // Create like and update like count
      await db.insert(vlogLikes).values({
        userId: req.user.id,
        vlogId: vlogId
      });
      
      await db.update(vlogs)
        .set({ likesCount: sql`${vlogs.likesCount} + 1` })
        .where(eq(vlogs.id, vlogId));
      
      res.status(201).json({ message: "Vlog liked successfully" });
    } catch (error) {
      console.error("Error liking vlog:", error);
      res.status(500).json({ message: "Error liking vlog" });
    }
  });
  
  app.delete("/api/vlogs/:id/like", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const vlogId = parseInt(id);
      
      // Check if like exists
      const existingLike = await db.query.vlogLikes.findFirst({
        where: and(
          eq(vlogLikes.userId, req.user.id),
          eq(vlogLikes.vlogId, vlogId)
        )
      });
      
      if (!existingLike) {
        return res.status(404).json({ message: "Like not found" });
      }
      
      // Delete like and update like count
      await db.delete(vlogLikes).where(
        and(
          eq(vlogLikes.userId, req.user.id),
          eq(vlogLikes.vlogId, vlogId)
        )
      );
      
      await db.update(vlogs)
        .set({ likesCount: sql`${vlogs.likesCount} - 1` })
        .where(eq(vlogs.id, vlogId));
      
      res.status(200).json({ message: "Vlog unliked successfully" });
    } catch (error) {
      console.error("Error unliking vlog:", error);
      res.status(500).json({ message: "Error unliking vlog" });
    }
  });
  
  // Add comment to vlog
  app.post("/api/vlogs/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const vlogId = parseInt(id);
      
      // Validate request body
      const commentData = insertCommentSchema.parse({
        ...req.body,
        userId: req.user.id,
        vlogId: vlogId
      });
      
      // Check if vlog exists and is not expired
      const vlog = await db.query.vlogs.findFirst({
        where: and(
          eq(vlogs.id, vlogId),
          gt(vlogs.expiresAt, new Date())
        )
      });
      
      if (!vlog) {
        return res.status(404).json({ message: "Vlog not found or expired" });
      }
      
      // Create comment
      const [newComment] = await db.insert(comments)
        .values(commentData)
        .returning();
      
      // Get the comment with user data
      const commentWithUser = await db.query.comments.findFirst({
        where: eq(comments.id, newComment.id),
        with: {
          user: true
        }
      });
      
      res.status(201).json({ comment: commentWithUser });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Error adding comment" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
