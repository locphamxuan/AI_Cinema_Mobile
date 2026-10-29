import { StyleSheet } from 'react-native';
import { GRID_GAP as GAP, GRID_SIDE as SIDE } from '../../layout';
import { textStyle, fonts } from '../../../theme';

export const styles = StyleSheet.create({
  container: { flex: 1 },
  // Room for the floating tab bar.
  scroll: { paddingBottom: 120, maxWidth: 600, width: '100%', alignSelf: 'center' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: SIDE },
  crumb: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start' },
  crumbText: { ...textStyle.label },
  genreHead: { flexDirection: 'row', alignItems: 'baseline', gap: 10, paddingHorizontal: SIDE, marginTop: 4, marginBottom: 16 },
  genreName: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34 },
  genreCount: { ...textStyle.label },
  list: { paddingHorizontal: SIDE, gap: 20 },
  empty: { ...textStyle.label, textAlign: 'center', marginTop: 48, paddingHorizontal: 32 },
});
