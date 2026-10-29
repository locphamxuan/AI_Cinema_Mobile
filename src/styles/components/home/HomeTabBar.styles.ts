import { StyleSheet } from 'react-native';
import { fonts } from '../../../theme';

export const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 20, alignItems: 'baseline' },
  active: { fontFamily: fonts.displayHeavy, fontSize: 28, lineHeight: 32 },
  idle: { fontFamily: fonts.display, fontSize: 19, lineHeight: 24 },
});
