import React from 'react';
import { Modal, Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ChatModal } from '../components/chat/ChatModal';
import { useSupportChat } from '../hooks/useSupportChat';
import { useSessionStore, useUiStore } from '../store';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('../hooks/useSupportChat', () => ({ useSupportChat: jest.fn() }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function chatWith(overrides: Partial<ReturnType<typeof useSupportChat>>) {
  const chat = {
    conversation: { id: 'c1', status: 'RESOLVED' },
    messages: [],
    quickReplies: [],
    loading: false,
    sending: false,
    error: null,
    send: jest.fn(),
    startNew: jest.fn(),
    requestStaff: jest.fn(),
    confirmResolved: jest.fn(),
    refresh: jest.fn(),
    ...overrides,
  };
  jest.mocked(useSupportChat).mockReturnValue(chat as unknown as ReturnType<typeof useSupportChat>);
  return chat;
}

let tree: ReactTestRenderer;
function render() {
  act(() => {
    useSessionStore.setState({ isAuthenticated: true } as never);
    useUiStore.setState({ isChatModalOpen: true } as never);
  });
  act(() => {
    tree = create(<ChatModal />);
  });
  return tree;
}
const press = (label: string) => {
  const node = tree.root.find((n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function');
  act(() => node.props.onPress());
};

afterEach(() => act(() => tree?.unmount()));

describe('ChatModal', () => {
  it('lets the member confirm a case Staff resolved', () => {
    const chat = chatWith({});
    render();
    press('Xác nhận đã giải quyết');
    expect(chat.confirmResolved).toHaveBeenCalled();
  });

  it('reads the case again from the error row, and closes with the back button of Android', () => {
    const chat = chatWith({ conversation: { id: 'c1', status: 'AI_HANDLING' } as never, error: 'Máy chủ phản hồi quá lâu' });
    render();
    let retry = tree.root.findAllByType(Text).find((t) => t.props.children === 'Thử lại')!;
    while (typeof retry.props.onPress !== 'function') retry = retry.parent!;
    act(() => retry.props.onPress());
    expect(chat.refresh).toHaveBeenCalled();
    act(() => tree.root.findByType(Modal).props.onRequestClose());
    expect(useUiStore.getState().isChatModalOpen).toBe(false);
  });
});
