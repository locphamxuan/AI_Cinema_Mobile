import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useProductionStore } from '../../store/useProductionStore';
import { useTheme } from '../../theme';

interface ComplianceModalProps {
  visible: boolean;
  onClose: () => void;
  projectId: string;
  episodeId: string;
  onPublished: () => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({
  visible,
  onClose,
  projectId,
  episodeId,
  onPublished,
}) => {
  const { colors, isDark } = useTheme();
  const { verifyComplianceAndPublish } = useProductionStore();

  const [article44, setArticle44] = useState(true);
  const [decree142, setDecree142] = useState(true);
  const [watermark, setWatermark] = useState(true);

  const canPublish = article44 && decree142 && watermark;

  const handlePublish = () => {
    verifyComplianceAndPublish(projectId, episodeId, {
      aiLawArticle44Verified: article44,
      decree142LabelAttached: decree142,
      aiWatermarkEnabled: watermark,
      certificationId: `AI-VN-2026-${Date.now().toString().slice(-6)}`,
      moderationScore: 99.4,
      aiContentPercentage: 100,
      verifiedBy: 'Hội đồng Thẩm định AI Cinema',
      verifiedAt: new Date().toISOString(),
    });

    onPublished();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
              <MaterialCommunityIcons name="shield-lock" size={22} color="#8B5CF6" />
              <Text style={[styles.title, { color: colors.text }]}>
                Thẩm Định Pháp Lý & Phát Hành
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Reviewer cần xác nhận đầy đủ các tiêu chuẩn tuân thủ trước khi cấp phép phát hành ra công chúng.
          </Text>

          {/* Checklist */}
          <View style={styles.checklist}>
            {/* Check item 1 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setArticle44(!article44)}
              style={[
                styles.checkItem,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={article44 ? 'checkbox' : 'square-outline'}
                size={22}
                color={article44 ? '#10B981' : colors.textMuted}
              />
              <View style={styles.checkTextContainer}>
                <Text style={[styles.checkTitle, { color: colors.text }]}>
                  Điều 44 Luật Trí tuệ Nhân tạo 2025
                </Text>
                <Text style={[styles.checkDesc, { color: colors.textMuted }]}>
                  Kiểm duyệt tính trung thực, không vi phạm thuần phong mỹ tục hoặc bản quyền.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Check item 2 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDecree142(!decree142)}
              style={[
                styles.checkItem,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={decree142 ? 'checkbox' : 'square-outline'}
                size={22}
                color={decree142 ? '#10B981' : colors.textMuted}
              />
              <View style={styles.checkTextContainer}>
                <Text style={[styles.checkTitle, { color: colors.text }]}>
                  Nghị định 142/2024/NĐ-CP
                </Text>
                <Text style={[styles.checkDesc, { color: colors.textMuted }]}>
                  Gắn nhãn định danh nội dung do AI tạo sinh ở phần mở đầu và kết thúc phim.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Check item 3 */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setWatermark(!watermark)}
              style={[
                styles.checkItem,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  borderColor: colors.border,
                },
              ]}
            >
              <Ionicons
                name={watermark ? 'checkbox' : 'square-outline'}
                size={22}
                color={watermark ? '#10B981' : colors.textMuted}
              />
              <View style={styles.checkTextContainer}>
                <Text style={[styles.checkTitle, { color: colors.text }]}>
                  Chữ ký số & Watermark bản quyền
                </Text>
                <Text style={[styles.checkDesc, { color: colors.textMuted }]}>
                  Nhúng thủy vân số ẩn và nhãn hiển thị chứng thực nguồn gốc mô hình.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.publishBtn,
              {
                backgroundColor: canPublish ? '#10B981' : colors.border,
              },
            ]}
            onPress={handlePublish}
            disabled={!canPublish}
          >
            <Ionicons name="rocket" size={18} color="#FFFFFF" />
            <Text style={styles.publishBtnText}>Ký Duyệt & Phát Hành Lên Nền Tảng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 20,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  checklist: {
    gap: 10,
    marginVertical: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  checkTextContainer: {
    flex: 1,
    gap: 2,
  },
  checkTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  checkDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
    marginTop: 4,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
