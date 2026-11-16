import React from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { Button } from './Button';
import { styles } from '../../styles/components/common/LoadError.styles';

interface LoadErrorProps {
  /** What did not load, from the BE or the network layer (already in Vietnamese). */
  message?: string | null;
  onRetry: () => void;
  style?: StyleProp<ViewStyle>;
}

/** A list or a page that could not load: says why and offers to try again, instead of an empty screen. */
export const LoadError: React.FC<LoadErrorProps> = ({ message, onRetry, style }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.box, style]} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={28} color={colors.textMuted} />
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message || 'Chưa tải được dữ liệu. Kiểm tra mạng rồi thử lại.'}</Text>
      <Button label="Thử lại" variant="secondary" onPress={onRetry} style={styles.retry} />
    </View>
  );
};
