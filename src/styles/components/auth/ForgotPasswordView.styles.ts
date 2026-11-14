import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

/** Extra styles of the forgot-password view; it shares the auth sheet's field styles. */
export const resetStyles = StyleSheet.create({
  intro: { ...textStyle.label },
  code: { letterSpacing: 6, textAlign: 'center' },
});
