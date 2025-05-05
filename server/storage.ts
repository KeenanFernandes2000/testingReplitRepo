import { db } from "@db";
import { pool } from "@db";
import { users, vlogs, follows, vlogLikes, comments, User } from "@shared/schema";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// Session store
const PgSession = connectPgSimple(session);

export const pgSession = new PgSession({
  pool,
  tableName: "session",
  createTableIfMissing: true
});

export const storage = {
  // User operations
  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },
  
  async getUserById(id: number): Promise<User | null> {
    return await db.query.users.findFirst({
      where: eq(users.id, id)
    });
  },
  
  async getUserByEmail(email: string): Promise<User | null> {
    return await db.query.users.findFirst({
      where: eq(users.email, email)
    });
  },
  
  async getUserByUsername(username: string): Promise<User | null> {
    return await db.query.users.findFirst({
      where: eq(users.username, username)
    });
  },
  
  async getUserByGoogleId(googleId: string): Promise<User | null> {
    return await db.query.users.findFirst({
      where: eq(users.googleId, googleId)
    });
  },
  
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  },
  
  // YouTube token operations
  async updateGoogleTokens(
    userId: number, 
    accessToken: string, 
    refreshToken: string | null, 
    expiryDate: Date
  ): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken,
        googleTokenExpiry: expiryDate
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  },
  
  // Check if token needs refreshing
  isTokenExpired(expiryDate: Date | null): boolean {
    if (!expiryDate) return true;
    
    // Add some buffer (5 minutes) to ensure we refresh before it actually expires
    const bufferTime = 5 * 60 * 1000; 
    return new Date(expiryDate.getTime() - bufferTime) <= new Date();
  },
  
  // Vlog operations
  async createVlog(vlogData: any): Promise<any> {
    const [newVlog] = await db.insert(vlogs).values(vlogData).returning();
    return newVlog;
  },
  
  // Expire old vlogs (called by a scheduled job)
  async expireOldVlogs(): Promise<number> {
    const now = new Date();
    const result = await db
      .update(vlogs)
      .set({ expiresAt: now })
      .where(eq(vlogs.expiresAt, new Date(now.getTime() + 72 * 60 * 60 * 1000)));
    
    return result.rowCount || 0;
  }
};
