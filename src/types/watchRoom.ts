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

/** ROOM_INVITED payload: a friend asks this member into their room for 10 minutes. */
export interface RoomInvite {
  roomId: string;
  invitedBy: string;
  expiresAt: number;
}
