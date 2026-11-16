import { emailError, groupFriendships } from '../lib/friends';
import { watchRoomService } from '../services/watchRoomService';
import type { Friendship } from '../types/watchRoom';

const row = (over: Partial<Friendship>): Friendship => ({
  id: over.id ?? 'f',
  senderId: 'other',
  receiverId: 'me',
  status: 'ACCEPTED',
  createdAt: '',
  friend: { id: 'other', fullName: 'Bạn' },
  ...over,
});

afterEach(() => jest.restoreAllMocks());

describe('friend groups (BR-69)', () => {
  it('splits friends, requests and the blocks this member set', () => {
    const rows = [
      row({ id: 'a', friend: { id: 'u-a', fullName: 'A' } }),
      row({ id: 'in', status: 'PENDING', incoming: true, friend: { id: 'u-in', fullName: 'In' } }),
      row({ id: 'out', status: 'PENDING', incoming: false, senderId: 'me', friend: { id: 'u-out', fullName: 'Out' } }),
      // I declined their request: stored as BLOCKED with them as sender, cannot be lifted from here.
      row({ id: 'declined', status: 'BLOCKED', senderId: 'u-d', friend: { id: 'u-d', fullName: 'D' } }),
      row({ id: 'mine', status: 'BLOCKED', senderId: 'me', friend: { id: 'u-b', fullName: 'B' } }),
    ];
    const groups = groupFriendships(rows, 'me');
    expect(groups.friends.map((r) => r.id)).toEqual(['a']);
    expect(groups.incoming.map((r) => r.id)).toEqual(['in']);
    expect(groups.outgoing.map((r) => r.id)).toEqual(['out']);
    expect(groups.blocked.map((r) => r.id)).toEqual(['mine']);
  });

  it('hides a friend this member has just blocked', () => {
    const rows = [
      row({ id: 'old', friend: { id: 'u-x', fullName: 'X' } }),
      row({ id: 'block', status: 'BLOCKED', senderId: 'me', receiverId: 'u-x', friend: { id: 'u-x', fullName: 'X' } }),
    ];
    const groups = groupFriendships(rows, 'me');
    expect(groups.friends).toEqual([]);
    expect(groups.blocked.map((r) => r.id)).toEqual(['block']);
  });

  it('checks the email before asking the BE', () => {
    expect(emailError('')).toContain('Nhập email');
    expect(emailError('ten@')).toContain('chưa đúng định dạng');
    expect(emailError('ten@gmail.com')).toBeUndefined();
  });

  it('blocks with POST and unblocks with DELETE on /friends/:id/block', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200, text: async () => 'true' } as Response);
    await watchRoomService.block('u-1');
    await watchRoomService.unblock('u-1');
    const calls = fetchMock.mock.calls.map(([url, init]) => `${init?.method} ${new URL(String(url), 'http://x').pathname.replace(/^\/api/, '')}`);
    expect(calls).toEqual(['POST /friends/u-1/block', 'DELETE /friends/u-1/block']);
  });
});
