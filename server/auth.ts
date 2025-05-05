import type { Express } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { eq } from "drizzle-orm";

// Helper functions for local authentication
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

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
  // Configure Local Strategy for username/password login
  passport.use(new LocalStrategy(
    { 
      usernameField: 'email',
    },
    async (email, password, done) => {
      try {
        // Find user with the given email
        const user = await storage.getUserByEmail(email);
        
        // If user doesn't exist or password is not set
        if (!user || !user.password) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        // Check if the password matches
        const isPasswordValid = await comparePasswords(password, user.password);
        if (!isPasswordValid) {
          return done(null, false, { message: 'Invalid email or password' });
        }
        
        // All good, return user
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
  
  // Configure Google Strategy with a relative callback URL
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackURL: "/api/auth/google/callback",
    scope: ["profile", "email"]
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
  
  // Local authentication routes
  // Register a new user
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, password, displayName } = req.body;
      
      console.log("Registration attempt:", { email, username, displayName });
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create the user
      const user = await storage.createUser({
        email,
        username,
        displayName,
        password: hashedPassword,
        followersCount: 0,
        followingCount: 0
      });
      
      console.log("User created:", user.id);
      
      // Log the user in
      req.login(user, (err) => {
        if (err) {
          console.error("Login error after registration:", err);
          return res.status(500).json({ message: "Error logging in after registration" });
        }
        return res.status(201).json(user);
      });
      
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Server error during registration" });
    }
  });
  
  // Login with email and password
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: any, info: { message: string } | undefined) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (loginErr: Error | null) => {
        if (loginErr) {
          return next(loginErr);
        }
        return res.json(user);
      });
    })(req, res, next);
  });
  
  // Get current authenticated user
  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    return res.status(401).json({ message: "Not authenticated" });
  });
  
  // Logout route
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err: Error | null) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}
