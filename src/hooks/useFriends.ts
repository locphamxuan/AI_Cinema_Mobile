import { useCallback, useEffect, useRef, useState } from 'react';
import { showDialog } from '../lib/dialog';
import { emailError, friendName, groupFriendships } from '../lib/friends';
import { watchRoomService } from '../services/watchRoomService';
import { useSessionStore } from '../store';
import type { Friendship } from '../types/watchRoom';

/**
 * BR-69 friends, shared by the Friends screen and the watch-party panel: load, add by email, answer requests,
 * block and unblock. Declining a request blocks its sender on the BE, so it asks first.
 */
export function useFriends() {
  const myId = useSessionStore((s) => s.user?.id);
  const [rows, setRows] = useState<Friendship[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTried, setEmailTried] = useState(false);
  const [sending, setSending] = useState(false);
  // Requests in flight, by friendship row (or 'add'): a double tap would otherwise answer twice and show a refusal.
  const inFlight = useRef(new Set<string>());
  const once = async (id: string, task: () => Promise<unknown>) => {
    if (inFlight.current.has(id)) return;
    inFlight.current.add(id);
    try {
      await task();
    } finally {
      inFlight.current.delete(id);
    }
  };

  const apply = (res: Awaited<ReturnType<typeof watchRoomService.friends>>) => {
    setFailed(!res.success);
    setRows(res.success && Array.isArray(res.data) ? res.data : []);
  };

  const reload = useCallback(async () => apply(await watchRoomService.friends()), []);

  useEffect(() => {
    let active = true;
    void watchRoomService.friends().then((res) => {
      if (active) apply(res);
    });
    return () => {
      active = false;
    };
  }, []);

  const add = async () => {
    setEmailTried(true);
    if (emailError(email)) return;
    await once('add', async () => {
      setSending(true);
      const res = await watchRoomService.addFriendByEmail(email);
      setSending(false);
      if (!res.success) return showDialog('Chưa gửi được lời mời', res.message || 'Không tìm thấy thành viên với email này.');
      setEmail('');
      setEmailTried(false);
      showDialog('Đã gửi lời mời kết bạn', 'Khi bạn ấy đồng ý, bạn có thể mời vào phòng xem nhóm.');
      void reload();
    });
  };

  const accept = (row: Friendship) =>
    once(row.id, async () => {
      const res = await watchRoomService.respond(row.id, true);
      if (!res.success) showDialog('Chưa đồng ý được', res.message);
      await reload();
    });

  const decline = (row: Friendship) =>
    showDialog(`Từ chối ${friendName(row)}?`, 'Người này sẽ không gửi lại lời mời hay mời bạn vào phòng được nữa.', [
      { text: 'Để sau', style: 'cancel' },
      {
        text: 'Từ chối',
        style: 'destructive',
        onPress: async () => {
          const res = await watchRoomService.respond(row.id, false);
          if (!res.success) showDialog('Chưa từ chối được', res.message);
          void reload();
        },
      },
    ]);

  const block = (row: Friendship) => {
    if (!row.friend) return;
    const friendId = row.friend.id;
    showDialog(`Chặn ${friendName(row)}?`, 'Hai bạn sẽ không mời nhau vào phòng xem nhóm. Bạn có thể bỏ chặn sau.', [
      { text: 'Để sau', style: 'cancel' },
      {
        text: 'Chặn',
        style: 'destructive',
        onPress: async () => {
          const res = await watchRoomService.block(friendId);
          if (!res.success) showDialog('Chưa chặn được', res.message);
          void reload();
        },
      },
    ]);
  };

  const unblock = async (row: Friendship) => {
    const friend = row.friend;
    if (!friend) return;
    await once(row.id, async () => {
      const res = await watchRoomService.unblock(friend.id);
      if (!res.success) return showDialog('Chưa bỏ chặn được', res.message);
      showDialog('Đã bỏ chặn', `${friendName(row)} có thể kết bạn và mời bạn vào phòng xem nhóm như trước.`);
      await reload();
    });
  };

  return {
    loading: rows === null,
    failed,
    groups: groupFriendships(rows ?? [], myId),
    email,
    setEmail,
    emailMessage: emailTried ? emailError(email) : undefined,
    sending,
    add,
    accept,
    decline,
    block,
    unblock,
    reload,
  };
}
