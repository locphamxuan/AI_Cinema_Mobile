import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { EpisodeVersion } from '../../types/movie';
import { useTheme } from '../../theme';

interface VersionSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  versions: EpisodeVersion[];
  selectedVersionId: string;
  onSelectVersion: (version: EpisodeVersion) => void;
}

export const VersionSelectorModal: React.FC<VersionSelectorModalProps> = ({
  visible,
  onClose,
  versions,
  selectedVersionId,
  onSelectVersion,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
            <View style={styles.headerTitleContainer}>
              <MaterialCommunityIcons name="history" size={20} color={colors.ruby} />
              <Text style={[styles.title, { color: colors.text }]}>
                Lịch Sử Phiên Bản AI (Multi-version)
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            AI Cinema lưu trữ đầy đủ các phiên bản render sau mỗi lần hiệu chỉnh nội dung và kiểm duyệt.
          </Text>

          {/* Versions list */}
          <ScrollView style={styles.scrollList} contentContainerStyle={styles.scrollContent}>
            {versions.map((ver) => {
              const isSelected = ver.id === selectedVersionId;

              return (
                <TouchableOpacity
                  key={ver.id}
                  activeOpacity={0.85}
                  onPress={() => onSelectVersion(ver)}
                  style={[
                    styles.versionCard,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? '#1E293B'
                          : '#EFF6FF'
                        : isDark
                        ? '#131B2E'
                        : '#F8FAFC',
                      borderColor: isSelected ? colors.ruby : colors.border,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  {/* Card top */}
                  <View style={styles.cardHeader}>
                    <View style={styles.versionBadge}>
                      <Text style={styles.versionNumber}>{ver.versionNumber}</Text>
                    </View>
                    {ver.isCurrent && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Đang phát hành</Text>
                      </View>
                    )}
                    <View style={styles.scoreBadge}>
                      <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                      <Text style={styles.scoreText}>{ver.moderationScore}%</Text>
                    </View>
                  </View>

                  {/* Title & Author */}
                  <Text style={[styles.versionTitle, { color: colors.text }]}>
                    {ver.versionTitle}
                  </Text>
                  <Text style={[styles.authorText, { color: colors.textMuted }]}>
                    {ver.author} • {ver.aiModel}
                  </Text>

                  {/* Changelog points */}
                  <View style={styles.changelogBox}>
                    <Text style={[styles.changelogTitle, { color: colors.textSecondary }]}>
                      Điểm hiệu chỉnh:
                    </Text>
                    {ver.changelog.map((log, idx) => (
                      <View key={idx} style={styles.logItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={[styles.logText, { color: colors.textSecondary }]}>
                          {log}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Switch button */}
                  <View style={styles.footerRow}>
                    <Text style={[styles.durationText, { color: colors.textMuted }]}>
                      Thời lượng: {ver.duration}
                    </Text>
                    <View
                      style={[
                        styles.selectBtn,
                        {
                          backgroundColor: isSelected ? colors.ruby : 'transparent',
                          borderColor: colors.ruby,
                          borderWidth: isSelected ? 0 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectBtnText,
                          { color: isSelected ? '#FFFFFF' : colors.ruby },
                        ]}
                      >
                        {isSelected ? 'Đang chọn' : 'Phát bản này'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
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
    maxHeight: '85%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  subtitle: {
    fontSize: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    lineHeight: 16,
  },
  scrollList: {
    paddingHorizontal: 16,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 20,
  },
  versionCard: {
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  versionBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  versionNumber: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 11,
  },
  currentBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 10,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  scoreText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 11,
  },
  versionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  authorText: {
    fontSize: 11,
  },
  changelogBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
    gap: 3,
  },
  changelogTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  logItem: {
    flexDirection: 'row',
    gap: 4,
  },
  bullet: {
    color: '#3B82F6',
    fontSize: 12,
  },
  logText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  durationText: {
    fontSize: 11,
  },
  selectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
