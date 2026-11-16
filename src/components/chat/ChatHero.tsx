import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThemeColors } from '../../theme';
import { styles } from '../../styles/components/chat/ChatModal.styles';
import { AiOrb } from './AiOrb';

type Topic = { title: string; desc: string; icon: keyof typeof Ionicons.glyphMap; tint: keyof ThemeColors; message: string };

/** First questions a member usually has, each inside the assistant's scope (BE docs/support-ai-member-scope.md). */
const TOPICS: Topic[] = [
  { title: 'Nạp Coin', desc: 'Nạp qua VNPay và kiểm tra ví', icon: 'wallet-outline', tint: 'coin', message: 'Làm sao để nạp Coin qua VNPay?' },
  { title: 'Gói Tháng', desc: 'Quyền lợi, gia hạn và cách hủy', icon: 'sparkles-outline', tint: 'ruby', message: 'Quyền lợi và cách đăng ký Gói Tháng?' },
  { title: 'Kho phim', desc: 'Phim đang có và nên xem gì', icon: 'film-outline', tint: 'neon', message: 'Hiện nay trên AI Cinema đang có bao nhiêu phim?' },
  {
    title: 'Thiết bị',
    desc: 'Số máy được xem cùng lúc',
    icon: 'phone-portrait-outline',
    tint: 'verified',
    message: 'Tài khoản của tôi xem được tối đa mấy thiết bị?',
  },
];

interface ChatHeroProps {
  colors: ThemeColors;
  isDark: boolean;
  disabled: boolean;
  onAsk: (message: string) => void;
}

/** The empty chat: what the assistant can help with, as four questions to start from. */
export const ChatHero: React.FC<ChatHeroProps> = ({ colors, isDark, disabled, onAsk }) => (
  <View style={styles.hero}>
    <AiOrb size="lg" />
    <Text style={[styles.heroTitle, { color: colors.text }]}>Bạn cần hỗ trợ gì?</Text>
    <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
      Chọn một chủ đề hoặc gõ câu hỏi về phim, Coin, gói Tháng và tài khoản.
    </Text>
    <View style={styles.cardGrid}>
      {TOPICS.map((topic) => (
        <TouchableOpacity
          key={topic.title}
          onPress={() => onAsk(topic.message)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={topic.message}
          style={[styles.featureCard, { backgroundColor: isDark ? colors.cardAlt : colors.card, borderColor: colors.border }]}
        >
          <View style={[styles.featureIconWrap, { backgroundColor: `${String(colors[topic.tint])}22` }]}>
            <Ionicons name={topic.icon} size={17} color={String(colors[topic.tint])} />
          </View>
          <Text style={[styles.featureTitle, { color: colors.text }]}>{topic.title}</Text>
          <Text style={[styles.featureDesc, { color: colors.textMuted }]}>{topic.desc}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);
