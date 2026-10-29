import { StyleSheet } from 'react-native';
import { fonts, textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 10, gap: 10 },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34 },
  label: { ...textStyle.labelStrong, marginTop: 6 },
  amountInput: { fontFamily: fonts.display, fontSize: 24, height: 56, borderRadius: 12, paddingHorizontal: 14 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  preset: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  presetText: { ...textStyle.labelStrong },
  hint: { ...textStyle.label },
  methods: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  method: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  methodName: { ...textStyle.bodyStrong },
  error: { ...textStyle.label },
  paid: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  paidTitle: { ...textStyle.title, fontSize: 20 },
  fullWidth: { alignSelf: 'stretch', marginTop: 8 },
});
