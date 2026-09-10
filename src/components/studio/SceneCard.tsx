import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Scene } from '../../types/production';
import { useTheme } from '../../theme';

interface SceneCardProps {
  scene: Scene;
  isCreator: boolean;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  isCreator,
  onGenerate,
  isGenerating,
}) => {
  const { colors, isDark } = useTheme();

  const isCompleted = scene.status === 'completed';
  const isRendering = scene.status === 'rendering';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: isCompleted ? '#10B981' : colors.border,
        },
      ]}
    >
      {/* Top row: Scene number & Token cost */}
      <View style={styles.header}>
        <View style={styles.sceneBadge}>
          <Text style={styles.sceneBadgeText}>CẢNH {scene.sceneNumber}</Text>
        </View>
        <Text style={[styles.sceneTitle, { color: colors.text }]} numberOfLines={1}>
          {scene.title}
        </Text>
        <View style={styles.tokenBadge}>
          <FontAwesome5 name="bolt" size={10} color="#F59E0B" />
          <Text style={styles.tokenText}>{scene.tokenCost} Tokens</Text>
        </View>
      </View>

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
});
