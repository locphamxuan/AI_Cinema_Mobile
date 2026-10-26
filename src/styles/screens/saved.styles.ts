import { StyleSheet } from 'react-native';
import { textStyle } from '../../theme';

export const styles = StyleSheet.create({
  content: { paddingBottom: 40, flexGrow: 1 },
  loading: { marginTop: 40 },
  empty: { ...textStyle.label, textAlign: 'center', marginTop: 40, paddingHorizontal: 32, lineHeight: 20 },
  action: { alignSelf: 'center', marginTop: 16, minWidth: 180 },
});
