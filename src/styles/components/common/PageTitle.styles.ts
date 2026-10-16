import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 12, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  title: { ...textStyle.display, fontSize: 28, lineHeight: 32 },
  note: { ...textStyle.label },
});
