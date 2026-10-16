import { StyleSheet } from 'react-native';
import { fonts, textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  tile: { borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end' },
  text: { padding: 12, gap: 2 },
  name: { fontFamily: fonts.displayHeavy, fontSize: 24, lineHeight: 26, color: '#FFFFFF' },
  count: { ...textStyle.caption, color: 'rgba(255, 255, 255, 0.75)' },
});
