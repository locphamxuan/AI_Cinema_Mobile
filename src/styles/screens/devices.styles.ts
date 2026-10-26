import { StyleSheet } from 'react-native';
import { textStyle } from '../../theme';

export const styles = StyleSheet.create({
  content: { paddingBottom: 40, flexGrow: 1 },
  body: { paddingHorizontal: 16, gap: 10, maxWidth: 600, width: '100%', alignSelf: 'center' },
  loading: { marginTop: 40 },
  empty: { ...textStyle.label, textAlign: 'center', marginTop: 40, paddingHorizontal: 32 },
  summary: { flexDirection: 'row', borderRadius: 14, paddingVertical: 14 },
  divider: { width: StyleSheet.hairlineWidth },
  limit: { flex: 1, alignItems: 'center', gap: 2 },
  limitValue: { ...textStyle.subtitle, fontSize: 22, lineHeight: 28 },
  limitLabel: { ...textStyle.caption },
  hint: { ...textStyle.caption, lineHeight: 17 },
  section: { ...textStyle.labelStrong, fontSize: 15, marginTop: 12 },
  none: { ...textStyle.label },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...textStyle.labelStrong, fontSize: 14, flexShrink: 1 },
  badge: { ...textStyle.captionStrong, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  meta: { ...textStyle.caption },
  action: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  actionText: { ...textStyle.labelStrong },
});
