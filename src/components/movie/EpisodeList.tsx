import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { episodeLabel } from '../../lib/episodeLabel';
import type { Episode } from '../../types/movie';
import { textStyle, useTheme } from '../../theme';

interface EpisodeListProps {
  episodes: Episode[];
  currentId?: string | null;
  isVIPMode: boolean;
  /** Fallback picture when an episode has no thumbnail of its own. */
  posterUrl?: string;
  onSelect: (episode: Episode) => void;
}

/** What a row says under the episode title: its length, then free / price / maintenance. */
function episodeMeta(ep: Episode, locked: boolean): string {
  const parts = [ep.duration];
  if (ep.availability === 'UNDER_REVISION') parts.push('đang sửa');
  else if (ep.isFree) parts.push('miễn phí');
  else if (locked) parts.push(`${ep.price} Coin`);
  return parts.filter(Boolean).join(', ');
}

/** Episodes as rows, each with its thumbnail, length and price. */
export function EpisodeList({ episodes, currentId, isVIPMode, posterUrl, onSelect }: EpisodeListProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: colors.text }]}>
        {episodes.length > 0 ? `${episodes.length} tập` : 'Tập phim'}
      </Text>

      <View style={styles.rows}>
        {episodes.map((ep) => {
          const isCurrent = ep.id === currentId;
          const underRevision = ep.availability === 'UNDER_REVISION';
          // A hint only: the BE decides when the episode is opened.
          const locked = !isVIPMode && !ep.isFree && !ep.isUnlocked;
          const name = episodeLabel(ep, episodes);
          const label = `${name}${locked ? `, ${ep.price} Coin` : ''}${underRevision ? ', đang sửa' : ''}`;
          const picture = ep.thumbnailUrl || posterUrl;
          const named = ep.title && ep.title !== `Tập ${ep.episodeNumber}`;
          const whole = name !== `Tập ${ep.episodeNumber}`;

          return (
            <TouchableOpacity
              key={ep.id}
              style={[styles.row, { backgroundColor: colors.card, borderColor: isCurrent ? colors.ruby : 'transparent' }]}
              onPress={() => onSelect(ep)}
              activeOpacity={0.8}
              accessibilityLabel={label}
            >
              {picture ? (
                <Image source={{ uri: picture }} style={[styles.thumb, { backgroundColor: colors.cardAlt }]} testID="episode-thumbnail" />
              ) : (
                <View style={[styles.thumb, { backgroundColor: colors.cardAlt }]} />
              )}
              <View style={styles.rowBody}>
                <Text style={[styles.rowTitle, { color: isCurrent ? colors.ruby : colors.text }]} numberOfLines={1}>
                  {whole ? (named ? `${name}: ${ep.title}` : name) : named ? `${ep.episodeNumber}. ${ep.title}` : name}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.textMuted }]}>{episodeMeta(ep, locked)}</Text>
              </View>
              {locked && <Ionicons name="lock-closed" size={15} color={colors.coin} />}
              {underRevision && <Ionicons name="construct-outline" size={15} color={colors.textMuted} />}
            </TouchableOpacity>
          );
        })}
      </View>
      {episodes.length === 0 && (
        <Text style={[styles.empty, { color: colors.textMuted }]}>Phim chưa phát hành tập nào.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, marginTop: 28, gap: 14 },
  heading: { ...textStyle.title },
  rows: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8, borderRadius: 12, borderWidth: 1.5 },
  thumb: { width: 104, height: 58, borderRadius: 6 },
  rowBody: { flex: 1, gap: 2 },
  rowTitle: { ...textStyle.labelStrong, fontSize: 14 },
  rowMeta: { ...textStyle.caption },
  empty: { ...textStyle.label },
});
