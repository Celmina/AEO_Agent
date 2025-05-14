import { Request, Response } from "express";
import { storage } from "../storage";
import { insertWebsiteSchema, chatbots } from "@shared/schema";
import { randomBytes } from "crypto";
import { z, ZodError } from "zod";
import { db } from "../db";

/**
 * Get all websites for the authenticated user
 */
export async function getWebsites(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    const websites = await storage.getWebsites(userId);
    return res.json(websites);
  } catch (error) {
    console.error("Error fetching websites:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get a specific website by ID
 */
export async function getWebsite(req: Request, res: Response) {
  try {
    const websiteId = parseInt(req.params.id);
    if (isNaN(websiteId)) {
      return res.status(400).json({ message: "Invalid website ID" });
    }
    
    const website = await storage.getWebsite(websiteId);
    if (!website) {
      return res.status(404).json({ message: "Website not found" });
    }
    
    // Check if the website belongs to the authenticated user
    const userId = (req.user as any).id;
    if (website.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to access this website" });
    }
    
    return res.json(website);
  } catch (error) {
    console.error("Error fetching website:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Create a new website
 */
export async function createWebsite(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    
    // Validate the request body
    const websiteData = insertWebsiteSchema.parse({
      ...req.body,
      userId,
      siteId: `site_${randomBytes(6).toString('hex')}` // Generate a unique site ID
    });
    
    // Check if a website with the same domain already exists for this user
    const existingWebsite = await storage.getWebsiteByDomain(websiteData.domain);
    if (existingWebsite && existingWebsite.userId === userId) {
      return res.status(400).json({ message: "You already have a website with this domain" });
    }
    
    // Create the website
    const website = await storage.createWebsite(websiteData);
    
    // Auto-create a default chatbot for this website
    try {
      const initialMessage = "Hello! How can I help you with information about our website?";
      
      await db.insert(chatbots).values({
        name: `${websiteData.domain} Chatbot`, // Use domain instead of name
        userId: userId,
        websiteId: website.id,
        initialMessage: initialMessage,
        primaryColor: "#4f46e5",  // Default primary color
        position: "bottom-right", // Default position
        collectEmail: true,       // Default to collecting emails
        status: "active",         // Set as active by default
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`Automatically created chatbot for website ${website.id}`);
    } catch (chatbotError) {
      console.error("Error creating default chatbot:", chatbotError);
      // We don't fail the request if chatbot creation fails
      // The user can still create a chatbot manually
    }
    
    return res.status(201).json(website);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error creating website:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Update an existing website
 */
export async function updateWebsite(req: Request, res: Response) {
  try {
    const websiteId = parseInt(req.params.id);
    if (isNaN(websiteId)) {
      return res.status(400).json({ message: "Invalid website ID" });
    }
    
    // Get the existing website
    const existingWebsite = await storage.getWebsite(websiteId);
    if (!existingWebsite) {
      return res.status(404).json({ message: "Website not found" });
    }
    
    // Check if the website belongs to the authenticated user
    const userId = (req.user as any).id;
    if (existingWebsite.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to update this website" });
    }
    
    // Update the website
    const updatedWebsite = await storage.updateWebsite(websiteId, req.body);
    
    return res.json(updatedWebsite);
  } catch (error) {
    console.error("Error updating website:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Delete a website
 */
export async function deleteWebsite(req: Request, res: Response) {
  try {
    const websiteId = parseInt(req.params.id);
    if (isNaN(websiteId)) {
      return res.status(400).json({ message: "Invalid website ID" });
    }
    
    // Get the existing website
    const existingWebsite = await storage.getWebsite(websiteId);
    if (!existingWebsite) {
      return res.status(404).json({ message: "Website not found" });
    }
    
    // Check if the website belongs to the authenticated user
    const userId = (req.user as any).id;
    if (existingWebsite.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to delete this website" });
    }
    
    // Delete the website
    await storage.deleteWebsite(websiteId);
    
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting website:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}