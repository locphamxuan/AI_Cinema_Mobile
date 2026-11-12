import { watchSocketUrl } from '../hooks/useWatchRoomSocket';
import { apiClient } from '../services/apiClient';
import { watchRoomService } from '../services/watchRoomService';

const ok = <T,>(data: T) => ({ success: true, statusCode: 200, data });
const room = { id: 'r1', roomCode: 'AB2-CD9', episodeId: 'e1', hostUserId: 'u1', status: 'PLAYING', currentPositionSeconds: 0 };

describe('watchRoomService (BR-69, Member only on the BE)', () => {
  beforeEach(() => jest.restoreAllMocks());

  it('creates, joins by code and joins a room on the BE routes', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue(ok(room));
    await watchRoomService.create('e1');
    await watchRoomService.joinByCode('  ab2-cd9 ');
    await watchRoomService.join('r1');
    expect(post.mock.calls).toEqual([
      ['/watch-rooms', { episodeId: 'e1' }],
      ['/watch-rooms/join', { roomCode: 'ab2-cd9' }],
      ['/watch-rooms/r1/join', {}],
    ]);
  });

  it('lets the Host hand over or disband when leaving, and plays the next episode', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue(ok({ closed: false, newHostUserId: 'u2' }));
    await watchRoomService.leave('r1', 'TRANSFER');
    await watchRoomService.leave('r1');
    await watchRoomService.nextEpisode('r1');
    expect(post.mock.calls).toEqual([
      ['/watch-rooms/r1/leave', { action: 'TRANSFER' }],
      ['/watch-rooms/r1/leave', {}],
      ['/watch-rooms/r1/next-episode', {}],
    ]);
  });

  it('reaches the /watch socket namespace on the API host without the /api prefix', () => {
    expect(watchSocketUrl('http://10.0.2.2:3001/api')).toBe('http://10.0.2.2:3001/watch');
    expect(watchSocketUrl('https://api.example.com/api/')).toBe('https://api.example.com/watch');
  });

  it('adds a friend by email and answers a request', async () => {
    const post = jest.spyOn(apiClient, 'post').mockResolvedValue(ok({}));
    await watchRoomService.addFriendByEmail(' ban@gmail.com ');
    await watchRoomService.respond('f1', true);
    expect(post.mock.calls).toEqual([
      ['/friends', { receiverEmail: 'ban@gmail.com' }],
      ['/friends/f1/respond', { accept: true }],
    ]);
  });
});
