import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';

const DEFAULT_AI_LABEL = 'Nội dung được tạo bởi AI';

interface EpisodePlayerProps {
  /** What the BE handed over once access was granted; empty until the viewer presses play. */
  streamUrl: string;
  posterUrl: string;
  /** AI label text that stays on the picture while the video plays (BR-10). */
  aiLabel: string | null;
  checking: boolean;
  onRequestPlay: () => void;
}

/** The AI label sits over both the poster and the playing video; it is never hidden. */
function AiLabelOverlay({ text }: { text: string | null }) {
  return (
    <View style={styles.aiBadge} pointerEvents="none" testID="ai-label-overlay">
      <MaterialCommunityIcons name="robot-outline" size={12} color="#10B981" />
      <Text style={styles.aiBadgeText} numberOfLines={1}>
        {text || DEFAULT_AI_LABEL}
      </Text>
    </View>
  );
}

function StreamPlayer({ streamUrl }: { streamUrl: string }) {
  const player = useVideoPlayer({ uri: streamUrl }, (p) => {
    p.play();
  });
  return <VideoView style={styles.fill} player={player} nativeControls allowsFullscreen contentFit="contain" />;
}

export function EpisodePlayer({ streamUrl, posterUrl, aiLabel, checking, onRequestPlay }: EpisodePlayerProps) {
  return (
    <View style={styles.container}>
      {streamUrl ? (
        // The key makes a new episode start from its own player instead of reusing the old one.
        <StreamPlayer key={streamUrl} streamUrl={streamUrl} />
      ) : (
        <>
          {posterUrl ? <Image source={{ uri: posterUrl }} style={styles.fill} resizeMode="cover" /> : null}
          <View style={styles.posterShade}>
            <TouchableOpacity style={styles.playBtn} onPress={onRequestPlay} activeOpacity={0.8} disabled={checking}>
              {checking ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="play" size={32} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </>
      )}
      <AiLabelOverlay text={aiLabel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', height: 220, backgroundColor: '#000000' },
  fill: { width: '100%', height: '100%', position: 'absolute' },
  posterShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    maxWidth: '70%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  aiBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
});
