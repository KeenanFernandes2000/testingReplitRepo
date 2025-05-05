import React, { createContext, useContext, useState, useEffect } from "react";
import { queryClient } from "./queryClient";
import { apiRequest } from "./queryClient";
import { User } from "@shared/schema";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

interface AuthContextProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (credentials: RegisterCredentials) => Promise<User>;
  signOut: () => Promise<void>;
  authError: string | null;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the current user when the app loads
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const signInWithGoogle = async () => {
    // In a real implementation, this would redirect to Google OAuth
    // This is a placeholder for the authentication flow
    try {
      setIsLoading(true);
      window.location.href = "/api/auth/google";
    } catch (error) {
      console.error("Sign in error:", error);
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<User> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      console.log("Attempting login with:", credentials.email);
      
      // Use direct fetch for better error handling
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Login failed");
      }
      
      const userData = await response.json();
      console.log("Login successful:", userData);
      
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Failed to login";
      setAuthError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const register = async (credentials: RegisterCredentials): Promise<User> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      const response = await apiRequest("POST", "/api/auth/register", credentials);
      const userData = await response.json();
      
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error) {
      console.error("Registration error:", error);
      const message = error instanceof Error ? error.message : "Failed to register";
      setAuthError(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await apiRequest("POST", "/api/auth/logout", {});
      
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear all queries
      queryClient.clear();
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue = {
    user,
    isAuthenticated,
    isLoading,
    signInWithGoogle,
    login,
    register,
    signOut,
    authError
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};