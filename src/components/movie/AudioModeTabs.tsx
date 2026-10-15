import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { SubtitleTrack } from '../../types/movie';

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
  extraTabs?: React.ReactNode;
}

export function AudioModeTabs({ mode, onModeChange, tracks, trackId, onTrackChange, language, extraTabs }: AudioModeTabsProps) {
  const tab = (key: AudioMode, label: string) => (
    <TouchableOpacity
      style={[styles.tab, mode === key && styles.tabActive]}
      onPress={() => onModeChange(key)}
      accessibilityRole="tab"
      accessibilityState={{ selected: mode === key }}
    >
      <Text style={[styles.tabText, mode === key && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <View style={styles.tabs}>
        {tab('subtitle', 'PHỤ ĐỀ')}
        {tab('voiceover', 'THUYẾT MINH')}
        {extraTabs}
      </View>
      <View style={styles.info}>
        <Ionicons name={mode === 'subtitle' ? 'text' : 'volume-high'} size={14} color="#10B981" />
        {mode === 'voiceover' ? (
          <Text style={styles.infoText}>Âm thanh gốc: {languageName(language)} · tắt phụ đề</Text>
        ) : tracks.length === 0 ? (
          <Text style={styles.infoText}>Tập này chưa có phụ đề · đang phát âm thanh gốc ({languageName(language)})</Text>
        ) : (
          <View style={styles.chips}>
            {tracks.map((t) => (
              <TouchableOpacity key={t.id} style={[styles.chip, trackId === t.id && styles.chipActive]} onPress={() => onTrackChange(t.id)}>
                <Text style={[styles.chipText, trackId === t.id && styles.chipTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#27272A', marginTop: 16, paddingHorizontal: 16 },
  tab: { paddingVertical: 10, marginRight: 20 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#10B981' },
  tabText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#10B981' },
  info: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  infoText: { color: '#94A3B8', fontSize: 12, flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A' },
  chipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  chipText: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
});