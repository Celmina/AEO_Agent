export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Website {
  id: string;
  domain: string;
  siteId: string;
  isActive: boolean;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  id: number;
  userId: number;
  companyName: string;
  industry: string;
  targetAudience: string;
  brandVoice: string;
  services: string;
  valueProposition: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  type: string;
  status: 'draft' | 'scheduled' | 'sent' | 'completed' | 'in-progress';
  openRate: number;
  clickRate: number;
  sentDate: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  subscribers: {
    total: number;
    change: number;
  };
  openRate: {
    value: number;
    change: number;
  };
  clickRate: {
    value: number;
    change: number;
  };
  conversionRate: {
    value: number;
    change: number;
  };
}

export interface EngagementDataPoint {
  name: string;
  opens: number;
  clicks: number;
  conversions: number;
}

export interface AudienceDataPoint {
  name: string;
  subscribers: number;
  unsubscribes: number;
}
