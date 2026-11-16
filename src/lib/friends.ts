import type { Friendship } from '../types/watchRoom';

export const friendName = (row: Friendship) => row.friend?.fullName || 'Thành viên AI Cinema';

/** A loose shape check before asking the BE; it has the final say on whether the member exists. */
export const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function emailError(value: string): string | undefined {
  if (!value.trim()) return 'Nhập email của bạn bè.';
  return looksLikeEmail(value) ? undefined : 'Email chưa đúng định dạng, ví dụ ten@gmail.com.';
}

export interface FriendGroups {
  friends: Friendship[];
  incoming: Friendship[];
  outgoing: Friendship[];
  /** Blocks this member set; only these can be lifted (the BE removes the row this member sent). */
  blocked: Friendship[];
}

/**
 * Splits GET /friends. A declined request is stored as BLOCKED by the receiver, so a BLOCKED row counts as "my
 * block" only when this member is its sender (POST /friends/:id/block); declined requests sent to me stay hidden.
 */
export function groupFriendships(rows: Friendship[], myId?: string): FriendGroups {
  // A block I set on a friend creates a second row next to the old ACCEPTED one; hide the friend in that case.
  const blockedIds = new Set(rows.filter((r) => r.status === 'BLOCKED' && r.senderId === myId).map((r) => r.friend?.id));
  return {
    friends: rows.filter((r) => r.status === 'ACCEPTED' && !blockedIds.has(r.friend?.id)),
    incoming: rows.filter((r) => r.status === 'PENDING' && r.incoming),
    outgoing: rows.filter((r) => r.status === 'PENDING' && !r.incoming),
    blocked: rows.filter((r) => r.status === 'BLOCKED' && Boolean(myId) && r.senderId === myId),
  };
}
