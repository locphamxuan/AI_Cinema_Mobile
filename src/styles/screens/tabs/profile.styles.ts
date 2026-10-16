import { StyleSheet } from 'react-native';
import { fonts, textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  // Room for the floating tab bar.
  scroll: { paddingBottom: 120, gap: 20 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: fonts.displayHeavy, fontSize: 28, lineHeight: 32 },
  identityText: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { ...textStyle.title, fontSize: 20, lineHeight: 26, flexShrink: 1 },
  sub: { ...textStyle.label },
  pass: { marginHorizontal: 16, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  passText: { flex: 1, gap: 4 },
  passTitle: { fontFamily: fonts.displayHeavy, fontSize: 26, lineHeight: 30 },
  passLine: { ...textStyle.label, opacity: 0.85 },
  passBtn: { backgroundColor: '#3D2306', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
  passBtnText: { ...textStyle.labelStrong, color: '#FFFFFF' },
  block: { gap: 12 },
  blockTitle: { ...textStyle.title, paddingHorizontal: 16 },
  blockEmpty: { ...textStyle.label, paddingHorizontal: 16 },
  historyRow: { paddingHorizontal: 16, gap: 10 },
  historyItem: { width: 92 },
  historyPoster: { width: 92, height: 126, borderRadius: 6 },
  historyTitle: { ...textStyle.label, marginTop: 6 },
  historyEp: { ...textStyle.caption },
});
