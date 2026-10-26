import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14 },
  poster: { width: 88, height: 122, borderRadius: 6, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  info: { flex: 1, gap: 6, paddingTop: 2 },
  title: { ...textStyle.subtitle, fontSize: 16 },
  genres: { ...textStyle.captionStrong },
  synopsis: { ...textStyle.label, lineHeight: 19 },
});
