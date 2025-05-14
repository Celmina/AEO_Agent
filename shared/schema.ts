import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const aeoStatusEnum = pgEnum('aeo_status', ['pending', 'approved', 'rejected', 'published']);
export const chatbotStatusEnum = pgEnum('chatbot_status', ['active', 'inactive', 'pending']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Websites table
export const websites = pgTable("websites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  domain: text("domain").notNull(),
  siteId: text("site_id").notNull().unique(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Company Profiles table
export const companyProfiles = pgTable("company_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  targetAudience: text("target_audience").notNull(),
  brandVoice: text("brand_voice").notNull(),
  services: text("services").notNull(),
  valueProposition: text("value_proposition").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chatbots table
export const chatbots = pgTable("chatbots", {
  id: serial("id").primaryKey(),
  websiteId: integer("website_id").notNull().references(() => websites.id),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").default("AI Assistant").notNull(),
  status: chatbotStatusEnum("status").default("inactive").notNull(),
  primaryColor: text("primary_color").default("#4f46e5").notNull(),
  position: text("position").default("bottom-right").notNull(),
  initialMessage: text("initial_message").default("Hello! How can I help you today?").notNull(),
  collectEmail: boolean("collect_email").default(true).notNull(),
  configuration: json("configuration").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat Sessions table
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  chatbotId: integer("chatbot_id").notNull().references(() => chatbots.id),
  visitorEmail: text("visitor_email"),
  visitorId: text("visitor_id"),
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// Chat Messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => chatSessions.id),
  content: text("content").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  sentAt: timestamp("sent_at").defaultNow(),
});

// AEO Content table
export const aeoContent = pgTable("aeo_content", {
  id: serial("id").primaryKey(),
  chatMessageId: integer("chat_message_id").references(() => chatMessages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  websiteId: integer("website_id").notNull().references(() => websites.id),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  status: aeoStatusEnum("status").default("pending").notNull(),
  schema: json("schema").$type<Record<string, any>>().default({}),
  addedToWebsite: boolean("added_to_website").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  websites: many(websites),
  companyProfile: many(companyProfiles),
  chatbots: many(chatbots),
  aeoContent: many(aeoContent),
}));

export const websitesRelations = relations(websites, ({ one, many }) => ({
  user: one(users, {
    fields: [websites.userId],
    references: [users.id],
  }),
  chatbots: many(chatbots),
  aeoContent: many(aeoContent),
}));

export const chatbotsRelations = relations(chatbots, ({ one, many }) => ({
  website: one(websites, {
    fields: [chatbots.websiteId],
    references: [websites.id],
  }),
  user: one(users, {
    fields: [chatbots.userId],
    references: [users.id],
  }),
  sessions: many(chatSessions),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  chatbot: one(chatbots, {
    fields: [chatSessions.chatbotId],
    references: [chatbots.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
  aeoContent: many(aeoContent, { relationName: "messageToAeo" }),
}));

export const aeoContentRelations = relations(aeoContent, ({ one }) => ({
  user: one(users, {
    fields: [aeoContent.userId],
    references: [users.id],
  }),
  website: one(websites, {
    fields: [aeoContent.websiteId],
    references: [websites.id],
  }),
  chatMessage: one(chatMessages, {
    fields: [aeoContent.chatMessageId],
    references: [chatMessages.id],
    relationName: "messageToAeo",
  }),
}));

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWebsiteSchema = createInsertSchema(websites).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatbotSchema = createInsertSchema(chatbots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  startedAt: true,
  endedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  sentAt: true,
});

export const insertAeoContentSchema = createInsertSchema(aeoContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Define types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertWebsite = z.infer<typeof insertWebsiteSchema>;
export type Website = typeof websites.$inferSelect;

export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;
export type CompanyProfile = typeof companyProfiles.$inferSelect;

export type InsertChatbot = z.infer<typeof insertChatbotSchema>;
export type Chatbot = typeof chatbots.$inferSelect;

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export type InsertAeoContent = z.infer<typeof insertAeoContentSchema>;
export type AeoContent = typeof aeoContent.$inferSelect;

// Deprecated - for backward compatibility only
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  openRate: text("open_rate"),
  clickRate: text("click_rate"),
  sentDate: text("sent_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
