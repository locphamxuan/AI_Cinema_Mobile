import { StyleSheet } from 'react-native';
import { textStyle, fonts } from '../../../theme';

export const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10, gap: 12 },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 4 },
  kicker: { ...textStyle.labelStrong },
  episodeName: { ...textStyle.title, marginTop: -6 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontFamily: fonts.displayHeavy, fontSize: 48, lineHeight: 52 },
  priceUnit: { ...textStyle.title },
  breakdown: { borderRadius: 14, padding: 14, gap: 10 },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  lineLabel: { ...textStyle.label, fontSize: 14 },
  lineValue: { ...textStyle.bodyStrong, fontSize: 14 },
  rule: { height: StyleSheet.hairlineWidth },
  rulesNote: { ...textStyle.caption, marginTop: -4 },
  error: { ...textStyle.label },
  planLink: { alignItems: 'center', paddingVertical: 8 },
  planText: { ...textStyle.labelStrong, textDecorationLine: 'underline' },
});
