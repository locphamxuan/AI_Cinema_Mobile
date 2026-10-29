import { StyleSheet } from 'react-native';
import { fonts, textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, gap: 20, maxWidth: 600, alignSelf: 'center', width: '100%' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rank: { fontFamily: fonts.displayHeavy, fontSize: 40, lineHeight: 44, width: 34, textAlign: 'center', marginTop: -2 },
  poster: { width: 84, height: 116, borderRadius: 6, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  info: { flex: 1, gap: 8, paddingTop: 2 },
  title: { ...textStyle.subtitle, fontSize: 16 },
  views: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewsText: { ...textStyle.captionStrong },
  tag: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 7, paddingVertical: 3 },
  tagText: { ...textStyle.captionStrong },
  synopsis: { ...textStyle.label, lineHeight: 19 },
});
