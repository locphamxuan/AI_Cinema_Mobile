import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  box: { alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingVertical: 32 },
  message: { ...textStyle.label, textAlign: 'center' },
  retry: { alignSelf: 'stretch', marginTop: 4 },
});
