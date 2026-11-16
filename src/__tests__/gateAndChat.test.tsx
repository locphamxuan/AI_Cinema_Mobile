import React from 'react';
import { act, create } from 'react-test-renderer';
import { useEpisodeGate } from '../hooks/useEpisodeGate';
import { useSupportChat } from '../hooks/useSupportChat';
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
    create(<Probe />);
  });
  return box as { current: R };
}

const episode = { id: 'ep-1', availability: 'AVAILABLE' } as Episode;

afterEach(() => {
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
