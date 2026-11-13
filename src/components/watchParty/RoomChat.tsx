import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import type { RoomChatMessage } from '../../types/watchRoom';
import { styles } from '../../styles/components/watchParty/RoomChat.styles';

const MAX_LENGTH = 300;

const timeOf = (sentAt: number) => {
  const d = new Date(sentAt);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** BR-69 — the chat beside the shared screen: everyone in the room, live, the latest 50 lines. */
export function RoomChat({
  messages,
  me,
  hostId,
  disabled,
  onSend,
}: {
  messages: RoomChatMessage[];
  me: string | undefined;
  hostId: string | null;
  disabled: boolean;
  onSend: (text: string) => void;
}) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const list = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const ready = text.trim().length > 0 && !disabled;

  useEffect(() => {
    list.current?.scrollToEnd({ animated: true });
  }, [messages.length]);

  const send = () => {
    if (!ready) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>Trò chuyện</Text>
      <ScrollView ref={list} style={styles.list} contentContainerStyle={styles.listContent} nestedScrollEnabled>
        {messages.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Chưa có tin nhắn. Gửi lời chào cả phòng nhé!</Text>
        ) : (
          messages.map((m) => {
            const mine = m.userId === me;
            return (
              <View key={m.id} style={[styles.row, mine && styles.rowMine]}>
                <View style={[styles.bubble, { backgroundColor: mine ? colors.ruby : colors.cardAlt }]}>
                  {mine ? null : (
                    <Text style={[styles.author, { color: colors.ruby }]} numberOfLines={1}>
                      {m.fullName}
                      {m.userId === hostId ? ' · Chủ phòng' : ''}
                    </Text>
                  )}
                  <Text style={[styles.text, { color: mine ? '#FFFFFF' : colors.text }]}>{m.text}</Text>
                  <Text style={[styles.time, { color: mine ? 'rgba(255,255,255,0.75)' : colors.textMuted }]}>
                    {timeOf(m.sentAt)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={disabled ? 'Phòng đã đóng' : 'Nhắn cho cả phòng…'}
          placeholderTextColor={colors.textMuted}
          maxLength={MAX_LENGTH}
          editable={!disabled}
          onSubmitEditing={send}
          returnKeyType="send"
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          accessibilityLabel="Tin nhắn trong phòng"
        />
        <TouchableOpacity
          style={[styles.send, { backgroundColor: colors.ruby, opacity: ready ? 1 : 0.5 }]}
          onPress={send}
          disabled={!ready}
          accessibilityLabel="Gửi tin nhắn"
        >
          <Ionicons name="send" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
