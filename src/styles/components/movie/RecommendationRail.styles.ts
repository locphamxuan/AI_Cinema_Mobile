import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  section: { marginTop: 20 },
  heading: { ...textStyle.title, marginBottom: 4, paddingHorizontal: 16 },
  caption: { ...textStyle.caption, marginBottom: 10, paddingHorizontal: 16 },
  row: { paddingHorizontal: 16, gap: 12 },
  card: { width: 120 },
  poster: { width: 120, height: 170, borderRadius: 10 },
  title: { ...textStyle.labelStrong, marginTop: 6 },
  reason: { ...textStyle.caption, fontSize: 11, lineHeight: 15, marginTop: 2 },
});
