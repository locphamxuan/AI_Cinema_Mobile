import { StyleSheet } from 'react-native';
import { textStyle } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingBottom: 8 },
  input: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, borderRadius: 22, paddingHorizontal: 14 },
  inputText: { ...textStyle.body, flex: 1, height: '100%' },
  content: { paddingBottom: 40 },
  note: { ...textStyle.label, textAlign: 'center', marginTop: 48, paddingHorizontal: 32 },
  block: { marginTop: 18 },
  blockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  blockTitle: { ...textStyle.title },
  clear: { ...textStyle.label },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  chip: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { ...textStyle.label },
  gridWrap: { marginTop: 14 },
});
