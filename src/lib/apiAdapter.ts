import type { Movie, Episode, AIComplianceInfo } from '../types/movie';
import type { WalletState, CheckInStreak } from '../types/wallet';
import type { Project, ProductionEpisode, Scene } from '../types/production';
import type { UserProfile } from '../types/auth';
import { getTodayDayIndex, getTodayDateString, VN_DAY_LABELS } from '../utils/date';

export function adaptUserProfile(api: any): UserProfile {
  if (!api) {
    return {
      id: 'user-guest',
      name: '',
      email: '',
      avatarUrl: '',
      role: 'user',
      isVIP: false,
      createdAt: new Date().toISOString(),
    };
  }

  const roleStr = String(api.role || '').toLowerCase();
  const isVIP = roleStr === 'vip' || Boolean(api.isVIP) || Boolean(api.subscription);

  return {
    id: api.id || '',
    name: api.name || api.fullName || (api.email ? api.email.split('@')[0] : ''),
    email: api.email || '',
    avatarUrl: api.avatarUrl || '',
    role: isVIP ? 'vip' : 'user',
    isVIP,
    vipExpiresAt: api.vipExpiresAt || api.subscription?.endDate,
    createdAt: api.createdAt || new Date().toISOString(),
  };
}

export function adaptApiMovieToMovie(api: any): Movie {
  if (!api) api = {};

  const episodes: Episode[] = Array.isArray(api.episodes) && api.episodes.length > 0
    ? api.episodes.map((ep: any, index: number) => adaptApiEpisodeToEpisode(ep, index + 1))
    : Array.from({ length: 12 }, (_, i) => ({
        id: `ep-${api.id || 'default'}-${i + 1}`,
        episodeNumber: i + 1,
        title: `Tập ${i + 1}`,
        duration: '24:00',
        hlsUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
        thumbnailUrl: api.posterUrl || api.thumbnailUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
        price: i === 0 ? 0 : 10,
        isFree: i === 0,
        isPreview: i === 1,
        isUnlocked: i === 0,
        synopsis: `Tập ${i + 1} của bộ phim ${api.title || 'AI Cinema'}.`,
        currentVersion: 'v1.0',
        versions: [],
      }));

  const genres: string[] = Array.isArray(api.genre)
    ? api.genre
    : Array.isArray(api.genres)
    ? api.genres.map((g: any) => (typeof g === 'string' ? g : g.name || 'AI Cinema'))
    : [];

  const aiCompliance: AIComplianceInfo = {
    aiModel: api.aiModel || api.aiContentLabel || '',
    generatedDate: api.generatedDate || api.createdAt || '',
    complianceArticle: api.complianceArticle || '',
    reviewStatus: api.reviewStatus === 'approved' || api.status === 'PUBLISHED' ? 'approved' : 'pending',
    moderationScore: Number(api.moderationScore) || 0,
    contentRating: api.ageRating || '',
    disclaimer: api.disclaimer || '',
  };

  return {
    id: api.id || '',
    title: api.title || '',
    genre: genres,
    posterUrl: api.posterUrl || api.thumbnailUrl || '',
    bannerUrl: api.bannerUrl || api.posterUrl || '',
    description: api.description || api.synopsis || '',
    year: Number(api.releaseYear || api.year) || 0,
    episodes,
    aiCompliance,
    totalEpisodes: Number(api.totalEpisodes ?? api.episodeCount) || episodes.length,
    matchScore: api.matchScore,
    quality: api.quality || '',
    audioQuality: api.audioQuality || '',
    ageRating: api.ageRating || '',
    badge: api.badge || '',
  };
}

/** 3725 -> "1:02:05", 60 -> "1:00"; empty when the length is unknown. */
export function formatDuration(totalSeconds: unknown): string {
  const seconds = Number(totalSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function adaptApiEpisodeToEpisode(api: any, defaultIndex = 1): Episode {
  return {
    id: api.id || '',
    seasonNumber: Number(api.seasonNumber) || 1,
    episodeNumber: api.episodeNumber || defaultIndex,
    title: api.title || '',
    duration: formatDuration(api.durationSeconds) || api.duration || '',
    hlsUrl: api.videoUrl || api.hlsUrl || '',
    thumbnailUrl: api.thumbnailUrl || '',
    price: Number(api.coinPrice ?? api.price) || 0,
    isFree: Boolean(api.isFreeStarter ?? api.isFree),
    availability: api.availability === 'UNDER_REVISION' ? 'UNDER_REVISION' : 'AVAILABLE',
    notice: api.notice || null,
    aiLabel: api.aiLabel?.labelText || null,
    isUnlocked: Boolean(api.isUnlocked),
    synopsis: api.description || api.synopsis || '',
  };
}

export function adaptApiWalletToWallet(api: any): WalletState {
  if (!api) return { mainCoin: 0, bonusCoin: 0 };
  return {
    mainCoin: Number(api.mainBalance ?? api.mainCoin) || 0,
    bonusCoin: Number(api.bonusBalance ?? api.bonusCoin) || 0,
  };
}

export function adaptApiCheckInToStreak(api: any): CheckInStreak {
  const todayIdx = getTodayDayIndex();
  const todayStr = getTodayDateString();

  api = api || {};

  const currentDay = typeof api.currentDay === 'number' ? api.currentDay : todayIdx;
  const isClaimedToday = Boolean(
    api.todayClaimed ?? (api.lastCheckInDate === todayStr || api.canClaimToday === false)
  );

  return {
    days: VN_DAY_LABELS.map((dayLabel, idx) => {
      const isToday = idx === currentDay;
      const claimed = Array.isArray(api.claimedDays)
        ? api.claimedDays.includes(idx)
        : isToday && isClaimedToday;
      return {
        dayIndex: idx,
        dayLabel,
        reward: Number(api.dailyRewards?.[idx] ?? api.rewards?.[idx]) || 0,
        claimed,
        isToday,
      };
    }),
    currentStreak: Number(api.streakCount) || 0,
    lastCheckInDate: api.lastCheckInDate || (isClaimedToday ? todayStr : null),
    todayClaimed: isClaimedToday,
  };
}

export function adaptApiProjectToProject(api: any): Project {
  const episodes: ProductionEpisode[] = Array.isArray(api.episodes) && api.episodes.length > 0
    ? api.episodes.map((ep: any, index: number) => {
        const scenes: Scene[] = Array.isArray(ep.scenes)
            ? ep.scenes.map((sc: any, sIdx: number) => ({
              id: sc.id || '',
              title: sc.title || '',
              prompt: sc.prompt || sc.description || '',
              status: sc.status || 'pending',
              duration: sc.duration || '',
              model: sc.model || '',
              progress: Number(sc.progress) || 0,
              videoUrl: sc.videoUrl || sc.assetUrl,
              resolution: sc.resolution || '',
              audioTrack: sc.audioTrack || '',
              voiceOver: sc.voiceOver || '',
            }))
          : [];

        return {
          id: ep.id || `ep-pkg-${index + 1}`,
          title: ep.title || `Tập ${index + 1}`,
          episodeNumber: ep.episodeNumber || index + 1,
          status: ep.status || (index === 0 ? 'published' : 'draft'),
          quotaAllocated: Number(ep.quotaAllocated ?? ep.quota_allocated) || 0,
          tokensUsed: Number(ep.tokensUsed ?? ep.actual_tokens_used) || 0,
          scenes,
          plan: {
            title: ep.title || '',
            synopsis: ep.synopsis || '',
            targetDuration: Number(ep.targetDuration) || 0,
            estimatedTokens: Number(ep.estimatedTokens) || 0,
            approach: ep.productionApproach || '',
            status: ep.status || 'approved',
          },
          videoDraftUrl: ep.videoDraftUrl || ep.video_draft_url,
        };
      })
    : [];

  return {
    id: api.id || '',
    title: api.title || '',
    synopsis: api.synopsis || api.description || '',
    totalEpisodes: episodes.length || Number(api.episodeCount) || 0,
    deadline: api.deadline || '',
    plannedReleaseDate: api.plannedReleaseDate || '',
    creatorName: api.assignedCreator?.fullName || '',
    reviewerName: api.createdBy?.fullName || '',
    genre: Array.isArray(api.genre) ? api.genre : [],
    status: api.status === 'PUBLISHED' ? 'completed' : api.status === 'IN_PRODUCTION' ? 'in_production' : 'planning',
    totalBudgetTokens: Number(api.totalAiQuotaBudget) || 0,
    allocatedTokens: Math.max(0, Number(api.totalAiQuotaBudget || 0) - Number(api.remainingAiQuotaBudget || 0)),
    consumedTokens: Number(api.consumedTokens) || 0,
    episodes,
    createdAt: api.createdAt || new Date().toISOString(),
    updatedAt: api.updatedAt || new Date().toISOString(),
  };
}
