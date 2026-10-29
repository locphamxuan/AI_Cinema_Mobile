import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  card: { borderRadius: 16, paddingHorizontal: 16, marginHorizontal: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 12 },
  icon: { width: 24 },
  label: { ...textStyle.body, flex: 1 },
  value: { ...textStyle.label },
  count: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  countText: { ...textStyle.captionStrong, fontSize: 11, color: '#FFFFFF' },
});
