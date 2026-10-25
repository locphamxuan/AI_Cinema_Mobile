import { StyleSheet } from 'react-native';
import { fonts } from '../../../theme';

const chip = {
  position: 'absolute' as const,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 6,
  overflow: 'hidden' as const,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
};

export const styles = StyleSheet.create({
  fill: { width: '100%', height: '100%', position: 'absolute' },
  ad: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  adBadge: { ...chip, top: 10, left: 10, color: '#FCD34D', fontFamily: fonts.semibold, fontSize: 11 },
  adTitle: { position: 'absolute', left: 10, bottom: 12, maxWidth: '60%', color: 'rgba(255,255,255,0.75)', fontSize: 11 },
  adLink: { ...chip, right: 10, bottom: 8, backgroundColor: 'rgba(255,255,255,0.9)' },
  adLinkText: { color: '#0F172A', fontFamily: fonts.semibold, fontSize: 12 },
  resume: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  resumeText: { color: '#FFFFFF', fontSize: 12 },
  resumeMain: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FF3D7F' },
  resumeMainText: { color: '#FFFFFF', fontFamily: fonts.semibold, fontSize: 12 },
  resumeAlt: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)' },
});
