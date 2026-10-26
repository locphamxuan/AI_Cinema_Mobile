import { StyleSheet } from 'react-native';
import { GRID_SIDE as SIDE, GRID_GAP as GAP } from '../../layout';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SIDE,
    columnGap: GAP,
    rowGap: 20,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  poster: { borderRadius: 6, overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomRightRadius: 6,
  },
  badgeText: { ...textStyle.captionStrong, color: '#FFFFFF' },
  title: { ...textStyle.labelStrong, fontSize: 14, marginTop: 8 },
  tags: { flexDirection: 'row', gap: 5, marginTop: 6, overflow: 'hidden' },
  tag: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 3, maxWidth: '100%', flexShrink: 1 },
  tagText: { ...textStyle.caption, lineHeight: 15 },
});
