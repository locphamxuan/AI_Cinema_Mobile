import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../../styles/components/chat/ChatModal.styles';

/** The pink projector glow behind the chat header: the chat belongs to the same screening room as the app. */
export const ChatGlow: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <LinearGradient
    pointerEvents="none"
    colors={[isDark ? 'rgba(255,61,127,0.28)' : 'rgba(255,61,127,0.16)', 'rgba(139,108,255,0.08)', 'transparent']}
    start={{ x: 0, y: 0 }}
    end={{ x: 0.6, y: 1 }}
    style={styles.sheetGlow}
  />
);
