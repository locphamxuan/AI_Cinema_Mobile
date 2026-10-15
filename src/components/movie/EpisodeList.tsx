import React from 'react';
import { Image, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Episode } from '../../types/movie';

interface EpisodeListProps {
  episodes: Episode[];
  currentId?: string | null;
  isVIPMode: boolean;
  /** Fallback picture when an episode has no thumbnail of its own. */
  posterUrl?: string;
  onSelect: (episode: Episode) => void;
}

/** Episodes as a grid of buttons, or with "Hiện ảnh" as rows with their thumbnail, length and price. */
export function EpisodeList({ episodes, currentId, isVIPMode, posterUrl, onSelect }: EpisodeListProps) {
  const [withImages, setWithImages] = React.useState(false);
  const current = episodes.find((ep) => ep.id === currentId);

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>
          Danh sách tập ({current ? `${current.episodeNumber} / ` : ''}{episodes.length})
        </Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Hiện ảnh</Text>
          <Switch
            value={withImages}
            onValueChange={setWithImages}
            accessibilityLabel="Hiện ảnh tập"
            trackColor={{ false: '#27272A', true: '#10B981' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#27272A"
          />
        </View>
      </View>

      <View style={withImages ? styles.rows : styles.grid}>
        {episodes.map((ep) => {
          const isCurrent = ep.id === currentId;
          const underRevision = ep.availability === 'UNDER_REVISION';
          // A hint only: the BE decides when the episode is opened.
          const locked = !isVIPMode && !ep.isFree && !ep.isUnlocked;
          const icon = underRevision ? 'construct' : locked ? 'lock-closed' : 'play';
          if (withImages) {
            const picture = ep.thumbnailUrl || posterUrl;
            return (
              <TouchableOpacity key={ep.id} style={[styles.row, isCurrent && styles.rowActive]} onPress={() => onSelect(ep)} activeOpacity={0.8}>
                {picture ? <Image source={{ uri: picture }} style={styles.thumb} testID="episode-thumbnail" /> : <View style={styles.thumb} />}
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    Tập {ep.episodeNumber}
                    {ep.title && ep.title !== `Tập ${ep.episodeNumber}` ? ` · ${ep.title}` : ''}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {ep.duration || '—'}
                    {ep.isFree ? ' · Miễn phí' : locked ? ` · ${ep.price} Coin` : ''}
                    {underRevision ? ' · Đang bảo trì' : ''}
                  </Text>
                </View>
                <Ionicons name={icon} size={16} color={locked ? '#F59E0B' : '#FFFFFF'} />
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity key={ep.id} style={[styles.cell, isCurrent && styles.cellActive]} activeOpacity={0.8} onPress={() => onSelect(ep)}>
              <Ionicons name={icon} size={12} color={locked ? '#F59E0B' : '#FFFFFF'} />
              <Text style={styles.cellText} numberOfLines={1}>
                Tập {ep.episodeNumber}
              </Text>
              {locked && <Text style={styles.coinTag}>{ep.price}C</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
      {episodes.length === 0 && <Text style={styles.empty}>Phim chưa có tập nào được phát hành.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, marginTop: 18, gap: 12 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heading: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '31%',
    backgroundColor: '#18181B',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#27272A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cellActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  cellText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  coinTag: { color: '#F59E0B', fontSize: 10, fontWeight: '800' },
  rows: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 10, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A' },
  rowActive: { borderColor: '#10B981' },
  thumb: { width: 96, height: 54, borderRadius: 6, backgroundColor: '#27272A' },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  rowMeta: { color: '#94A3B8', fontSize: 11 },
  empty: { color: '#94A3B8', fontSize: 12 },
});