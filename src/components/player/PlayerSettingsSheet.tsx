
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SubtitleTrack } from '../../types/movie';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/player/PlayerSettingsSheet.styles';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

interface PlayerSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  subtitles: SubtitleTrack[];
  /** Null = subtitles off: the original audio only (Thuyết minh). */
  subtitleTrackId: string | null;
  onSubtitleChange: (trackId: string | null) => void;
  /** Spoken language of the film, e.g. "Tiếng Việt". */
  audioLabel: string;
  rate: number;
  onRateChange: (rate: number) => void;
}

/** Player settings: subtitle language (or off), the film's own audio language, and playback speed. */
export function PlayerSettingsSheet(props: PlayerSettingsSheetProps) {
  const { visible, onClose, subtitles, subtitleTrackId, onSubtitleChange, audioLabel, rate, onRateChange } = props;
  const { colors } = useTheme();

  const option = (key: string, label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity key={key} style={styles.option} onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Text style={[styles.optionText, { color: selected ? colors.ruby : colors.text }]}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={18} color={colors.ruby} />}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} accessibilityLabel="Đóng cài đặt" />
      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />
        <ScrollView>
          <Text style={[styles.heading, { color: colors.textMuted }]}>Phụ đề</Text>
          {option('off', `Tắt, nghe âm thanh gốc (${audioLabel})`, subtitleTrackId === null, () => onSubtitleChange(null))}
          {subtitles.map((track) => option(track.id, track.label, subtitleTrackId === track.id, () => onSubtitleChange(track.id)))}
          {subtitles.length === 0 && <Text style={[styles.note, { color: colors.textMuted }]}>Tập này chưa có phụ đề.</Text>}

          <Text style={[styles.heading, { color: colors.textMuted }]}>Tốc độ</Text>
          <View style={styles.rates}>
            {PLAYBACK_RATES.map((r) => {
              const on = rate === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.rate, { backgroundColor: on ? colors.ruby : colors.cardAlt }]}
                  onPress={() => onRateChange(r)}
                  accessibilityLabel={`Tốc độ ${r}x`}
                  accessibilityState={{ selected: on }}
                >
                  <Text style={[styles.rateText, { color: on ? '#FFFFFF' : colors.text }]}>{r === 1 ? 'Bình thường' : `${r}x`}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
