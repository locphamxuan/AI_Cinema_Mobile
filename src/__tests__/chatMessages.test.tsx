import React from 'react';
import { Text } from 'react-native';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { ChatMessages, sentAt } from '../components/chat/ChatMessages';
import { darkColors, lightColors } from '../theme';
import type { SupportMessage } from '../types/support';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const at = new Date(2026, 10, 19, 20, 5).toISOString();
const msg = (id: string, senderType: SupportMessage['senderType'], content: string, createdAt: string = at) =>
  ({ id, senderType, content, createdAt }) as SupportMessage;

function texts(tree: ReactTestRenderer) {
  return tree.root.findAllByType(Text).map((t) => [t.props.children].flat().join(''));
}

describe('ChatMessages', () => {
  it('names who speaks and when: the member, the assistant, a person from Staff, and system notes', () => {
    let tree!: ReactTestRenderer;
    act(() => {
      tree = create(
        <ChatMessages
          colors={darkColors}
          isDark
          typing={false}
          messages={[msg('1', 'MEMBER', 'Còn bao nhiêu Coin?'), msg('2', 'AI', 'Bạn còn 12 Coin.'), msg('3', 'STAFF', 'Mình đã kiểm tra.'), msg('4', 'SYSTEM', 'Đã chuyển cho nhân viên.', 'x')]}
        />,
      );
    });
    const shown = texts(tree);
    expect(shown).toEqual(expect.arrayContaining(['Còn bao nhiêu Coin?', 'Trợ lý AI', 'Nhân viên hỗ trợ', 'Đã chuyển cho nhân viên.', '20:05']));
    expect(shown.filter((t) => t === '20:05')).toHaveLength(3);
    act(() => tree.unmount());
  });

  it('shows three dots while the assistant writes, still when motion is reduced', async () => {
    let tree!: ReactTestRenderer;
    await act(async () => {
      tree = create(<ChatMessages colors={lightColors} isDark={false} typing messages={[]} />);
    });
    expect(tree.root.findAll((n) => n.props.accessibilityLabel === 'Trợ lý AI đang trả lời')).not.toHaveLength(0);
    act(() => tree.unmount());
  });

  it('formats the sent time, and gives nothing for a missing or broken date', () => {
    expect(sentAt(at)).toBe('20:05');
    expect(sentAt(undefined)).toBe('');
    expect(sentAt('không phải ngày')).toBe('');
  });
});
