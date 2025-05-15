import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pool } from "./db";
import session from "express-session";
import MemoryStore from "memorystore";
import passport from "passport";
import passportLocal from "passport-local";
import bcrypt from "bcryptjs";
import path from "path";

// Controllers
import * as authController from "./controllers/auth";
import * as websitesController from "./controllers/websites";
import * as companiesController from "./controllers/companies";
import * as campaignsController from "./controllers/campaigns";
import * as statsController from "./controllers/stats";
import * as chatbotController from "./controllers/chatbot";
import * as aeoContentController from "./controllers/aeoContent";

// Middleware
import { isAuthenticated } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve the chatbot.js file statically from client/public
  // Serve chatbot.js and the newer version with improved error handling
  app.use('/chatbot.js', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'client/public/chatbot.js'));
  });
  
  app.use('/chatbot-v2.js', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'client/public/chatbot-v2.js'));
  });
  // Session store
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "ecomai-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
      store: new SessionStore({ checkPeriod: 86400000 }),
    })
  );

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new passportLocal.Strategy(
      {
        usernameField: "email",
        passwordField: "password",
      },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }

          const isValid = await bcrypt.compare(password, user.password);
          if (!isValid) {
            return done(null, false, { message: "Invalid email or password" });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post("/api/auth/register", authController.register);
  app.post("/api/auth/login", authController.login);
  app.post("/api/auth/logout", authController.logout);
  app.get("/api/auth/me", isAuthenticated, authController.getCurrentUser);

  // Website routes
  app.get("/api/websites", isAuthenticated, websitesController.getWebsites);
  app.post("/api/websites", isAuthenticated, websitesController.createWebsite);
  app.get("/api/websites/:id", isAuthenticated, websitesController.getWebsite);
  app.put("/api/websites/:id", isAuthenticated, websitesController.updateWebsite);
  app.delete("/api/websites/:id", isAuthenticated, websitesController.deleteWebsite);

  // Company profile routes
  app.get("/api/company/profile", isAuthenticated, companiesController.getCompanyProfile);
  app.post("/api/company/profile", isAuthenticated, companiesController.createCompanyProfile);
  app.put("/api/company/profile", isAuthenticated, companiesController.updateCompanyProfile);

  // Campaign routes
  app.get("/api/campaigns", isAuthenticated, campaignsController.getCampaigns);
  app.post("/api/campaigns", isAuthenticated, campaignsController.createCampaign);
  app.get("/api/campaigns/:id", isAuthenticated, campaignsController.getCampaign);
  app.put("/api/campaigns/:id", isAuthenticated, campaignsController.updateCampaign);
  app.delete("/api/campaigns/:id", isAuthenticated, campaignsController.deleteCampaign);

  // Stats routes
  app.get("/api/stats/dashboard", isAuthenticated, statsController.getDashboardStats);
  app.get("/api/stats/chat-usage", isAuthenticated, statsController.getChatUsageStats);
  app.get("/api/stats/aeo", isAuthenticated, statsController.getAeoStats);
  
  // Chatbot routes (authenticated)
  app.get("/api/chatbots", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const result = await pool.query(`
        SELECT c.* FROM chatbots c
        JOIN websites w ON c.website_id = w.id
        WHERE w.user_id = $1
      `, [userId]);
      
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching chatbots:", error);
      res.status(500).json({ message: "Failed to fetch chatbots" });
    }
  });
  app.post("/api/chatbots", isAuthenticated, chatbotController.createChatbot);
  app.get("/api/chatbots/:id", isAuthenticated, chatbotController.getChatbot);
  app.put("/api/chatbots/:id", isAuthenticated, chatbotController.updateChatbot);

  // AEO content routes
  app.get("/api/aeo-content", isAuthenticated, aeoContentController.getAeoContent);
  app.get("/api/aeo-content/:id", isAuthenticated, aeoContentController.getAeoContentById);
  app.put("/api/aeo-content/:id", isAuthenticated, aeoContentController.updateAeoContent);
  app.post("/api/aeo-content/:id/approve", isAuthenticated, aeoContentController.approveAeoContent);
  app.post("/api/aeo-content/:id/reject", isAuthenticated, aeoContentController.rejectAeoContent);
  app.post("/api/aeo-content/:id/publish", isAuthenticated, aeoContentController.publishAeoContent);
  
  // Public chatbot API
  app.get("/api/public/chatbot", chatbotController.getChatbotByDomain);
  app.post("/api/public/chat-sessions", chatbotController.createChatSession);
  app.post("/api/public/chat-sessions/:sessionId/messages", chatbotController.sendMessage);
  app.get("/api/public/chat-sessions/:sessionId/messages", chatbotController.getMessages);

  const httpServer = createServer(app);

  return httpServer;
}
