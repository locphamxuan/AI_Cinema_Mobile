import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../../store/useAppStore';
import { useTheme } from '../../theme';
import { quickActions } from '../../mocks/mockData';

export const ChatModal: React.FC = () => {
  const { colors, isDark } = useTheme();
  const {
    chatIsOpen,
    toggleChat,
    chatMessages,
    sendMessage,
    handleQuickAction,
    escalateToAgent,
    chatPhase,
    chatTicket,
  } = useAppStore();

  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  return (
    <Modal
      visible={chatIsOpen}
      transparent
      animationType="slide"
      onRequestClose={toggleChat}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <View style={styles.avatarCircle}>
                <Ionicons name="chatbubbles" size={16} color="#FFFFFF" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Trợ Lý AI Cinema</Text>
                <Text style={[styles.headerSub, { color: '#10B981' }]}>
                  {chatPhase === 'waiting' ? 'Đang kết nối nhân viên...' : 'Trực tuyến 24/7'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={toggleChat} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Messages list */}
          <ScrollView
            style={styles.messageList}
            contentContainerStyle={styles.messageContent}
            showsVerticalScrollIndicator={false}
          >
            {chatMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSystem = msg.sender === 'system';

              if (isSystem) {
                return (
                  <View key={msg.id} style={styles.systemMessage}>
                    <Text style={[styles.systemText, { color: colors.textMuted }]}>
                      {msg.content}
                    </Text>
                  </View>
                );
              }

              return (
                <View
                  key={msg.id}
                  style={[
                    styles.bubbleRow,
                    { justifyContent: isUser ? 'flex-end' : 'flex-start' },
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: isUser
                          ? colors.ruby
                          : isDark
                          ? '#1E293B'
                          : '#F1F5F9',
                        borderBottomRightRadius: isUser ? 2 : 14,
                        borderBottomLeftRadius: !isUser ? 2 : 14,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        { color: isUser ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {msg.content}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Quick reply chips */}
          <View style={styles.quickReplyContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  activeOpacity={0.8}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleQuickAction(action.id)}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}

              {chatPhase !== 'waiting' && !chatTicket && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[styles.chip, styles.escalateChip]}
                  onPress={escalateToAgent}
                >
                  <Text style={styles.escalateChipText}>🚨 Gặp Chuyên viên</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Input row */}
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Nhập câu hỏi cần hỗ trợ..."
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text }]}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.ruby }]}
              onPress={handleSend}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  messageList: {
    flex: 1,
    paddingVertical: 10,
  },
  messageContent: {
    gap: 8,
    paddingBottom: 8,
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginVertical: 4,
  },
  systemText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 18,
  },
  quickReplyContainer: {
    paddingVertical: 6,
  },
  chipRow: {
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  escalateChip: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  escalateChipText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  input: {
    flex: 1,
    height: 38,
    fontSize: 13,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
