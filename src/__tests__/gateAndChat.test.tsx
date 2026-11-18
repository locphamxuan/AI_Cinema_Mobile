import React from 'react';
import { act, create } from 'react-test-renderer';
import { useEpisodeGate } from '../hooks/useEpisodeGate';
import { POLL_MS, useSupportChat } from '../hooks/useSupportChat';
import { useFriends } from '../hooks/useFriends';
import { episodeAccessService } from '../services/episodeAccessService';
import { supportService } from '../services/supportService';
import { watchRoomService } from '../services/watchRoomService';
import { useDialogStore } from '../store/dialogStore';
import type { ApiResponse } from '../types/api';
import type { AccessDecision } from '../types/episodeAccess';
import type { Episode } from '../types/movie';
import type { SupportConversation } from '../types/support';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ok = <T,>(data: T): ApiResponse<T> => ({ success: true, data, statusCode: 200 });
const flush = () => act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});

/** Every hook rendered by a test, unmounted after it so no timer outlives the test environment. */
const mounted: ReturnType<typeof create>[] = [];

function renderHook<R>(useHook: () => R) {
  const box: { current?: R } = {};
  function Probe() {
    const value = useHook();
    React.useEffect(() => {
      box.current = value;
    });
    return null;
  }
  act(() => {
    mounted.push(create(<Probe />));
  });
  return box as { current: R };
}

const episode = { id: 'ep-1', availability: 'AVAILABLE' } as Episode;

afterEach(() => {
  act(() => mounted.splice(0).forEach((tree) => tree.unmount()));
  jest.restoreAllMocks();
  act(() => useDialogStore.setState({ queue: [] }));
});

describe('useEpisodeGate', () => {
  it('explains an episode the BE says is not playable instead of offering to buy it', async () => {
    jest.spyOn(episodeAccessService, 'checkAccess').mockResolvedValue(
      ok({ accessGranted: false, nextAction: 'NOT_PLAYABLE', notice: 'Tập đang được xử lý video.' } as AccessDecision),
    );
    const granted = jest.fn();
    const gate = renderHook(() => useEpisodeGate(granted));
    await act(async () => gate.current.open(episode));
    expect(gate.current.locked).toBeNull();
    expect(granted).not.toHaveBeenCalled();
    expect(useDialogStore.getState().queue[0]).toMatchObject({ title: 'Tập chưa xem được', message: 'Tập đang được xử lý video.' });
  });
});

describe('useSupportChat', () => {
  const conversation = { id: 'c1', status: 'AI_HANDLING' } as SupportConversation;

  it('opens no case for a Guest', async () => {
    const start = jest.spyOn(supportService, 'startOrGetOpen');
    const chat = renderHook(() => useSupportChat(true, false));
    await flush();
    expect(start).not.toHaveBeenCalled();
    expect(chat.current.conversation).toBeNull();
  });

  it('loads the member case and gives the text back when sending fails', async () => {
    jest.spyOn(supportService, 'startOrGetOpen').mockResolvedValue(ok(conversation));
    jest.spyOn(supportService, 'getDetail').mockResolvedValue(ok({ conversation, messages: [], quickReplies: [] }));
    jest.spyOn(supportService, 'sendMessage').mockResolvedValue({ success: false, data: null as never, message: 'Hội thoại đã đóng' });
    const chat = renderHook(() => useSupportChat(true, true));
    await flush();
    expect(chat.current.conversation?.id).toBe('c1');
    let sent = true;
    await act(async () => {
      sent = await chat.current.send('Xin chào');
    });
    expect(sent).toBe(false);
    expect(chat.current.error).toBe('Hội thoại đã đóng');
  });

  it('reports a message as not sent while the case is still loading, so the draft is kept', async () => {
    jest.spyOn(supportService, 'startOrGetOpen').mockImplementation(() => new Promise(() => undefined));
    const send = jest.spyOn(supportService, 'sendMessage');
    const chat = renderHook(() => useSupportChat(true, true));
    await flush();
    expect(chat.current.loading).toBe(true);
    let sent = true;
    await act(async () => {
      sent = await chat.current.send('Xin chào');
    });
    expect(sent).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('useSupportChat with Staff', () => {
  const waiting = { id: 'c1', status: 'WAITING_FOR_STAFF' } as SupportConversation;
  const staffReply = { id: 'm9', senderType: 'STAFF', content: 'Nhân viên đây', createdAt: 'x' } as const;
  afterEach(() => jest.useRealTimers());

  it('shows a Staff reply without closing the chat, by reading the case every few seconds', async () => {
    jest.useFakeTimers();
    jest.spyOn(supportService, 'startOrGetOpen').mockResolvedValue(ok(waiting));
    const detail = jest
      .spyOn(supportService, 'getDetail')
      .mockResolvedValueOnce(ok({ conversation: waiting, messages: [], quickReplies: [] }))
      .mockResolvedValue(ok({ conversation: waiting, messages: [staffReply], quickReplies: [] }));
    const chat = renderHook(() => useSupportChat(true, true));
    await act(async () => jest.advanceTimersByTimeAsync(0));
    expect(chat.current.messages).toEqual([]);
    await act(async () => jest.advanceTimersByTimeAsync(POLL_MS));
    expect(chat.current.messages).toEqual([staffReply]);
    expect(detail).toHaveBeenCalledTimes(2);
  });

  it('reads the case again after a failed send and retries with the same message id', async () => {
    const ai = { id: 'c1', status: 'AI_HANDLING' } as SupportConversation;
    jest.spyOn(supportService, 'startOrGetOpen').mockResolvedValue(ok(ai));
    const detail = jest.spyOn(supportService, 'getDetail').mockResolvedValue(ok({ conversation: ai, messages: [], quickReplies: [] }));
    const send = jest.spyOn(supportService, 'sendMessage').mockResolvedValue({ success: false, data: null as never, message: 'Máy chủ phản hồi quá lâu' });
    const chat = renderHook(() => useSupportChat(true, true));
    await flush();
    await act(async () => void (await chat.current.send('Còn bao nhiêu Coin?')));
    await act(async () => void (await chat.current.send('Còn bao nhiêu Coin?')));
    expect(send.mock.calls[0][2]).toBe(send.mock.calls[1][2]);
    expect(detail).toHaveBeenCalledTimes(3);
  });

  it('closes a resolved case on confirmation, and sends it back to Staff when it is not solved', async () => {
    const resolved = { id: 'c1', status: 'RESOLVED' } as SupportConversation;
    jest.spyOn(supportService, 'startOrGetOpen').mockResolvedValue(ok(resolved));
    jest.spyOn(supportService, 'getDetail').mockResolvedValue(ok({ conversation: resolved, messages: [], quickReplies: [] }));
    const confirm = jest.spyOn(supportService, 'confirmResolved').mockResolvedValue(ok({}));
    const staff = jest.spyOn(supportService, 'requestStaff').mockResolvedValue(ok(waiting));
    const chat = renderHook(() => useSupportChat(true, true));
    await flush();
    await act(async () => chat.current.confirmResolved());
    expect(confirm).toHaveBeenCalledWith('c1');
    await act(async () => chat.current.requestStaff());
    expect(staff).toHaveBeenCalledWith('c1');
  });
});

describe('useFriends', () => {
  it('asks before declining, because declining blocks the sender', async () => {
    const request = { id: 'f1', senderId: 'u2', receiverId: 'me', status: 'PENDING' as const, createdAt: '', incoming: true, friend: { id: 'u2', fullName: 'Lan' } };
    jest.spyOn(watchRoomService, 'friends').mockResolvedValue(ok([request]));
    const respond = jest.spyOn(watchRoomService, 'respond').mockResolvedValue(ok({ ...request, status: 'BLOCKED' as const }));
    const friends = renderHook(() => useFriends());
    await flush();
    act(() => friends.current.decline(friends.current.groups.incoming[0]));
    expect(respond).not.toHaveBeenCalled();
    const dialog = useDialogStore.getState().queue[0];
    expect(dialog.title).toBe('Từ chối Lan?');
    await act(async () => dialog.buttons.find((b) => b.text === 'Từ chối')?.onPress?.());
    expect(respond).toHaveBeenCalledWith('f1', false);
  });

  it('shows a field error instead of calling the BE for a malformed email', async () => {
    jest.spyOn(watchRoomService, 'friends').mockResolvedValue(ok([]));
    const add = jest.spyOn(watchRoomService, 'addFriendByEmail');
    const friends = renderHook(() => useFriends());
    await flush();
    act(() => friends.current.setEmail('lan@'));
    await act(async () => friends.current.add());
    expect(add).not.toHaveBeenCalled();
    expect(friends.current.emailMessage).toContain('chưa đúng định dạng');
  });
});
