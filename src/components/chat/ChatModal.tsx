import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supportService } from '../../services/supportService';
import { useSessionStore, useUiStore } from '../../store';
import { useTheme } from '../../theme';
import type { SupportConversation, SupportMessage, SupportQuickReply, SupportStatus } from '../../types/support';
import { styles } from '../../styles/components/chat/ChatModal.styles';

const STATUS_LABELS: Record<SupportStatus, string> = {
  AI_HANDLING: 'Trợ lý AI đang hỗ trợ',
  WAITING_FOR_STAFF: 'Đang chờ nhân viên CSKH',
  STAFF_HANDLING: 'Nhân viên đang hỗ trợ',
  RESOLVED: 'Đã giải quyết xong',
  CLOSED: 'Cuộc trò chuyện đã đóng',
};

export const ChatModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const { isChatModalOpen, setChatModalOpen } = useUiStore();

  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<SupportQuickReply[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  useEffect(() => {
    if (!isChatModalOpen || !isAuthenticated) return;
    let active = true;
    const loadConversation = async () => {
      setLoading(true);
      try {
        const startRes = await supportService.startOrGetOpen();
        if (!active || !startRes.success || !startRes.data) return;
        setConversation(startRes.data);
        const detailRes = await supportService.getDetail(startRes.data.id);
        if (active && detailRes.success && detailRes.data) {
          setConversation(detailRes.data.conversation);
          setMessages(detailRes.data.messages);
          setQuickReplies(detailRes.data.quickReplies ?? []);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadConversation();
    return () => {
      active = false;
    };
  }, [isChatModalOpen, isAuthenticated]);

  const sendText = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean || !conversation || sending) return;
    setDraft('');
    setSending(true);
    try {
      const res = await supportService.sendMessage(conversation.id, clean, `mob-${Date.now()}`);
      if (res.success && res.data) {
        setConversation(res.data.conversation);
        setMessages((prev) => {
          const next = [...prev, res.data.memberMessage];
          if (res.data.aiMessage) next.push(res.data.aiMessage);
          if (res.data.systemMessage) next.push(res.data.systemMessage);
          return next;
        });
        if (res.data.quickReplies?.length) {
          setQuickReplies(res.data.quickReplies);
        }
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
      }
    } finally {
      setSending(false);
    }
  };

  const handleRequestStaff = async () => {
    if (!conversation || sending) return;
    setSending(true);
    try {
      const res = await supportService.requestStaff(conversation.id);
      if (res.success && res.data) {
        setConversation(res.data);
        const detailRes = await supportService.getDetail(conversation.id);
        if (detailRes.success && detailRes.data) {
          setMessages(detailRes.data.messages);
        }
      }
    } finally {
      setSending(false);
    }
  };

  const handleConfirmResolved = async () => {
    if (!conversation || sending) return;
    setSending(true);
    try {
      const res = await supportService.confirmResolved(conversation.id, 5);
      if (res.success && res.data) {
        setConversation(res.data);
        const detailRes = await supportService.getDetail(conversation.id);
        if (detailRes.success && detailRes.data) {
          setMessages(detailRes.data.messages);
        }
      }
    } finally {
      setSending(false);
    }
  };

  const statusText = conversation ? STATUS_LABELS[conversation.status] : 'Đang kết nối trợ lý AI...';
  const canEscalate = conversation?.status === 'AI_HANDLING';
  const isClosed = conversation?.status === 'RESOLVED' || conversation?.status === 'CLOSED';

  return (
    <Modal visible={isChatModalOpen} transparent animationType="slide" onRequestClose={() => setChatModalOpen(false)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 12) + 8 },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
            <View style={styles.headerText}>
              <View style={styles.titleRow}>
                <Ionicons name="chatbubble-ellipses" size={20} color={colors.ruby} />
                <Text style={[styles.title, { color: colors.text }]}>Trợ lý AI</Text>
              </View>
              <Text style={[styles.status, { color: colors.textMuted }]}>{statusText}</Text>
            </View>

            <View style={styles.headerActions}>
              {canEscalate && (
                <TouchableOpacity
                  onPress={handleRequestStaff}
                  disabled={sending}
                  style={[styles.actionPill, { backgroundColor: colors.cardAlt }]}
                >
                  <Text style={[styles.actionPillText, { color: colors.textSecondary }]}>Gặp nhân viên</Text>
                </TouchableOpacity>
              )}
              {!isClosed && conversation && (
                <TouchableOpacity
                  onPress={handleConfirmResolved}
                  disabled={sending}
                  style={[styles.actionPill, { backgroundColor: colors.rubySoft }]}
                >
                  <Text style={[styles.actionPillText, { color: colors.ruby }]}>Đã xong</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => setChatModalOpen(false)}
                hitSlop={10}
                accessibilityLabel="Đóng trợ lý AI"
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messageContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.ruby} style={{ marginTop: 28 }} />
            ) : messages.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                Hãy hỏi tôi về phim, nạp Coin, Gói Tháng hoặc cách xử lý lỗi phát video.
              </Text>
            ) : (
              messages.map((msg) => {
                if (msg.senderType === 'SYSTEM') {
                  return (
                    <Text key={msg.id} style={[styles.system, { color: colors.textMuted }]}>
                      {msg.content}
                    </Text>
                  );
                }
                const isMember = msg.senderType === 'MEMBER';
                return (
                  <View
                    key={msg.id}
                    style={[styles.bubbleRow, { justifyContent: isMember ? 'flex-end' : 'flex-start' }]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        { backgroundColor: isMember ? colors.ruby : isDark ? colors.cardAlt : colors.card },
                      ]}
                    >
                      <Text style={[styles.bubbleText, { color: isMember ? '#FFFFFF' : colors.text }]}>
                        {msg.content}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
            {sending && (
              <View style={[styles.bubbleRow, { justifyContent: 'flex-start' }]}>
                <View style={[styles.bubble, { backgroundColor: isDark ? colors.cardAlt : colors.card }]}>
                  <Text style={[styles.bubbleText, { color: colors.textMuted }]}>Đang phản hồi...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick Reply Chips */}
          {!isClosed && quickReplies.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipsBar}
              contentContainerStyle={styles.chips}
            >
              {quickReplies.map((chip) => (
                <TouchableOpacity
                  key={chip.label}
                  onPress={() => sendText(chip.message)}
                  disabled={sending}
                  style={[styles.chip, { backgroundColor: isDark ? colors.cardAlt : colors.card }]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Input Box */}
          {!isClosed && (
            <View style={[styles.inputRow, { backgroundColor: isDark ? colors.cardAlt : colors.card }]}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Nhập câu hỏi cho trợ lý AI..."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
                multiline
                editable={!sending}
                onSubmitEditing={() => void sendText(draft)}
              />
              <TouchableOpacity
                onPress={() => void sendText(draft)}
                disabled={sending || !draft.trim()}
                accessibilityLabel="Gửi tin nhắn"
                style={[
                  styles.send,
                  { backgroundColor: draft.trim() && !sending ? colors.ruby : colors.textMuted },
                ]}
              >
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
