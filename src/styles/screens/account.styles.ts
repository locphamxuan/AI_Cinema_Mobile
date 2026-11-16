import { StyleSheet } from 'react-native';
import { textStyle } from '../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 48 },
  body: { paddingHorizontal: 16, gap: 16, maxWidth: 600, width: '100%', alignSelf: 'center' },
  card: { borderRadius: 16, padding: 16, gap: 14 },
  cardTitle: { ...textStyle.title },
  cardNote: { ...textStyle.caption, marginTop: -8 },
  emailLabel: { ...textStyle.labelStrong },
  email: { ...textStyle.body },
  action: { marginTop: 2 },
  guest: { textAlign: 'center', marginTop: 32 },
});
