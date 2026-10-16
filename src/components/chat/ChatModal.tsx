import React, { useRef, useState } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import { fonts, useTheme } from '../../theme';
import { styles } from '../../styles/components/chat/ChatModal.styles';

const quickActions = [
  { id: 'coin-error', label: 'Bị trừ Coin sai' },
  { id: 'cancel-renew', label: 'Tắt tự gia hạn' },
  { id: 'report', label: 'Báo nội dung vi phạm' },
];

export const ChatModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { chatIsOpen, toggleChat, chatMessages, sendMessage, handleQuickAction, escalateToAgent, chatPhase, chatTicket } = useAppStore();
  const [input, setInput] = useState('');
  const list = useRef<ScrollView>(null);

  const handleSend = () => {
    if (!input.trim()) return;
    void sendMessage(input.trim());
    setInput('');
  };

  return (
    <Modal visible={chatIsOpen} transparent animationType="slide" onRequestClose={toggleChat}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: colors.text }]}>Hỗ trợ</Text>
              <Text style={[styles.status, { color: colors.textMuted }]}>
                {chatTicket
                  ? `Đã gửi phiếu #${chatTicket.id} cho nhân viên`
                  : chatPhase === 'waiting'
                    ? 'Đang chuyển cho nhân viên…'
                    : 'Cần người thật xử lý thì bấm "Gặp nhân viên"'}
              </Text>
            </View>
            <TouchableOpacity onPress={toggleChat} hitSlop={10} accessibilityLabel="Đóng">
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={list}
            style={styles.messages}
            contentContainerStyle={styles.messageContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          >
            {chatMessages.length === 0 && (
              <Text style={[styles.empty, { color: colors.textMuted }]}>Bạn cần giúp gì? Chọn một chủ đề bên dưới hoặc gõ câu hỏi.</Text>
            )}
            {chatMessages.map((msg) => {
              if (msg.sender === 'system') {
                return (
                  <Text key={msg.id} style={[styles.system, { color: colors.textMuted }]}>
                    {msg.content}
                  </Text>
                );
              }
              const mine = msg.sender === 'user';
              return (
                <View key={msg.id} style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start' }]}>
                  <View
                    style={[
                      styles.bubble,
                      mine
                        ? { backgroundColor: colors.ruby, borderBottomRightRadius: 4 }
                        : { backgroundColor: isDark ? colors.cardAlt : colors.card, borderBottomLeftRadius: 4 },
                    ]}
                  >
                    <Text style={[styles.bubbleText, { color: mine ? '#FFFFFF' : colors.text }]}>{msg.content}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={styles.chipsBar} keyboardShouldPersistTaps="handled">
            {quickActions.map((action) => (
              <TouchableOpacity key={action.id} style={[styles.chip, { backgroundColor: colors.card }]} onPress={() => handleQuickAction(action.id)}>
                <Text style={[styles.chipText, { color: colors.textSecondary }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
            {chatPhase !== 'waiting' && !chatTicket && (
              <TouchableOpacity style={[styles.chip, { backgroundColor: colors.rubySoft }]} onPress={escalateToAgent}>
                <Text style={[styles.chipText, { color: colors.ruby, fontFamily: fonts.semibold }]}>Gặp nhân viên</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={[styles.inputRow, { backgroundColor: isDark ? colors.cardAlt : colors.card }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Viết tin nhắn"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text }]}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.send, { backgroundColor: input.trim() ? colors.ruby : 'transparent' }]}
              onPress={handleSend}
              disabled={!input.trim()}
              accessibilityLabel="Gửi"
            >
              <Ionicons name="arrow-up" size={18} color={input.trim() ? '#FFFFFF' : colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
