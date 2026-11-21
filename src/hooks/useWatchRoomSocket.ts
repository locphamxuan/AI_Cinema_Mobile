import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_CONFIG } from '../constants/config';
import { apiClient } from '../services/apiClient';
import { CHAT_KEEP, CHAT_REJECTED_NOTICE, NOTICES, ROOM_EVENT, roomErrorCode, roomErrorNotice } from '../lib/roomEvents';
import type { RoomAdState, RoomChatMessage, RoomPlaybackState, RoomScreen, RoomSync, WatchRoom } from '../types/watchRoom';

export { ROOM_EVENT };

export const SESSION_EXPIRED_NOTICE = 'Phiên đăng nhập đã hết hạn. Đăng nhập lại rồi mở phòng lần nữa.';

/**
 * The `/watch` namespace on the backend. On the web the REST calls go through the same-origin `/api` proxy
 * of the dev server, which does not forward WebSockets, so the socket talks to the backend directly
 * (EXPO_PUBLIC_API_URL, else the local backend): a WebSocket is not held back by CORS.
 */
export const watchSocketUrl = (baseUrl = API_CONFIG.BASE_URL, directUrl = process.env.EXPO_PUBLIC_API_URL) => {
  const origin = baseUrl.startsWith('/') ? directUrl || 'http://localhost:3001/api' : baseUrl;
  return `${origin.replace(/\/api\/?$/, '')}/watch`;
};

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


/**
 * BR-69 live sync. The member stays in the room as long as the room lives: socket.io reconnects on its own and the
 * hook joins the room again after every reconnect, so a network blip never drops a viewer while the Host is there.
 */
export function useWatchRoomSocket(roomId: string | undefined, { join = true }: { join?: boolean } = {}) {
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
    let reauth = false;
    /** The token of the last handshake: a rejected one is never sent twice. */
    let sentToken = '';
    /** Handshakes refused since the last connect: one fresh token is tried, then the room says the session ended. */
    let refused = 0;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      // A callback, so every (re)connect sends the current token, refreshed first when it has expired.
      socket = io(watchSocketUrl(), {
        transports: ['websocket'],
        auth: (send) =>
          void apiClient.getFreshAccessToken().then((token) => {
            sentToken = token;
            send({ token });
          }),
        reconnection: true,
      });
      socketRef.current = socket;
      const patch = (next: Partial<WatchRoomLive>) => setLive((prev) => ({ ...prev, ...next }));
      socket.on('connect', () => {
        refused = 0;
        patch({ connected: true, notice: null });
        // The lobby only sends invites: taking the Host seat there would read as a drop when the room opens.
        if (join) socket?.emit(ROOM_EVENT.JOIN, { roomId });
      });
      socket.on('disconnect', (why) => {
        patch({ connected: false });
        // The BE drops an expired token itself, and socket.io does not reconnect after a server-side disconnect.
        if (why !== 'io server disconnect' || !reauth) return;
        reauth = false;
        // Reconnect only with a different token: a revoked refresh token, a locked account or a skewed clock would
        // otherwise loop forever on the same rejected handshake.
        const rejected = sentToken;
        void apiClient.getFreshAccessToken().then((token) => {
          if (cancelled) return;
          if (!token || token === rejected) {
            patch({ closed: true, notice: SESSION_EXPIRED_NOTICE });
            return;
          }
          socket?.connect();
        });
      });
      // The BE checks the token in the handshake: a refused one arrives here, before any room event. socket.io does
      // not retry that refusal by itself, so the hook refreshes the session once and connects again.
      socket.on('connect_error', (error: Error) => {
        if (error.message !== 'UNAUTHENTICATED' || cancelled) return;
        const rejected = sentToken;
        refused += 1;
        void (refused > 1 ? Promise.resolve('') : apiClient.refreshAccessToken()).then((token) => {
          if (cancelled) return;
          if (!token || token === rejected) {
            patch({ closed: true, notice: SESSION_EXPIRED_NOTICE });
            return;
          }
          socket?.connect();
        });
      });
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
      socket.on(ROOM_EVENT.ERROR, (error: { reason?: string; details?: unknown }) => {
        if (roomErrorCode(error) === 'UNAUTHENTICATED') reauth = true;
        patch({ notice: roomErrorNotice(error) });
      });
      socket.on(ROOM_EVENT.HOST_INACTIVE, () => patch({ notice: NOTICES[ROOM_EVENT.HOST_INACTIVE] }));
      socket.on(ROOM_EVENT.LAST_ONE_LEFT, () =>
        patch({ notice: 'Các bạn khác đã rời phòng. Bạn có thể xem tiếp ở đây hoặc rời phòng để xem một mình.' }),
      );
    });
    return () => {
      cancelled = true;
      socket?.removeAllListeners();
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [roomId, join]);

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
