import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

/** Colours come from the theme at render time (light and dark), never from here. */
export const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24, gap: 10, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  unavailable: { opacity: 0.7 },
  thumb: { width: 88, height: 50, borderRadius: 8 },
  info: { flex: 1, minWidth: 0, gap: 4 },
  title: { ...textStyle.bodyStrong, fontSize: 14 },
  sub: { ...textStyle.label, fontSize: 12 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  percent: { ...textStyle.caption, fontSize: 11, minWidth: 32, textAlign: 'right' },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24, gap: 12 },
  emptyText: { ...textStyle.label, fontSize: 13, textAlign: 'center' },
  retry: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999 },
  retryText: { ...textStyle.bodyStrong, fontSize: 13 },
  loading: { marginTop: 24 },
});
