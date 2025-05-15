import { Request, Response } from "express";
import { storage } from "../storage";
import { insertWebsiteSchema, chatbots } from "@shared/schema";
import { randomBytes } from "crypto";
import { z, ZodError } from "zod";
import { db, pool } from "../db";
import { scrapeWebsite } from "../services/websiteScraperService";
import { log } from "../vite";
import { eq, sql } from "drizzle-orm";

/**
 * Helper function to extract readable domain name from URL
 */
function extractDomainName(url: string): string {
  try {
    // Remove protocol if present
    let domain = url.replace(/(^\w+:|^)\/\//, '');
    // Remove www if present
    domain = domain.replace(/^www\./, '');
    // Remove path if present
    domain = domain.split('/')[0];
    // Remove query params and hash if present
    domain = domain.split('?')[0].split('#')[0];
    
    // Extract domain name without TLD
    const parts = domain.split('.');
    if (parts.length >= 2) {
      return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
    }
    
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch (e) {
    // Return original domain if error
    return url;
  }
}

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
    
    // Start website scraping in the background
    try {
      log(`Starting website scraping for ${websiteData.domain}`, 'website');
      
      // Update the website status to 'scraping' to indicate the process has started
      await pool.query(`
        UPDATE websites 
        SET status = $1
        WHERE id = $2
      `, ['scraping', website.id]);
      
      // Run scraper in the background (don't await) - add a larger delay to ensure DB operations complete
      setTimeout(async () => {
        try {
          // First verify the website exists in the database
          const checkResult = await pool.query(`
            SELECT id FROM websites WHERE id = $1
          `, [website.id]);
          
          if (!checkResult.rows || checkResult.rows.length === 0) {
            log(`Website record not yet available in database, retrying in 1s...`, 'website');
            // Try again with a longer delay if the website record isn't ready
            setTimeout(async () => {
              try {
                const result = await scrapeWebsite(websiteData.domain, website.id);
                
                // Update the website status after scraping completes
                if (result) {
                  await pool.query(`
                    UPDATE websites 
                    SET status = $1
                    WHERE id = $2
                  `, ['active', website.id]);
                  
                  log(`Successfully scraped website: ${websiteData.domain}`, 'website');
                } else {
                  await pool.query(`
                    UPDATE websites 
                    SET status = $1
                    WHERE id = $2
                  `, ['error', website.id]);
                  
                  log(`Failed to scrape website: ${websiteData.domain}`, 'error');
                }
              } catch (retryError) {
                log(`Error in retry scraping: ${retryError}`, 'error');
              }
            }, 1000);
            return;
          }
          
          // If we get here, the website record is available
          const result = await scrapeWebsite(websiteData.domain, website.id);
          
          // Update the website status after scraping completes
          if (result) {
            await pool.query(`
              UPDATE websites 
              SET status = $1
              WHERE id = $2
            `, ['active', website.id]);
            
            log(`Successfully scraped website: ${websiteData.domain}`, 'website');
          } else {
            await pool.query(`
              UPDATE websites 
              SET status = $1
              WHERE id = $2
            `, ['error', website.id]);
            
            log(`Failed to scrape website: ${websiteData.domain}`, 'error');
          }
        } catch (e) {
          // Update status to reflect the error
          await pool.query(`
            UPDATE websites 
            SET status = $1
            WHERE id = $2
          `, ['error', website.id]);
          
          log(`Error in background scraping: ${e}`, 'error');
        }
      }, 500);
    } catch (scraperError) {
      log(`Error initiating website scraper: ${scraperError}`, 'error');
      // Continue anyway - scraping failure shouldn't block website creation
    }
    
    // Helper function to create the default chatbot
    const createDefaultChatbot = async (
      websiteData: any, 
      userId: number, 
      websiteId: number
    ) => {
      // Create chatbot with dynamic info based on website name
      const siteName = websiteData.name || extractDomainName(websiteData.domain);
      const initialMessage = `Hello! How can I help you with information about ${siteName}?`;
      
      // After website creation, set up the default chatbot
      // Use the raw pool query to ensure it works consistently
      const query = `
        INSERT INTO chatbots 
        (name, user_id, website_id, initial_message, primary_color, position, collect_email, status, created_at, updated_at)
        VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id`;
        
      const values = [
        `${siteName} Assistant`,
        userId,
        websiteId,
        initialMessage,
        "#4f46e5",  // Default primary color
        "bottom-right", // Default position
        true,       // Default to collecting emails
        "active",   // Set as active by default
        new Date(),
        new Date()
      ];
      
      // Execute direct query to avoid ORM-specific issues
      const result = await pool.query(query, values);
      
      log(`Automatically created chatbot for website ${websiteId}`, 'website');
    };
    
    // Auto-create a default chatbot for this website (with delay to ensure website record exists)
    setTimeout(async () => {
      try {
        // Check if website exists
        const checkWebsite = await pool.query(`
          SELECT id FROM websites WHERE id = $1
        `, [website.id]);
        
        if (!checkWebsite.rows || checkWebsite.rows.length === 0) {
          log(`Website record not ready for chatbot creation, trying again in 1s...`, 'website');
          // Try again with a longer delay
          setTimeout(async () => {
            try {
              await createDefaultChatbot(websiteData, userId, website.id);
            } catch (retryError) {
              log(`Error in retry chatbot creation: ${retryError}`, 'error');
            }
          }, 1000);
          return;
        }
        
        // Website exists, create the chatbot
        await createDefaultChatbot(websiteData, userId, website.id);
      } catch (chatbotError) {
        log(`Error creating default chatbot: ${chatbotError}`, 'error');
      }
    }, 500);
    
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