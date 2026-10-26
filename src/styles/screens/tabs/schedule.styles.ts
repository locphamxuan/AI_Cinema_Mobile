import { StyleSheet } from 'react-native';
import { fonts, textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  daysScroll: { flexGrow: 0 },
  days: { paddingHorizontal: 16, gap: 8, paddingBottom: 16 },
  day: { width: 72, paddingVertical: 10, borderRadius: 12, alignItems: 'center', gap: 2 },
  dayLabel: { fontFamily: fonts.display, fontSize: 18, lineHeight: 22 },
  dayDate: { ...textStyle.caption },
  dot: { position: 'absolute', top: 7, right: 8, width: 6, height: 6, borderRadius: 3 },
  // Room for the floating tab bar.
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 20, maxWidth: 600, width: '100%', alignSelf: 'center' },
  loading: { marginTop: 40 },
  release: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  episode: { ...textStyle.bodyStrong },
  time: { ...textStyle.label },
  empty: { ...textStyle.label, textAlign: 'center', marginTop: 40, paddingHorizontal: 24 },
});
