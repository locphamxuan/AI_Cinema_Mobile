import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants/config';
import { storage, STORAGE_KEYS } from '../lib/storage';
import type { RoomAdState, RoomChatMessage, RoomPlaybackState, RoomScreen, RoomSync, WatchRoom } from '../types/watchRoom';

/** Event names of the BE WatchRoomGateway (room-events.ts). */
export const ROOM_EVENT = {
  JOIN: 'ROOM_JOIN',
  PLAYBACK: 'ROOM_PLAYBACK',
  LEAVE: 'ROOM_LEAVE',
  VOTE_HOST: 'ROOM_VOTE_HOST',
  INVITE: 'ROOM_INVITE',
  INVITE_SENT: 'ROOM_INVITE_SENT',
  INVITE_FAILED: 'ROOM_INVITE_FAILED',
  JOINED: 'ROOM_JOINED',
  PARTICIPANT_JOINED: 'ROOM_PARTICIPANT_JOINED',
  PARTICIPANT_LEFT: 'ROOM_PARTICIPANT_LEFT',
  SYNC_PLAYBACK: 'SYNC_PLAYBACK',
  HEARTBEAT_SYNC: 'HEARTBEAT_SYNC',
  HOST_DISCONNECTED: 'ROOM_HOST_DISCONNECTED',
  HOST_RECONNECTED: 'ROOM_HOST_RECONNECTED',
  HOST_CHANGED: 'ROOM_HOST_CHANGED',
  VOTE_OPEN: 'ROOM_VOTE_OPEN',
  EPISODE_ENDED: 'ROOM_EPISODE_ENDED',
  EPISODE_CHANGED: 'ROOM_EPISODE_CHANGED',
  TERMINATED: 'ROOM_TERMINATED',
  SESSION_REPLACED: 'ROOM_SESSION_REPLACED',
  // Shared screen (13/11/2026): chat, the Host's ad and quality, the catch-up snapshot.
  CHAT: 'ROOM_CHAT',
  AD_BREAK: 'ROOM_AD_BREAK',
  QUALITY: 'ROOM_QUALITY',
  SCREEN_STATE: 'ROOM_SCREEN_STATE',
  CHAT_MESSAGE: 'ROOM_CHAT_MESSAGE',
  CHAT_REJECTED: 'ROOM_CHAT_REJECTED',
  AD_STATE: 'ROOM_AD_STATE',
  QUALITY_CHANGED: 'ROOM_QUALITY_CHANGED',
  SCREEN: 'ROOM_SCREEN',
  ERROR: 'ROOM_ERROR',
} as const;

const CHAT_KEEP = 50;
const CHAT_REJECTED_NOTICE: Record<string, string> = {
  RATE_LIMITED: 'Bạn gửi nhanh quá, đợi vài giây nhé.',
  TOO_LONG: 'Tin nhắn dài quá (tối đa 300 ký tự).',
};

/** The socket lives on the API host without the /api prefix, namespace /watch. */
export const watchSocketUrl = (baseUrl = API_CONFIG.BASE_URL) => `${baseUrl.replace(/\/api\/?$/, '')}/watch`;

export interface WatchRoomLive {
  connected: boolean;
  room: WatchRoom | null;
  hostUserId: string | null;
  participantCount: number;
  lastSync: RoomSync | null;
  voteOpen: boolean;
  /** Last notice for the viewer (host lost, room closed, ...), in Vietnamese. */
  notice: string | null;
  /** True once the room is gone for good (disbanded, episode taken down, signed in elsewhere). */
  closed: boolean;
  /** The room chat, oldest first (the latest 50 lines). */
  chat: RoomChatMessage[];
  /** The Host's ad the whole room is watching; members wait for the Host to skip it. */
  ad: RoomAdState;
  /** The stream quality the Host picked for everyone (`auto` = adaptive). */
  quality: string;
}

const NOTICES: Record<string, string> = {
  [ROOM_EVENT.HOST_DISCONNECTED]: 'Chủ phòng tạm mất kết nối, phòng vẫn giữ trong 45 giây.',
  [ROOM_EVENT.HOST_RECONNECTED]: 'Chủ phòng đã quay lại.',
  [ROOM_EVENT.HOST_CHANGED]: 'Phòng đã có chủ phòng mới.',
  [ROOM_EVENT.VOTE_OPEN]: 'Chủ phòng tạm dừng quá lâu: bạn có thể bỏ phiếu chọn chủ phòng mới.',
  [ROOM_EVENT.EPISODE_ENDED]: 'Tập phim đã hết, chờ chủ phòng chuyển tập tiếp theo.',
  [ROOM_EVENT.EPISODE_CHANGED]: 'Chủ phòng đã chuyển sang tập tiếp theo.',
};

/**
 * BR-69 live sync. The member stays in the room as long as the room lives: socket.io reconnects on its own and the
 * hook joins the room again after every reconnect, so a network blip never drops a viewer while the Host is there.
 */
export function useWatchRoomSocket(roomId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const [live, setLive] = useState<WatchRoomLive>({
    connected: false,
    room: null,
    hostUserId: null,
    participantCount: 0,
    lastSync: null,
    voteOpen: false,
    notice: null,
    closed: false,
    chat: [],
    ad: { active: false },
    quality: 'auto',
  });

  useEffect(() => {
    if (!roomId) return;
    let socket: Socket | null = null;
    let cancelled = false;
    void storage.getString(STORAGE_KEYS.AUTH_TOKEN, '').then((token) => {
      if (cancelled) return;
      socket = io(watchSocketUrl(), { transports: ['websocket'], auth: { token }, reconnection: true });
      socketRef.current = socket;
      const patch = (next: Partial<WatchRoomLive>) => setLive((prev) => ({ ...prev, ...next }));
      socket.on('connect', () => {
        patch({ connected: true });
        socket?.emit(ROOM_EVENT.JOIN, { roomId });
      });
      socket.on('disconnect', () => patch({ connected: false }));
      socket.on(ROOM_EVENT.JOINED, ({ room }: { room: WatchRoom }) => {
        patch({ room, hostUserId: room.hostUserId, participantCount: room.participantCount ?? 1 });
        socket?.emit(ROOM_EVENT.SCREEN_STATE, { roomId });
      });
      socket.on(ROOM_EVENT.SCREEN, (screen: RoomScreen) =>
        patch({ chat: screen.chat ?? [], ad: screen.ad ?? { active: false }, quality: screen.quality ?? 'auto' }),
      );
      socket.on(ROOM_EVENT.CHAT_MESSAGE, (message: RoomChatMessage) =>
        setLive((prev) => ({ ...prev, chat: [...prev.chat, message].slice(-CHAT_KEEP) })),
      );
      socket.on(ROOM_EVENT.CHAT_REJECTED, ({ reason }: { reason?: string }) =>
        patch({ notice: CHAT_REJECTED_NOTICE[reason ?? ''] ?? 'Chưa gửi được tin nhắn.' }),
      );
      socket.on(ROOM_EVENT.AD_STATE, (ad: RoomAdState) => patch({ ad }));
      socket.on(ROOM_EVENT.QUALITY_CHANGED, ({ quality }: { quality: string }) => patch({ quality }));
      const onSync = (sync: RoomSync) => patch({ lastSync: sync, voteOpen: false });
      socket.on(ROOM_EVENT.SYNC_PLAYBACK, onSync);
      socket.on(ROOM_EVENT.HEARTBEAT_SYNC, onSync);
      socket.on(ROOM_EVENT.PARTICIPANT_JOINED, ({ count }: { count: number }) => patch({ participantCount: count }));
      socket.on(ROOM_EVENT.PARTICIPANT_LEFT, ({ count }: { count?: number }) =>
        setLive((prev) => ({ ...prev, participantCount: count ?? Math.max(1, prev.participantCount - 1) })),
      );
      socket.on(ROOM_EVENT.HOST_CHANGED, ({ newHostUserId }: { newHostUserId: string }) =>
        patch({
          hostUserId: newHostUserId,
          notice: NOTICES[ROOM_EVENT.HOST_CHANGED],
          voteOpen: false,
          ad: { active: false },
        }),
      );
      for (const event of [ROOM_EVENT.HOST_DISCONNECTED, ROOM_EVENT.HOST_RECONNECTED, ROOM_EVENT.EPISODE_ENDED]) {
        socket.on(event, () => patch({ notice: NOTICES[event] }));
      }
      socket.on(ROOM_EVENT.VOTE_OPEN, () => patch({ voteOpen: true, notice: NOTICES[ROOM_EVENT.VOTE_OPEN] }));
      socket.on(ROOM_EVENT.EPISODE_CHANGED, (payload: { room?: WatchRoom }) =>
        patch({ notice: NOTICES[ROOM_EVENT.EPISODE_CHANGED], ...(payload?.room ? { room: payload.room } : {}) }),
      );
      socket.on(ROOM_EVENT.TERMINATED, ({ reason }: { reason?: string }) =>
        patch({ closed: true, notice: reason === 'HOST_DISBANDED' ? 'Chủ phòng đã giải tán phòng.' : 'Phòng xem nhóm đã đóng.' }),
      );
      socket.on(ROOM_EVENT.SESSION_REPLACED, () =>
        patch({ closed: true, notice: 'Bạn đã tham gia phòng này từ một thiết bị khác.' }),
      );
      socket.on(ROOM_EVENT.INVITE_SENT, () => patch({ notice: 'Đã gửi lời mời. Có thể mời lại người này sau 60 giây.' }));
      socket.on(ROOM_EVENT.INVITE_FAILED, (outcome: { reason?: string }) =>
        patch({
          notice:
            outcome?.reason === 'COOLDOWN'
              ? 'Vừa mời người này rồi, đợi 60 giây nhé.'
              : 'Chưa mời được: chỉ mời được bạn bè đã chấp nhận kết bạn.',
        }),
      );
      socket.on(ROOM_EVENT.ERROR, (error: { reason?: string; message?: string }) =>
        patch({ notice: error?.message ?? 'Không thể đồng bộ phòng xem nhóm.' }),
      );
    });
    return () => {
      cancelled = true;
      socket?.removeAllListeners();
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  /** Host only: the BE refuses anyone else. */
  const sendPlayback = useCallback(
    (state: RoomPlaybackState, positionSeconds: number) =>
      socketRef.current?.emit(ROOM_EVENT.PLAYBACK, { roomId, state, positionSeconds: Math.max(0, positionSeconds) }),
    [roomId],
  );
  /** Invite an accepted friend: a socket ping if online, else an in-app notification (60 s cooldown on the BE). */
  const invite = useCallback(
    (friendId: string) => socketRef.current?.emit(ROOM_EVENT.INVITE, { roomId, friendId }),
    [roomId],
  );
  const voteHost = useCallback(() => socketRef.current?.emit(ROOM_EVENT.VOTE_HOST, { roomId }), [roomId]);
  const leave = useCallback(() => socketRef.current?.emit(ROOM_EVENT.LEAVE, { roomId }), [roomId]);
  const sendChat = useCallback((text: string) => socketRef.current?.emit(ROOM_EVENT.CHAT, { roomId, text }), [roomId]);
  /** Host only: the BE looks the ad up in the Host's own session by breakId and mirrors it to the room. */
  const sendAd = useCallback(
    (active: boolean, breakId?: string) => socketRef.current?.emit(ROOM_EVENT.AD_BREAK, { roomId, active, breakId }),
    [roomId],
  );
  /** Host only: `auto` or a rendition name such as `720p`. */
  const sendQuality = useCallback(
    (quality: string) => socketRef.current?.emit(ROOM_EVENT.QUALITY, { roomId, quality }),
    [roomId],
  );

  return { live, sendPlayback, voteHost, leave, invite, sendChat, sendAd, sendQuality };
}
