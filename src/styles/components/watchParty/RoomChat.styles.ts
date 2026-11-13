import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, gap: 10, borderWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6 },
  list: { maxHeight: 260 },
  listContent: { gap: 6 },
  empty: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  row: { flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7, gap: 2 },
  author: { fontSize: 11, fontWeight: '700' },
  text: { fontSize: 14 },
  time: { fontSize: 10, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14 },
  send: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
