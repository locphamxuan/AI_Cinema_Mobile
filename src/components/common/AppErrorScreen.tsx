import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';
import { darkColors } from '../../theme/colors';
import { styles } from '../../styles/components/common/AppErrorScreen.styles';

/**
 * Shown instead of closing the app when a screen throws while drawing (expo-router ErrorBoundary).
 * It does not use the theme context: the error may come from there, so it keeps to the dark palette.
 */
export function AppErrorScreen({ retry }: Pick<ErrorBoundaryProps, 'retry'>) {
  return (
    <View style={[styles.screen, { backgroundColor: darkColors.background }]} accessibilityRole="alert">
      <Text style={[styles.title, { color: darkColors.text }]}>Đã có lỗi xảy ra</Text>
      <Text style={[styles.message, { color: darkColors.textSecondary }]}>
        Màn hình này gặp sự cố. Bấm "Thử lại" để mở lại, dữ liệu của bạn không bị mất.
      </Text>
      <Pressable
        onPress={() => void retry()}
        accessibilityRole="button"
        accessibilityLabel="Thử lại"
        style={[styles.button, { backgroundColor: darkColors.ruby }]}
      >
        <Text style={styles.buttonText}>Thử lại</Text>
      </Pressable>
    </View>
  );
}
