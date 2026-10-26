import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 6 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
  },
  hint: { ...textStyle.body, flex: 1 },
  gift: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  count: {
    position: 'absolute',
    top: -1,
    right: -3,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { ...textStyle.captionStrong, fontSize: 11, lineHeight: 14, color: '#FFFFFF' },
  dot: { position: 'absolute', top: 4, right: 2, width: 12, height: 12, borderRadius: 6, borderWidth: 2 },
});
