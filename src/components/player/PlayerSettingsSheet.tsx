import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SubtitleTrack } from '../../types/movie';

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

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

function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.option} onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected }}>
      <Text style={[styles.optionText, selected && styles.optionTextActive]}>{label}</Text>
      {selected && <Ionicons name="checkmark" size={16} color="#10B981" />}
    </TouchableOpacity>
  );
}

/** Player settings: subtitle language (or off), the film's own audio language, and playback speed. */
export function PlayerSettingsSheet(props: PlayerSettingsSheetProps) {
  const { visible, onClose, subtitles, subtitleTrackId, onSubtitleChange, audioLabel, rate, onRateChange } = props;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Đóng cài đặt" />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView>
          <Text style={styles.heading}>Phụ đề / ngôn ngữ</Text>
          <Option label={`Tắt phụ đề (thuyết minh — ${audioLabel})`} selected={subtitleTrackId === null} onPress={() => onSubtitleChange(null)} />
          {subtitles.map((track) => (
            <Option key={track.id} label={track.label} selected={subtitleTrackId === track.id} onPress={() => onSubtitleChange(track.id)} />
          ))}
          {subtitles.length === 0 && <Text style={styles.note}>Tập này chưa có phụ đề.</Text>}

          <Text style={styles.heading}>Tốc độ phát</Text>
          <View style={styles.rates}>
            {PLAYBACK_RATES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.rate, rate === r && styles.rateActive]}
                onPress={() => onRateChange(r)}
                accessibilityLabel={`Tốc độ ${r}x`}
                accessibilityState={{ selected: rate === r }}
              >
                <Text style={[styles.rateText, rate === r && styles.rateTextActive]}>{r === 1 ? 'Chuẩn' : `${r}x`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#18181B', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: '70%' },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: '#3F3F46', marginBottom: 8 },
  heading: { color: '#94A3B8', fontSize: 12, fontWeight: '800', marginTop: 12, marginBottom: 4, textTransform: 'uppercase' },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  optionText: { color: '#E4E4E7', fontSize: 14 },
  optionTextActive: { color: '#10B981', fontWeight: '700' },
  note: { color: '#71717A', fontSize: 12, paddingVertical: 6 },
  rates: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingVertical: 6 },
  rate: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#27272A' },
  rateActive: { backgroundColor: '#10B981' },
  rateText: { color: '#E4E4E7', fontSize: 13, fontWeight: '700' },
  rateTextActive: { color: '#FFFFFF' },
});