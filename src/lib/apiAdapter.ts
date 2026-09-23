import type { Movie, Episode, EpisodeVersion, AIComplianceInfo } from '../types/movie';
import type { WalletState, CheckInStreak } from '../types/wallet';
import type { Project, ProductionEpisode, Scene } from '../types/production';
import type { UserProfile } from '../types/auth';
import { mockMovie, mockCheckInStreak } from '../mocks/mockData';
import { getTodayDayIndex, getTodayDateString } from '../utils/date';

export function adaptUserProfile(api: any): UserProfile {
  if (!api) {
    return {
      id: 'user-guest',
      name: 'Khán Giả AI',
      email: 'guest@aicinema.vn',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      role: 'user',
      isVIP: false,
      createdAt: new Date().toISOString(),
    };
  }

  const roleStr = String(api.role || '').toLowerCase();
  const isVIP = roleStr === 'vip' || Boolean(api.isVIP) || Boolean(api.subscription);

  return {
    id: api.id || `user-${Date.now()}`,
    name: api.name || api.fullName || (api.email ? api.email.split('@')[0] : 'Khán Giả AI'),
    email: api.email || '',
    avatarUrl: api.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    role: isVIP ? 'vip' : 'user',
    isVIP,
    vipExpiresAt: api.vipExpiresAt || api.subscription?.endDate,
    createdAt: api.createdAt || new Date().toISOString(),
  };
}

export function adaptApiMovieToMovie(api: any): Movie {
  if (!api) return mockMovie;

  const episodes: Episode[] = Array.isArray(api.episodes) && api.episodes.length > 0
    ? api.episodes.map((ep: any, index: number) => adaptApiEpisodeToEpisode(ep, index + 1))
    : mockMovie.episodes;

  const genres: string[] = Array.isArray(api.genre)
    ? api.genre
    : Array.isArray(api.genres)
    ? api.genres.map((g: any) => (typeof g === 'string' ? g : g.name || 'AI Cinema'))
    : ['Khoa học viễn tưởng', 'Hành động', 'AI'];

  const aiCompliance: AIComplianceInfo = {
    aiModel: api.aiModel || api.aiContentLabel || 'CinemaGen v3.2 (Transformer Architecture)',
    generatedDate: api.generatedDate || api.createdAt || new Date().toISOString().split('T')[0],
    complianceArticle: api.complianceArticle || 'Điều 44, Luật Trí tuệ Nhân tạo 2025 & Nghị định 142/2024/NĐ-CP',
    reviewStatus: api.reviewStatus === 'approved' || api.status === 'PUBLISHED' ? 'approved' : 'pending',
    moderationScore: api.moderationScore || 98.5,
    contentRating: api.ageRating || 'T16 - Phim dành cho khán giả từ 16 tuổi',
    disclaimer: api.disclaimer || 'Toàn bộ nội dung hình ảnh, âm thanh và kịch bản trong phim này được tạo 100% bằng Trí tuệ Nhân tạo. Không có diễn viên thật tham gia.',
  };

  return {
    id: api.id || `movie-${Date.now()}`,
    title: api.title || 'Phim Chưa Đặt Tên',
    genre: genres,
    posterUrl: api.posterUrl || api.thumbnailUrl || mockMovie.posterUrl,
    bannerUrl: api.bannerUrl || api.posterUrl || mockMovie.bannerUrl,
    description: api.description || api.synopsis || 'Tác phẩm điện ảnh được tạo bởi Trí tuệ Nhân tạo thế hệ mới.',
    year: api.releaseYear || api.year || 2026,
    episodes,
    aiCompliance,
    totalEpisodes: episodes.length || api.totalEpisodes || 1,
    matchScore: api.matchScore || 98,
    quality: api.quality || '4K Ultra HD',
    audioQuality: api.audioQuality || 'Dolby Atmos',
    ageRating: api.ageRating || 'T16',
    badge: api.badge || (api.isVIPOnly ? '⭐ VIP Exclusive' : '🔥 Mới Phát Hành'),
  };
}

export function adaptApiEpisodeToEpisode(api: any, defaultIndex = 1): Episode {
  const versions: EpisodeVersion[] = Array.isArray(api.versions) && api.versions.length > 0
    ? api.versions.map((v: any, vIdx: number) => ({
        id: v.id || `v-${api.id}-${vIdx}`,
        versionNumber: v.versionNumber || `v1.${vIdx}.0`,
        versionTitle: v.versionTitle || 'Bản phát hành chính thức',
        releaseDate: v.releaseDate || v.createdAt || new Date().toISOString(),
        author: v.author || 'Đạo diễn AI / Studio',
        aiModel: v.aiModel || 'CinemaGen v3.2',
        status: v.status || 'published',
        statusLabel: v.status === 'archived' ? 'Đã lưu trữ' : 'Đang phát hành',
        isCurrent: vIdx === 0,
        moderationScore: v.moderationScore || 98.5,
        changelog: Array.isArray(v.changelog) ? v.changelog : ['Tối ưu khẩu hình AI', 'Dolby Spatial Audio'],
        hlsUrl: v.videoUrl || v.hlsUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        duration: v.duration || api.duration || '45:00',
      }))
    : [
        {
          id: `v-${api.id || defaultIndex}-1`,
          versionNumber: 'v1.0.0',
          versionTitle: 'Bản Chuẩn 4K AI Cinema',
          releaseDate: new Date().toISOString(),
          author: 'Đạo diễn AI',
          aiModel: 'CinemaGen v3.2',
          status: 'published',
          statusLabel: 'Đang phát hành',
          isCurrent: true,
          moderationScore: 98.5,
          changelog: ['Bản Master 4K 60fps'],
          hlsUrl: api.videoUrl || api.hlsUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          duration: api.duration || '45:00',
        },
      ];

  return {
    id: api.id || `ep-${defaultIndex}`,
    episodeNumber: api.episodeNumber || defaultIndex,
    title: api.title || `Tập ${defaultIndex}`,
    duration: api.duration || '45:00',
    hlsUrl: api.videoUrl || api.hlsUrl || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    thumbnailUrl: api.thumbnailUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    price: api.tokenCost !== undefined ? api.tokenCost : (defaultIndex === 1 ? 0 : 50),
    isFree: api.isFree ?? defaultIndex === 1,
    isPreview: defaultIndex === 1,
    isUnlocked: api.isUnlocked ?? defaultIndex === 1,
    synopsis: api.description || api.synopsis || `Nội dung kịch tính và kỹ xảo AI trong Tập ${defaultIndex}.`,
    currentVersion: versions[0]?.versionNumber,
    versions,
  };
}

export function adaptApiWalletToWallet(api: any): WalletState {
  if (!api) return { mainCoin: 120, bonusCoin: 80 };
  return {
    mainCoin: Number(api.mainBalance ?? api.mainCoin ?? 120),
    bonusCoin: Number(api.bonusBalance ?? api.bonusCoin ?? 80),
  };
}

export function adaptApiCheckInToStreak(api: any): CheckInStreak {
  const todayIdx = getTodayDayIndex();
  const todayStr = getTodayDateString();

  if (!api) return mockCheckInStreak;

  const currentDay = typeof api.currentDay === 'number' ? api.currentDay : todayIdx;
  const isClaimedToday = Boolean(
    api.todayClaimed ?? (api.lastCheckInDate === todayStr || !api.canClaimToday)
  );

  return {
    days: mockCheckInStreak.days.map((d, idx) => {
      const isToday = idx === currentDay;
      const claimed = api.claimedDays
        ? api.claimedDays.includes(idx)
        : idx < (api.streakCount ?? currentDay) || (isToday && isClaimedToday);
      return {
        ...d,
        claimed,
        isToday,
      };
    }),
    currentStreak: api.streakCount ?? (isClaimedToday ? currentDay + 1 : currentDay),
    lastCheckInDate: api.lastCheckInDate || (isClaimedToday ? todayStr : null),
    todayClaimed: isClaimedToday,
  };
}

export function adaptApiProjectToProject(api: any): Project {
  const episodes: ProductionEpisode[] = Array.isArray(api.episodes) && api.episodes.length > 0
    ? api.episodes.map((ep: any, index: number) => {
        const scenes: Scene[] = Array.isArray(ep.scenes)
          ? ep.scenes.map((sc: any, sIdx: number) => ({
              id: sc.id || `sc-${index + 1}-${sIdx + 1}`,
              title: sc.title || `Cảnh ${sIdx + 1}`,
              prompt: sc.prompt || sc.description || '',
              status: sc.status || 'pending',
              duration: sc.duration || '15s',
              model: sc.model || 'CinemaGen v3.2',
              progress: sc.progress || 0,
              videoUrl: sc.videoUrl || sc.assetUrl,
              resolution: '4K Ultra HD',
              audioTrack: 'Dolby Atmos Master',
              voiceOver: sc.voiceOver || '',
            }))
          : [
              {
                id: `sc-${index + 1}-1`,
                title: 'Cảnh 1: Thiết lập bối cảnh',
                prompt: 'Góc quay cinematic bối cảnh tương lai neon.',
                status: 'completed' as const,
                duration: '15s',
                model: 'CinemaGen v3.2',
                progress: 100,
                videoUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
                resolution: '4K Ultra HD',
                audioTrack: 'Dolby Atmos Master',
              },
            ];

        return {
          id: ep.id || `ep-pkg-${index + 1}`,
          title: ep.title || `Tập ${index + 1}`,
          episodeNumber: ep.episodeNumber || index + 1,
          status: ep.status || (index === 0 ? 'published' : 'draft'),
          quotaAllocated: ep.quotaAllocated || ep.quota_allocated || 500,
          tokensUsed: ep.tokensUsed || ep.actual_tokens_used || 0,
          scenes,
          plan: {
            title: ep.title || `Kịch bản Tập ${index + 1}`,
            synopsis: ep.synopsis || 'Bản phác thảo kịch bản sản xuất tập phim.',
            targetDuration: ep.targetDuration || 30,
            estimatedTokens: ep.estimatedTokens || 450,
            approach: ep.productionApproach || 'Tạo khung hình AI sau đó nội suy video chất lượng cao.',
            status: ep.status || 'approved',
          },
          videoDraftUrl: ep.videoDraftUrl || ep.video_draft_url,
        };
      })
    : [];

  return {
    id: api.id || `proj-${Date.now()}`,
    title: api.title || 'Dự Án Điện Ảnh AI',
    synopsis: api.synopsis || api.description || 'Dự án phim điện ảnh AI thế hệ mới.',
    totalEpisodes: episodes.length || api.episodeCount || 1,
    deadline: api.deadline || '2026-12-31',
    plannedReleaseDate: api.plannedReleaseDate || '2026-12-31',
    creatorName: api.assignedCreator?.fullName || 'Trần Minh Huy',
    reviewerName: api.createdBy?.fullName || 'Lê Quốc Bảo (Reviewer)',
    genre: api.genre || ['Khoa học viễn tưởng', 'Hành động'],
    status: api.status === 'PUBLISHED' ? 'completed' : api.status === 'IN_PRODUCTION' ? 'in_production' : 'planning',
    totalBudgetTokens: api.totalAiQuotaBudget || 3000,
    allocatedTokens: Math.max(0, (api.totalAiQuotaBudget || 3000) - (api.remainingAiQuotaBudget || 2100)),
    consumedTokens: 815,
    episodes,
    createdAt: api.createdAt || new Date().toISOString(),
    updatedAt: api.updatedAt || new Date().toISOString(),
  };
}
