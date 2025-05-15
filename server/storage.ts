import { 
  User, InsertUser, 
  Website, InsertWebsite,
  CompanyProfile, InsertCompanyProfile,
  Campaign, InsertCampaign,
  Chatbot, InsertChatbot,
  users, websites, companyProfiles, campaigns, chatbots
} from "@shared/schema";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Website methods
  getWebsites(userId: number): Promise<Website[]>;
  getWebsite(id: number): Promise<Website | undefined>;
  getWebsiteByDomain(domain: string): Promise<Website | undefined>;
  createWebsite(website: InsertWebsite): Promise<Website>;
  updateWebsite(id: number, website: Partial<Website>): Promise<Website | undefined>;
  deleteWebsite(id: number): Promise<boolean>;
  
  // Chatbot methods
  getChatbotsByWebsiteId(websiteId: number): Promise<Chatbot[]>;
  
  // Company profile methods
  getCompanyProfile(userId: number): Promise<CompanyProfile | undefined>;
  createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
  updateCompanyProfile(userId: number, profile: Partial<CompanyProfile>): Promise<CompanyProfile | undefined>;
  
  // Campaign methods
  getCampaigns(userId: number): Promise<Campaign[]>;
  getCampaign(id: number): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, campaign: Partial<Campaign>): Promise<Campaign | undefined>;
  deleteCampaign(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private websites: Map<number, Website>;
  private companyProfiles: Map<number, CompanyProfile>;
  private campaigns: Map<number, Campaign>;
  private chatbots: Map<number, Chatbot>;
  private currentUserId: number;
  private currentWebsiteId: number;
  private currentProfileId: number;
  private currentCampaignId: number;
  private currentChatbotId: number;

  constructor() {
    this.users = new Map();
    this.websites = new Map();
    this.companyProfiles = new Map();
    this.campaigns = new Map();
    this.currentUserId = 1;
    this.currentWebsiteId = 1;
    this.currentProfileId = 1;
    this.currentCampaignId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    
    const user: User = {
      ...insertUser,
      id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(id, user);
    return user;
  }

  // Website methods
  async getWebsites(userId: number): Promise<Website[]> {
    return Array.from(this.websites.values()).filter(
      (website) => website.userId === userId
    );
  }

  async getWebsite(id: number): Promise<Website | undefined> {
    return this.websites.get(id);
  }

  async getWebsiteByDomain(domain: string): Promise<Website | undefined> {
    return Array.from(this.websites.values()).find(
      (website) => website.domain.toLowerCase() === domain.toLowerCase()
    );
  }

  async createWebsite(insertWebsite: InsertWebsite): Promise<Website> {
    const id = this.currentWebsiteId++;
    const siteId = insertWebsite.siteId || `site_${randomBytes(6).toString('hex')}`;
    
    const website: Website = {
      ...insertWebsite,
      id,
      siteId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.websites.set(id, website);
    return website;
  }

  async updateWebsite(id: number, websiteData: Partial<Website>): Promise<Website | undefined> {
    const website = this.websites.get(id);
    if (!website) {
      return undefined;
    }
    
    const updatedWebsite: Website = {
      ...website,
      ...websiteData,
      updatedAt: new Date()
    };
    
    this.websites.set(id, updatedWebsite);
    return updatedWebsite;
  }

  async deleteWebsite(id: number): Promise<boolean> {
    return this.websites.delete(id);
  }

  // Company profile methods
  async getCompanyProfile(userId: number): Promise<CompanyProfile | undefined> {
    return Array.from(this.companyProfiles.values()).find(
      (profile) => profile.userId === userId
    );
  }

  async createCompanyProfile(insertProfile: InsertCompanyProfile): Promise<CompanyProfile> {
    const id = this.currentProfileId++;
    
    const profile: CompanyProfile = {
      ...insertProfile,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.companyProfiles.set(id, profile);
    return profile;
  }

  async updateCompanyProfile(userId: number, profileData: Partial<CompanyProfile>): Promise<CompanyProfile | undefined> {
    const profile = Array.from(this.companyProfiles.values()).find(
      (p) => p.userId === userId
    );
    
    if (!profile) {
      return undefined;
    }
    
    const updatedProfile: CompanyProfile = {
      ...profile,
      ...profileData,
      updatedAt: new Date()
    };
    
    this.companyProfiles.set(profile.id, updatedProfile);
    return updatedProfile;
  }

  // Campaign methods
  async getCampaigns(userId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.userId === userId
    );
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentCampaignId++;
    
    const campaign: Campaign = {
      ...insertCampaign,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: number, campaignData: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) {
      return undefined;
    }
    
    const updatedCampaign: Campaign = {
      ...campaign,
      ...campaignData,
      updatedAt: new Date()
    };
    
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(insertUser.password, 10);
      const [user] = await db.insert(users).values({
        ...insertUser,
        email: insertUser.email.toLowerCase(),
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  // Website methods
  async getWebsites(userId: number): Promise<Website[]> {
    try {
      const results = await db.select().from(websites).where(eq(websites.userId, userId));
      return results;
    } catch (error) {
      console.error("Error getting websites:", error);
      return [];
    }
  }

  async getWebsite(id: number): Promise<Website | undefined> {
    try {
      const [website] = await db.select().from(websites).where(eq(websites.id, id));
      return website;
    } catch (error) {
      console.error("Error getting website:", error);
      return undefined;
    }
  }

  async getWebsiteByDomain(domain: string): Promise<Website | undefined> {
    try {
      const [website] = await db.select().from(websites).where(eq(websites.domain, domain.toLowerCase()));
      return website;
    } catch (error) {
      console.error("Error getting website by domain:", error);
      return undefined;
    }
  }

  async createWebsite(insertWebsite: InsertWebsite): Promise<Website> {
    try {
      const siteId = insertWebsite.siteId || `site_${randomBytes(6).toString('hex')}`;
      const [website] = await db.insert(websites).values({
        ...insertWebsite,
        domain: insertWebsite.domain.toLowerCase(),
        siteId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return website;
    } catch (error) {
      console.error("Error creating website:", error);
      throw error;
    }
  }

  async updateWebsite(id: number, websiteData: Partial<Website>): Promise<Website | undefined> {
    try {
      const [updatedWebsite] = await db.update(websites)
        .set({
          ...websiteData,
          updatedAt: new Date()
        })
        .where(eq(websites.id, id))
        .returning();
      return updatedWebsite;
    } catch (error) {
      console.error("Error updating website:", error);
      return undefined;
    }
  }

  async deleteWebsite(id: number): Promise<boolean> {
    try {
      const result = await db.delete(websites).where(eq(websites.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting website:", error);
      return false;
    }
  }

  // Company profile methods
  async getCompanyProfile(userId: number): Promise<CompanyProfile | undefined> {
    try {
      const [profile] = await db.select().from(companyProfiles).where(eq(companyProfiles.userId, userId));
      return profile;
    } catch (error) {
      console.error("Error getting company profile:", error);
      return undefined;
    }
  }

  async createCompanyProfile(insertProfile: InsertCompanyProfile): Promise<CompanyProfile> {
    try {
      const [profile] = await db.insert(companyProfiles).values({
        ...insertProfile,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return profile;
    } catch (error) {
      console.error("Error creating company profile:", error);
      throw error;
    }
  }

  async updateCompanyProfile(userId: number, profileData: Partial<CompanyProfile>): Promise<CompanyProfile | undefined> {
    try {
      const [updatedProfile] = await db.update(companyProfiles)
        .set({
          ...profileData,
          updatedAt: new Date()
        })
        .where(eq(companyProfiles.userId, userId))
        .returning();
      return updatedProfile;
    } catch (error) {
      console.error("Error updating company profile:", error);
      return undefined;
    }
  }

  // Campaign methods
  async getCampaigns(userId: number): Promise<Campaign[]> {
    try {
      const results = await db.select().from(campaigns).where(eq(campaigns.userId, userId));
      return results;
    } catch (error) {
      console.error("Error getting campaigns:", error);
      return [];
    }
  }

  async getCampaign(id: number): Promise<Campaign | undefined> {
    try {
      const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
      return campaign;
    } catch (error) {
      console.error("Error getting campaign:", error);
      return undefined;
    }
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    try {
      const [campaign] = await db.insert(campaigns).values({
        ...insertCampaign,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return campaign;
    } catch (error) {
      console.error("Error creating campaign:", error);
      throw error;
    }
  }

  async updateCampaign(id: number, campaignData: Partial<Campaign>): Promise<Campaign | undefined> {
    try {
      const [updatedCampaign] = await db.update(campaigns)
        .set({
          ...campaignData,
          updatedAt: new Date()
        })
        .where(eq(campaigns.id, id))
        .returning();
      return updatedCampaign;
    } catch (error) {
      console.error("Error updating campaign:", error);
      return undefined;
    }
  }

  async deleteCampaign(id: number): Promise<boolean> {
    try {
      await db.delete(campaigns).where(eq(campaigns.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting campaign:", error);
      return false;
    }
  }
}

// Switch from MemStorage to DatabaseStorage
export const storage = new DatabaseStorage();
