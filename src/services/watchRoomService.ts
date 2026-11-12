import { API_ROUTES } from '../constants/apiRoutes';
import type { ApiResponse } from '../types/api';
import type { Friendship, RoomPlaybackState, WatchRoom } from '../types/watchRoom';
import { apiClient } from './apiClient';

const R = API_ROUTES.WATCH_ROOMS;
const F = API_ROUTES.FRIENDS;

/**
 * BR-69 Watch Party over REST (Member only). The live sync runs on the `/watch` socket (useWatchRoomSocket); the BE
 * checks each member's own right to watch the episode, age and device limits before letting them in.
 */
export const watchRoomService = {
  create: (episodeId: string): Promise<ApiResponse<WatchRoom>> => apiClient.post<WatchRoom>(R.CREATE, { episodeId }),
  joinByCode: (roomCode: string): Promise<ApiResponse<WatchRoom>> =>
    apiClient.post<WatchRoom>(R.JOIN_BY_CODE, { roomCode: roomCode.trim() }),
  join: (roomId: string): Promise<ApiResponse<WatchRoom>> => apiClient.post<WatchRoom>(R.JOIN(roomId), {}),
  get: (roomId: string): Promise<ApiResponse<WatchRoom>> => apiClient.get<WatchRoom>(R.DETAIL(roomId)),
  /** Host only: the REST twin of the socket sync, used when the socket is down. */
  sync: (roomId: string, state: RoomPlaybackState, positionSeconds: number) =>
    apiClient.put<WatchRoom>(R.DETAIL(roomId), { state, positionSeconds }),
  nextEpisode: (roomId: string) => apiClient.post<WatchRoom & { blockedUserIds: string[] }>(R.NEXT_EPISODE(roomId), {}),
  /** The Host leaves by handing the room over (TRANSFER, default) or closing it for everyone (DISBAND). */
  leave: (roomId: string, action?: 'TRANSFER' | 'DISBAND') =>
    apiClient.post<{ closed: boolean; newHostUserId: string | null }>(R.LEAVE(roomId), action ? { action } : {}),

  friends: (): Promise<ApiResponse<Friendship[]>> => apiClient.get<Friendship[]>(F.LIST),
  addFriend: (receiverId: string) => apiClient.post<Friendship>(F.LIST, { receiverId }),
  /** A member usually knows a friend's email, not their id. */
  addFriendByEmail: (email: string) => apiClient.post<Friendship>(F.LIST, { receiverEmail: email.trim() }),
  respond: (friendshipId: string, accept: boolean) => apiClient.post<Friendship>(F.RESPOND(friendshipId), { accept }),
};
