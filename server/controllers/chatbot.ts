import { Request, Response } from 'express';
import { db } from '../db';
import { chatbots, chatSessions, chatMessages, aeoContent, websites, companyProfiles } from '@shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { generateAIResponse } from '../services/perplexityService';
import { log } from '../vite';

/**
 * Create a new chatbot for a website
 */
export async function createChatbot(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const { websiteId, ...chatbotData } = req.body;
    
    // Check if the website belongs to the user
    const website = await db.query.websites.findFirst({
      where: and(
        eq(websites.id, websiteId),
        eq(websites.userId, userId)
      )
    });

    if (!website) {
      return res.status(404).json({ message: 'Website not found or not owned by you' });
    }

    // Check if a chatbot already exists for this website
    const existingChatbot = await db.query.chatbots.findFirst({
      where: eq(chatbots.websiteId, websiteId)
    });

    if (existingChatbot) {
      return res.status(400).json({ message: 'A chatbot already exists for this website' });
    }

    // Create new chatbot
    const [newChatbot] = await db.insert(chatbots)
      .values({
        ...chatbotData,
        websiteId,
        userId: userId
      })
      .returning();

    return res.status(201).json(newChatbot);
  } catch (error) {
    log(`Error creating chatbot: ${error}`, 'error');
    return res.status(500).json({ message: 'Failed to create chatbot', error: String(error) });
  }
}

/**
 * Get a chatbot by ID
 */
export async function getChatbot(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const userId = (req.user as any).id;
    const chatbotId = Number(req.params.id);
    
    const chatbot = await db.query.chatbots.findFirst({
      where: and(
        eq(chatbots.id, chatbotId),
        eq(chatbots.userId, userId)
      )
    });

    if (!chatbot) {
      return res.status(404).json({ message: 'Chatbot not found' });
    }

    return res.status(200).json(chatbot);
  } catch (error) {
    log(`Error getting chatbot: ${error}`, 'error');
    return res.status(500).json({ message: 'Failed to get chatbot', error: String(error) });
  }
}

/**
 * Update a chatbot
 */
export async function updateChatbot(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const chatbotId = Number(req.params.id);
    const updateData = req.body;
    
    // Check if the chatbot belongs to the user
    const userId = (req.user as any).id;
    const chatbot = await db.query.chatbots.findFirst({
      where: and(
        eq(chatbots.id, chatbotId),
        eq(chatbots.userId, userId)
      )
    });

    if (!chatbot) {
      return res.status(404).json({ message: 'Chatbot not found or not owned by you' });
    }

    const [updatedChatbot] = await db.update(chatbots)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(chatbots.id, chatbotId))
      .returning();

    return res.status(200).json(updatedChatbot);
  } catch (error) {
    log(`Error updating chatbot: ${error}`, 'error');
    return res.status(500).json({ message: 'Failed to update chatbot', error: String(error) });
  }
}

/**
 * Get chatbot for a domain (public API)
 */
export async function getChatbotByDomain(req: Request, res: Response) {
  try {
    const domain = req.query.domain as string;
    
    if (!domain) {
      return res.status(400).json({ message: 'Domain parameter is required' });
    }

    log(`Chatbot lookup requested for domain: ${domain}`, 'chatbot');
    
    // Normalize the domain (remove www. if present)
    const normalizedDomain = domain.replace(/^www\./i, '');
    
    // Try multiple domain patterns to make matching more robust
    // For example, both "example.com" and "www.example.com" should match
    const domainPatterns = [
      normalizedDomain,
      `www.${normalizedDomain}`,
      `https://${normalizedDomain}`,
      `http://${normalizedDomain}`,
      `https://www.${normalizedDomain}`,
      `http://www.${normalizedDomain}`
    ];
    
    // Find the website by trying each domain pattern
    let website = null;
    for (const pattern of domainPatterns) {
      log(`Trying to match domain pattern: ${pattern}`, 'chatbot');
      const foundWebsite = await db.query.websites.findFirst({
        where: eq(websites.domain, pattern)
      });
      
      if (foundWebsite) {
        website = foundWebsite;
        log(`Found website match: ${pattern}`, 'chatbot');
        break;
      }
    }

    if (!website) {
      log(`No website found for domain: ${domain} (tried ${domainPatterns.join(', ')})`, 'chatbot');
      return res.status(404).json({ message: 'Website not found' });
    }

    // Get chatbot for website
    const chatbot = await db.query.chatbots.findFirst({
      where: and(
        eq(chatbots.websiteId, website.id),
        eq(chatbots.status, 'active')
      )
    });

    if (!chatbot) {
      log(`No active chatbot found for website ID ${website.id}`, 'chatbot');
      return res.status(404).json({ message: 'No active chatbot found for this website' });
    }

    log(`Found active chatbot ID ${chatbot.id} for domain ${domain}`, 'chatbot');

    // Return public configuration data only
    const publicConfig = {
      id: chatbot.id,
      name: chatbot.name || 'Chat with us',
      primaryColor: chatbot.primaryColor || '#4f46e5',
      position: chatbot.position || 'bottom-right',
      initialMessage: chatbot.initialMessage || 'Hi there! How can I help you today?',
      collectEmail: chatbot.collectEmail
    };

    return res.status(200).json(publicConfig);
  } catch (error) {
    log(`Error getting chatbot by domain: ${error}`, 'error');
    return res.status(500).json({ message: 'Failed to get chatbot', error: String(error) });
  }
}

/**
 * Create a new chat session
 */
export async function createChatSession(req: Request, res: Response) {
  try {
    const { chatbotId, visitorEmail, visitorId } = req.body;
    
    if (!chatbotId) {
      return res.status(400).json({ message: 'Chatbot ID is required' });
    }

    // Check if chatbot exists and is active
    const chatbot = await db.query.chatbots.findFirst({
      where: and(
        eq(chatbots.id, chatbotId),
        eq(chatbots.status, 'active')
      )
    });

    if (!chatbot) {
      return res.status(404).json({ message: 'Chatbot not found or not active' });
    }

    // Create new session
    const [newSession] = await db.insert(chatSessions)
      .values({
        chatbotId: Number(chatbotId),
        visitorEmail,
        visitorId
      })
      .returning();

    // Add initial message from chatbot
    await db.insert(chatMessages)
      .values({
        sessionId: newSession.id,
        content: chatbot.initialMessage,
        role: 'assistant'
      });

    return res.status(201).json(newSession);
  } catch (error) {
    log(`Error creating chat session: ${error}`, 'error');
    return res.status(500).json({ message: 'Failed to create chat session', error: String(error) });
  }
}

/**
 * Send a message in a chat session
 */
export async function sendMessage(req: Request, res: Response) {
  try {
    const sessionId = Number(req.params.sessionId);
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check if session exists
    const session = await db.query.chatSessions.findFirst({
      where: eq(chatSessions.id, sessionId),
      with: {
        chatbot: {
          with: {
            website: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    // Add user message
    const [userMessage] = await db.insert(chatMessages)
      .values({
        sessionId,
        content: message,
        role: 'user'
      })
      .returning();

    // Get company info for AI context
    const companyInfo = await db.query.companyProfiles.findFirst({
      where: eq(companyProfiles.userId, session.chatbot.userId)
    });

    if (!companyInfo) {
      return res.status(500).json({ message: 'Company information not found' });
    }

    // Create context for AI
    const context = `
Company Name: ${companyInfo.companyName}
Industry: ${companyInfo.industry}
Target Audience: ${companyInfo.targetAudience}
Brand Voice: ${companyInfo.brandVoice}
Services/Products: ${companyInfo.services}
Value Proposition: ${companyInfo.valueProposition}
Website: ${session.chatbot.website.domain}
    `;

    try {
      // Generate AI response
      const aiContent = await generateAIResponse(message, context);
      
      // Add AI response message
      const [aiMessage] = await db.insert(chatMessages)
        .values({
          sessionId,
          content: aiContent,
          role: 'assistant'
        })
        .returning();
      
      // Create AEO content entry (for review)
      await db.insert(aeoContent)
        .values({
          chatMessageId: userMessage.id,
          userId: session.chatbot.userId,
          websiteId: session.chatbot.websiteId,
          question: message,
          answer: aiContent,
          status: 'pending'
        });
      
      // Return the AI response to the client
      return res.status(200).json({
        message: aiMessage,
        session: sessionId
      });
    } catch (aiError) {
      // If AI fails, provide a fallback response
      const fallbackResponse = "I'm sorry, but I'm having trouble processing your request at the moment. Please try again later or contact support for assistance.";
      
      const [fallbackMessage] = await db.insert(chatMessages)
        .values({
          sessionId,
          content: fallbackResponse,
          role: 'assistant'
        })
        .returning();
      
      log(`AI error in chat: ${aiError}`, 'error');
      
      return res.status(200).json({
        message: fallbackMessage,
        session: sessionId,
        error: "AI service temporarily unavailable"
      });
    }
  } catch (error) {
    log(`Error sending message: ${error}`, 'error');
    return res.status(500).json({ message: 'Failed to send message', error: String(error) });
  }
}

/**
 * Get messages for a chat session
 */
export async function getMessages(req: Request, res: Response) {
  try {
    const sessionId = Number(req.params.sessionId);
    
    // Check if session exists
    const session = await db.query.chatSessions.findFirst({
      where: eq(chatSessions.id, sessionId)
    });

    if (!session) {
      return res.status(404).json({ message: 'Chat session not found' });
    }

    // Get messages for session
    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.sessionId, sessionId),
      orderBy: (chatMessages, { asc }) => [asc(chatMessages.sentAt)]
    });

    return res.status(200).json(messages);
  } catch (error) {
    log(`Error getting messages: ${error}`, 'error');
    return res.status(500).json({ message: 'Failed to get messages', error: String(error) });
  }
}