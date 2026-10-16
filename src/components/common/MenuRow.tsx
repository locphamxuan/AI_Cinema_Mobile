import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

interface MenuRowProps {
  icon?: keyof typeof Ionicons.glyphMap;
  label: string;
  /** Grey text before the chevron, e.g. "Tối" or "1.0.0". */
  value?: string;
  /** Small pink count bubble, e.g. unread notifications. */
  count?: number;
  danger?: boolean;
  onPress?: () => void;
  right?: React.ReactNode;
  last?: boolean;
}

/** One row of a grey menu card: outline icon, label, optional value, chevron. */
export const MenuRow: React.FC<MenuRowProps> = ({ icon, label, value, count, danger, onPress, right, last }) => {
  const { colors } = useTheme();
  const tint = danger ? colors.danger : colors.text;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
    >
      {icon ? <Ionicons name={icon} size={22} color={tint} style={styles.icon} /> : null}
      <Text style={[styles.label, { color: tint }]}>{label}</Text>
      {count ? (
        <View style={[styles.count, { backgroundColor: colors.ruby }]}>
          <Text style={styles.countText}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
      {value ? <Text style={[styles.value, { color: colors.textMuted }]}>{value}</Text> : null}
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null)}
    </TouchableOpacity>
  );
};

/** Grey rounded card that groups menu rows. */
export const MenuCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.card }]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, paddingHorizontal: 16, marginHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 17, gap: 12 },
  icon: { width: 24 },
  label: { flex: 1, fontSize: 15, fontWeight: '500' },
  value: { fontSize: 14 },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  countText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
});
