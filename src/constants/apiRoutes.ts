/**
 * AI Cinema Mobile - Backend API Endpoints Registry
 * Maps 1-to-1 with NestJS Backend Controllers (39 Endpoints Spec Match)
 */
export const API_ROUTES = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/me',
    LOGOUT: '/auth/logout',
  },

  // Movies & Catalog
  MOVIES: {
    LIST: '/movies',
    DETAIL: (id: string) => `/movies/${id}`,
    EPISODES: (movieId: string) => `/movies/${movieId}/episodes`,
  },

  // MF-2 — wallet & Coin top-ups
  WALLET: {
    INFO: '/wallet',
    TOP_UPS: '/wallet/top-ups',
    TOP_UP_OPTIONS: '/wallet/top-ups/options',
    TOP_UP_DETAIL: (topUpId: string) => `/wallet/top-ups/${topUpId}`,
    STATEMENTS: '/wallet/statements',
  },

  // MF-2 — episode access decision and single-episode purchase
  ACCESS: {
    DECISION: (episodeId: string) => `/episodes/${episodeId}/access`,
    PURCHASE: (episodeId: string) => `/episodes/${episodeId}/purchase`,
  },

  // MF-2 — monthly plan
  SUBSCRIPTION: {
    PLANS: '/membership-plans',
    MINE: '/subscriptions/me',
    QUOTE: '/subscriptions',
    ACTIVATE: (id: string) => `/subscriptions/${id}/activate`,
    CANCEL_RENEW: (id: string) => `/subscriptions/${id}/cancel-auto-renew`,
    RESUME_RENEW: (id: string) => `/subscriptions/${id}/resume-auto-renew`,
  },

  // MF-2 — daily check-in and reward wheel
  REWARDS: {
    STATUS: '/daily-rewards/status',
    CHECK_IN: '/daily-rewards/check-in',
    SPINS: '/rewards/spins',
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
    TICKET: '/chat/ticket',
  },
} as const;
