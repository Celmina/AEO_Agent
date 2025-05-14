import { Request, Response } from "express";
import { storage } from "../storage";
import { insertUserSchema } from "@shared/schema";
import passport from "passport";
import { z, ZodError } from "zod";

/**
 * Register a new user
 */
export async function register(req: Request, res: Response) {
  try {
    // Validate the request body
    const userData = insertUserSchema.parse(req.body);
    
    // Check if the user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }
    
    // Create the user
    const user = await storage.createUser(userData);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    // Automatically log the user in
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging in after registration" });
      }
      return res.status(201).json(userWithoutPassword);
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Login a user
 */
export function login(req: Request, res: Response) {
  passport.authenticate("local", (err: any, user: any, info: any) => {
    if (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
    
    if (!user) {
      return res.status(401).json({ message: info?.message || "Invalid credentials" });
    }
    
    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error during login" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      return res.json(userWithoutPassword);
    });
  })(req, res);
}

/**
 * Logout a user
 */
export function logout(req: Request, res: Response) {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: "Error during logout" });
    }
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error destroying session" });
      }
      res.clearCookie("connect.sid");
      return res.json({ message: "Logged out successfully" });
    });
  });
}

/**
 * Get the current user
 */
export function getCurrentUser(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  // Remove password from response
  const { password, ...userWithoutPassword } = req.user as any;
  
  return res.json(userWithoutPassword);
}
