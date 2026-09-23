import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Header } from '../../src/components/common/Header';
import { MakerCheckerHeader } from '../../src/components/studio/MakerCheckerHeader';
import { SceneCard } from '../../src/components/studio/SceneCard';
import { ComplianceModal } from '../../src/components/studio/ComplianceModal';
import { useProductionStore } from '../../src/store/useProductionStore';
import { useTheme } from '../../src/theme';
import { ProductionState, Scene } from '../../src/types/production';

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
    reorderScenes,
    reviewScene,
    requestTokenExtension,
    respondToTokenExtension,
    submitEpisodeDraft,
    submitEpisodeForReview,
    approveContent,
    requestContentChanges,
    loadProjects,
  } = useProductionStore();

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const project = getProject();
  const [selectedEpId, setSelectedEpId] = useState('ep-prod-02');
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [complianceModalVisible, setComplianceModalVisible] = useState(false);

  // Modals for MainFlow4
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tokenReqAmount, setTokenReqAmount] = useState('100');
  const [tokenReqReason, setTokenReqReason] = useState('');
  const [sceneFeedbackModalVisible, setSceneFeedbackModalVisible] = useState(false);
  const [targetSceneForFeedback, setTargetSceneForFeedback] = useState<Scene | null>(null);
  const [sceneFeedbackText, setSceneFeedbackText] = useState('');

  const currentEpisode = project?.episodes.find((e) => e.id === selectedEpId) || project?.episodes[0];
  const isCreator = activeRole === 'creator';
  const isReviewer = activeRole === 'reviewer';

  // Duration Check
  const totalDurationSec = currentEpisode?.scenes.reduce((sum, s) => sum + (s.durationSec || 0), 0) || 0;
  const maxDurationSec = currentEpisode?.maxDurationSec || 2700; // 45 minutes
  const isDurationExceeded = totalDurationSec > maxDurationSec;

  const formatMinSec = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 100% Scene Approval Enforcement for Reviewer
  const unapprovedScenes = currentEpisode?.scenes.filter((s) => s.reviewStatus !== 'approved') || [];
  const allScenesApproved = (currentEpisode?.scenes.length || 0) > 0 && unapprovedScenes.length === 0;

  // Pending Token Requests
  const pendingTokenReqs = project?.tokenExtensionRequests?.filter(
    (r) => r.episodeId === currentEpisode?.id && r.status === 'pending'
  ) || [];

  const handleGenerate = async (sceneId: string) => {
    if (!project || !currentEpisode) return;
    setGeneratingSceneId(sceneId);
    const result = await generateSceneVideo(project.id, currentEpisode.id, sceneId);
    setGeneratingSceneId(null);

    if (!result.success) {
      Alert.alert('Lỗi Render', result.error);
    }
  };

  const handleMoveScene = (index: number, direction: 'up' | 'down') => {
    if (!project || !currentEpisode) return;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= currentEpisode.scenes.length) return;
    reorderScenes(project.id, currentEpisode.id, index, target);
  };

  const handleSubmitForReview = () => {
    if (!project || !currentEpisode) return;

    submitEpisodeDraft(
      project.id,
      currentEpisode.id,
      'Bản dựng hoàn chỉnh đã render đầy đủ các phân cảnh, kiểm tra độ dài và chuẩn chất lượng AI.'
    );

    const result = submitEpisodeForReview(project.id, currentEpisode.id);
    if (result.success) {
      Alert.alert('Nộp thành công 🎉', 'Bản dựng đã tạo EpisodeSubmission và gửi lên Reviewer để thẩm định!');
    } else {
      Alert.alert('Chưa thể nộp', result.error);
    }
  };

  const handleReviewerApprove = () => {
    if (!project || !currentEpisode) return;

    if (!allScenesApproved) {
      Alert.alert(
        'Chưa Đủ Điều Kiện Nghiệm Thu',
        `⚠️ Cần duyệt 100% các phân cảnh trước khi có thể phê duyệt tập phim! Còn ${unapprovedScenes.length}/${currentEpisode.scenes.length} cảnh chưa duyệt.`
      );
      return;
    }

    approveContent(project.id, currentEpisode.id);
    setComplianceModalVisible(true);
  };

  const handleReviewerReject = () => {
    if (!project || !currentEpisode) return;
    requestContentChanges(
      project.id,
      currentEpisode.id,
      'Cần chỉnh sửa lại biểu cảm nhân vật và khớp khẩu hình lồng tiếng AI theo nhận xét của Reviewer.'
    );
    Alert.alert('Đã gửi phản hồi', 'Yêu cầu chỉnh sửa đã được gửi về cho Creator.');
  };

  const handleApproveScene = (sceneId: string) => {
    if (!project || !currentEpisode) return;
    reviewScene(project.id, currentEpisode.id, sceneId, 'approved');
    Alert.alert('Đã duyệt cảnh', 'Phân cảnh đã chuyển trạng thái sang Đã Duyệt.');
  };

  const handleOpenFeedbackModal = (scene: Scene) => {
    setTargetSceneForFeedback(scene);
    setSceneFeedbackText(scene.reviewFeedback || '');
    setSceneFeedbackModalVisible(true);
  };

  const handleSaveSceneFeedback = () => {
    if (!project || !currentEpisode || !targetSceneForFeedback || !sceneFeedbackText.trim()) return;
    reviewScene(project.id, currentEpisode.id, targetSceneForFeedback.id, 'changes_requested', sceneFeedbackText.trim());
    setSceneFeedbackModalVisible(false);
    setTargetSceneForFeedback(null);
    setSceneFeedbackText('');
    Alert.alert('Đã lưu góp ý', 'Phân cảnh đã được chuyển sang trạng thái Cần Chỉnh Sửa.');
  };

  const handleSendTokenRequest = () => {
    if (!project || !currentEpisode || !tokenReqReason.trim()) return;
    const tokens = parseInt(tokenReqAmount, 10) || 100;
    requestTokenExtension(project.id, currentEpisode.id, tokens, tokenReqReason.trim());
    setIsTokenModalOpen(false);
    setTokenReqReason('');
    Alert.alert('Đã gửi đề xuất ⚡', `Yêu cầu xin thêm ${tokens} Tokens đã được chuyển tới Reviewer.`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Role & Quota Header */}
        <MakerCheckerHeader />

        {/* Quick Toolbar: Project Info & Token Extension */}
        <View style={styles.quickBar}>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setIsPlanModalOpen(true)}
          >
            <Ionicons name="document-text-outline" size={14} color={colors.ruby} />
            <Text style={[styles.quickBtnText, { color: colors.text }]}>Kế Hoạch & Chính Sách AI</Text>
          </TouchableOpacity>

          {isCreator && (
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: '#F59E0B' }]}
              onPress={() => setIsTokenModalOpen(true)}
            >
              <FontAwesome5 name="bolt" size={12} color="#F59E0B" />
              <Text style={[styles.quickBtnText, { color: '#F59E0B' }]}>Xin Thêm Token</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Reviewer Notice for Pending Token Requests */}
        {isReviewer && pendingTokenReqs.length > 0 && (
          <View style={[styles.tokenNoticeCard, { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: '#F59E0B' }]}>
            <View style={styles.tokenNoticeHeader}>
              <FontAwesome5 name="exclamation-triangle" size={14} color="#F59E0B" />
              <Text style={styles.tokenNoticeTitle}>Đề xuất mở rộng Quota Token từ Creator</Text>
            </View>
            {pendingTokenReqs.map((req) => (
              <View key={req.id} style={styles.tokenNoticeItem}>
                <Text style={[styles.tokenNoticeText, { color: colors.text }]}>
                  Xin thêm <Text style={{ fontWeight: '700', color: '#F59E0B' }}>+{req.requestedTokens} Tokens</Text>: &quot;{req.reason}&quot;
                </Text>
                <View style={styles.tokenNoticeActions}>
                  <TouchableOpacity
                    style={[styles.tokenActionBtn, { backgroundColor: '#EF4444' }]}
                    onPress={() => respondToTokenExtension(project!.id, req.id, false, 'Từ chối')}
                  >
                    <Text style={styles.tokenActionBtnText}>Từ chối</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tokenActionBtn, { backgroundColor: '#10B981' }]}
                    onPress={() => respondToTokenExtension(project!.id, req.id, true, 'Đã phê duyệt')}
                  >
                    <Text style={styles.tokenActionBtnText}>Duyệt (+{req.requestedTokens})</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

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

              {/* Duration Control Bar */}
              <View
                style={[
                  styles.durationCard,
                  {
                    backgroundColor: isDurationExceeded ? 'rgba(239, 68, 68, 0.12)' : isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDurationExceeded ? '#EF4444' : colors.border,
                  },
                ]}
              >
                <View style={styles.durationHeaderRow}>
                  <Text style={[styles.durationLabel, { color: isDurationExceeded ? '#EF4444' : colors.textMuted }]}>
                    ⏱️ Độ dài: {formatMinSec(totalDurationSec)} / Tối đa {formatMinSec(maxDurationSec)}
                  </Text>
                  <Text style={[styles.durationBadge, { color: isDurationExceeded ? '#EF4444' : '#10B981' }]}>
                    {isDurationExceeded ? 'Vượt Giới Hạn!' : 'Đạt Chuẩn'}
                  </Text>
                </View>
                <View style={styles.durationTrack}>
                  <View
                    style={[
                      styles.durationProgress,
                      {
                        width: `${Math.min(100, (totalDurationSec / maxDurationSec) * 100)}%`,
                        backgroundColor: isDurationExceeded ? '#EF4444' : '#10B981',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Stats row */}
              <View style={styles.epMetaRow}>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Tokens đã dùng:</Text>
                  <Text style={[styles.metaValue, { color: '#F59E0B' }]}>
                    {currentEpisode.actualTokensUsed} / {currentEpisode.quota?.allocatedTokens || 0}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>Duyệt Cảnh:</Text>
                  <Text style={[styles.metaValue, { color: allScenesApproved ? '#10B981' : '#F59E0B' }]}>
                    {currentEpisode.scenes.length - unapprovedScenes.length}/{currentEpisode.scenes.length} cảnh ({allScenesApproved ? '100%' : `${Math.round(((currentEpisode.scenes.length - unapprovedScenes.length) / currentEpisode.scenes.length) * 100)}%`})
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
                  Dùng ▲/▼ để đổi thứ tự cảnh
                </Text>
              )}
            </View>

            {/* Scenes list */}
            {currentEpisode.scenes.map((scene, idx) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                isCreator={isCreator}
                isReviewer={isReviewer}
                canMoveUp={idx > 0}
                canMoveDown={idx < currentEpisode.scenes.length - 1}
                onMoveUp={() => handleMoveScene(idx, 'up')}
                onMoveDown={() => handleMoveScene(idx, 'down')}
                onGenerate={() => handleGenerate(scene.id)}
                isGenerating={generatingSceneId === scene.id}
                onApproveScene={() => handleApproveScene(scene.id)}
                onRequestChangesScene={() => handleOpenFeedbackModal(scene)}
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
                  style={[
                    styles.approveBtn,
                    {
                      backgroundColor: allScenesApproved ? '#10B981' : '#64748B',
                      opacity: allScenesApproved ? 1 : 0.7,
                    },
                  ]}
                  onPress={handleReviewerApprove}
                >
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.approveBtnText}>
                    {allScenesApproved ? 'Duyệt & Xuất Bản Pháp Lý' : `Còn ${unapprovedScenes.length} cảnh chưa duyệt`}
                  </Text>
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

      {/* Project Info & Policy Modal */}
      {project && (
        <Modal
          visible={isPlanModalOpen}
          animationType="slide"
          transparent
          onRequestClose={() => setIsPlanModalOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>📋 Kế Hoạch & Chính Sách AI</Text>
                <TouchableOpacity onPress={() => setIsPlanModalOpen(false)}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Text style={[styles.subHeading, { color: colors.text }]}>{project.title}</Text>
                <Text style={[styles.synopsisText, { color: colors.textSecondary }]}>{project.synopsis}</Text>

                {/* Genre chips */}
                <View style={styles.genreRow}>
                  {Array.isArray(project.genre) ? (
                    project.genre.map((g) => (
                      <View key={g} style={styles.genreChip}>
                        <Text style={styles.genreChipText}>{g}</Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.genreChip}>
                      <Text style={styles.genreChipText}>{project.genre}</Text>
                    </View>
                  )}
                </View>

                {/* AI Policy */}
                <View style={[styles.policyBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}>
                  <Text style={styles.policyTitle}>📜 {project.appliedPolicy?.name || 'Luật AI 2025'}</Text>
                  <Text style={[styles.policyDesc, { color: colors.textSecondary }]}>
                    {project.appliedPolicy?.description}
                  </Text>
                  <Text style={styles.policyMeta}>
                    • Tiêu chuẩn an toàn: &ge;{project.appliedPolicy?.minModerationScore}% • Watermark: {project.appliedPolicy?.watermarkRequired ? 'Bắt buộc' : 'Không'}
                  </Text>
                </View>

                {/* Milestones */}
                <Text style={[styles.subHeading, { color: colors.text, marginTop: 12 }]}>🚩 Cột Mốc Dự Án</Text>
                {project.milestones?.map((m, i) => (
                  <View key={m.id} style={[styles.milestoneItem, { borderColor: colors.border }]}>
                    <Text style={[styles.milestoneTitle, { color: colors.text }]}>Mốc {i + 1}: {m.title}</Text>
                    <Text style={[styles.milestoneSub, { color: colors.textMuted }]}>Hạn chót: {m.dueDate} • Phụ trách: {m.assignedTo}</Text>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.modalCloseBtn, { backgroundColor: colors.ruby }]}
                onPress={() => setIsPlanModalOpen(false)}
              >
                <Text style={styles.modalCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Token Extension Request Modal */}
      <Modal
        visible={isTokenModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsTokenModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>⚡ Xin Đề Xuất Mở Rộng Token</Text>
              <TouchableOpacity onPress={() => setIsTokenModalOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Số lượng Tokens cần thêm:</Text>
            <TextInput
              style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
              keyboardType="numeric"
              value={tokenReqAmount}
              onChangeText={setTokenReqAmount}
              placeholder="100"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 8 }]}>Lý do cần thêm token:</Text>
            <TextInput
              style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
              multiline
              numberOfLines={3}
              value={tokenReqReason}
              onChangeText={setTokenReqReason}
              placeholder="Ví dụ: Cần render lại Cảnh 2 với model 4K..."
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setIsTokenModalOpen(false)}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.text }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: '#F59E0B' }]}
                onPress={handleSendTokenRequest}
              >
                <Text style={styles.modalSubmitBtnText}>Gửi Đề Xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Scene Feedback Modal for Reviewer */}
      <Modal
        visible={sceneFeedbackModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setSceneFeedbackModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                💬 Góp Ý Cảnh #{targetSceneForFeedback?.sceneNumber}
              </Text>
              <TouchableOpacity onPress={() => setSceneFeedbackModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Yêu cầu chỉnh sửa chi tiết:</Text>
            <TextInput
              style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1E293B' : '#F8FAFC' }]}
              multiline
              numberOfLines={4}
              value={sceneFeedbackText}
              onChangeText={setSceneFeedbackText}
              placeholder="Nhập góp ý cho Creator..."
              placeholderTextColor={colors.textMuted}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setSceneFeedbackModalVisible(false)}
              >
                <Text style={[styles.modalCancelBtnText, { color: colors.text }]}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, { backgroundColor: colors.ruby }]}
                onPress={handleSaveSceneFeedback}
              >
                <Text style={styles.modalSubmitBtnText}>Lưu & Yêu Cầu Sửa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  quickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tokenNoticeCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  tokenNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tokenNoticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  tokenNoticeItem: {
    gap: 6,
  },
  tokenNoticeText: {
    fontSize: 11,
    lineHeight: 15,
  },
  tokenNoticeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  tokenActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tokenActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  durationCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  durationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  durationBadge: {
    fontSize: 10,
    fontWeight: '700',
  },
  durationTrack: {
    height: 4,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  durationProgress: {
    height: '100%',
    borderRadius: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  modalTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  subHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  synopsisText: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  genreChip: {
    backgroundColor: 'rgba(229, 9, 20, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(229, 9, 20, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  genreChipText: {
    color: '#E50914',
    fontSize: 10,
    fontWeight: '700',
  },
  policyBox: {
    padding: 10,
    borderRadius: 8,
    gap: 4,
    marginBottom: 6,
  },
  policyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
  },
  policyDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  policyMeta: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
  },
  milestoneItem: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 6,
  },
  milestoneTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  milestoneSub: {
    fontSize: 10,
    marginTop: 2,
  },
  modalCloseBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    textAlignVertical: 'top',
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
