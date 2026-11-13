import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  memberBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  followPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  followText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
});
