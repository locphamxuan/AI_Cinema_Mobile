import React from 'react';
import { Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DEFAULT_AI_LABEL } from './AIComplianceModal';
import { styles } from '../../styles/components/player/EpisodePlayer.styles';

/**
 * BR-10 (Điều 44 Luật 134/2025/QH15, Điều 18 NĐ 142/2026/NĐ-CP): the AI label on every picture the viewer sees,
 * poster, video, ads and fullscreen. Render it as the LAST child of the stage so no overlay can cover it.
 */
export function AiLabelOverlay({ text }: { text?: string | null }) {
  return (
    <View style={styles.aiBadge} pointerEvents="none" testID="ai-label-overlay">
      <MaterialCommunityIcons name="robot-outline" size={12} color="#FF3D7F" />
      <Text style={styles.aiBadgeText} numberOfLines={1}>
        {text || DEFAULT_AI_LABEL}
      </Text>
    </View>
  );
}
