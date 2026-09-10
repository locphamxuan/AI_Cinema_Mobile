import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Header } from '../../src/components/common/Header';
import { MakerCheckerHeader } from '../../src/components/studio/MakerCheckerHeader';
import { SceneCard } from '../../src/components/studio/SceneCard';
import { ComplianceModal } from '../../src/components/studio/ComplianceModal';
import { useProductionStore } from '../../src/store/useProductionStore';
import { useTheme } from '../../src/theme';
import { ProductionState } from '../../src/types/production';

const STATUS_LABELS: Record<ProductionState, { label: string; color: string }> = {
  DRAFT: { label: 'Bản Nháp', color: '#64748B' },
  PLAN_SUBMITTED: { label: 'Chờ Duyệt Kế Hoạch', color: '#F59E0B' },
  PLAN_REJECTED: { label: 'Yêu Cầu Sửa Kế Hoạch', color: '#EF4444' },
  QUOTA_ALLOCATED: { label: 'Đã Cấp Quota AI', color: '#10B981' },
  PRODUCING: { label: 'Đang Sản Xuất AI', color: '#3B82F6' },
  CONTENT_SUBMITTED: { label: 'Chờ Thẩm Định Bản Dựng', color: '#8B5CF6' },
  CONTENT_REJECTED: { label: 'Yêu Cầu Sửa Cảnh', color: '#EF4444' },
  COMPLIANCE_PENDING: { label: 'Chờ Thẩm Định Pháp Lý', color: '#F59E0B' },
  PUBLISHED: { label: 'Đã Phát Hành', color: '#10B981' },
};

export default function StudioScreen() {
  const { colors, isDark } = useTheme();
  const {
    activeRole,
    getProject,
    generateSceneVideo,
    submitEpisodeForReview,
    approveContent,
    requestContentChanges,
  } = useProductionStore();

  const project = getProject();
  const [selectedEpId, setSelectedEpId] = useState('ep-prod-02');
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [complianceModalVisible, setComplianceModalVisible] = useState(false);

  const currentEpisode = project?.episodes.find((e) => e.id === selectedEpId) || project?.episodes[0];
  const isCreator = activeRole === 'creator';
  const isReviewer = activeRole === 'reviewer';

  const handleGenerate = async (sceneId: string) => {
    if (!project || !currentEpisode) return;
    setGeneratingSceneId(sceneId);
    const result = await generateSceneVideo(project.id, currentEpisode.id, sceneId);
    setGeneratingSceneId(null);

    if (!result.success) {
      Alert.alert('Lỗi Render', result.error);
    }
  };

  const handleSubmitForReview = () => {
    if (!project || !currentEpisode) return;
    const result = submitEpisodeForReview(project.id, currentEpisode.id);
    if (result.success) {
      Alert.alert('Nộp thành công 🎉', 'Bản dựng đã gửi lên Reviewer để thẩm định!');
    } else {
      Alert.alert('Chưa thể nộp', result.error);
    }
  };

  const handleReviewerApprove = () => {
    if (!project || !currentEpisode) return;
    approveContent(project.id, currentEpisode.id);
    setComplianceModalVisible(true);
  };

  const handleReviewerReject = () => {
    if (!project || !currentEpisode) return;
    requestContentChanges(
      project.id,
      currentEpisode.id,
      'Cần chỉnh sửa lại biểu cảm nhân vật và khớp khẩu hình lồng tiếng AI tại Cảnh 2.'
    );
    Alert.alert('Đã gửi phản hồi', 'Yêu cầu chỉnh sửa đã được gửi về cho Creator.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Role & Quota Header */}
        <MakerCheckerHeader />

        {/* Episode Selector Tabs */}
        {project && (
          <View style={styles.episodeTabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.episodeTabs}>
              {project.episodes.map((ep) => {
                const isSelected = ep.id === currentEpisode?.id;
                const statusMeta = STATUS_LABELS[ep.status];

                return (
                  <TouchableOpacity
                    key={ep.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedEpId(ep.id)}
                    style={[
                      styles.epTab,
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
                    <Text
                      style={[
                        styles.epTabTitle,
                        {
                          color: isSelected ? colors.ruby : colors.text,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      Tập {ep.episodeNumber}
                    </Text>
                    <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Current Episode Status Card */}
        {currentEpisode && (
          <View style={styles.episodeSection}>
            <View
              style={[
                styles.episodeHeaderCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.epTitleRow}>
                <Text style={[styles.epTitle, { color: colors.text }]}>
                  {currentEpisode.title}
                </Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: `${STATUS_LABELS[currentEpisode.status].color}20`,
                      borderColor: STATUS_LABELS[currentEpisode.status].color,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: STATUS_LABELS[currentEpisode.status].color },
                    ]}
                  >
                    {STATUS_LABELS[currentEpisode.status].label}
                  </Text>
                </View>
              </View>

              {/* Stats row */}
              <View style={styles.epMetaRow}>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Thời lượng:</Text>
                  <Text style={[styles.metaValue, { color: colors.text }]}>
                    {currentEpisode.totalDuration}
                  </Text>
                </View>

                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Tokens đã dùng:</Text>
                  <Text style={[styles.metaValue, { color: '#F59E0B' }]}>
                    {currentEpisode.actualTokensUsed} / {currentEpisode.quota?.allocatedTokens || 0}
                  </Text>
                </View>
              </View>

              {/* Feedback history if any */}
              {currentEpisode.plan.feedbackHistory.length > 0 && (
                <View
                  style={[
                    styles.feedbackBox,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFBEB',
                      borderColor: '#F59E0B',
                    },
                  ]}
                >
                  <Text style={styles.feedbackAuthor}>
                    💬 {currentEpisode.plan.feedbackHistory[0].author}:
                  </Text>
                  <Text style={[styles.feedbackContent, { color: colors.text }]}>
                    {currentEpisode.plan.feedbackHistory[0].content}
                  </Text>
                </View>
              )}
            </View>

            {/* Scenes Section Title */}
            <View style={styles.sectionHeadingRow}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>
                Phân Cảnh Kịch Bản ({currentEpisode.scenes.length} cảnh)
              </Text>
              {isCreator && (
                <Text style={[styles.hintText, { color: colors.textMuted }]}>
                  Bấm "Sinh Clip AI" để render
                </Text>
              )}
            </View>

            {/* Scenes list */}
            {currentEpisode.scenes.map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                isCreator={isCreator}
                onGenerate={() => handleGenerate(scene.id)}
                isGenerating={generatingSceneId === scene.id}
              />
            ))}

            {/* Maker Action Footer */}
            {isCreator && currentEpisode.status !== 'PUBLISHED' && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.ruby }]}
                onPress={handleSubmitForReview}
              >
                <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Nộp Bản Dựng Lên Reviewer</Text>
              </TouchableOpacity>
            )}

            {/* Reviewer Action Footer */}
            {isReviewer && currentEpisode.status === 'CONTENT_SUBMITTED' && (
              <View style={styles.reviewerActions}>
                <TouchableOpacity
                  style={[styles.rejectBtn, { borderColor: '#EF4444' }]}
                  onPress={handleReviewerReject}
                >
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                  <Text style={styles.rejectBtnText}>Yêu Cầu Sửa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.approveBtn, { backgroundColor: '#10B981' }]}
                  onPress={handleReviewerApprove}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>Duyệt & Xuất Bản Pháp Lý</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Compliance Modal */}
      {project && currentEpisode && (
        <ComplianceModal
          visible={complianceModalVisible}
          onClose={() => setComplianceModalVisible(false)}
          projectId={project.id}
          episodeId={currentEpisode.id}
          onPublished={() => {
            Alert.alert('Xuất bản thành công 🎬', 'Tập phim đã được đăng tải lên nền tảng AI Cinema!');
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  episodeTabsContainer: {
    paddingVertical: 4,
    marginBottom: 8,
  },
  episodeTabs: {
    paddingHorizontal: 16,
    gap: 8,
  },
  epTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  epTabTitle: {
    fontSize: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  episodeSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  episodeHeaderCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  epTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  epTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  epMetaRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metaItem: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  feedbackBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  feedbackAuthor: {
    color: '#D97706',
    fontSize: 11,
    fontWeight: '700',
  },
  feedbackContent: {
    fontSize: 11,
    lineHeight: 15,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
  },
  hintText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  reviewerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  rejectBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  approveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    gap: 6,
  },
  approveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
