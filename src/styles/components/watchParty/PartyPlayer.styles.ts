import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  frame: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', justifyContent: 'center' },
  video: { width: '100%', height: '100%' },
  aiBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  aiBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  controls: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 28,
  },
  followHint: { position: 'absolute', bottom: 10, alignSelf: 'center', color: '#fff', fontSize: 12, opacity: 0.8 },
});
