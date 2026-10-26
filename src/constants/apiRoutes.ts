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
    ENGAGEMENT: (movieId: string) => `/movies/${movieId}/engagement`,
    LIKE: (movieId: string) => `/movies/${movieId}/like`,
    VIEWS: (episodeId: string) => `/episodes/${episodeId}/views`,
    SUBTITLE: (subtitleId: string) => `/subtitles/${subtitleId}`,
  },

  // In-app notifications of the signed-in account
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    READ_ALL: '/notifications/read-all',
    READ: (id: string) => `/notifications/${id}/read`,
  },

  // MF-2 - wallet & Coin top-ups
  WALLET: {
    INFO: '/wallet',
    AFFORDABILITY: '/wallet/affordability',
    TOP_UPS: '/wallet/top-ups',
    TOP_UP_OPTIONS: '/wallet/top-ups/options',
    TOP_UP_DETAIL: (topUpId: string) => `/wallet/top-ups/${topUpId}`,
    STATEMENTS: '/wallet/statements',
    TRANSACTION_DETAIL: (transactionId: string) => `/wallet/transactions/${transactionId}`,
  },

  // MF-2 - episode access decision and single-episode purchase
  ACCESS: {
    DECISION: (episodeId: string) => `/episodes/${episodeId}/access`,
    PURCHASE: (episodeId: string) => `/episodes/${episodeId}/purchase`,
  },

  // MF-2 - monthly plan
  SUBSCRIPTION: {
    PLANS: '/membership-plans',
    MINE: '/subscriptions/me',
    QUOTE: '/subscriptions',
    ACTIVATE: (id: string) => `/subscriptions/${id}/activate`,
    CANCEL_RENEW: (id: string) => `/subscriptions/${id}/cancel-auto-renew`,
    RESUME_RENEW: (id: string) => `/subscriptions/${id}/resume-auto-renew`,
    CYCLES: (id: string) => `/subscriptions/${id}/cycles`,
  },

  // MF-2 - daily check-in and reward wheel
  REWARDS: {
    STATUS: '/daily-rewards/status',
    CHECK_IN: '/daily-rewards/check-in',
    SPINS: '/rewards/spins',
  },

  // Chat & AI Support
  CHAT: {
    SEND_MESSAGE: '/chat/message',
    TICKET: '/chat/ticket',
  },
} as const;
