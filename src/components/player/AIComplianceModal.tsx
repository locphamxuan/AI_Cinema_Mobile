import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AIComplianceInfo } from '../../types/movie';
import { useTheme } from '../../theme';

interface AIComplianceModalProps {
  visible: boolean;
  onClose: () => void;
  compliance: AIComplianceInfo;
}

export const AIComplianceModal: React.FC<AIComplianceModalProps> = ({
  visible,
  onClose,
  compliance,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
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
            <View style={styles.titleRow}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
              <Text style={[styles.title, { color: colors.text }]}>
                Minh Bạch & Tuân Thủ Pháp Luật AI
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Status card */}
            <View
              style={[
                styles.statusBox,
                {
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  borderColor: 'rgba(16, 185, 129, 0.3)',
                },
              ]}
            >
              <View style={styles.statusRow}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.statusTitle}>ĐÃ PHÊ DUYỆT & GẮN NHÃN PHÁP LÝ</Text>
              </View>
              <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
                Nội dung đáp ứng tiêu chuẩn đạo đức và kỹ thuật số theo pháp luật hiện hành.
              </Text>
            </View>

            {/* Compliance Info Grid */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Căn cứ pháp lý:</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {compliance.complianceArticle}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Mô hình tạo sinh:</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {compliance.aiModel}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Ngày khởi tạo:</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {compliance.generatedDate}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Điểm kiểm duyệt an toàn:</Text>
                <View style={styles.scoreRow}>
                  <Text style={[styles.scoreValue, { color: '#10B981' }]}>
                    {compliance.moderationScore}%
                  </Text>
                  <Text style={[styles.scoreTag, { color: colors.textMuted }]}>
                    (Đạt ngưỡng an toàn xuất bản {'>'} 90%)
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Phân loại độ tuổi:</Text>
                <Text style={[styles.value, { color: colors.text }]}>
                  {compliance.contentRating}
                </Text>
              </View>
            </View>

            {/* Disclaimer box */}
            <View
              style={[
                styles.disclaimerBox,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.disclaimerTitle, { color: colors.text }]}>
                ⚠️ Tuyên bố miễn trừ trách nhiệm nội dung AI
              </Text>
              <Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
                {compliance.disclaimer}
              </Text>
            </View>
          </ScrollView>

          {/* Close button */}
          <TouchableOpacity
            style={[styles.doneBtn, { backgroundColor: colors.ruby }]}
            onPress={onClose}
          >
            <Text style={styles.doneBtnText}>Tôi đã hiểu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    marginBottom: 16,
  },
  statusBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statusTitle: {
    color: '#10B981',
    fontWeight: '800',
    fontSize: 12,
  },
  statusSubtitle: {
    fontSize: 11,
    lineHeight: 15,
  },
  infoSection: {
    gap: 10,
    marginBottom: 14,
  },
  infoRow: {
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  scoreTag: {
    fontSize: 11,
  },
  disclaimerBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  disclaimerTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
  },
  doneBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
