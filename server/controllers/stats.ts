import { Request, Response } from "express";
import { db } from "../db";
import { chatSessions, chatMessages, chatbots, aeoContent } from "@shared/schema";
import { eq, and, count } from "drizzle-orm";
import { log } from "../vite";

/**
 * Get dashboard statistics for the authenticated user
 */
export async function getDashboardStats(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    
    // Get real statistics using the database
    const totalChatbots = await db.select({ count: count() })
      .from(chatbots)
      .where(eq(chatbots.userId, userId));
    
    const approvedAeoContent = await db.select({ count: count() })
      .from(aeoContent)
      .where(and(
        eq(aeoContent.userId, userId),
        eq(aeoContent.status, 'approved')
      ));
    
    const pendingAeoContent = await db.select({ count: count() })
      .from(aeoContent)
      .where(and(
        eq(aeoContent.userId, userId),
        eq(aeoContent.status, 'pending')
      ));
    
    const publishedAeoContent = await db.select({ count: count() })
      .from(aeoContent)
      .where(and(
        eq(aeoContent.userId, userId),
        eq(aeoContent.status, 'published')
      ));
    
    const dashboardStats = {
      chatbots: {
        total: totalChatbots[0]?.count || 0,
        change: 0 // We don't have historical data yet
      },
      approvedAeo: {
        value: approvedAeoContent[0]?.count || 0,
        change: 0
      },
      pendingAeo: {
        value: pendingAeoContent[0]?.count || 0,
        change: 0
      },
      publishedAeo: {
        value: publishedAeoContent[0]?.count || 0,
        change: 0
      }
    };
    
    return res.json(dashboardStats);
  } catch (error) {
    log(`Error fetching dashboard stats: ${error}`, 'error');
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get chat usage statistics for the authenticated user
 */
export async function getChatUsageStats(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    
    // Get user's chatbots
    const userChatbots = await db.select({ id: chatbots.id })
      .from(chatbots)
      .where(eq(chatbots.userId, userId));
    
    // If user has no chatbots, return zeros
    if (!userChatbots.length) {
      return res.json({
        totalSessions: 0,
        totalMessages: 0,
        averageMessagesPerSession: 0,
        chatbotsWithActivity: 0
      });
    }
    
    const chatbotIds = userChatbots.map(chatbot => chatbot.id);
    
    // Count total chat sessions
    const totalSessionsResult = await db.$client.query(`
      SELECT COUNT(*) as count
      FROM chat_sessions
      WHERE chatbot_id = ANY($1)
    `, [chatbotIds]);
    
    const totalSessions = parseInt(totalSessionsResult.rows[0]?.count || '0');
    
    // Count total messages
    const totalMessagesResult = await db.$client.query(`
      SELECT COUNT(*) as count
      FROM chat_messages
      WHERE session_id IN (
        SELECT id FROM chat_sessions WHERE chatbot_id = ANY($1)
      )
    `, [chatbotIds]);
    
    const totalMessages = parseInt(totalMessagesResult.rows[0]?.count || '0');
    
    // Count number of chatbots with at least one session
    const chatbotsWithActivityResult = await db.$client.query(`
      SELECT COUNT(DISTINCT chatbot_id) as count
      FROM chat_sessions
      WHERE chatbot_id = ANY($1)
    `, [chatbotIds]);
    
    const chatbotsWithActivity = parseInt(chatbotsWithActivityResult.rows[0]?.count || '0');
    
    // Calculate average messages per session
    const averageMessagesPerSession = totalSessions > 0 ? (totalMessages / totalSessions) : 0;
    
    return res.json({
      totalSessions,
      totalMessages,
      averageMessagesPerSession: parseFloat(averageMessagesPerSession.toFixed(1)),
      chatbotsWithActivity
    });
  } catch (error) {
    log(`Error fetching chat usage stats: ${error}`, 'error');
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Get AEO statistics and breakdown for the authenticated user
 */
export async function getAeoStats(req: Request, res: Response) {
  try {
    const userId = (req.user as any).id;
    
    // Get AEO content by status
    const aeoStatsResult = await db.$client.query(`
      SELECT 
        status, 
        COUNT(*) as count 
      FROM aeo_content 
      WHERE user_id = $1 
      GROUP BY status
    `, [userId]);
    
    // Convert to a more useful format
    const aeoStats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      published: 0,
      total: 0
    };
    
    aeoStatsResult.rows.forEach(row => {
      const status = row.status as keyof typeof aeoStats;
      const count = parseInt(row.count);
      
      aeoStats[status] = count;
      aeoStats.total += count;
    });
    
    return res.json(aeoStats);
  } catch (error) {
    log(`Error fetching AEO stats: ${error}`, 'error');
    return res.status(500).json({ message: "Internal server error" });
  }
}
