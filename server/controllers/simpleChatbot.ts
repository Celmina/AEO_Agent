import { Request, Response } from 'express';
import { storage } from '../storage';
import { log } from '../vite';
import { generateChatbotResponse } from '../services/simpleChatbotService';

/**
 * Create a chat session for the simplified chatbot
 */
export async function createSimpleChatSession(req: Request, res: Response) {
  try {
    const { websiteId, visitorId } = req.body;
    
    if (!websiteId || !visitorId) {
      return res.status(400).json({ 
        message: "Missing required fields: websiteId and visitorId are required" 
      });
    }
    
    // Get the website to find associated company
    const website = await storage.getWebsite(Number(websiteId));
    if (!website) {
      return res.status(404).json({ message: "Website not found" });
    }
    
    // Get chatbot for this website
    const chatbots = await storage.getChatbotsByWebsiteId(website.id);
    const chatbot = chatbots && chatbots.length > 0 ? chatbots[0] : null;
    
    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found for this website" });
    }
    
    // Create a new session ID (this would normally be stored in DB)
    const sessionId = `session_${Math.random().toString(36).substring(2, 15)}`;
    
    // Return the session info
    return res.status(200).json({
      sessionId,
      chatbotId: chatbot.id,
      initialMessage: chatbot.initialMessage || "Hello! How can I help you today?"
    });
  } catch (error) {
    log(`Error creating chat session: ${error}`, 'error');
    return res.status(500).json({ message: "Failed to create chat session" });
  }
}

/**
 * Send a message to the simplified chatbot
 */
export async function sendSimpleMessage(req: Request, res: Response) {
  try {
    const { sessionId, message, visitorId, websiteId } = req.body;
    
    if (!sessionId || !message || !visitorId || !websiteId) {
      return res.status(400).json({ 
        message: "Missing required fields: sessionId, message, visitorId, and websiteId are required" 
      });
    }
    
    // Get the website
    const website = await storage.getWebsite(Number(websiteId));
    if (!website) {
      return res.status(404).json({ message: "Website not found" });
    }
    
    // Get the company profile for this website's owner
    const companyProfile = await storage.getCompanyProfile(website.userId);
    
    // If no company profile exists, use basic info
    const companyInfo = companyProfile || {
      companyName: website.name || "Our Company",
      industry: "Not specified",
      targetAudience: "General audience",
      brandVoice: "Professional",
      services: "Not specified",
      valueProposition: "Not specified"
    };
    
    // Get previous messages (in a real implementation, this would come from the database)
    // For simplicity, we'll just use the current message
    const previousMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    
    // Generate AI response
    const response = await generateChatbotResponse(message, companyInfo, previousMessages);
    
    // Return the response
    return res.status(200).json({
      message: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    log(`Error sending message: ${error}`, 'error');
    return res.status(500).json({ message: "Failed to process message" });
  }
}