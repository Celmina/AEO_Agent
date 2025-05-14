import { Request, Response } from 'express';
import { db } from '../db';
import { chatbots, chatSessions, chatMessages, aeoContent, websites, companyProfiles } from '@shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { generateAIResponse } from '../services/openaiService';
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
    const siteId = req.query.siteId as string;
    
    if (!domain && !siteId) {
      return res.status(400).json({ message: 'Either domain or siteId parameter is required' });
    }

    log(`Chatbot lookup requested for ${siteId ? 'siteId: ' + siteId : 'domain: ' + domain}`, 'chatbot');
    
    let website = null;
    
    // First try to find by siteId if provided (most precise method)
    if (siteId) {
      website = await db.query.websites.findFirst({
        where: eq(websites.siteId, siteId)
      });
      
      if (website) {
        log(`Found website match using siteId: ${siteId}`, 'chatbot');
      }
    }
    
    // If no website found by siteId and domain is provided, try domain matching
    if (!website && domain) {
      // Normalize the domain (remove www. if present)
      const normalizedDomain = domain.replace(/^www\./i, '');
      
      // Try multiple domain patterns to make matching more robust
      const domainPatterns = [
        normalizedDomain,
        `www.${normalizedDomain}`,
        `https://${normalizedDomain}`,
        `http://${normalizedDomain}`,
        `https://www.${normalizedDomain}`,
        `http://www.${normalizedDomain}`
      ];
      
      // Find the website by trying each domain pattern
      for (const pattern of domainPatterns) {
        log(`Trying to match domain pattern: ${pattern}`, 'chatbot');
        const foundWebsite = await db.query.websites.findFirst({
          where: eq(websites.domain, pattern)
        });
        
        if (foundWebsite) {
          website = foundWebsite;
          log(`Found website match using domain pattern: ${pattern}`, 'chatbot');
          break;
        }
      }
    }

    // If no website is found, create a default response for development/testing
    if (!website) {
      const message = siteId 
        ? `No website found for siteId: ${siteId}` 
        : `No website found for domain: ${domain}`;
      log(message, 'chatbot');
      
      // For development only - provide a default configuration
      // This allows the chatbot to work even if the database is empty or has connectivity issues
      log('Providing default chatbot configuration for development', 'chatbot');
      const defaultConfig = {
        id: 1,
        name: 'ecom.ai Chat',
        primaryColor: '#4f46e5',
        position: 'bottom-right',
        initialMessage: 'Hello! How can I help you today? (This is a development-mode chatbot)',
        collectEmail: false,
        websiteDomain: domain || 'unknown'
      };
      
      return res.status(200).json(defaultConfig);
    }

    // Get chatbot for website
    const chatbot = await db.query.chatbots.findFirst({
      where: and(
        eq(chatbots.websiteId, website.id),
        eq(chatbots.status, 'active')
      ),
      orderBy: [desc(chatbots.updatedAt)] // Get the most recently updated chatbot if multiple exist
    });

    // If no chatbot found, provide a default one
    if (!chatbot) {
      log(`No active chatbot found for website ID ${website.id}, providing default`, 'chatbot');
      
      // Default configuration based on website
      const defaultConfig = {
        id: website.id,
        name: `Chat with ${website.name}`,
        primaryColor: '#4f46e5',
        position: 'bottom-right',
        initialMessage: 'Hello! How can I help you today?',
        collectEmail: false,
        websiteDomain: website.domain
      };
      
      return res.status(200).json(defaultConfig);
    }

    log(`Found active chatbot ID ${chatbot.id} for website ID ${website.id}`, 'chatbot');

    // Return public configuration data only
    const publicConfig = {
      id: chatbot.id,
      name: chatbot.name || 'Chat with us',
      primaryColor: chatbot.primaryColor || '#4f46e5',
      position: chatbot.position || 'bottom-right',
      initialMessage: chatbot.initialMessage || 'Hi there! How can I help you today?',
      collectEmail: chatbot.collectEmail !== undefined ? chatbot.collectEmail : true,
      websiteDomain: website.domain
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
    const { chatbotId, visitorEmail, visitorId, url } = req.body;
    
    if (!chatbotId) {
      return res.status(400).json({ message: 'Chatbot ID is required' });
    }

    log(`Creating chat session for chatbot ID ${chatbotId}, visitor ${visitorId || 'anonymous'}`, 'chatbot');

    // Try to find chatbot
    const chatbot = await db.query.chatbots.findFirst({
      where: and(
        eq(chatbots.id, chatbotId),
        eq(chatbots.status, 'active')
      ),
      with: {
        website: true
      }
    });

    // For development/testing, create a mock session even if chatbot is not found
    if (!chatbot) {
      log(`Chatbot ID ${chatbotId} not found, creating development session`, 'chatbot');
      
      // Create a mock session for development
      const session = {
        id: Math.floor(Math.random() * 10000) + 1,
        chatbotId: chatbotId,
        visitorId: visitorId || 'anonymous',
        visitorEmail: visitorEmail || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return res.status(201).json(session);
    }

    // Prepare session metadata
    const metadataObj = {
      url: url || null,
      userAgent: req.headers['user-agent'] || null,
      referrer: req.headers['referer'] || null,
      timestamp: new Date().toISOString(),
      ipAddress: req.ip || req.socket.remoteAddress || null
    };

    // Create the new chat session directly with the SQL query
    const insertSessionSql = `
      INSERT INTO chat_sessions (
        chatbot_id, 
        visitor_email, 
        visitor_id, 
        metadata
      ) 
      VALUES (
        $1, 
        $2, 
        $3, 
        $4
      )
      RETURNING *
    `;

    const visitorIdValue = visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const metadataValue = JSON.stringify(metadataObj);

    const sessionResult = await db.$client.query(insertSessionSql, [
      Number(chatbotId),
      visitorEmail || null,
      visitorIdValue,
      metadataValue
    ]);

    if (!sessionResult.rows || sessionResult.rows.length === 0) {
      throw new Error('Failed to create chat session');
    }

    const newSession = sessionResult.rows[0];
    
    // Determine appropriate initial message based on website info
    let initialMessage = chatbot.initialMessage;
    if (!initialMessage) {
      const domainName = chatbot.website?.domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      initialMessage = `Hi there! How can I help you with information about ${domainName || 'our website'}?`;
    }

    // Add initial message from chatbot
    const insertMessageSql = `
      INSERT INTO chat_messages (
        session_id, 
        content, 
        role
      ) 
      VALUES (
        $1, 
        $2, 
        $3
      )
      RETURNING *
    `;

    const messageResult = await db.$client.query(insertMessageSql, [
      newSession.id,
      initialMessage,
      'assistant'
    ]);

    if (!messageResult.rows || messageResult.rows.length === 0) {
      throw new Error('Failed to create initial message');
    }

    const firstMessage = messageResult.rows[0];

    log(`Created chat session ID ${newSession.id} for chatbot ID ${chatbotId}`, 'chatbot');

    return res.status(201).json({
      ...newSession,
      message: firstMessage
    });
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

    log(`Processing message for session ID ${sessionId}`, 'chatbot');

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
      log(`Session ID ${sessionId} not found`, 'chatbot');
      return res.status(404).json({ message: 'Chat session not found' });
    }

    // Add user message using raw SQL to avoid type issues
    const insertUserMessageSql = `
      INSERT INTO chat_messages (
        session_id,
        content,
        role
      )
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const userMessageResult = await db.$client.query(insertUserMessageSql, [
      sessionId,
      message,
      'user'
    ]);

    if (!userMessageResult.rows || userMessageResult.rows.length === 0) {
      throw new Error('Failed to save user message');
    }

    const userMessage = userMessageResult.rows[0];

    // Get company info for AI context
    const companyInfo = await db.query.companyProfiles.findFirst({
      where: eq(companyProfiles.userId, session.chatbot.userId)
    });

    if (!companyInfo) {
      log(`No company profile found for user ID ${session.chatbot.userId}`, 'chatbot');
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
      log(`Generating AI response for message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`, 'chatbot');
      const aiContent = await generateAIResponse(message, context);
      
      // Add AI response message using raw SQL
      const insertAiMessageSql = `
        INSERT INTO chat_messages (
          session_id,
          content,
          role
        )
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const aiMessageResult = await db.$client.query(insertAiMessageSql, [
        sessionId,
        aiContent,
        'assistant'
      ]);

      if (!aiMessageResult.rows || aiMessageResult.rows.length === 0) {
        throw new Error('Failed to save AI response');
      }

      const aiMessage = aiMessageResult.rows[0];
      
      // Create AEO content entry (for review) using raw SQL
      const insertAeoContentSql = `
        INSERT INTO aeo_content (
          chat_message_id,
          user_id,
          website_id,
          question,
          answer,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      await db.$client.query(insertAeoContentSql, [
        userMessage.id,
        session.chatbot.userId,
        session.chatbot.websiteId,
        message,
        aiContent,
        'pending'
      ]);
      
      log(`AI response generated successfully (len: ${aiContent.length})`, 'chatbot');
      
      // Return the AI response to the client
      return res.status(200).json({
        message: aiMessage,
        session: sessionId
      });
    } catch (aiError) {
      // If AI fails, provide a fallback response
      log(`AI error in chat: ${aiError}`, 'error');
      const fallbackResponse = "I'm sorry, but I'm having trouble processing your request at the moment. Please try again later or contact support for assistance.";
      
      const insertFallbackMessageSql = `
        INSERT INTO chat_messages (
          session_id,
          content,
          role
        )
        VALUES ($1, $2, $3)
        RETURNING *
      `;

      const fallbackMessageResult = await db.$client.query(insertFallbackMessageSql, [
        sessionId,
        fallbackResponse,
        'assistant'
      ]);

      if (!fallbackMessageResult.rows || fallbackMessageResult.rows.length === 0) {
        throw new Error('Failed to save fallback message');
      }

      const fallbackMessage = fallbackMessageResult.rows[0];
      
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
    
    log(`Retrieving messages for session ID ${sessionId}`, 'chatbot');
    
    // Check if session exists using raw SQL
    const checkSessionSql = `
      SELECT * FROM chat_sessions WHERE id = $1
    `;
    
    const sessionResult = await db.$client.query(checkSessionSql, [sessionId]);
    
    if (!sessionResult.rows || sessionResult.rows.length === 0) {
      log(`Session ID ${sessionId} not found`, 'chatbot');
      return res.status(404).json({ message: 'Chat session not found' });
    }

    // Get messages for session using raw SQL
    const getMessagesSql = `
      SELECT * FROM chat_messages 
      WHERE session_id = $1
      ORDER BY sent_at ASC
    `;
    
    const messagesResult = await db.$client.query(getMessagesSql, [sessionId]);
    
    const messages = messagesResult.rows || [];
    log(`Retrieved ${messages.length} messages for session ID ${sessionId}`, 'chatbot');

    return res.status(200).json(messages);
  } catch (error) {
    log(`Error getting messages: ${error}`, 'error');
    return res.status(500).json({ message: 'Failed to get messages', error: String(error) });
  }
}