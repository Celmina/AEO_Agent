export const APP_NAME = "MarkSync";

export const SITE_URL = "https://marksync.io";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },
  WEBSITES: {
    LIST: "/api/websites",
    CREATE: "/api/websites",
    GET: (id: string) => `/api/websites/${id}`,
    UPDATE: (id: string) => `/api/websites/${id}`,
    DELETE: (id: string) => `/api/websites/${id}`,
  },
  COMPANY: {
    PROFILE: "/api/company/profile",
    UPDATE: "/api/company/profile",
  },
  CAMPAIGNS: {
    LIST: "/api/campaigns",
    CREATE: "/api/campaigns",
    GET: (id: string) => `/api/campaigns/${id}`,
    UPDATE: (id: string) => `/api/campaigns/${id}`,
    DELETE: (id: string) => `/api/campaigns/${id}`,
  },
  STATS: {
    DASHBOARD: "/api/stats/dashboard",
    ENGAGEMENT: "/api/stats/engagement",
    AUDIENCE: "/api/stats/audience",
  },
};

export const PRICING = {
  STARTER: {
    PRICE: 29,
    FEATURES: [
      "Up to 5,000 contacts",
      "Basic email campaigns",
      "Standard analytics",
      "Email support",
    ],
  },
  PROFESSIONAL: {
    PRICE: 79,
    FEATURES: [
      "Up to 25,000 contacts",
      "Advanced email campaigns",
      "Detailed analytics",
      "AI recommendations",
      "Priority support",
    ],
  },
  ENTERPRISE: {
    PRICE: 249,
    FEATURES: [
      "Unlimited contacts",
      "Premium email campaigns",
      "Enterprise analytics",
      "Advanced AI tools",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
};
