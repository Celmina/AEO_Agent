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
  CHATBOTS: {
    CREATE: "/api/chatbots",
    GET: (id: string) => `/api/chatbots/${id}`,
    UPDATE: (id: string) => `/api/chatbots/${id}`,
  },
  PUBLIC_CHATBOT: {
    GET_BY_DOMAIN: "/api/public/chatbot",
    CREATE_SESSION: "/api/public/chat-sessions",
    SEND_MESSAGE: (sessionId: string) => `/api/public/chat-sessions/${sessionId}/messages`,
    GET_MESSAGES: (sessionId: string) => `/api/public/chat-sessions/${sessionId}/messages`,
  },
  AEO_CONTENT: {
    LIST: "/api/aeo-content",
    APPROVE: (id: string) => `/api/aeo-content/${id}/approve`,
    REJECT: (id: string) => `/api/aeo-content/${id}/reject`,
    PUBLISH: (id: string) => `/api/aeo-content/${id}/publish`,
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
      "1 website integration",
      "AI chatbot with Perplexity API",
      "Basic AEO content generation",
      "Up to 500 chatbot conversations/month",
      "Email support",
    ],
  },
  PROFESSIONAL: {
    PRICE: 79,
    FEATURES: [
      "Up to 3 website integrations",
      "AI chatbot with Perplexity API",
      "Advanced AEO content generation",
      "Up to 2,500 chatbot conversations/month",
      "Chatbot customization options",
      "Content approval workflow",
      "Priority support",
    ],
  },
  ENTERPRISE: {
    PRICE: 249,
    FEATURES: [
      "Unlimited website integrations",
      "AI chatbot with Perplexity API",
      "Premium AEO content generation",
      "Unlimited chatbot conversations",
      "Custom chatbot training",
      "Advanced analytics dashboard",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
};
