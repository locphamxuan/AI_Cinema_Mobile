import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginTop: 24, gap: 12 },
  title: { ...textStyle.labelStrong, fontSize: 14 },
  info: { ...textStyle.label },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  chipText: { ...textStyle.labelStrong },
});
