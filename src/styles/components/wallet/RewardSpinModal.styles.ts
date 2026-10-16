import { StyleSheet } from 'react-native';
import { fonts, textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10, gap: 14 },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34 },
  loading: { marginVertical: 30 },
  wheel: { alignSelf: 'center', width: 128, height: 128, borderRadius: 64, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  note: { ...textStyle.label, textAlign: 'center' },
  prizes: { gap: 8 },
  prizesTitle: { ...textStyle.labelStrong },
  prizeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  prize: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  prizeText: { ...textStyle.label },
  won: { borderRadius: 12, padding: 12, gap: 2 },
  wonTitle: { ...textStyle.bodyStrong },
  wonText: { ...textStyle.label },
  errorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  error: { ...textStyle.label, flex: 1 },
  retry: { ...textStyle.labelStrong },
  footnote: { ...textStyle.caption, textAlign: 'center' },
});
