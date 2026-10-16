import type { Movie, Episode, AIComplianceInfo } from '../types/movie';
import type { UserProfile } from '../types/auth';

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
    : [];

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
    language: api.defaultLanguage || api.language || 'vi',
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
    subtitles: Array.isArray(api.subtitles)
      ? api.subtitles.map((s: any) => ({
          id: String(s.id),
          language: String(s.language),
          label: String(s.label || s.language),
          isDefault: Boolean(s.isDefault),
        }))
      : [],
    isUnlocked: Boolean(api.isUnlocked),
    synopsis: api.description || api.synopsis || '',
    publishedAt: api.publishedAt || null,
  };
}
