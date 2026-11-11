import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  useWindowDimensions,
  type GestureResponderEvent,
  type TextInputKeyPressEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supportService, type SupportCatalogContext } from '../../services/supportService';
import { useCatalogStore, useSessionStore, useUiStore } from '../../store';
import { useTheme } from '../../theme';
import type { SupportConversation, SupportMessage, SupportQuickReply, SupportStatus } from '../../types/support';
import { styles } from '../../styles/components/chat/ChatModal.styles';
import { AiOrb } from './AiOrb';

const STATUS_LABELS: Record<SupportStatus, string> = {
  AI_HANDLING: 'AI sẵn sàng hỗ trợ',
  WAITING_FOR_STAFF: 'Đang chờ nhân viên CSKH',
  STAFF_HANDLING: 'Nhân viên đang hỗ trợ',
  RESOLVED: 'Đã hoàn tất',
  CLOSED: 'Đã đóng hội thoại',
};

const HERO_CARDS: {
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  message: string;
}[] = [
  {
    title: 'Nạp Coin VNPay',
    desc: 'Hướng dẫn nạp nhanh & kiểm tra ví',
    icon: 'wallet-outline',
    tint: '#F59E0B',
    message: 'Làm sao để nạp Coin qua VNPay?',
  },
  {
    title: 'Gói Tháng VIP',
    desc: 'Quyền lợi xem phim không giới hạn',
    icon: 'sparkles-outline',
    tint: '#EC4899',
    message: 'Quyền lợi và cách đăng ký Gói Tháng?',
  },
  {
    title: 'Kho phim AI',
    desc: 'Số lượng phim & gợi ý xem ngay',
    icon: 'film-outline',
    tint: '#8B5CF6',
    message: 'Hiện nay trên AI Cinema đang có bao nhiêu phim?',
  },
  {
    title: 'Thiết bị xem phim',
    desc: 'Giới hạn máy & thoát bớt thiết bị',
    icon: 'phone-portrait-outline',
    tint: '#10B981',
    message: 'Tài khoản của tôi xem được tối đa mấy thiết bị?',
  },
];

export const ChatModal: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const movies = useCatalogStore((s) => s.movies);
  const { isChatModalOpen, setChatModalOpen, openAuthModal } = useUiStore();

  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<SupportQuickReply[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [webOffset, setWebOffset] = useState({ x: 0, y: 0 });
  const [webDragStart, setWebDragStart] = useState<{
    pageX: number;
    pageY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const handleWebHeaderGrant = (e: GestureResponderEvent) => {
    setWebDragStart({
      pageX: e.nativeEvent.pageX,
      pageY: e.nativeEvent.pageY,
      startX: webOffset.x,
      startY: webOffset.y,
    });
  };

  const handleWebHeaderMove = (e: GestureResponderEvent) => {
    if (!webDragStart) return;
    const dx = e.nativeEvent.pageX - webDragStart.pageX;
    const dy = e.nativeEvent.pageY - webDragStart.pageY;
    const maxLeft = Math.max(0, winWidth - 440);
    const maxUp = Math.max(0, winHeight - 630);
    setWebOffset({
      x: Math.min(20, Math.max(-maxLeft, webDragStart.startX + dx)),
      y: Math.min(20, Math.max(-maxUp, webDragStart.startY + dy)),
    });
  };

  const catalogContext: SupportCatalogContext = useMemo(
    () => ({
      movieCount: movies.length,
      sampleTitles: movies.slice(0, 3).map((m) => m.title),
    }),
    [movies],
  );

  const loadCurrentConversation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!isAuthenticated) {
        await supportService.resetLocalConversation();
        const detail = await supportService.getDetail('local-ai-support');
        if (detail.success && detail.data) {
          setConversation(detail.data.conversation);
          setMessages(detail.data.messages);
          setQuickReplies(detail.data.quickReplies ?? []);
        }
        return;
      }

      const startRes = await supportService.startOrGetOpen();
      if (!startRes.success || !startRes.data) {
        setErrorMsg(startRes.message || 'Không thể kết nối Trợ lý AI lúc này.');
        return;
      }
      setConversation(startRes.data);
      const detailRes = await supportService.getDetail(startRes.data.id);
      if (detailRes.success && detailRes.data) {
        setConversation(detailRes.data.conversation);
        setMessages(detailRes.data.messages);
        setQuickReplies(detailRes.data.quickReplies ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isChatModalOpen) return;
    let active = true;
    const run = async () => {
      if (!active) return;
      await loadCurrentConversation();
    };
    void run();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatModalOpen, isAuthenticated]);

  const handleStartNewConversation = async () => {
    if (loading || sending) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      if (!isAuthenticated) {
        await supportService.resetLocalConversation();
        const detail = await supportService.getDetail('local-ai-support');
        if (detail.success && detail.data) {
          setConversation(detail.data.conversation);
          setMessages(detail.data.messages);
          setQuickReplies(detail.data.quickReplies ?? []);
        }
        return;
      }

      const freshRes = await supportService.startFresh(conversation?.id);
      if (freshRes.success && freshRes.data) {
        setConversation(freshRes.data);
        const detailRes = await supportService.getDetail(freshRes.data.id);
        if (detailRes.success && detailRes.data) {
          setConversation(detailRes.data.conversation);
          setMessages(detailRes.data.messages);
          setQuickReplies(detailRes.data.quickReplies ?? []);
        }
      } else {
        setErrorMsg(freshRes.message || 'Chưa tạo được cuộc hội thoại mới. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const sendText = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean || sending || loading) return;
    const convId = conversation?.id ?? 'local-ai-support';
    setDraft('');
    setErrorMsg(null);
    setSending(true);
    try {
      const res = await supportService.sendMessage(convId, clean, `mob-${Date.now()}`, catalogContext);
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
      } else {
        setDraft(clean);
        setErrorMsg(
          res.message || 'Không gửi được tin nhắn (có thể hội thoại đã đóng). Hãy bấm "Hội thoại mới".',
        );
      }
    } finally {
      setSending(false);
    }
  };

  const handleRequestStaff = async () => {
    if (!isAuthenticated) {
      setChatModalOpen(false);
      openAuthModal('login');
      return;
    }
    if (!conversation || sending || loading) return;
    setErrorMsg(null);
    setSending(true);
    try {
      const res = await supportService.requestStaff(conversation.id);
      if (res.success && res.data) {
        setConversation(res.data);
        const detailRes = await supportService.getDetail(conversation.id);
        if (detailRes.success && detailRes.data) {
          setMessages(detailRes.data.messages);
        }
      } else {
        setErrorMsg(res.message || 'Không thể chuyển nhân viên CSKH lúc này.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleConfirmResolved = async () => {
    if (!conversation || sending || loading) return;
    setErrorMsg(null);
    setSending(true);
    try {
      const res = await supportService.confirmResolved(conversation.id, 5);
      if (res.success && res.data) {
        setConversation(res.data);
        const detailRes = await supportService.getDetail(conversation.id);
        if (detailRes.success && detailRes.data) {
          setMessages(detailRes.data.messages);
        }
      } else {
        setErrorMsg(res.message || 'Chưa thể đóng hội thoại lúc này.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleWebKeyPress = (e: TextInputKeyPressEvent) => {
    if (Platform.OS !== 'web') return;
    const nativeEvent = e.nativeEvent as unknown as { key?: string; shiftKey?: boolean; preventDefault?: () => void };
    if (nativeEvent.key === 'Enter' && !nativeEvent.shiftKey) {
      nativeEvent.preventDefault?.();
      void sendText(draft);
    }
  };

  const statusText = conversation ? STATUS_LABELS[conversation.status] : 'Đang kết nối trợ lý AI...';
  const canEscalate = !conversation || conversation.status === 'AI_HANDLING';
  const isWaitingStaff =
    conversation?.status === 'WAITING_FOR_STAFF' || conversation?.status === 'STAFF_HANDLING';
  const isClosed = conversation?.status === 'RESOLVED' || conversation?.status === 'CLOSED';
  const showHero = messages.length <= 1 && !loading && !isClosed;

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
            Platform.OS === 'web'
              ? { transform: [{ translateX: webOffset.x }, { translateY: webOffset.y }] }
              : null,
          ]}
        >
          {/* Header (draggable on Web) */}
          <View
            onMoveShouldSetResponder={() => Platform.OS === 'web'}
            onResponderGrant={handleWebHeaderGrant}
            onResponderMove={handleWebHeaderMove}
            onResponderRelease={() => setWebDragStart(null)}
            onResponderTerminate={() => setWebDragStart(null)}
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
                onPress={handleStartNewConversation}
                disabled={sending || loading}
                accessibilityLabel="Cuộc hội thoại mới"
                style={[styles.actionPill, { backgroundColor: isDark ? colors.cardAlt : colors.card }]}
              >
                <Ionicons name="add-circle-outline" size={14} color={colors.text} />
                <Text style={[styles.actionPillText, { color: colors.text }]}>Hội thoại mới</Text>
              </TouchableOpacity>
              {canEscalate && isAuthenticated && (
                <TouchableOpacity
                  onPress={handleRequestStaff}
                  disabled={sending || loading}
                  accessibilityLabel="Gặp nhân viên"
                  style={[styles.iconBtn, { backgroundColor: colors.cardAlt }]}
                >
                  <Ionicons name="headset-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              {!isClosed && conversation && isAuthenticated && (
                <TouchableOpacity
                  onPress={handleConfirmResolved}
                  disabled={sending || loading}
                  accessibilityLabel="Đã xong"
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
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* CSKH handoff banner so user never feels stuck for 24h */}
          {isWaitingStaff && (
            <View style={[styles.banner, { backgroundColor: colors.coinSoft, borderColor: colors.coin }]}>
              <Text style={[styles.bannerText, { color: colors.text }]}>
                CSKH đang tiếp nhận — AI tạm dừng. Bạn có thể tạo cuộc hội thoại mới để hỏi AI ngay.
              </Text>
              <TouchableOpacity
                onPress={handleStartNewConversation}
                disabled={loading || sending}
                style={[styles.bannerBtn, { backgroundColor: colors.ruby }]}
              >
                <Text style={styles.bannerBtnText}>Chat AI mới</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Guest prompt banner */}
          {!isAuthenticated && (
            <View style={[styles.banner, { backgroundColor: colors.rubySoft, borderColor: colors.ruby }]}>
              <Text style={[styles.bannerText, { color: colors.text }]}>
                Đăng nhập để lưu lịch sử trò chuyện và kết nối nhân viên CSKH.
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
              <ActivityIndicator size="small" color={colors.ruby} style={{ marginTop: 32 }} />
            ) : (
              <>
                {showHero && (
                  <View style={styles.hero}>
                    <AiOrb size="lg" />
                    <View style={[styles.heroBadge, { backgroundColor: colors.rubySoft, borderColor: colors.ruby }]}>
                      <Text style={[styles.heroBadgeText, { color: colors.ruby }]}>AI Smart Assistant</Text>
                    </View>
                    <Text style={[styles.heroTitle, { color: colors.text }]}>Tôi có thể giúp gì cho bạn?</Text>
                    <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
                      Chọn nhanh một chủ đề bên dưới hoặc nhập câu hỏi của bạn về phim, Coin & tài khoản.
                    </Text>

                    <View style={styles.cardGrid}>
                      {HERO_CARDS.map((card) => (
                        <TouchableOpacity
                          key={card.title}
                          onPress={() => sendText(card.message)}
                          disabled={sending}
                          style={[
                            styles.featureCard,
                            {
                              backgroundColor: isDark ? colors.cardAlt : colors.card,
                              borderColor: colors.border,
                            },
                          ]}
                        >
                          <View style={[styles.featureIconWrap, { backgroundColor: `${card.tint}22` }]}>
                            <Ionicons name={card.icon} size={17} color={card.tint} />
                          </View>
                          <Text style={[styles.featureTitle, { color: colors.text }]}>{card.title}</Text>
                          <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{card.desc}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {messages.map((msg) => {
                  if (msg.senderType === 'SYSTEM') {
                    return (
                      <Text key={msg.id} style={[styles.system, { color: colors.textMuted }]}>
                        {msg.content}
                      </Text>
                    );
                  }
                  const isMember = msg.senderType === 'MEMBER';
                  if (isMember) {
                    return (
                      <View key={msg.id} style={[styles.bubbleRow, { justifyContent: 'flex-end' }]}>
                        <View style={[styles.bubble, styles.bubbleUser, { backgroundColor: colors.ruby }]}>
                          <Text style={[styles.bubbleText, { color: '#FFFFFF' }]}>{msg.content}</Text>
                        </View>
                      </View>
                    );
                  }
                  return (
                    <View key={msg.id} style={styles.assistantWrap}>
                      <View style={styles.senderRow}>
                        <AiOrb size="xs" />
                        <Text style={[styles.senderName, { color: colors.textSecondary }]}>
                          {msg.senderType === 'STAFF' ? 'Nhân viên CSKH' : 'Trợ lý AI Cinema'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.bubble,
                          styles.bubbleAssistant,
                          {
                            backgroundColor: isDark ? colors.cardAlt : colors.card,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text style={[styles.bubbleText, { color: colors.text }]}>{msg.content}</Text>
                      </View>
                    </View>
                  );
                })}

                {sending && (
                  <View style={styles.assistantWrap}>
                    <View style={styles.senderRow}>
                      <AiOrb size="xs" />
                      <Text style={[styles.senderName, { color: colors.textMuted }]}>Trợ lý AI đang trả lời...</Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {errorMsg && (
            <View style={[styles.errorRow, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{errorMsg}</Text>
              <TouchableOpacity onPress={handleStartNewConversation} style={[styles.bannerBtn, { backgroundColor: colors.ruby }]}>
                <Text style={styles.bannerBtnText}>Thử mới</Text>
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
                  onPress={() => sendText(chip.message)}
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

          {/* Input Box or New Conversation CTA when closed */}
          {isClosed ? (
            <View style={styles.closedBar}>
              <Text style={[styles.closedText, { color: colors.textMuted }]}>
                Cuộc hội thoại này đã kết thúc.
              </Text>
              <TouchableOpacity
                onPress={handleStartNewConversation}
                disabled={loading}
                style={[styles.newConvBtn, { backgroundColor: colors.ruby }]}
              >
                <Ionicons name="sparkles" size={15} color="#FFFFFF" />
                <Text style={styles.newConvBtnText}>Cuộc hội thoại mới</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: isDark ? colors.cardAlt : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Hỏi Trợ lý AI bất kỳ điều gì..."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.text }]}
                multiline
                editable={!sending && !loading}
                onKeyPress={handleWebKeyPress}
                onSubmitEditing={() => void sendText(draft)}
              />
              <TouchableOpacity
                onPress={() => void sendText(draft)}
                disabled={sending || loading || !draft.trim()}
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
