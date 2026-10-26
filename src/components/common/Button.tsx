import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/common/Button.styles';

type Variant = 'primary' | 'secondary' | 'quiet';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Pink for the one thing a screen is for, grey for the rest, plain text for "not now". */
export const Button: React.FC<ButtonProps> = ({ label, onPress, variant = 'primary', icon, loading, disabled, style, accessibilityLabel }) => {
  const { colors } = useTheme();
  const tone = {
    primary: { bg: colors.ruby, fg: colors.white },
    secondary: { bg: colors.cardAlt, fg: colors.text },
    quiet: { bg: 'transparent', fg: colors.textSecondary },
  }[variant];
  const off = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(off), busy: Boolean(loading) }}
      style={[styles.base, { backgroundColor: tone.bg, opacity: disabled && !loading ? 0.45 : 1 }, style]}
    >
      {loading ? (
        <ActivityIndicator color={tone.fg} />
      ) : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={tone.fg} /> : null}
          <Text style={[styles.label, { color: tone.fg }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
