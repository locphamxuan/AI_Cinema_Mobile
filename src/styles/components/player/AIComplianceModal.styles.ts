import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 420, borderRadius: 18, padding: 22, gap: 12 },
  title: { ...textStyle.title, fontSize: 19 },
  body: { ...textStyle.body, fontSize: 14, lineHeight: 21 },
  facts: { borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12, gap: 10 },
  fact: { gap: 2 },
  factLabel: { ...textStyle.caption },
  factValue: { ...textStyle.bodyStrong },
  done: { marginTop: 4 },
});
