import { StyleSheet } from 'react-native';
import { fonts, textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20, paddingTop: 20, maxHeight: '92%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34 },
  form: { gap: 14, paddingBottom: 4 },
  saved: { borderRadius: 12, padding: 12, gap: 4 },
  savedText: { ...textStyle.label },
  savedAction: { ...textStyle.labelStrong },
  field: { gap: 6 },
  label: { ...textStyle.labelStrong },
  hint: { ...textStyle.caption },
  input: { ...textStyle.body, height: 48, borderRadius: 12, paddingHorizontal: 14 },
  passwordWrap: { justifyContent: 'center' },
  passwordInput: { paddingRight: 48 },
  eye: { position: 'absolute', right: 14 },
  optionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  check: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  box: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkLabel: { ...textStyle.label, flexShrink: 1 },
  link: { ...textStyle.label },
  error: { ...textStyle.label },
  switch: { alignItems: 'center', paddingVertical: 6 },
  switchText: { ...textStyle.label, fontSize: 14 },
});
