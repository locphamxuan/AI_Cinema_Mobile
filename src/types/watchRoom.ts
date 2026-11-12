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
}
