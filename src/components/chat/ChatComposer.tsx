import React from 'react';
import { Platform, Text, TextInput, TouchableOpacity, View, type TextInputKeyPressEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '../../theme';
import { styles } from '../../styles/components/chat/ChatModal.styles';

interface ChatComposerProps {
  colors: ThemeColors;
  isDark: boolean;
  draft: string;
  onDraft: (text: string) => void;
  onSend: () => void;
  /** The case is resolved or closed: offer a new conversation instead of the input. */
  closed: boolean;
  onNewConversation: () => void;
  canType: boolean;
  busy: boolean;
}

/** The bottom of the chat: the message box with its send button, or "new conversation" once a case is over. */
export const ChatComposer: React.FC<ChatComposerProps> = ({ colors, isDark, draft, onDraft, onSend, closed, onNewConversation, canType, busy }) => {
  // On the web, Enter sends and Shift+Enter starts a new line, as in any chat.
  const onKeyPress = (e: TextInputKeyPressEvent) => {
    if (Platform.OS !== 'web') return;
    const key = e.nativeEvent as unknown as { key?: string; shiftKey?: boolean; preventDefault?: () => void };
    if (key.key === 'Enter' && !key.shiftKey) {
      key.preventDefault?.();
      onSend();
    }
  };

  if (closed) {
    return (
      <View style={styles.closedBar}>
        <Text style={[styles.closedText, { color: colors.textMuted }]}>Cuộc hội thoại này đã kết thúc.</Text>
        <TouchableOpacity onPress={onNewConversation} disabled={busy} style={[styles.newConvBtn, { backgroundColor: colors.ruby }]}>
          <Ionicons name="sparkles" size={15} color={colors.white} />
          <Text style={styles.newConvBtnText}>Cuộc hội thoại mới</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ready = canType && !busy && draft.trim().length > 0;
  return (
    <View style={[styles.inputRow, { backgroundColor: isDark ? colors.cardAlt : colors.card, borderColor: colors.border }]}>
      <TextInput
        value={draft}
        onChangeText={onDraft}
        placeholder={canType ? 'Nhập câu hỏi cho Trợ lý AI' : 'Đăng nhập để trò chuyện'}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, { color: colors.text }]}
        multiline
        maxLength={2000}
        editable={canType && !busy}
        onKeyPress={onKeyPress}
        onSubmitEditing={onSend}
        accessibilityLabel="Câu hỏi cho Trợ lý AI"
      />
      <TouchableOpacity
        onPress={onSend}
        disabled={!ready}
        accessibilityLabel="Gửi tin nhắn"
        style={[styles.send, { backgroundColor: ready ? colors.ruby : colors.textMuted }]}
      >
        <Ionicons name="send" size={16} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};
