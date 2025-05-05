import type { Express } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

// Passport user serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await storage.getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export function setupAuthRoutes(app: Express) {
  // Get the app URL from environment or use the Replit domain
  const appHost = process.env.REPLIT_SLUG 
    ? `https://${process.env.REPLIT_SLUG}.${process.env.REPLIT_DOMAIN}`
    : process.env.APP_URL || "http://localhost:5000";
    
  // Configure Google Strategy
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: `${appHost}/api/auth/google/callback`,
    scope: ["profile", "email", "https://www.googleapis.com/auth/youtube.upload"]
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (user) {
        // Update OAuth tokens
        user = await storage.updateGoogleTokens(
          user.id,
          accessToken,
          refreshToken || user.googleRefreshToken,
          new Date(Date.now() + 3600 * 1000) // Token expires in 1 hour
        );
      } else {
        // Create new user
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : "";
        const displayName = profile.displayName || "";
        
        // Create a username from email or name
        let username = email.split("@")[0];
        // Make username URL-friendly and unique
        username = username.toLowerCase().replace(/[^a-z0-9]/g, "");
        
        // Check if username exists, append random numbers if needed
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          username = `${username}${Math.floor(Math.random() * 10000)}`;
        }
        
        user = await storage.createUser({
          googleId: profile.id,
          email,
          username,
          displayName,
          avatarUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken,
          googleTokenExpiry: new Date(Date.now() + 3600 * 1000),
          followersCount: 0,
          followingCount: 0
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error as Error);
    }
  }));
  
  // Google OAuth routes
  app.get("/api/auth/google", passport.authenticate("google"));
  
  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { 
      failureRedirect: "/auth?error=google_auth_failed"
    }),
    (req, res) => {
      // Successful authentication, redirect home
      res.redirect("/");
    }
  );
  
  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}
