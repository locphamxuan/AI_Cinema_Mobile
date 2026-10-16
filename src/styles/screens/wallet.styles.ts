import { StyleSheet } from 'react-native';
import { fonts, textStyle } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingBottom: 40, gap: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
  balance: { marginHorizontal: 16, borderRadius: 18, padding: 20, gap: 16 },
  cols: { flexDirection: 'row', alignItems: 'stretch' },
  col: { flex: 1, gap: 2, paddingHorizontal: 4 },
  amount: { fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 44 },
  colLabel: { ...textStyle.labelStrong, fontSize: 14 },
  colNote: { ...textStyle.caption },
  divider: { width: StyleSheet.hairlineWidth, marginHorizontal: 12 },
  rule: { ...textStyle.caption },
  section: { ...textStyle.title, marginHorizontal: 16, marginTop: 8 },
  statement: { paddingHorizontal: 16 },
});
