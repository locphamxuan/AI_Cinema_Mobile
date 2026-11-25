import { StyleSheet } from 'react-native';
import { fonts } from '../../../theme';

/** Fixed parts of the lucky wheel; sizes that follow the wheel's width are set inline. */
export const styles = StyleSheet.create({
  root: { alignSelf: 'center', alignItems: 'center' },
  rim: { alignItems: 'center', justifyContent: 'center' },
  bulb: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
  disc: { overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0 },
  wedge: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    backgroundColor: 'transparent',
  },
  divider: { position: 'absolute', width: 1.5 },
  label: { position: 'absolute', justifyContent: 'center' },
  labelText: { fontFamily: fonts.bold, textAlign: 'left' },
  // Above the rim, its tip just inside the disc; 30 points wide (two 15-point borders).
  pointer: { position: 'absolute', top: 0, width: 30, alignItems: 'center', zIndex: 4, elevation: 4 },
  pointerOuter: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderTopWidth: 28,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    backgroundColor: 'transparent',
  },
  pointerInner: {
    position: 'absolute',
    top: 4,
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 17,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    backgroundColor: 'transparent',
  },
  hub: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  hubFace: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  hubText: { fontFamily: fonts.displayHeavy, fontSize: 20, letterSpacing: 1, textAlign: 'center' },
});
