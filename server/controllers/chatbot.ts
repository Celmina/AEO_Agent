import { Request, Response } from 'express';
import { db } from '../db';
import { chatbots, chatSessions, chatMessages, aeoContent, websites, companyProfiles } from '@shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { generateAIResponse } from '../services/openaiService';
import { log } from '../vite';
import { pool } from '../db';

// Helper function to create a simple hash from a string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Helper functions for content extraction
function extractFromScrapedContent(data: any, field: string): string | null {
  if (!data) return null;
  
  // Direct field access
  if (data[field]) return data[field];
  
  // Common fields in scraped content
  if (field === 'industry' && data.aboutContent) {
    return extractIndustryFromText(data.aboutContent);
  }
  
  if (field === 'services' && data.mainContent) {
    return extractServicesFromText(data.mainContent);
  }
  
  if (field === 'valueProposition' && data.mainContent) {
    return extractValuePropositionFromText(data.mainContent);
  }
  
  return null;
}

function extractIndustryFromText(text: string): string | null {
  const industries = ['technology', 'healthcare', 'finance', 'education', 'retail', 
                      'manufacturing', 'hospitality', 'construction', 'professional services'];
  
  for (const industry of industries) {
    if (text.toLowerCase().includes(industry)) {
      return industry.charAt(0).toUpperCase() + industry.slice(1);
    }
  }
  
  return null;
}

function extractServicesFromText(text: string): string | null {
  // Look for phrases like "we offer" or "our services"
  const servicePatterns = [
    /we offer (.*?)\./i,
    /our services include (.*?)\./i,
    /we provide (.*?)\./i,
    /specialized in (.*?)\./i
  ];
  
  for (const pattern of servicePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

function extractValuePropositionFromText(text: string): string | null {
  // Look for value proposition phrases
  const vpPatterns = [
    /we help (.*?)\./i,
    /our mission is (.*?)\./i,
    /committed to (.*?)\./i,
    /dedicated to (.*?)\./i
  ];
  
  for (const pattern of vpPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[0].trim(); // Return the full match including "we help", etc.
    }
  }
  
  return null;
}

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

    // Add origin and referrer to logs for debugging CORS and embedding issues
    const origin = req.headers.origin || 'unknown';
    const referrer = req.headers.referer || 'unknown';
    log(`Chatbot lookup requested for ${siteId ? 'siteId: ' + siteId : 'domain: ' + domain} | Origin: ${origin} | Referrer: ${referrer}`, 'chatbot');
    
    let website = null;
    
    // First try to find by siteId if provided (most precise method)
    if (siteId) {
      try {
        website = await db.query.websites.findFirst({
          where: eq(websites.siteId, siteId)
        });
        
        if (website) {
          log(`Found website match using siteId: ${siteId}`, 'chatbot');
        }
      } catch (dbError) {
        log(`Database error finding website by siteId: ${dbError}`, 'error');
        // Continue to domain-based lookup if available
      }
    }
    
    // If no website found by siteId and domain is provided, try domain matching
    if (!website && domain) {
      try {
        // Normalize the domain (remove www. and protocol if present)
        const normalizedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/i, '').split('/')[0];
        log(`Normalized domain for matching: ${normalizedDomain}`, 'chatbot');
        
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
        
        // Try a more flexible match by doing a partial SQL like match
        if (!website) {
          log(`No exact domain match found, trying partial match`, 'chatbot');
          const sql = `
            SELECT * FROM websites 
            WHERE domain ILIKE $1 
            OR $1 ILIKE CONCAT('%', domain, '%')
            LIMIT 1
          `;
          const result = await db.$client.query(sql, [`%${normalizedDomain}%`]);
          
          if (result.rows && result.rows.length > 0) {
            website = result.rows[0];
            log(`Found website using partial domain match: ${website.domain}`, 'chatbot');
          }
        }
      } catch (dbError) {
        log(`Database error finding website by domain: ${dbError}`, 'error');
      }
    }

    // If no website is found, try to match by siteId as a direct numeric ID
    if (!website && siteId) {
      try {
        const siteIdNumeric = parseInt(siteId, 10);
        if (!isNaN(siteIdNumeric)) {
          website = await db.query.websites.findFirst({
            where: eq(websites.id, siteIdNumeric)
          });
          if (website) {
            log(`Found website match using numeric ID: ${siteIdNumeric}`, 'chatbot');
          }
        }
      } catch (dbError) {
        log(`Database error finding website by numeric ID: ${dbError}`, 'error');
      }
    }
    
    // If still no website found, create a fallback response
    if (!website) {
      const message = siteId 
        ? `No website found for siteId: ${siteId}` 
        : `No website found for domain: ${domain}`;
      log(message, 'chatbot');
      
      // Try to find any website owned by the same user as a last resort
      // This helps with development and testing environments
      let anyWebsite = null;
      try {
        anyWebsite = await db.query.websites.findFirst({
          orderBy: [desc(websites.updatedAt)]
        });
      } catch (err) {
        log(`Error finding any website: ${err}`, 'error');
      }
      
      // If we found another website, use its company information
      if (anyWebsite) {
        log(`Using alternative website (ID: ${anyWebsite.id}) for chatbot configuration`, 'chatbot');
        
        const chatbotForSite = await db.query.chatbots.findFirst({
          where: eq(chatbots.websiteId, anyWebsite.id)
        });
        
        // Use the found website's information
        const altConfig = {
          id: siteId ? parseInt(siteId, 10) || 1 : 1, // Keep requested ID for continuity
          name: chatbotForSite?.name || `Chat with ${anyWebsite.name}`,
          primaryColor: chatbotForSite?.primaryColor || '#4f46e5',
          position: chatbotForSite?.position || 'bottom-right',
          initialMessage: chatbotForSite?.initialMessage || `Hello! How can I help you with information about ${anyWebsite.name}?`,
          collectEmail: chatbotForSite?.collectEmail !== undefined ? chatbotForSite.collectEmail : false,
          websiteDomain: anyWebsite.domain
        };
        
        return res.status(200).json(altConfig);
      }
      
      // Last resort fallback (should only happen in completely empty database)
      log('No websites found in database. Providing generic fallback configuration', 'chatbot');
      const defaultConfig = {
        id: siteId ? parseInt(siteId, 10) || 1 : 1,
        name: 'Website Chat Assistant',
        primaryColor: '#4f46e5',
        position: 'bottom-right',
        initialMessage: 'Hello! How can I help you today?',
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

    // Add more detailed logging including origin and headers for debugging
    const origin = req.headers.origin || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    log(`Creating chat session for chatbot ID ${chatbotId}, visitor ${visitorId || 'anonymous'} | Origin: ${origin} | UA: ${userAgent.substring(0, 50)}`, 'chatbot');

    // Try to find chatbot with better error handling
    let chatbot = null;
    try {
      chatbot = await db.query.chatbots.findFirst({
        where: and(
          eq(chatbots.id, chatbotId),
          eq(chatbots.status, 'active')
        ),
        with: {
          website: true
        }
      });
    } catch (dbError) {
      log(`Database error finding chatbot: ${dbError}`, 'error');
      // Continue with fallback mode
    }

    // For development/testing or error recovery, create a fallback session if chatbot is not found
    if (!chatbot) {
      log(`Chatbot ID ${chatbotId} not found or database error occurred, creating fallback session`, 'chatbot');
      
      // Generate a deterministic but unique session ID based on input values to prevent duplicates
      const hashInput = `${chatbotId}-${visitorId || Date.now()}-${Date.now()}`;
      const sessionId = Math.abs(hashString(hashInput)) % 100000 + 1; // Keep ID in reasonable range
      
      // Create a fallback session
      const session = {
        id: sessionId,
        chatbotId: parseInt(chatbotId.toString(), 10),
        visitorId: visitorId || `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        visitorEmail: visitorEmail || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'active'
      };
      
      // Include a default welcome message
      const welcomeMessage = {
        id: sessionId * 1000, // Ensure unique ID
        sessionId: sessionId,
        content: "Hello! I'm the ecom.ai chatbot assistant. How can I help you today?",
        role: "assistant",
        createdAt: new Date()
      };
      
      return res.status(201).json({
        ...session,
        message: welcomeMessage
      });
    }
    
    // Using the hashString helper function defined at module level

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

    // Add detailed logging including headers
    const origin = req.headers.origin || 'unknown';
    const contentType = req.headers['content-type'] || 'unknown';
    log(`Processing message for session ID ${sessionId} | Origin: ${origin} | Content-Type: ${contentType}`, 'chatbot');
    log(`Message content: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`, 'chatbot');

    // Check if session exists with better error handling
    let session = null;
    try {
      session = await db.query.chatSessions.findFirst({
        where: eq(chatSessions.id, sessionId),
        with: {
          chatbot: {
            with: {
              website: true
            }
          }
        }
      });
    } catch (dbError) {
      log(`Database error finding session: ${dbError}`, 'error');
      // Continue with fallback mode
    }

    if (!session) {
      log(`Session ID ${sessionId} not found or database error. Creating fallback response`, 'chatbot');
      
      // Try to find website information for better personalization
      let website = null;
      try {
        // Look for any website in the database to use for context
        website = await db.query.websites.findFirst({
          orderBy: [desc(websites.updatedAt)],
          with: {
            user: {
              with: {
                companyProfile: true
              }
            }
          }
        });
      } catch (err) {
        log(`Error finding any website for context: ${err}`, 'error');
      }
      
      // Craft a response using any found information
      let companyName = "our company";
      let siteName = "our website";
      let aiResponse = "I'm a website assistant. How can I help you today?";
      
      if (website) {
        // Safely extract company name from profile if available
        const profile = website.user?.companyProfile;
        companyName = profile ? profile.companyName : website.name;
        siteName = website.name || "our website";
        
        // Create a properly personalized response
        aiResponse = `Hello! I'm the chat assistant for ${companyName}. How can I help you with information about ${siteName}?`;
        
        // Very basic context-aware responses for common questions
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('pricing') || lowerMessage.includes('cost') || lowerMessage.includes('plan')) {
          aiResponse = `For pricing information about ${companyName}, please visit our pricing page or contact our sales team. Would you like me to guide you to the right contact?`;
        } else if (lowerMessage.includes('contact') || lowerMessage.includes('support')) {
          aiResponse = `You can reach ${companyName}'s support team through our contact form on the website. Our team typically responds promptly during business hours.`;
        } else if (lowerMessage.includes('features') || lowerMessage.includes('what can you do') || lowerMessage.includes('what do you offer')) {
          aiResponse = `I can provide information about ${companyName} and answer questions about our products and services. What specific information are you looking for?`;
        }
      } else {
        // Very basic context-aware responses for common questions
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('pricing') || lowerMessage.includes('cost') || lowerMessage.includes('plan')) {
          aiResponse = `For pricing information, please visit our pricing page or contact our sales team. Would you like me to guide you to the right contact?`;
        } else if (lowerMessage.includes('contact') || lowerMessage.includes('support')) {
          aiResponse = `You can reach our support team through the contact form on the website. Our team typically responds promptly during business hours.`;
        } else if (lowerMessage.includes('features') || lowerMessage.includes('what can you do') || lowerMessage.includes('what do you offer')) {
          aiResponse = `I can provide information about our company and answer questions about our products and services. What specific information are you looking for?`;
        }
      }
      
      // Generate a deterministic ID based on session and message
      const messageHash = `${sessionId}-${message}`;
      const responseId = Math.abs(hashString(messageHash)) % 10000 + 1;
      
      // Add message to the response
      const fallbackResponse = {
        id: responseId,
        sessionId: sessionId,
        content: aiResponse,
        role: "assistant",
        createdAt: new Date()
      };
      
      return res.status(200).json(fallbackResponse);
    }
    
    // Using the hashString helper function defined at module level

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

    // Get company info for AI context with detailed error handling
    let companyInfo: any = null;
    try {
      // Use a direct SQL query to ensure we get the most reliable data
      const profileResult = await pool.query(`
        SELECT * FROM company_profiles 
        WHERE user_id = $1 
        LIMIT 1
      `, [session.chatbot.userId]);
      
      if (profileResult && profileResult.rows && profileResult.rows.length > 0) {
        companyInfo = profileResult.rows[0];
        log(`Found company profile for chatbot's user ID ${session.chatbot.userId}`, 'chatbot');
      }
    } catch (dbError) {
      log(`Error fetching company profile: ${dbError}`, 'error');
    }
    
    // If no company profile is found, try to extract info from website
    if (!companyInfo) {
      try {
        // Get the website data using direct SQL to avoid ORM issues
        const websiteResult = await pool.query(`
          SELECT * FROM websites 
          WHERE id = $1
        `, [session.chatbot.websiteId]);
        
        if (websiteResult && websiteResult.rows && websiteResult.rows.length > 0) {
          const website = websiteResult.rows[0];
          
          if (website && website.scraped_content) {
            log(`Using scraped website content for chatbot context`, 'chatbot');
            
            // Parse the scraped content
            let scrapedData = {};
            try {
              scrapedData = JSON.parse(website.scraped_content.toString());
              log(`Successfully parsed scraped content`, 'chatbot');
            } catch (parseError) {
              log(`Error parsing scraped content: ${parseError}`, 'error');
            }
            
            // Create a company profile from the scraped data
            companyInfo = {
              companyName: website.name || "Website",
              industry: extractFromScrapedContent(scrapedData, 'industry') || "General",
              targetAudience: extractFromScrapedContent(scrapedData, 'targetAudience') || "Website visitors",
              brandVoice: extractFromScrapedContent(scrapedData, 'brandVoice') || "Professional",
              services: extractFromScrapedContent(scrapedData, 'services') || "Products and services",
              valueProposition: extractFromScrapedContent(scrapedData, 'valueProposition') || 
                                `Information about ${website.name || website.domain || "our website"}`,
              websiteDomain: website.domain
            };
            
            // Add additional log to verify data extraction
            log(`Created company profile from website data: ${JSON.stringify(companyInfo).substring(0, 200)}...`, 'chatbot');
          } else {
            log(`No scraped content found for website ID ${session.chatbot.websiteId}`, 'chatbot');
          }
        } else {
          log(`No website found with ID ${session.chatbot.websiteId}`, 'chatbot');
        }
      } catch (webError) {
        log(`Error accessing website data: ${webError}`, 'error');
      }
    }
    
    // Default company info if nothing else is found - but try to use website domain to make it specific
    if (!companyInfo) {
      try {
        // Get just the website domain name as a fallback
        const domainResult = await pool.query(`
          SELECT domain, name FROM websites 
          WHERE id = $1
        `, [session.chatbot.websiteId]);
        
        const domain = domainResult.rows[0]?.domain || "our website";
        const siteName = domainResult.rows[0]?.name || domain;
        
        log(`No company profile found, but retrieved domain: ${domain}`, 'chatbot');
        
        companyInfo = {
          companyName: siteName,
          industry: "Business",
          targetAudience: "Website visitors",
          brandVoice: "Professional",
          services: "Services and information",
          valueProposition: `Information and assistance for ${domain}`,
          websiteDomain: domain
        };
      } catch (err) {
        log(`Failed to get domain fallback, using very generic info: ${err}`, 'error');
        companyInfo = {
          companyName: "This website",
          industry: "Business",
          targetAudience: "Website visitors",
          brandVoice: "Professional",
          services: "Information services",
          valueProposition: "Helping visitors find what they need"
        };
      }
    }

    // Create context for AI, ensuring we never use generic ecom.ai info
    // We want the context to be specific to this website only
    log(`Creating AI context with company name: ${companyInfo.companyName}`, 'chatbot');
    
    const context = `
IMPORTANT: You are a helpful assistant specifically for the website "${companyInfo.websiteDomain || companyInfo.companyName}".
Only answer questions about this company/website. If asked about ecom.ai, explain you are here to help with 
${companyInfo.companyName} information only.

Company Name: ${companyInfo.companyName}
Industry: ${companyInfo.industry}
Target Audience: ${companyInfo.targetAudience}
Brand Voice: ${companyInfo.brandVoice}
Services/Products: ${companyInfo.services}
Value Proposition: ${companyInfo.valueProposition}
Website: ${companyInfo.websiteDomain || 'this website'}

ANSWER ONLY QUESTIONS ABOUT THIS WEBSITE/COMPANY. For questions about other topics, politely explain you only
have information about ${companyInfo.companyName}.
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