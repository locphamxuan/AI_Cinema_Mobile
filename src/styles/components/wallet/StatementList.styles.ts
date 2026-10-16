import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  wrap: { gap: 4 },
  filterRow: { gap: 6, paddingBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  chipText: { ...textStyle.labelStrong },
  note: { ...textStyle.label, textAlign: 'center', paddingVertical: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12 },
  info: { flex: 1, gap: 2 },
  title: { ...textStyle.bodyStrong, fontSize: 14 },
  desc: { ...textStyle.caption },
  amounts: { alignItems: 'flex-end', gap: 2 },
  amount: { ...textStyle.labelStrong, fontVariant: ['tabular-nums'] },
  loading: { marginVertical: 12 },
});
