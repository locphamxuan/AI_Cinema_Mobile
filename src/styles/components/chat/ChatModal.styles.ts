import { StyleSheet } from 'react-native';
import { fonts, textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerText: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.displayHeavy, fontSize: 26, lineHeight: 30 },
  status: { ...textStyle.caption },
  messages: { flex: 1 },
  messageContent: { gap: 8, paddingVertical: 12 },
  empty: { ...textStyle.label, textAlign: 'center', marginTop: 24, paddingHorizontal: 24 },
  system: { ...textStyle.caption, textAlign: 'center', marginVertical: 4 },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '80%', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  bubbleText: { ...textStyle.body, fontSize: 14, lineHeight: 20 },
  chipsBar: { flexGrow: 0 },
  chips: { gap: 6, paddingVertical: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  chipText: { ...textStyle.label },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingLeft: 16, paddingRight: 5, gap: 8 },
  input: { ...textStyle.body, flex: 1, height: 46 },
  send: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
