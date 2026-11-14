import React, { useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, useTheme } from '../../theme';
import { useUiStore } from '../../store';
import { AiOrb } from './AiOrb';

const BUTTON_SIZE = 58;
const EDGE_MARGIN = 12;

function clamp(value: number, min: number, max: number): number {
  if (max <= min) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Draggable floating Smart Assistant orb (supports dragging up, down, left, right on Mobile & Web).
 * Tapping without dragging opens ChatModal immediately.
 */
export const FloatingAiButton: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { isChatModalOpen, isAuthModalOpen, setChatModalOpen } = useUiStore();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const bounds = useMemo(() => {
    const minX = EDGE_MARGIN;
    const maxX = Math.max(minX, width - BUTTON_SIZE - EDGE_MARGIN);
    const minY = Math.max(insets.top + 8, EDGE_MARGIN);
    const maxY = Math.max(minY, height - BUTTON_SIZE - insets.bottom - (Platform.OS === 'web' ? 16 : 92));
    return { minX, maxX, minY, maxY };
  }, [width, height, insets.top, insets.bottom]);

  const [draggedPos, setDraggedPos] = useState<{ x: number; y: number } | null>(null);
  const [gestureStart, setGestureStart] = useState<{
    pageX: number;
    pageY: number;
    startX: number;
    startY: number;
  } | null>(null);

  const rawPos = draggedPos ?? { x: bounds.maxX - 4, y: bounds.maxY - 6 };
  const pos = {
    x: clamp(rawPos.x, bounds.minX, bounds.maxX),
    y: clamp(rawPos.y, bounds.minY, bounds.maxY),
  };

  const handleGrant = (e: GestureResponderEvent) => {
    setGestureStart({
      pageX: e.nativeEvent.pageX,
      pageY: e.nativeEvent.pageY,
      startX: pos.x,
      startY: pos.y,
    });
  };

  const handleMove = (e: GestureResponderEvent) => {
    if (!gestureStart) return;
    const dx = e.nativeEvent.pageX - gestureStart.pageX;
    const dy = e.nativeEvent.pageY - gestureStart.pageY;
    setDraggedPos({
      x: clamp(gestureStart.startX + dx, bounds.minX, bounds.maxX),
      y: clamp(gestureStart.startY + dy, bounds.minY, bounds.maxY),
    });
  };

  const handleRelease = (e: GestureResponderEvent) => {
    if (gestureStart) {
      const dx = e.nativeEvent.pageX - gestureStart.pageX;
      const dy = e.nativeEvent.pageY - gestureStart.pageY;
      if (Math.hypot(dx, dy) < 6) {
        setChatModalOpen(true);
      }
    } else {
      setChatModalOpen(true);
    }
    setGestureStart(null);
  };

  if (isChatModalOpen || isAuthModalOpen) return null;

  return (
    <View
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      onResponderRelease={handleRelease}
      onResponderTerminate={() => setGestureStart(null)}
      accessibilityRole="button"
      accessibilityLabel="Mở Trợ lý AI (kéo để di chuyển)"
      style={[
        styles.fab,
        {
          left: pos.x,
          top: pos.y,
          backgroundColor: isDark ? colors.surface : '#FFFFFF',
          borderColor: 'rgba(236, 72, 153, 0.5)',
        },
      ]}
    >
      <AiOrb size="md" />
      <View style={[styles.badge, { backgroundColor: colors.ruby }]}>
        <Text style={styles.badgeText}>AI</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    zIndex: 50,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EC4899',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  badge: {
    position: 'absolute',
    bottom: -3,
    right: -2,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 9,
    lineHeight: 11,
  },
});
