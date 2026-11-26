import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  // Height, width and the bottom inset come from `sheetFrame` (screen size + safe area); the list scrolls inside.
  sheet: { alignSelf: 'center', borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: 20, paddingTop: 10 },
  list: { flexGrow: 0, flexShrink: 1 },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 8 },
  heading: { ...textStyle.labelStrong, marginTop: 14, marginBottom: 2 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  optionText: { ...textStyle.body },
  note: { ...textStyle.label, paddingVertical: 6 },
  rates: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 8 },
  rate: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  rateText: { ...textStyle.labelStrong },
});
