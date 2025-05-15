import { 
  User, InsertUser, 
  Website, InsertWebsite,
  CompanyProfile, InsertCompanyProfile,
  Campaign, InsertCampaign
} from "@shared/schema";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

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
  private currentUserId: number;
  private currentWebsiteId: number;
  private currentProfileId: number;
  private currentCampaignId: number;

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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      updatedAt: new Date().toISOString()
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      updatedAt: new Date().toISOString()
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
      updatedAt: new Date().toISOString()
    };
    
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    return this.campaigns.delete(id);
  }
}

export const storage = new MemStorage();
