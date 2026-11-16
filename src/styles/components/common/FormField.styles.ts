import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  field: { gap: 6 },
  label: { ...textStyle.labelStrong },
  inputWrap: { justifyContent: 'center' },
  input: { ...textStyle.body, height: 48, borderRadius: 12, paddingHorizontal: 14, borderWidth: 1 },
  withEye: { paddingRight: 48 },
  eye: { position: 'absolute', right: 14 },
  hint: { ...textStyle.caption },
  error: { ...textStyle.caption },
  readOnly: { ...textStyle.body, paddingVertical: 4 },
});
