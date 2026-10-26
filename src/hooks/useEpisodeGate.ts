import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { episodeAccessService } from '../services/episodeAccessService';
import { useAppStore } from '../store/useAppStore';
import type { Episode } from '../types/movie';
import type { AccessDecision } from '../types/episodeAccess';

export interface LockedEpisode {
  episode: Episode;
  decision: AccessDecision;
}

/**
 * Asks the BE whether the viewer may watch an episode (GET /episodes/:id/access) before playing
 * it; the client never decides that from cached flags. A refused episode is handed to the unlock
 * modal together with the BE's decision: its price, the wallet and whether the plan is an option.
 */
export function useEpisodeGate(onGranted: (episode: Episode) => void) {
  const { openAuthModal, markEpisodeUnlocked } = useAppStore();
  const [locked, setLocked] = useState<LockedEpisode | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const open = useCallback(
    async (episode: Episode) => {
      if (episode.availability === 'UNDER_REVISION') {
        Alert.alert('Tập đang bảo trì', episode.notice || 'Tập phim đang được chỉnh sửa, vui lòng quay lại sau.');
        return;
      }
      setCheckingId(episode.id);
      const res = await episodeAccessService.checkAccess(episode.id);
      setCheckingId(null);
      if (!res.success || !res.data) {
        Alert.alert('Không kiểm tra được quyền xem', res.message || 'Vui lòng thử lại.');
        return;
      }
      if (res.data.accessGranted) {
        markEpisodeUnlocked(episode.id);
        onGranted({ ...episode, hlsUrl: res.data.streamUrl ?? episode.hlsUrl });
        return;
      }
      if (res.data.nextAction === 'REGISTER_OR_LOGIN') {
        openAuthModal('login');
        return;
      }
      setLocked({ episode, decision: res.data });
    },
    [markEpisodeUnlocked, onGranted, openAuthModal],
  );

  return { open, checkingId, locked, close: () => setLocked(null) };
}
