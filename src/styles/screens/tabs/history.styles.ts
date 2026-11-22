import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 8, gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  thumb: { width: 88, height: 50, borderRadius: 8 },
  info: { flex: 1, gap: 2 },
  title: { ...textStyle.bodyStrong, fontSize: 14 },
  sub: { ...textStyle.label, fontSize: 12 },
  progress: { gap: 4 },
  track: { width: 70, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  percent: { ...textStyle.caption, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { ...textStyle.label, fontSize: 13 },
  loading: { marginTop: 24 },
});
