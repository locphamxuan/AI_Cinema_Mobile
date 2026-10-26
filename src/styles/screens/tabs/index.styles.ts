import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  tint: { position: 'absolute', top: 0, left: 0, right: 0 },
  // Room for the floating tab bar.
  scrollContent: { paddingTop: 4, paddingBottom: 120 },
  moreRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 24 },
  moreBtn: { flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  moreText: { ...textStyle.bodyStrong },
  genreScroll: { flexGrow: 0 },
  genreRow: { paddingHorizontal: 16, paddingBottom: 14, gap: 6 },
  genrePill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  genreOn: { ...textStyle.bodyStrong },
  genreOff: { ...textStyle.body },
  empty: { ...textStyle.label, textAlign: 'center', marginTop: 48, paddingHorizontal: 32 },
});
