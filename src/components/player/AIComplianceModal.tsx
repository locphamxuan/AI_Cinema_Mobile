import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '../common/Button';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/player/AIComplianceModal.styles';

export const DEFAULT_AI_LABEL = 'Nội dung được tạo bởi AI';

interface AIComplianceModalProps {
  visible: boolean;
  onClose: () => void;
  /** The label the episodes carry on screen (BR-10); the default text when the BE sends none. */
  aiLabel?: string | null;
  ageRating?: string;
}

/** Why the film shows an AI label, and what that label says. Only facts the BE gives are listed. */
export const AIComplianceModal: React.FC<AIComplianceModalProps> = ({ visible, onClose, aiLabel, ageRating }) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} accessibilityLabel="Đóng">
        <Pressable style={[styles.card, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="robot-outline" size={28} color={colors.ruby} />
          <Text style={[styles.title, { color: colors.text }]}>Phim này được tạo bằng AI</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Khi phát, nhãn AI luôn nằm trên khung hình, kể cả lúc xem toàn màn hình. Đây là yêu cầu của Điều 44 Luật
            134/2025/QH15 và Điều 18 Nghị định 142/2026/NĐ-CP.
          </Text>

          <View style={[styles.facts, { borderColor: colors.border }]}>
            <View style={styles.fact}>
              <Text style={[styles.factLabel, { color: colors.textMuted }]}>Nhãn trên khung hình</Text>
              <Text style={[styles.factValue, { color: colors.text }]}>{aiLabel || DEFAULT_AI_LABEL}</Text>
            </View>
            {ageRating ? (
              <View style={styles.fact}>
                <Text style={[styles.factLabel, { color: colors.textMuted }]}>Độ tuổi</Text>
                <Text style={[styles.factValue, { color: colors.text }]}>{ageRating}</Text>
              </View>
            ) : null}
          </View>

          <Button label="Đã hiểu" onPress={onClose} style={styles.done} />
        </Pressable>
      </Pressable>
    </Modal>
  );
};
