import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  playerPlaceholder: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  badge: { fontSize: 12, fontWeight: '600' },
  code: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  codeText: { fontSize: 24, fontWeight: '800', letterSpacing: 4 },
  meta: { fontSize: 13 },
  notice: { fontSize: 13, padding: 10, borderRadius: 10 },
  error: { fontSize: 15, textAlign: 'center' },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 22, letterSpacing: 4 },
  button: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  ghost: { backgroundColor: 'transparent', borderWidth: 1 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
