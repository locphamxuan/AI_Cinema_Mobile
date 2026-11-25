import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../theme';
import { historyMeta, watchProgress } from '../../lib/watchHistory';
import type { WatchHistoryEntry } from '../../types/playback';
import { styles } from '../../styles/screens/tabs/history.styles';

interface Props {
  item: WatchHistoryEntry;
  /** The film's poster from the catalog, when the row has no thumbnail of its own. */
  poster?: string;
  onOpen: (item: WatchHistoryEntry) => void;
}

/** One episode of "Lịch sử xem": the film, the episode once, where the member stopped and how far along. */
export function HistoryCard({ item, poster, onOpen }: Props) {
  const { colors } = useTheme();
  const progress = watchProgress(item);
  const percent = Math.round(progress.ratio * 100);
  const image = item.thumbnailUrl || poster;
  return (
    <TouchableOpacity
      testID={`history-card-${item.episodeId}`}
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }, !item.available && styles.unavailable]}
      onPress={() => onOpen(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.movieTitle}, tập ${item.episodeNumber}`}
      accessibilityState={{ disabled: !item.available }}
      disabled={!item.available}
    >
      {image ? (
        <Image source={{ uri: image }} style={[styles.thumb, { backgroundColor: colors.cardAlt }]} />
      ) : (
        <View style={[styles.thumb, { backgroundColor: colors.cardAlt }]} />
      )}
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {item.movieTitle}
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]} numberOfLines={1}>
          {historyMeta(item)}
        </Text>
        {item.available && (
          <View style={styles.progress}>
            <View style={[styles.track, { backgroundColor: colors.border }]}>
              {progress.ratio > 0 && <View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.ruby }]} />}
            </View>
            <Text style={[styles.percent, { color: colors.textMuted }]}>{percent}%</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
