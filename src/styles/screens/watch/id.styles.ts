import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  missingTitle: { ...textStyle.title },
  missingBtn: { alignSelf: 'center' },
  head: { paddingHorizontal: 16, paddingTop: 14, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -4 },
  movieTitle: { ...textStyle.title, fontSize: 19, flex: 1 },
  episodeTitle: { ...textStyle.label, fontSize: 14 },
  notice: { ...textStyle.labelStrong },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  iconBtn: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  views: { ...textStyle.label, marginLeft: 'auto' },
  about: { paddingHorizontal: 16, marginTop: 28, gap: 8 },
  aboutTitle: { ...textStyle.title },
  aboutText: { ...textStyle.body, fontSize: 14, lineHeight: 22 },
});
