import { StyleSheet } from 'react-native';
import { textStyle } from '../../../theme';

export const styles = StyleSheet.create({
  center: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  text: { ...textStyle.label, color: '#FFFFFF', textAlign: 'center' },
  button: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
  buttonText: { ...textStyle.labelStrong, color: '#FFFFFF' },
  notice: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  noticeText: { ...textStyle.label, color: '#FFFFFF' },
});
