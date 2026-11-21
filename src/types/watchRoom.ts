export type RoomPlaybackState = 'PLAYING' | 'PAUSED' | 'ENDED';

/** BE WatchRoomResponseDto. */
export interface WatchRoom {
  id: string;
  roomCode: string;
  episodeId: string;
  hostUserId: string | null;
  status: string;
  currentPositionSeconds: number;
  participantCount?: number;
  /** Members currently in the room (who is watching together). */
  participants?: { userId: string; fullName: string }[];
  serverTimestamp?: number;
}

/** What the gateway broadcasts after the Host plays, pauses or seeks (and every 5 s while playing). */
export interface RoomSync {
  state: RoomPlaybackState;
  positionSeconds: number;
  hostUserId?: string;
  serverTimestamp: number;
}

export interface Friendship {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
  createdAt: string;
  /** The other member, named (GET /friends). */
  friend?: { id: string; fullName: string };
  /** True when this member received the request. */
  incoming?: boolean;
}

/** ROOM_CHAT_MESSAGE: one line of the room chat. */
export interface RoomChatMessage {
  id: string;
  userId: string;
  fullName: string;
  text: string;
  sentAt: number;
}

/** ROOM_AD_STATE: the Host's mid-roll, shown to the whole room until the Host skips it. */
export interface RoomAdState {
  active: boolean;
  title?: string;
  mediaUrl?: string;
  durationSeconds?: number;
  startedAt?: number;
}

/** ROOM_SCREEN: what a member who just joined needs to catch up. */
export interface RoomScreen {
  quality: string;
  ad: RoomAdState;
  chat: RoomChatMessage[];
}
