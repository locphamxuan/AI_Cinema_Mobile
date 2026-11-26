
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';
import type { SubtitleTrack } from '../../types/movie';
import { useTheme } from '../../theme';
import { styles } from '../../styles/components/player/PlayerSettingsSheet.styles';

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

interface PlayerSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  subtitles: SubtitleTrack[];
  /** Null = subtitles off. */
  subtitleTrackId: string | null;
  onSubtitleChange: (trackId: string | null) => void;
  /** Spoken language of the film, e.g. "Tiếng Việt"; absent when the episode has no subtitle track. */
  audioLabel?: string;
  rate: number;
  onRateChange: (rate: number) => void;
  /** The stream quality (`auto` or `720p`…), only the ones the plan allows; hidden when absent. */
  quality?: { options: string[]; value: string; onChange?: (quality: string) => void };
  /** Watch room: everyone plays at 1x, so the speed row is hidden. */
  hideRate?: boolean;
}

const qualityLabel = (q: string) => (q === 'auto' ? 'Tự động' : q);

/** Widest the sheet gets: in landscape a full-width list would stretch each row across the whole phone. */
export const SHEET_MAX_WIDTH = 560;
/** Share of a portrait screen the sheet may cover, so the video stays in sight above it. */
const PORTRAIT_SHARE = 0.7;
/** Room kept above the sheet in landscape, where the screen is short and the list needs every row. */
const LANDSCAPE_TOP_GAP = 12;

/**
 * Size of the sheet on this screen: never taller than the space between the status bar / notch and the bottom
 * edge (minus the system bars, which the modal draws under edge to edge), so every option stays on screen and the
 * list scrolls instead of running off the bottom. Works for portrait, landscape and fullscreen alike.
 */
export function sheetFrame(width: number, height: number, insets: EdgeInsets) {
  const landscape = width > height;
  const usable = height - insets.top - (landscape ? LANDSCAPE_TOP_GAP : 0);
  return {
    maxHeight: Math.max(0, Math.floor(landscape ? usable : Math.min(usable, height * PORTRAIT_SHARE))),
    width: Math.min(width - insets.left - insets.right, SHEET_MAX_WIDTH),
    paddingBottom: insets.bottom + 16,
  };
}

/** Player settings: subtitle language (or off), the film's own audio language, and playback speed. */
export function PlayerSettingsSheet(props: PlayerSettingsSheetProps) {
  const { visible, onClose, subtitles, subtitleTrackId, onSubtitleChange, audioLabel, rate, onRateChange, quality, hideRate } =
    props;
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const frame = sheetFrame(width, height, useSafeAreaInsets());

  const option = (key: string, label: string, selected: boolean, onPress: () => void) => (
    <TouchableOpacity key={key} style={styles.option} onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Text style={[styles.optionText, { color: selected ? colors.ruby : colors.text }]}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={18} color={colors.ruby} />}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose} accessibilityLabel="Đóng cài đặt" />
      <View
        style={[styles.sheet, { backgroundColor: colors.surface, maxHeight: frame.maxHeight, width: frame.width }]}
        testID="player-settings-sheet"
      >
        <View style={[styles.handle, { backgroundColor: colors.borderLight }]} />
        <ScrollView
          style={styles.list}
          contentContainerStyle={{ paddingBottom: frame.paddingBottom }}
          showsVerticalScrollIndicator
          testID="player-settings-list"
        >
          <Text style={[styles.heading, { color: colors.textMuted }]}>Phụ đề</Text>
          {option('off', audioLabel ? `Tắt, nghe âm thanh gốc (${audioLabel})` : 'Tắt, nghe âm thanh gốc', subtitleTrackId === null, () => onSubtitleChange(null))}
          {subtitles.map((track) => option(track.id, track.label, subtitleTrackId === track.id, () => onSubtitleChange(track.id)))}
          {subtitles.length === 0 && <Text style={[styles.note, { color: colors.textMuted }]}>Tập này chưa có phụ đề.</Text>}

          {quality ? (
            <>
              <Text style={[styles.heading, { color: colors.textMuted }]}>Chất lượng</Text>
              {quality.onChange ? (
                quality.options.map((q) =>
                  option(`q-${q}`, qualityLabel(q), quality.value === q, () => quality.onChange?.(q)),
                )
              ) : (
                <Text style={[styles.note, { color: colors.textMuted }]}>
                  Theo chủ phòng: {qualityLabel(quality.value)}
                </Text>
              )}
            </>
          ) : null}

          {hideRate ? null : (
            <>
              <Text style={[styles.heading, { color: colors.textMuted }]}>Tốc độ</Text>
              <View style={styles.rates}>
                {PLAYBACK_RATES.map((r) => {
                  const on = rate === r;
                  return (
                    <TouchableOpacity
                      key={r}
                      style={[styles.rate, { backgroundColor: on ? colors.ruby : colors.cardAlt }]}
                      onPress={() => onRateChange(r)}
                      accessibilityLabel={`Tốc độ ${r} lần`}
                      accessibilityState={{ selected: on }}
                    >
                      <Text style={[styles.rateText, { color: on ? '#FFFFFF' : colors.text }]}>
                        {r === 1 ? 'Bình thường' : `${r}x`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
