import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, marginTop: 28, gap: 14 },
  heading: { ...textStyle.title },
  rows: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 12, borderWidth: 1.5 },
  thumb: { width: 104, height: 58, borderRadius: 6 },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { ...textStyle.labelStrong, fontSize: 14 },
  rowMeta: { ...textStyle.caption },
  empty: { ...textStyle.label },
});
