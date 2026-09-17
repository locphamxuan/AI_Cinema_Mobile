import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Scene } from '../../types/production';
import { useTheme } from '../../theme';

interface SceneCardProps {
  scene: Scene;
  isCreator: boolean;
  isReviewer?: boolean;
  onGenerate: () => void;
  isGenerating?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  onApproveScene?: () => void;
  onRequestChangesScene?: () => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  isCreator,
  isReviewer,
  onGenerate,
  isGenerating,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  onApproveScene,
  onRequestChangesScene,
}) => {
  const { colors, isDark } = useTheme();

  const isCompleted = scene.status === 'completed';
  const isRendering = scene.status === 'rendering';
  const isSceneApproved = scene.reviewStatus === 'approved';
  const isSceneChangesReq = scene.reviewStatus === 'changes_requested';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isSceneApproved
            ? '#10B981'
            : isSceneChangesReq
            ? '#EF4444'
            : colors.border,
        },
      ]}
    >
      {/* Top row: Reorder controls + Scene number & Token cost + Review status */}
      <View style={styles.header}>
        {/* Reorder Buttons (▲/▼) for Creator */}
        {isCreator && (
          <View style={styles.reorderContainer}>
            <TouchableOpacity
              disabled={!canMoveUp}
              onPress={onMoveUp}
              style={[styles.reorderBtn, { opacity: canMoveUp ? 1 : 0.3 }]}
            >
              <Ionicons name="caret-up" size={12} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!canMoveDown}
              onPress={onMoveDown}
              style={[styles.reorderBtn, { opacity: canMoveDown ? 1 : 0.3 }]}
            >
              <Ionicons name="caret-down" size={12} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sceneBadge}>
          <Text style={styles.sceneBadgeText}>#{scene.sceneNumber}</Text>
        </View>

        <Text style={[styles.sceneTitle, { color: colors.text }]} numberOfLines={1}>
          {scene.title}
        </Text>

        {/* Review Status Badge */}
        {isSceneApproved ? (
          <View style={styles.approvedBadge}>
            <Ionicons name="checkmark-circle" size={11} color="#10B981" />
            <Text style={styles.approvedBadgeText}>Đã Duyệt</Text>
          </View>
        ) : isSceneChangesReq ? (
          <View style={styles.rejectedBadge}>
            <Ionicons name="alert-circle" size={11} color="#EF4444" />
            <Text style={styles.rejectedBadgeText}>Cần Sửa</Text>
          </View>
        ) : (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>Chờ Duyệt</Text>
          </View>
        )}

        <View style={styles.tokenBadge}>
          <FontAwesome5 name="bolt" size={10} color="#F59E0B" />
          <Text style={styles.tokenText}>{scene.tokenCost}</Text>
        </View>
      </View>

      {/* Reviewer Feedback Callout if Changes Requested */}
      {isSceneChangesReq && scene.reviewFeedback && (
        <View
          style={[
            styles.sceneFeedbackBox,
            { backgroundColor: isDark ? '#2E1515' : '#FEF2F2', borderColor: '#EF4444' },
          ]}
        >
          <Ionicons name="chatbubble-ellipses" size={14} color="#EF4444" />
          <View style={{ flex: 1 }}>
            <Text style={styles.sceneFeedbackTitle}>Yêu cầu từ Reviewer:</Text>
            <Text style={[styles.sceneFeedbackText, { color: colors.text }]}>
              {scene.reviewFeedback}
            </Text>
          </View>
        </View>
      )}

      {/* Visual Prompt */}
      <View style={styles.promptBox}>
        <Text style={[styles.promptLabel, { color: colors.textMuted }]}>Visual Prompt:</Text>
        <Text style={[styles.promptText, { color: colors.textSecondary }]} numberOfLines={2}>
          {scene.prompt}
        </Text>
      </View>

      {/* Audio / Dialogue */}
      {scene.dialogue && (
        <View style={styles.promptBox}>
          <Text style={[styles.promptLabel, { color: colors.textMuted }]}>Thoại & Lồng tiếng:</Text>
          <Text style={[styles.dialogueText, { color: colors.text }]} numberOfLines={2}>
            {scene.dialogue}
          </Text>
        </View>
      )}

      {/* Preview or Render Progress */}
      {isCompleted && scene.thumbnailUrl ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: scene.thumbnailUrl }} style={styles.previewImage} />
          <View style={styles.statusCompletedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
            <Text style={styles.statusCompletedText}>Render Hoàn Tất • {scene.durationSec}s</Text>
          </View>
        </View>
      ) : isRendering ? (
        <View style={[styles.renderingBox, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
          <ActivityIndicator size="small" color={colors.ruby} />
          <Text style={[styles.renderingText, { color: colors.text }]}>
            Đang sinh video AI CinemaGen... ({scene.progress}%)
          </Text>
        </View>
      ) : null}

      {/* Action CTA for Creator */}
      {isCreator && !isCompleted && !isRendering && (
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.generateBtn, { backgroundColor: colors.ruby }]}
          onPress={onGenerate}
          disabled={isGenerating}
        >
          <Ionicons name="videocam" size={16} color="#FFFFFF" />
          <Text style={styles.generateBtnText}>Sinh Clip AI ({scene.tokenCost} Tokens)</Text>
        </TouchableOpacity>
      )}

      {/* Action Buttons for Reviewer */}
      {isReviewer && (
        <View style={styles.reviewerSceneActions}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.sceneReviewBtn,
              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: colors.border },
            ]}
            onPress={onRequestChangesScene}
          >
            <Ionicons name="chatbox" size={13} color="#F59E0B" />
            <Text style={[styles.sceneReviewBtnText, { color: colors.text }]}>Góp Ý / Sửa</Text>
          </TouchableOpacity>

          {!isSceneApproved ? (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.sceneReviewBtn, { backgroundColor: '#10B981', borderColor: '#10B981' }]}
              onPress={onApproveScene}
            >
              <Ionicons name="checkmark" size={13} color="#FFFFFF" />
              <Text style={[styles.sceneReviewBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                Duyệt Cảnh
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.approvedCheckTag}>
              <Ionicons name="checkmark-done" size={14} color="#10B981" />
              <Text style={styles.approvedCheckText}>Đã Nghiệm Thu</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sceneBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sceneBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  sceneTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tokenText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  promptBox: {
    gap: 2,
  },
  promptLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  promptText: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  dialogueText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
  previewContainer: {
    position: 'relative',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  statusCompletedBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusCompletedText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '700',
  },
  renderingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  renderingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    gap: 6,
    marginTop: 4,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  reorderContainer: {
    flexDirection: 'column',
    gap: 1,
    marginRight: 2,
  },
  reorderBtn: {
    padding: 2,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  approvedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
  rejectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  rejectedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#EF4444',
  },
  pendingBadge: {
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748B',
  },
  sceneFeedbackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sceneFeedbackTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 2,
  },
  sceneFeedbackText: {
    fontSize: 11,
    lineHeight: 15,
  },
  reviewerSceneActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
  },
  sceneReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  sceneReviewBtnText: {
    fontSize: 11,
  },
  approvedCheckTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  approvedCheckText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
});
