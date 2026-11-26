/** BE answers shared by the system tests, shaped like the real DTOs. */
import { api, ok } from './harness';

export const MOVIE_ID = 'm-1';

export const movieDto = (overrides: Record<string, unknown> = {}) => ({
  id: MOVIE_ID,
  title: 'Mùa Hạ Trong Gương',
  genres: ['Tình cảm', 'Học đường'],
  posterUrl: 'https://cdn.test/poster.jpg',
  description: 'Một mùa hè khác thường.',
  releaseYear: 2026,
  ageRating: 'T13',
  status: 'PUBLISHED',
  ...overrides,
});

export const episodeDto = (n: number, overrides: Record<string, unknown> = {}) => ({
  id: `ep-${n}`,
  episodeNumber: n,
  title: `Tập ${n}`,
  durationSeconds: 1200,
  coinPrice: 30,
  isFreeForGuest: n === 1,
  isFreeForMember: n <= 2,
  aiLabel: { labelText: 'Nội dung được tạo bằng AI' },
  subtitles: [
    { id: 'sub-vi', language: 'vi', label: 'Tiếng Việt', isDefault: true },
    { id: 'sub-en', language: 'en', label: 'English', isDefault: false },
  ],
  ...overrides,
});

/** GET /movies/:id, its episodes and its hearts, as the detail and watch screens read them. */
export function movieRoutes(episodes = [episodeDto(1), episodeDto(2), episodeDto(3)], movie = movieDto()) {
  api.on(`GET /movies/${movie.id}`, ok(movie));
  api.on(`GET /movies/${movie.id}/episodes`, ok(episodes));
  api.on(`GET /movies/${movie.id}/engagement`, ok({ movieId: movie.id, likeCount: 12, viewCount: 340, likedByMe: false }));
  api.on(`GET /recommendations/similar/${movie.id}`, ok([]));
}

export const decision = (episodeId: string, overrides: Record<string, unknown> = {}) => ({
  episodeId,
  movieId: MOVIE_ID,
  accessGranted: false,
  source: 'NONE',
  actorType: 'MEMBER',
  accessMethods: ['UNLOCK_EPISODE', 'MONTHLY_PLAN'],
  required: { coinPrice: 30, mainBalance: 20, bonusBalance: 15, enoughCoins: true, missingCoins: 0, monthlyPlanCoinPrice: 99 },
  nextAction: 'UNLOCK_EPISODE',
  ...overrides,
});
export const granted = (episodeId: string, source = 'FREE_STARTER') =>
  decision(episodeId, { accessGranted: true, source, accessMethods: [], nextAction: 'HANDOFF_TO_PLAYBACK' });

/** POST /playback/sessions: the stream, the AI label (BR-10) and the ad slots of the plan. */
export const streamingSession = (episodeId: string, overrides: Record<string, unknown> = {}) => ({
  sessionId: `s-${episodeId}`,
  episodeId,
  movieId: MOVIE_ID,
  accessType: 'FREE_STARTER',
  status: 'ACTIVE',
  stream: { masterUrl: `https://cdn.test/${episodeId}/master.m3u8`, qualities: ['720p'], durationSeconds: 1200 },
  aiLabel: { type: 'AI_GENERATED', text: 'Nội dung được tạo bằng AI', displayLocation: 'TOP_RIGHT' },
  adSchedule: [],
  ...overrides,
});

/** The playback calls every session makes in the background. */
export function playbackRoutes() {
  api.on('POST /playback/sessions', (call) => ok(streamingSession((call.body as { episodeId: string }).episodeId), 201));
  api.on('POST /episodes/ep-1/views', ok({ counted: true, viewCount: 341 }));
}

export const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

export const activePlan = (overrides: Record<string, unknown> = {}) => ({
  id: 'sub-1',
  status: 'ACTIVE',
  autoRenew: true,
  priceCoins: 99,
  currentPeriodStart: hoursFromNow(-24 * 20),
  currentPeriodEnd: hoursFromNow(24 * 10),
  nextRenewalAt: hoursFromNow(24 * 10),
  cancelDeadline: hoursFromNow(24 * 9),
  plan: { id: 'plan-monthly', code: 'monthly', name: 'Gói Tháng', durationDays: 30 },
  ...overrides,
});

export const monthlyPlan = {
  id: 'plan-monthly',
  code: 'monthly',
  name: 'Gói Tháng',
  description: 'Xem mọi tập trong 30 ngày',
  period: 'MONTHLY',
  durationDays: 30,
  isFree: false,
  isActive: true,
  isFeatured: true,
  sortOrder: 1,
  priceCoins: 99,
};
