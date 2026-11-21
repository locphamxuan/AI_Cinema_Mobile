import { Text, TouchableOpacity, View } from 'react-native';
import type { SubtitleTrack } from '../../types/movie';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/movie/SubtitleChips.styles';

const LANGUAGE_NAME: Record<string, string> = { vi: 'Tiếng Việt', en: 'English', zh: '中文', ko: '한국어', ja: '日本語' };

export const languageName = (code: string) => LANGUAGE_NAME[code] ?? code;

/** The subtitle track that plays: none when the member turned subtitles off, else the one chosen, the default, or the first. */
export function trackFor(subtitlesOn: boolean, tracks: SubtitleTrack[], chosen: string | null): string | null {
  if (!subtitlesOn || tracks.length === 0) return null;
  return tracks.find((t) => t.id === chosen)?.id ?? tracks.find((t) => t.isDefault)?.id ?? tracks[0].id;
}

interface SubtitleChipsProps {
  /** Tracks of the episode on screen; empty when it has none. */
  tracks: SubtitleTrack[];
  /** The track playing, or null when subtitles are off. */
  trackId: string | null;
  /** A track id, or null to turn subtitles off. */
  onChange: (trackId: string | null) => void;
}

/** The subtitle languages of the episode and "Tắt"; the film always plays its own audio. */
export function SubtitleChips({ tracks, trackId, onChange }: SubtitleChipsProps) {
  const { colors } = useTheme();
  const chip = (key: string, label: string, on: boolean, value: string | null) => (
    <TouchableOpacity
      key={key}
      style={[styles.chip, { backgroundColor: on ? colors.rubySoft : colors.card }]}
      onPress={() => onChange(value)}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
    >
      <Text style={[styles.chipText, { color: on ? colors.ruby : colors.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.text }]}>Phụ đề</Text>
      {tracks.length === 0 ? (
        <Text style={[styles.info, { color: colors.textMuted }]}>Tập này chưa có phụ đề.</Text>
      ) : (
        <View style={styles.chips}>
          {tracks.map((t) => chip(t.id, t.label, trackId === t.id, t.id))}
          {chip('off', 'Tắt', trackId === null, null)}
        </View>
      )}
    </View>
  );
}
