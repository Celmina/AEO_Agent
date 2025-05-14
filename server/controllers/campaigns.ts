import { Request, Response } from "express";
import { storage } from "../storage";
import { insertCampaignSchema } from "@shared/schema";
import { z, ZodError } from "zod";

/**
 * Get all campaigns for the authenticated user
 */
export async function getCampaigns(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    const campaigns = await storage.getCampaigns(userId);
    return res.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get a specific campaign by ID
 */
export async function getCampaign(req: Request, res: Response) {
  try {
    const campaignId = parseInt(req.params.id);
    if (isNaN(campaignId)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }
    
    const campaign = await storage.getCampaign(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    
    // Check if the campaign belongs to the authenticated user
    const userId = (req.user as any).id;
    if (campaign.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to access this campaign" });
    }
    
    return res.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Create a new campaign
 */
export async function createCampaign(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    
    // Validate the request body
    const campaignData = insertCampaignSchema.parse({
      ...req.body,
      userId
    });
    
    // Create the campaign
    const campaign = await storage.createCampaign(campaignData);
    
    return res.status(201).json(campaign);
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error creating campaign:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(req: Request, res: Response) {
  try {
    const campaignId = parseInt(req.params.id);
    if (isNaN(campaignId)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }
    
    // Get the existing campaign
    const existingCampaign = await storage.getCampaign(campaignId);
    if (!existingCampaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    
    // Check if the campaign belongs to the authenticated user
    const userId = (req.user as any).id;
    if (existingCampaign.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to update this campaign" });
    }
    
    // Update the campaign
    const updatedCampaign = await storage.updateCampaign(campaignId, req.body);
    
    return res.json(updatedCampaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(req: Request, res: Response) {
  try {
    const campaignId = parseInt(req.params.id);
    if (isNaN(campaignId)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }
    
    // Get the existing campaign
    const existingCampaign = await storage.getCampaign(campaignId);
    if (!existingCampaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }
    
    // Check if the campaign belongs to the authenticated user
    const userId = (req.user as any).id;
    if (existingCampaign.userId !== userId) {
      return res.status(403).json({ message: "You don't have permission to delete this campaign" });
    }
    
    // Delete the campaign
    await storage.deleteCampaign(campaignId);
    
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
