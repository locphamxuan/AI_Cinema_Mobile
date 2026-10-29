import { StyleSheet } from 'react-native';
import { fonts } from '../../../theme';

export const styles = StyleSheet.create({
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 36 },
  seekBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  playBtn: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingBottom: 6, paddingTop: 4, backgroundColor: 'rgba(0,0,0,0.45)' },
  time: { color: '#FFFFFF', fontFamily: fonts.medium, fontSize: 12, fontVariant: ['tabular-nums'] },
  barTouch: { flex: 1, height: 22, justifyContent: 'center' },
  track: { height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#FF3D7F' },
  iconBtn: { padding: 4, flexDirection: 'row', alignItems: 'center', gap: 2 },
  rateTag: { color: '#FF3D7F', fontFamily: fonts.bold, fontSize: 11 },
});
