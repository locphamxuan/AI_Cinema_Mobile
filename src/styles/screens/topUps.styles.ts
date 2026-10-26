import { StyleSheet } from 'react-native';
import { textStyle } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 10, maxWidth: 600, width: '100%', alignSelf: 'center' },
  loading: { marginVertical: 16 },
  empty: { ...textStyle.label, textAlign: 'center', marginTop: 40, paddingHorizontal: 32 },
  error: { ...textStyle.label, textAlign: 'center', marginBottom: 8 },
  card: { borderRadius: 14, padding: 12, gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 2 },
  coins: { ...textStyle.labelStrong, fontSize: 15 },
  meta: { ...textStyle.caption },
  status: { ...textStyle.captionStrong, borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  resume: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, marginTop: 2 },
  resumeText: { ...textStyle.labelStrong },
});
