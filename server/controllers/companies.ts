import { Request, Response } from "express";
import { storage } from "../storage";
import { insertCompanyProfileSchema } from "@shared/schema";
import { z, ZodError } from "zod";

/**
 * Get the company profile for the authenticated user
 */
export async function getCompanyProfile(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    const profile = await storage.getCompanyProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ message: "Company profile not found" });
    }
    
    return res.json(profile);
  } catch (error) {
    console.error("Error fetching company profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Create a new company profile
 */
export async function createCompanyProfile(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    
    // Check if a profile already exists for this user
    const existingProfile = await storage.getCompanyProfile(userId);
    if (existingProfile) {
      return res.status(400).json({ message: "Company profile already exists for this user" });
    }
    
    // Validate the request body
    const profileData = insertCompanyProfileSchema.parse({
      ...req.body,
      userId
    });
    
    // Create the profile
    const profile = await storage.createCompanyProfile(profileData);
    
    return res.status(201).json(profile);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error creating company profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Update an existing company profile
 */
export async function updateCompanyProfile(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    
    // Get the existing profile
    const existingProfile = await storage.getCompanyProfile(userId);
    if (!existingProfile) {
      return res.status(404).json({ message: "Company profile not found" });
    }
    
    // Update the profile
    const updatedProfile = await storage.updateCompanyProfile(userId, req.body);
    
    return res.json(updatedProfile);
  } catch (error) {
    console.error("Error updating company profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
