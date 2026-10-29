import { StyleSheet } from 'react-native';
import { textStyle } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  tabsBar: { flexGrow: 0 },
  tabs: { paddingHorizontal: 16, gap: 6, paddingBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  tabOn: { ...textStyle.labelStrong, fontSize: 14 },
  tabOff: { ...textStyle.label, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 52 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  itemBody: { flex: 1, gap: 3 },
  itemTitle: { ...textStyle.body, fontSize: 14, lineHeight: 20 },
  itemTitleUnread: { ...textStyle.bodyStrong, fontSize: 14, lineHeight: 20 },
  itemText: { ...textStyle.label },
  itemTime: { ...textStyle.caption },
  unread: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  loading: { marginVertical: 16 },
  empty: { ...textStyle.label, textAlign: 'center', marginTop: 40, paddingHorizontal: 32 },
});
