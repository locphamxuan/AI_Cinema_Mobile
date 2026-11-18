import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSupportChat } from '../../hooks/useSupportChat';
import { useWebDrag } from '../../hooks/useWebDrag';
import { QUICK_ACTION } from '../../services/supportService';
import { useSessionStore, useUiStore } from '../../store';
import { darkColors, lightColors, useTheme } from '../../theme';
import type { SupportStatus } from '../../types/support';
import { styles } from '../../styles/components/chat/ChatModal.styles';
import { AiOrb } from './AiOrb';
import { ChatHero } from './ChatHero';
import { ChatMessages } from './ChatMessages';
import { ChatComposer } from './ChatComposer';

const STATUS_LABELS: Record<SupportStatus, string> = {
  AI_HANDLING: 'AI sẵn sàng hỗ trợ',
  WAITING_FOR_STAFF: 'Đang chờ nhân viên hỗ trợ',
  STAFF_HANDLING: 'Nhân viên đang hỗ trợ',
  RESOLVED: 'Chờ bạn xác nhận',
  CLOSED: 'Đã đóng hội thoại',
};

export const ChatModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors: appColors, isDark: appDark } = useTheme();
  const [chatDarkOverride, setChatDarkOverride] = useState<boolean | null>(null);
  const isDark = chatDarkOverride ?? appDark;
  const colors = chatDarkOverride === null ? appColors : chatDarkOverride ? darkColors : lightColors;
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const { isChatModalOpen, setChatModalOpen, openAuthModal } = useUiStore();

  const chat = useSupportChat(isChatModalOpen, isAuthenticated);
  const { conversation, messages, quickReplies, loading, sending, error: errorMsg } = chat;
  const [draft, setDraft] = useState('');
  const drag = useWebDrag(440, 630);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  // The draft is cleared only when the BE took the message, so nothing typed is lost while the chat is busy.
  const sendText = async (text: string, fromDraft = true) => {
    const sent = await chat.send(text);
    if (!sent) return;
    if (fromDraft) setDraft((current) => (current.trim() === text.trim() ? '' : current));
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const handleStartNewConversation = chat.startNew;

  const handleRequestStaff = () => {
    if (!isAuthenticated) {
      setChatModalOpen(false);
      openAuthModal('login');
      return;
    }
    void chat.requestStaff();
  };

  const statusText = !isAuthenticated
    ? 'Cần đăng nhập'
    : conversation
      ? STATUS_LABELS[conversation.status]
      : 'Đang kết nối Trợ lý AI…';
  const canEscalate = !conversation || conversation.status === 'AI_HANDLING';
  const isWaitingStaff =
    conversation?.status === 'WAITING_FOR_STAFF' || conversation?.status === 'STAFF_HANDLING';
  const isClosed = conversation?.status === 'RESOLVED' || conversation?.status === 'CLOSED';
  const showHero = isAuthenticated && messages.length <= 1 && !loading && !isClosed;

  const statusColor = isWaitingStaff ? colors.coin : isClosed ? colors.textMuted : colors.verified;

  return (
    <Modal visible={isChatModalOpen} transparent animationType={Platform.OS === 'web' ? 'fade' : 'slide'} onRequestClose={() => setChatModalOpen(false)}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
      >
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12) + 8,
            },
            drag.style,
          ]}
        >
          {/* Header (draggable on Web) */}
          <View
            {...drag.handlers}
            style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}
          >
            <View style={styles.headerBrand}>
              <AiOrb size="sm" />
              <View style={styles.headerText}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                    Trợ lý AI
                  </Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.card }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.status, { color: colors.textSecondary }]} numberOfLines={1}>
                    {statusText}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setChatDarkOverride(!isDark)}
                accessibilityLabel={isDark ? 'Chuyển khung chat sang màu trắng' : 'Chuyển khung chat sang màu đen'}
                style={[styles.iconBtn, { backgroundColor: isDark ? colors.cardAlt : colors.card }]}
              >
                <Ionicons
                  name={isDark ? 'sunny-outline' : 'moon-outline'}
                  size={16}
                  color={isDark ? colors.coin : colors.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStartNewConversation}
                disabled={sending || loading}
                accessibilityLabel="Cuộc hội thoại mới"
                style={[styles.iconBtn, { backgroundColor: isDark ? colors.cardAlt : colors.card }]}
              >
                <Ionicons name="create-outline" size={16} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setChatModalOpen(false)}
                hitSlop={10}
                accessibilityLabel="Đóng trợ lý AI"
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Direct line to a human: always visible while the AI handles the case */}
          {isAuthenticated && canEscalate && (
            <View style={[styles.staffBar, { backgroundColor: isDark ? colors.cardAlt : colors.card, borderColor: colors.border }]}>
              <Ionicons name="headset" size={18} color={colors.ruby} />
              <Text style={[styles.staffBarText, { color: colors.textSecondary }]} numberOfLines={2}>
                Cần người thật hỗ trợ? AI sẽ tóm tắt cuộc trò chuyện cho nhân viên.
              </Text>
              <TouchableOpacity
                onPress={handleRequestStaff}
                disabled={sending || loading || !conversation}
                accessibilityLabel="Liên hệ trực tiếp nhân viên hỗ trợ"
                style={[styles.staffBtn, { backgroundColor: colors.ruby, opacity: sending || loading ? 0.6 : 1 }]}
              >
                <Text style={styles.staffBtnText}>Liên hệ nhân viên</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* CSKH handoff banner so user never feels stuck for 24h */}
          {isWaitingStaff && (
            <View style={[styles.banner, { backgroundColor: colors.coinSoft, borderColor: colors.coin }]}>
              <Text style={[styles.bannerText, { color: colors.text }]}>
                Đã chuyển cho nhân viên hỗ trợ, Trợ lý AI tạm dừng ở hội thoại này. Muốn hỏi AI ngay, hãy mở hội thoại mới.
              </Text>
              <TouchableOpacity
                onPress={handleStartNewConversation}
                disabled={loading || sending}
                style={[styles.bannerBtn, { backgroundColor: colors.ruby }]}
              >
                <Text style={styles.bannerBtnText}>Hội thoại mới</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Staff marked the case resolved: the member closes it or sends it back; it also closes on its own */}
          {conversation?.status === 'RESOLVED' && (
            <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.verified }]}>
              <Text style={[styles.bannerText, { color: colors.text }]}>
                Nhân viên đã xử lý yêu cầu của bạn. Vấn đề đã được giải quyết chưa? Yêu cầu tự đóng nếu bạn không phản hồi.
              </Text>
              <TouchableOpacity
                onPress={() => void chat.confirmResolved()}
                disabled={sending}
                accessibilityLabel="Xác nhận đã giải quyết"
                style={[styles.bannerBtn, { backgroundColor: colors.verified }]}
              >
                <Text style={styles.bannerBtnText}>Đã giải quyết</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRequestStaff}
                disabled={sending}
                accessibilityLabel="Vẫn cần hỗ trợ"
                style={[styles.bannerBtn, { backgroundColor: colors.ruby }]}
              >
                <Text style={styles.bannerBtnText}>Vẫn cần hỗ trợ</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Guest prompt banner */}
          {!isAuthenticated && (
            <View style={[styles.banner, { backgroundColor: colors.rubySoft, borderColor: colors.ruby }]}>
              <Text style={[styles.bannerText, { color: colors.text }]}>
                Đăng nhập để hỏi Trợ lý AI về ví, gói Tháng của bạn và gặp nhân viên hỗ trợ.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setChatModalOpen(false);
                  openAuthModal('login');
                }}
                style={[styles.bannerBtn, { backgroundColor: colors.ruby }]}
              >
                <Text style={styles.bannerBtnText}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Messages & Smart Assistant Hero */}
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={styles.messageContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.ruby} style={styles.loading} />
            ) : (
              <>
                {showHero && (
                  <ChatHero colors={colors} isDark={isDark} disabled={sending} onAsk={(message) => void sendText(message, false)} />
                )}

                <ChatMessages messages={messages} colors={colors} isDark={isDark} typing={sending} />
              </>
            )}
          </ScrollView>

          {errorMsg && (
            <View style={[styles.errorRow, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
              <TouchableOpacity onPress={() => void chat.refresh()} style={[styles.bannerBtn, { backgroundColor: colors.ruby }]}>
                <Text style={styles.bannerBtnText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          )}

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
                  onPress={() => {
                    if (chip.message === QUICK_ACTION.REQUEST_STAFF) void handleRequestStaff();
                    else if (chip.message === QUICK_ACTION.CONFIRM_RESOLVED) void chat.confirmResolved();
                    else void sendText(chip.message, false);
                  }}
                  disabled={sending}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isDark ? colors.cardAlt : colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: colors.textSecondary }]}>{chip.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <ChatComposer
            colors={colors}
            isDark={isDark}
            draft={draft}
            onDraft={setDraft}
            onSend={() => void sendText(draft)}
            closed={isClosed}
            onNewConversation={handleStartNewConversation}
            canType={isAuthenticated}
            busy={sending || loading}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
