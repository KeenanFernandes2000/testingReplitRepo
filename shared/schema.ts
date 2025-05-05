import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"), // For local authentication
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  googleId: text("google_id").unique(), // Made optional for local auth
  googleAccessToken: text("google_access_token"),
  googleRefreshToken: text("google_refresh_token"),
  googleTokenExpiry: timestamp("google_token_expiry"),
  youtubeChannelId: text("youtube_channel_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  followersCount: integer("followers_count").default(0).notNull(),
  followingCount: integer("following_count").default(0).notNull(),
});

// Vlogs table
export const vlogs = pgTable("vlogs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  youtubeId: text("youtube_id").notNull().unique(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  duration: text("duration").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
});

// Tags for vlogs
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

// Vlogs to tags many-to-many relation
export const vlogTags = pgTable("vlog_tags", {
  vlogId: integer("vlog_id").references(() => vlogs.id).notNull(),
  tagId: integer("tag_id").references(() => tags.id).notNull(),
});

// Followers relation
export const follows = pgTable("follows", {
  followerId: integer("follower_id").references(() => users.id).notNull(),
  followingId: integer("following_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Likes for vlogs
export const vlogLikes = pgTable("vlog_likes", {
  userId: integer("user_id").references(() => users.id).notNull(),
  vlogId: integer("vlog_id").references(() => vlogs.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Comments for vlogs
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  vlogId: integer("vlog_id").references(() => vlogs.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  vlogs: many(vlogs),
  comments: many(comments),
  givenLikes: many(vlogLikes),
  following: many(follows, { relationName: "following" }),
  followers: many(follows, { relationName: "followers" }),
}));

export const vlogsRelations = relations(vlogs, ({ one, many }) => ({
  user: one(users, { fields: [vlogs.userId], references: [users.id] }),
  likes: many(vlogLikes),
  comments: many(comments),
  tags: many(vlogTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  vlogs: many(vlogTags),
}));

export const vlogTagsRelations = relations(vlogTags, ({ one }) => ({
  vlog: one(vlogs, { fields: [vlogTags.vlogId], references: [vlogs.id] }),
  tag: one(tags, { fields: [vlogTags.tagId], references: [tags.id] }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, { fields: [follows.followerId], references: [users.id], relationName: "following" }),
  following: one(users, { fields: [follows.followingId], references: [users.id], relationName: "followers" }),
}));

export const vlogLikesRelations = relations(vlogLikes, ({ one }) => ({
  user: one(users, { fields: [vlogLikes.userId], references: [users.id] }),
  vlog: one(vlogs, { fields: [vlogLikes.vlogId], references: [vlogs.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, { fields: [comments.userId], references: [users.id] }),
  vlog: one(vlogs, { fields: [comments.vlogId], references: [vlogs.id] }),
}));

// Validation schemas
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertVlogSchema = createInsertSchema(vlogs);
export const selectVlogSchema = createSelectSchema(vlogs);

export const insertCommentSchema = createInsertSchema(comments);
export const selectCommentSchema = createSelectSchema(comments);

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Vlog = typeof vlogs.$inferSelect;
export type InsertVlog = typeof vlogs.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = typeof comments.$inferInsert;

export type Follow = typeof follows.$inferSelect;
export type VlogLike = typeof vlogLikes.$inferSelect;
export type Tag = typeof tags.$inferSelect;
