import { Request, Response } from "express";
import { db } from "../db";
import { aeoContent, websites } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { log } from "../vite";

/**
 * Get all AEO content for the authenticated user
 */
export async function getAeoContent(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    
    // Fetch all AEO content for the user
    const userAeoContent = await db.select()
      .from(aeoContent)
      .where(eq(aeoContent.userId, userId))
      .orderBy(aeoContent.createdAt);
    
    return res.json(userAeoContent);
  } catch (error) {
    log(`Error fetching AEO content: ${error}`, 'error');
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get a specific AEO content by ID
 */
export async function getAeoContentById(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    const contentId = parseInt(req.params.id);
    
    if (isNaN(contentId)) {
      return res.status(400).json({ message: "Invalid content ID" });
    }
    
    // Fetch the specific AEO content for the user
    const [content] = await db.select()
      .from(aeoContent)
      .where(and(
        eq(aeoContent.id, contentId),
        eq(aeoContent.userId, userId)
      ));
    
    if (!content) {
      return res.status(404).json({ message: "AEO content not found" });
    }
    
    return res.json(content);
  } catch (error) {
    log(`Error fetching AEO content by ID: ${error}`, 'error');
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Update a specific AEO content
 */
export async function updateAeoContent(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    const contentId = parseInt(req.params.id);
    const { answer } = req.body;
    
    if (isNaN(contentId)) {
      return res.status(400).json({ message: "Invalid content ID" });
    }
    
    // Verify the content exists and belongs to the user
    const [existingContent] = await db.select()
      .from(aeoContent)
      .where(and(
        eq(aeoContent.id, contentId),
        eq(aeoContent.userId, userId)
      ));
    
    if (!existingContent) {
      return res.status(404).json({ message: "AEO content not found" });
    }
    
    // Update the answer
    const [updatedContent] = await db
      .update(aeoContent)
      .set({ 
        answer: answer || existingContent.answer,
        updatedAt: new Date()
      })
      .where(eq(aeoContent.id, contentId))
      .returning();
    
    return res.json(updatedContent);
  } catch (error) {
    log(`Error updating AEO content: ${error}`, 'error');
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Approve an AEO content item
 */
export async function approveAeoContent(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    const contentId = parseInt(req.params.id);
    
    if (isNaN(contentId)) {
      return res.status(400).json({ message: "Invalid content ID" });
    }
    
    // Verify the content exists and belongs to the user
    const [existingContent] = await db.select()
      .from(aeoContent)
      .where(and(
        eq(aeoContent.id, contentId),
        eq(aeoContent.userId, userId)
      ));
    
    if (!existingContent) {
      return res.status(404).json({ message: "AEO content not found" });
    }
    
    // Update the status to approved
    const [approvedContent] = await db
      .update(aeoContent)
      .set({ 
        status: 'approved',
        updatedAt: new Date()
      })
      .where(eq(aeoContent.id, contentId))
      .returning();
    
    return res.json(approvedContent);
  } catch (error) {
    log(`Error approving AEO content: ${error}`, 'error');
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Reject an AEO content item
 */
export async function rejectAeoContent(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    const contentId = parseInt(req.params.id);
    
    if (isNaN(contentId)) {
      return res.status(400).json({ message: "Invalid content ID" });
    }
    
    // Verify the content exists and belongs to the user
    const [existingContent] = await db.select()
      .from(aeoContent)
      .where(and(
        eq(aeoContent.id, contentId),
        eq(aeoContent.userId, userId)
      ));
    
    if (!existingContent) {
      return res.status(404).json({ message: "AEO content not found" });
    }
    
    // Update the status to rejected
    const [rejectedContent] = await db
      .update(aeoContent)
      .set({ 
        status: 'rejected',
        updatedAt: new Date()
      })
      .where(eq(aeoContent.id, contentId))
      .returning();
    
    return res.json(rejectedContent);
  } catch (error) {
    log(`Error rejecting AEO content: ${error}`, 'error');
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Publish an AEO content item to the website
 */
export async function publishAeoContent(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    const contentId = parseInt(req.params.id);
    
    if (isNaN(contentId)) {
      return res.status(400).json({ message: "Invalid content ID" });
    }
    
    // Verify the content exists, belongs to the user, and is approved
    const [existingContent] = await db.select()
      .from(aeoContent)
      .where(and(
        eq(aeoContent.id, contentId),
        eq(aeoContent.userId, userId),
        eq(aeoContent.status, 'approved')
      ));
    
    if (!existingContent) {
      return res.status(404).json({ 
        message: "Content not found or not in an approved state"
      });
    }
    
    // Verify the website exists
    const [website] = await db.select()
      .from(websites)
      .where(eq(websites.id, existingContent.websiteId));
    
    if (!website) {
      return res.status(404).json({ message: "Associated website not found" });
    }
    
    // Update the status to published and mark as added to website
    const [publishedContent] = await db
      .update(aeoContent)
      .set({ 
        status: 'published',
        addedToWebsite: true,
        updatedAt: new Date()
      })
      .where(eq(aeoContent.id, contentId))
      .returning();
    
    // In a real implementation, this would trigger a process to add the content
    // to the website with proper schema markup
    
    return res.json({
      ...publishedContent,
      message: "Content has been published to your website"
    });
  } catch (error) {
    log(`Error publishing AEO content: ${error}`, 'error');
    return res.status(500).json({ message: "Internal server error" });
  }
}