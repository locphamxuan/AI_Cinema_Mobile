import { useCallback, useEffect, useId, useState } from 'react';
import { showDialog } from '../lib/dialog';
import { episodeAccessService } from '../services/episodeAccessService';
import { useCatalogStore, useUiStore } from '../store';
import type { Episode } from '../types/movie';
import type { AccessDecision } from '../types/episodeAccess';

export interface LockedEpisode {
  episode: Episode;
  decision: AccessDecision;
  /** The gate that asked, so a top-up made for this episode comes back to the same screen. */
  gateId?: string;
}

/**
 * Asks the BE whether the viewer may watch an episode (GET /episodes/:id/access) before playing
 * it; the client never decides that from cached flags. A refused episode is handed to the unlock
 * modal together with the BE's decision: its price, the wallet and whether the plan is an option.
 */
export function useEpisodeGate(onGranted: (episode: Episode) => void) {
  const { markEpisodeUnlocked } = useCatalogStore();
  const { openAuthModal } = useUiStore();
  const [locked, setLocked] = useState<LockedEpisode | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const gateId = useId();

  const open = useCallback(
    async (episode: Episode) => {
      if (episode.availability === 'UNDER_REVISION') {
        showDialog('Tập đang bảo trì', episode.notice || 'Tập phim đang được chỉnh sửa, vui lòng quay lại sau.');
        return;
      }
      setCheckingId(episode.id);
      const res = await episodeAccessService.checkAccess(episode.id);
      setCheckingId(null);
      if (!res.success || !res.data) {
        showDialog('Không kiểm tra được quyền xem', res.message || 'Vui lòng thử lại.');
        return;
      }
      if (res.data.accessGranted) {
        markEpisodeUnlocked(episode.id);
        onGranted(episode);
        return;
      }
      if (res.data.nextAction === 'NOT_PLAYABLE') {
        showDialog('Tập chưa xem được', res.data.notice || 'Tập phim chưa sẵn sàng để phát. Vui lòng quay lại sau.');
        return;
      }
      if (res.data.nextAction === 'REGISTER_OR_LOGIN') {
        openAuthModal('login');
        return;
      }
      setLocked({ episode, decision: res.data, gateId });
    },
    [markEpisodeUnlocked, onGranted, openAuthModal, gateId],
  );

  // After a PAID top-up the member chose "go back to the episode": ask the BE again (it may now be enough Coin).
  const resumePurchase = useUiStore((s) => s.resumePurchase);
  useEffect(() => {
    if (!resumePurchase) return;
    const intent = useUiStore.getState().takeResumePurchase((i) => i.kind === 'episode' && i.gateId === gateId);
    if (intent?.kind === 'episode') void Promise.resolve(intent.episode).then(open);
  }, [resumePurchase, gateId, open]);

  return { open, checkingId, locked, close: () => setLocked(null) };
}
