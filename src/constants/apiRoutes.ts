/**
 * AI Cinema Mobile - Backend API Endpoints Registry
 * Maps 1-to-1 with NestJS Backend Controllers
 */
export const API_ROUTES = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    LOGOUT: '/auth/logout',
  },

  // Movies & Catalog
  MOVIES: {
    LIST: '/movies',
    DETAIL: (id: string) => `/movies/${id}`,
    BY_CATEGORY: (category: string) => `/movies/category/${category}`,
    SEARCH: '/movies/search',
    FEATURED: '/movies/featured',
    POPULAR: '/movies/popular',
    NEW_RELEASES: '/movies/new-releases',
    EPISODE_DETAIL: (id: string) => `/catalog/episodes/${id}`,
  },

  // Wallet & Payments
  WALLET: {
    INFO: '/wallet',
    CHECK_IN: '/wallet/check-in',
    STREAK: '/wallet/streak',
    DEPOSIT: '/wallet/deposit',
    TRANSACTIONS: '/wallet/transactions',
    UNLOCK_EPISODE: '/wallet/unlock-episode',
  },

  // Subscription (VIP Plans)
  SUBSCRIPTION: {
    CURRENT: '/subscription',
    SUBSCRIBE: '/subscription/subscribe',
    CANCEL: '/subscription/cancel',
    TOGGLE_AUTO_RENEW: '/subscription/toggle-auto-renew',
    PLANS: '/subscription/plans',
  },

  // Production Workflow (Mobile Studio)
  PRODUCTION: {
    PROJECTS: '/production-projects',
    PROJECT_DETAIL: (projectId: string) => `/production-projects/${projectId}`,
    PLANS: (projectId: string) => `/production-projects/${projectId}/plans`,
    PLAN_DETAIL: (planId: string) => `/production-plans/${planId}`,
    PLAN_SUBMIT: (planId: string) => `/production-plans/${planId}/submit`,
    PLAN_REVIEWS: (planId: string) => `/production-plans/${planId}/plan-reviews`,
    QUOTA_ALLOCATIONS: (planId: string) => `/production-plans/${planId}/quota-allocations`,
    SCENES: (planId: string) => `/production-plans/${planId}/scenes`,
    SCENE_DETAIL: (sceneId: string) => `/scenes/${sceneId}`,
    SCENE_SUBMIT: (sceneId: string) => `/scenes/${sceneId}/submit`,
    GENERATION_JOBS: (planId: string) => `/production-plans/${planId}/generation-jobs`,
    JOB_DETAIL: (jobId: string) => `/generation-jobs/${jobId}`,
    JOB_RETRY: (jobId: string) => `/generation-jobs/${jobId}/retry`,
    PACKAGES: (planId: string) => `/production-plans/${planId}/episode-packages`,
    PACKAGE_DETAIL: (packageId: string) => `/episode-packages/${packageId}`,
    COMPLIANCE_CHECKS: (packageId: string) => `/episode-packages/${packageId}/compliance-checks`,
  },

  // Chat & AI Support
  CHAT: {
    SEND_MESSAGE: '/chat/message',
    HISTORY: '/chat/history',
    TICKET: '/chat/ticket',
  },
} as const;
