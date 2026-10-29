import { StyleSheet } from 'react-native';
import { fonts, textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10, gap: 14 },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34 },
  sub: { ...textStyle.label, fontSize: 14, lineHeight: 20, marginTop: -6 },
  loading: { marginVertical: 24 },
  days: { flexDirection: 'row', gap: 5 },
  day: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, gap: 6 },
  dayLabel: { ...textStyle.caption, fontSize: 11, lineHeight: 14 },
  reward: { fontFamily: fonts.display, fontSize: 16, lineHeight: 18 },
  done: { borderRadius: 12, padding: 12, gap: 2 },
  doneTitle: { ...textStyle.bodyStrong },
  doneText: { ...textStyle.label },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  error: { ...textStyle.label, flex: 1 },
  retry: { ...textStyle.labelStrong },
  footnote: { ...textStyle.caption, textAlign: 'center' },
});
