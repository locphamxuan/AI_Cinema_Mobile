import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, gap: 10, borderWidth: StyleSheet.hairlineWidth },
  label: { ...textStyle.labelStrong },
  list: { maxHeight: 260 },
  listContent: { gap: 6 },
  empty: { ...textStyle.label, textAlign: 'center', paddingVertical: 12 },
  row: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, gap: 2 },
  author: { ...textStyle.captionStrong, fontSize: 11 },
  text: { ...textStyle.body, fontSize: 14, lineHeight: 20 },
  time: { ...textStyle.caption, fontSize: 11, lineHeight: 14, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, ...textStyle.body, fontSize: 14 },
  send: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
