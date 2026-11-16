import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 380, borderRadius: 20, padding: 20, gap: 12 },
  title: { ...textStyle.title },
  message: { ...textStyle.body },
  actions: { gap: 8, marginTop: 4 },
  actionsRow: { flexDirection: 'row' },
  action: { minHeight: 46, borderRadius: 12, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  actionInRow: { flex: 1 },
  actionLabel: { ...textStyle.button, textAlign: 'center' },
});
