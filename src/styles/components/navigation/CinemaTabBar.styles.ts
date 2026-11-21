import { StyleSheet } from 'react-native';
import { fonts } from '../../../theme';

export const TAB_BAR_HEIGHT = 64;

export const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB_BAR_HEIGHT / 2,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 6,
    elevation: 8,
    shadowColor: '#000000',
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  tab: {
    flexGrow: 1,
    flexBasis: 0,
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  label: {
    color: '#FFFFFF',
    fontFamily: fonts.bold,
    fontSize: 14,
    // Room for stacked Vietnamese marks (Hồ sơ, Khám phá): never clipped.
    lineHeight: 20,
    includeFontPadding: false,
  },
});
