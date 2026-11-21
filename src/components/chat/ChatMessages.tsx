import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

/** "20:15", the time a message was sent, in the member's clock. */
export function sentAt(iso: string | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** Three dots that rise in turn while the assistant writes; still when the member asked for less motion. */
function TypingDots({ color }: { color: string }) {
  const [dots] = useState(() => [0, 1, 2].map(() => new Animated.Value(0.35)));
  const [still, setStill] = useState(false);
  useEffect(() => {
    let alive = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => alive && setStill(reduce));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(
      Animated.stagger(
        160,
        dots.map((v) =>
          Animated.sequence([
            Animated.timing(v, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.timing(v, { toValue: 0.35, duration: 280, useNativeDriver: true }),
          ]),
        ),
      ),
    );
    loop.start();
    return () => loop.stop();
  }, [dots, still]);
  return (
    <View style={styles.typingDots} accessibilityLabel="Trợ lý AI đang trả lời">
      {dots.map((v, i) => (
        <Animated.View key={i} style={[styles.typingDot, { backgroundColor: color, opacity: v }]} />
      ))}
    </View>
  );
}

/**
 * The conversation. The member writes on the right in projector pink; the assistant answers on the left with a violet
 * edge, a person from Staff with an amber edge and a headset, so who is speaking is clear before reading; system
 * lines sit in the middle as small notes. Every bubble carries the time it was sent.
 */
export const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, colors, isDark, typing }) => (
  <>
    {messages.map((msg) => {
      const time = sentAt(msg.createdAt);
      if (msg.senderType === 'SYSTEM') {
        return (
          <View key={msg.id} style={[styles.systemPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : colors.card, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.system, { color: colors.textSecondary }]}>{msg.content}</Text>
          </View>
        );
      }
      if (msg.senderType === 'MEMBER') {
        return (
          <View key={msg.id} style={[styles.bubbleRow, styles.bubbleRowMine]}>
            <View style={styles.mineWrap}>
              <LinearGradient colors={[colors.ruby, colors.rubyDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.bubble, styles.bubbleUser]}>
                <Text style={[styles.bubbleText, { color: colors.white }]}>{msg.content}</Text>
              </LinearGradient>
              {!!time && <Text style={[styles.time, styles.timeMine, { color: colors.textMuted }]}>{time}</Text>}
            </View>
          </View>
        );
      }
      const staff = msg.senderType === 'STAFF';
      const edge = staff ? colors.coin : '#8B6CFF';
      return (
        <View key={msg.id} style={styles.assistantWrap}>
          <View style={styles.senderRow}>
            {staff ? (
              <View style={[styles.staffAvatar, { backgroundColor: colors.coinSoft }]}>
                <Ionicons name="headset" size={11} color={colors.coin} />
              </View>
            ) : (
              <AiOrb size="xs" />
            )}
            <Text style={[styles.senderName, { color: staff ? colors.coin : colors.textSecondary }]}>{staff ? 'Nhân viên hỗ trợ' : 'Trợ lý AI'}</Text>
            {!!time && <Text style={[styles.time, { color: colors.textMuted }]}>{time}</Text>}
          </View>
          <View
            style={[
              styles.bubble,
              styles.bubbleAssistant,
              { backgroundColor: isDark ? colors.cardAlt : colors.card, borderColor: colors.border, borderLeftColor: edge },
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
          <Text style={[styles.senderName, { color: colors.textMuted }]}>Trợ lý AI đang trả lời</Text>
        </View>
        <View style={[styles.bubble, styles.bubbleAssistant, styles.typingBubble, { backgroundColor: isDark ? colors.cardAlt : colors.card, borderColor: colors.border, borderLeftColor: '#8B6CFF' }]}>
          <TypingDots color={colors.textSecondary} />
        </View>
      </View>
    ) : null}
  </>
);
