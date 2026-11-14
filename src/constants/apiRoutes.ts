/**
 * AI Cinema Mobile - Backend API Endpoints Registry
 * Maps 1-to-1 with NestJS Backend Controllers (39 Endpoints Spec Match)
 */
export const API_ROUTES = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    GOOGLE: '/auth/google',
    PROFILE: '/auth/me',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Movies & Catalog
  MOVIES: {
    LIST: '/movies',
    RANKING: '/movies/ranking',
    DETAIL: (id: string) => `/movies/${id}`,
    EPISODES: (movieId: string) => `/movies/${movieId}/episodes`,
    ENGAGEMENT: (movieId: string) => `/movies/${movieId}/engagement`,
    LIKE: (movieId: string) => `/movies/${movieId}/like`,
    VIEWS: (episodeId: string) => `/episodes/${episodeId}/views`,
    SUBTITLE: (subtitleId: string) => `/subtitles/${subtitleId}`,
  },

  // BR-68: AI recommendations read from the member's viewing behavior (BE RecommendationController)
  RECOMMENDATIONS: {
    FOR_YOU: '/recommendations/for-you',
    TRENDING: '/recommendations/trending',
    AFTER: (movieId: string) => `/recommendations/after/${movieId}`,
    SIMILAR: (movieId: string) => `/recommendations/similar/${movieId}`,
  },

  // BR-69 Watch Party and friends (Member only, permission watch-party:use)
  WATCH_ROOMS: {
    CREATE: '/watch-rooms',
    JOIN_BY_CODE: '/watch-rooms/join',
    DETAIL: (roomId: string) => `/watch-rooms/${roomId}`,
    JOIN: (roomId: string) => `/watch-rooms/${roomId}/join`,
    NEXT_EPISODE: (roomId: string) => `/watch-rooms/${roomId}/next-episode`,
    LEAVE: (roomId: string) => `/watch-rooms/${roomId}/leave`,
  },
  FRIENDS: {
    LIST: '/friends',
    RESPOND: (friendshipId: string) => `/friends/${friendshipId}/respond`,
    BLOCK: (friendId: string) => `/friends/${friendId}/block`,
  },

  // "Danh sách của tôi": movies the member saved to watch later
  SAVED_MOVIES: {
    LIST: '/saved-movies',
    ITEM: (movieId: string) => `/saved-movies/${movieId}`,
  },

  // MF-4 - registered devices and live streams of the member
  DEVICES: {
    LIST: '/devices',
    REMOVE: (deviceId: string) => `/devices/${deviceId}`,
    END_SESSION: (sessionId: string) => `/devices/sessions/${sessionId}/end`,
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

  // MF-3 - streaming session, heartbeat and mid-roll ads
  PLAYBACK: {
    SESSIONS: '/playback/sessions',
    HEARTBEAT: (sessionId: string) => `/playback/sessions/${sessionId}/heartbeat`,
    STOP: (sessionId: string) => `/playback/sessions/${sessionId}/stop`,
    COMPLETE: (sessionId: string) => `/playback/sessions/${sessionId}/complete`,
    AD_STARTED: (sessionId: string, breakId: string) => `/playback/sessions/${sessionId}/ad-breaks/${breakId}/played`,
    AD_FINISHED: (sessionId: string, breakId: string) => `/playback/sessions/${sessionId}/ad-breaks/${breakId}/completed`,
    HISTORY: '/playback/history',
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

  // AI Chatbox
  // AI Customer Support (BE MemberSupportController): real Gemini assistant with RAG, Member only.
  CHAT: {
    CONVERSATIONS: '/support/conversations',
    DETAIL: (id: string) => `/support/conversations/${id}`,
    MESSAGES: (id: string) => `/support/conversations/${id}/messages`,
    HANDOFF: (id: string) => `/support/conversations/${id}/request-staff`,
    CONFIRM_RESOLVED: (id: string) => `/support/conversations/${id}/confirm-resolved`,
    CLOSE: (id: string) => `/support/conversations/${id}/close`,
    READ: (id: string) => `/support/conversations/${id}/read`,
  },
} as const;
