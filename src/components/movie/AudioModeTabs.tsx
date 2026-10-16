
import { Text, TouchableOpacity, View } from 'react-native';
import type { SubtitleTrack } from '../../types/movie';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/movie/AudioModeTabs.styles';

/** Phụ đề = the film's audio with subtitles; Thuyết minh = the film's own audio, no subtitles. */
export type AudioMode = 'subtitle' | 'voiceover';

const LANGUAGE_NAME: Record<string, string> = { vi: 'Tiếng Việt', en: 'English', zh: '中文', ko: '한국어', ja: '日本語' };

export const languageName = (code: string) => LANGUAGE_NAME[code] ?? code;

/** The track a mode plays: none for Thuyết minh, else the one chosen, the default, or the first. */
export function trackFor(mode: AudioMode, tracks: SubtitleTrack[], chosen: string | null): string | null {
  if (mode === 'voiceover' || tracks.length === 0) return null;
  return tracks.find((t) => t.id === chosen)?.id ?? tracks.find((t) => t.isDefault)?.id ?? tracks[0].id;
}

interface AudioModeTabsProps {
  mode: AudioMode;
  onModeChange: (mode: AudioMode) => void;
  /** Tracks of the episode on screen; empty when it has none. */
  tracks: SubtitleTrack[];
  trackId: string | null;
  onTrackChange: (trackId: string) => void;
  language: string;
}

/** A two-way switch between subtitles and the film's own audio, then the subtitle languages. */
export function AudioModeTabs({ mode, onModeChange, tracks, trackId, onTrackChange, language }: AudioModeTabsProps) {
  const { colors } = useTheme();
  const option = (key: AudioMode, label: string) => {
    const on = mode === key;
    return (
      <TouchableOpacity
        style={[styles.option, on && { backgroundColor: colors.background }]}
        onPress={() => onModeChange(key)}
        accessibilityRole="tab"
        accessibilityState={{ selected: on }}
      >
        <Text style={[styles.optionText, { color: on ? colors.text : colors.textMuted }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={[styles.switch, { backgroundColor: colors.card }]}>
        {option('subtitle', 'Phụ đề')}
        {option('voiceover', 'Thuyết minh')}
      </View>
      {mode === 'voiceover' ? (
        <Text style={[styles.info, { color: colors.textMuted }]}>Phát âm thanh gốc ({languageName(language)}), không có phụ đề.</Text>
      ) : tracks.length === 0 ? (
        <Text style={[styles.info, { color: colors.textMuted }]}>
          Tập này chưa có phụ đề, nên sẽ phát âm thanh gốc ({languageName(language)}).
        </Text>
      ) : (
        <View style={styles.chips}>
          {tracks.map((t) => {
            const on = trackId === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.chip, { backgroundColor: on ? colors.rubySoft : colors.card }]}
                onPress={() => onTrackChange(t.id)}
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.chipText, { color: on ? colors.ruby : colors.textSecondary }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}
