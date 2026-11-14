import React from 'react';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { FriendsPanel } from '../components/watchParty/FriendsPanel';
import { ROOM_EVENT } from '../hooks/useWatchRoomSocket';
import { playbackService } from '../services/playbackService';
import { watchRoomService } from '../services/watchRoomService';
import CreateWatchPartyScreen from '../../app/watch-party/create';

type Handler = (payload?: unknown) => void;
const mockHandlers = new Map<string, Handler>();
const mockEmit = jest.fn();
const mockReplace = jest.fn();
const mockParams: { episodeId?: string; label?: string } = {};
jest.mock('socket.io-client', () => ({
  io: () => ({
    on: (event: string, fn: Handler) => mockHandlers.set(event, fn),
    emit: (...args: unknown[]) => mockEmit(...args),
    removeAllListeners: jest.fn(),
    disconnect: jest.fn(),
  }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('../lib/dialog', () => ({ showDialog: jest.fn() }));

const friendships = [
  { id: 'f1', senderId: 'me', receiverId: 'u1', status: 'ACCEPTED', createdAt: '', friend: { id: 'u1', fullName: 'Lan' } },
  { id: 'f2', senderId: 'u2', receiverId: 'me', status: 'PENDING', createdAt: '', incoming: true, friend: { id: 'u2', fullName: 'Minh' } },
];
const ok = <T,>(data: T) => ({ success: true, data }) as never;
const flush = () => act(async () => undefined);
const pressLabel = (tree: ReactTestRenderer, label: string) =>
  act(async () => {
    tree.root.findAll((node) => node.type === TouchableOpacity && node.props.accessibilityLabel === label)[0].props.onPress();
  });
const texts = (tree: ReactTestRenderer) => tree.root.findAllByType(Text).map((t) => String(t.props.children));

describe('FriendsPanel (BR-69)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(watchRoomService, 'friends').mockResolvedValue(ok(friendships));
  });

  it('invites an accepted friend once and marks them invited', async () => {
    const onInvite = jest.fn();
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<FriendsPanel onInvite={onInvite} />);
    });
    await pressLabel(tree, 'Mời Lan');
    expect(onInvite).toHaveBeenCalledWith('u1');
    expect(texts(tree)).toContain('Đã mời');
  });

  it('accepts a friend request and adds a friend by email from the same panel', async () => {
    const respond = jest.spyOn(watchRoomService, 'respond').mockResolvedValue(ok(friendships[1]));
    const add = jest.spyOn(watchRoomService, 'addFriendByEmail').mockResolvedValue(ok(friendships[0]));
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<FriendsPanel />);
    });
    await pressLabel(tree, 'Đồng ý Minh');
    expect(respond).toHaveBeenCalledWith('f2', true);
    await act(async () => {
      tree.root.findByType(TextInput).props.onChangeText('ban@aicinema.vn');
    });
    await pressLabel(tree, 'Gửi lời mời kết bạn');
    expect(add).toHaveBeenCalledWith('ban@aicinema.vn');
    // Without onInvite (the friends screen) there is no invite button.
    expect(tree.root.findAll((node) => node.props.accessibilityLabel === 'Mời Lan')).toHaveLength(0);
  });
});

describe('Create watch party screen (lobby)', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockHandlers.clear();
    mockEmit.mockClear();
    mockReplace.mockClear();
    delete mockParams.episodeId;
    delete mockParams.label;
    jest.spyOn(watchRoomService, 'friends').mockResolvedValue(ok(friendships));
  });

  it('picks an episode from the history, opens the room, invites without taking the Host seat, then goes in', async () => {
    jest.spyOn(playbackService, 'history').mockResolvedValue(
      ok([
        { episodeId: 'e1', episodeNumber: 2, movieTitle: 'Nexus', episodeTitle: '', thumbnailUrl: null, available: true },
        { episodeId: 'gone', episodeNumber: 1, movieTitle: 'Old', episodeTitle: '', thumbnailUrl: null, available: false },
      ]),
    );
    const createRoom = jest
      .spyOn(watchRoomService, 'create')
      .mockResolvedValue(ok({ id: 'r1', roomCode: 'ABC-234', episodeId: 'e1', hostUserId: 'me', status: 'CREATED', currentPositionSeconds: 0 }));
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<CreateWatchPartyScreen />);
    });
    await flush();
    // A taken-down episode is not offered.
    expect(texts(tree)).toContain('Nexus · Tập 2');
    expect(texts(tree)).not.toContain('Old · Tập 1');

    await pressLabel(tree, 'Nexus · Tập 2');
    await pressLabel(tree, 'Tạo phòng');
    expect(createRoom).toHaveBeenCalledWith('e1');
    await flush();
    expect(texts(tree)).toContain('ABC-234');

    await act(async () => {
      mockHandlers.get('connect')?.();
    });
    expect(mockEmit).not.toHaveBeenCalledWith(ROOM_EVENT.JOIN, expect.anything());
    await pressLabel(tree, 'Mời Lan');
    expect(mockEmit).toHaveBeenCalledWith(ROOM_EVENT.INVITE, { roomId: 'r1', friendId: 'u1' });

    await pressLabel(tree, 'Vào phòng xem');
    expect(mockReplace).toHaveBeenCalledWith('/watch-party/r1');
  });

  it('opens on the episode being watched and explains a refusal from the BE', async () => {
    mockParams.episodeId = 'e9';
    mockParams.label = 'Nexus · Tập 9';
    const history = jest.spyOn(playbackService, 'history');
    jest.spyOn(watchRoomService, 'create').mockResolvedValue({ success: false, message: 'Bạn chưa mở khoá tập này' } as never);
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<CreateWatchPartyScreen />);
    });
    expect(history).not.toHaveBeenCalled();
    expect(texts(tree)).toContain('Nexus · Tập 9');
    await pressLabel(tree, 'Tạo phòng');
    await flush();
    expect(texts(tree)).toContain('Bạn chưa mở khoá tập này');
  });
});
