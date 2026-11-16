import { StyleSheet } from 'react-native';
import { fonts, textStyle } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 48, flexGrow: 1 },
  body: { paddingHorizontal: 16, gap: 10, maxWidth: 600, width: '100%', alignSelf: 'center' },
  addCard: { borderRadius: 16, padding: 16, gap: 12 },
  loading: { marginTop: 24 },
  failed: { gap: 12, marginTop: 16 },
  empty: { ...textStyle.label, textAlign: 'center', marginTop: 24, paddingHorizontal: 24 },
  section: { ...textStyle.subtitle, marginTop: 12 },
  none: { ...textStyle.label },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bold, fontSize: 16 },
  info: { flex: 1, gap: 2 },
  name: { ...textStyle.bodyStrong, fontSize: 14 },
  note: { ...textStyle.caption },
  actions: { flexDirection: 'row', gap: 8 },
  action: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  actionText: { ...textStyle.labelStrong },
});
