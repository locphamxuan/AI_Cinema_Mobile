import React from 'react';
import { Text, View } from 'react-native';
import type { ThemeColors } from '../../theme';
import type { SupportMessage } from '../../types/support';
import { styles } from '../../styles/components/chat/ChatModal.styles';
import { AiOrb } from './AiOrb';

interface ChatMessagesProps {
  messages: SupportMessage[];
  colors: ThemeColors;
  isDark: boolean;
  /** The AI is writing its answer. */
  typing: boolean;
}

/** The conversation: the member on the right in pink, the assistant or Staff on the left, system lines centered. */
export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, colors, isDark, typing }) => (
  <>
    {messages.map((msg) => {
      if (msg.senderType === 'SYSTEM') {
        return (
          <Text key={msg.id} style={[styles.system, { color: colors.textMuted }]}>
            {msg.content}
          </Text>
        );
      }
      if (msg.senderType === 'MEMBER') {
        return (
          <View key={msg.id} style={[styles.bubbleRow, styles.bubbleRowMine]}>
            <View style={[styles.bubble, styles.bubbleUser, { backgroundColor: colors.ruby }]}>
              <Text style={[styles.bubbleText, { color: colors.white }]}>{msg.content}</Text>
            </View>
          </View>
        );
      }
      return (
        <View key={msg.id} style={styles.assistantWrap}>
          <View style={styles.senderRow}>
            <AiOrb size="xs" />
            <Text style={[styles.senderName, { color: colors.textSecondary }]}>
              {msg.senderType === 'STAFF' ? 'Nhân viên hỗ trợ' : 'Trợ lý AI'}
            </Text>
          </View>
          <View
            style={[
              styles.bubble,
              styles.bubbleAssistant,
              { backgroundColor: isDark ? colors.cardAlt : colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.bubbleText, { color: colors.text }]}>{msg.content}</Text>
          </View>
        </View>
      );
    })}
    {typing ? (
      <View style={styles.assistantWrap}>
        <View style={styles.senderRow}>
          <AiOrb size="xs" />
          <Text style={[styles.senderName, { color: colors.textMuted }]}>Trợ lý AI đang trả lời…</Text>
        </View>
      </View>
    ) : null}
  </>
);
