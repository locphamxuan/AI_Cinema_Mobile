import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  back: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { ...textStyle.title, flex: 1, textAlign: 'center' },
  side: { width: 40, alignItems: 'flex-end' },
});
