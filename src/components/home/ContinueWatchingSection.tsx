import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { useAppStore } from '../../store/useAppStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.65;

export const ContinueWatchingSection: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { watchHistory } = useAppStore();
  const router = useRouter();

  if (!watchHistory || watchHistory.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Text style={styles.titleIcon}>🕒</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Đang Xem Dở</Text>
        </View>
        <Text style={[styles.itemCount, { color: colors.textMuted }]}>
          {watchHistory.length} nội dung
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {watchHistory.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.88}
            onPress={() => router.push(`/watch/${item.episodeId}` as any)}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Thumbnail Housing with Play Overlay */}
            <View style={styles.thumbnailHousing}>
              <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />

              <View style={styles.playCenter}>
                <View style={styles.playCircle}>
                  <Ionicons name="play" size={16} color="#FFFFFF" style={{ marginLeft: 2 }} />
                </View>
              </View>

              {/* Episode Tag */}
              <View style={styles.episodeBadge}>
                <Text style={styles.episodeText}>Tập {item.episodeNumber}</Text>
              </View>

              {/* Progress Bar at Bottom of Thumbnail */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${item.progressPercent}%`,
                      backgroundColor: colors.ruby,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Info Footer */}
            <View style={styles.infoRow}>
              <View style={styles.textContainer}>
                <Text style={[styles.movieTitle, { color: colors.text }]} numberOfLines={1}>
                  {item.movieTitle}
                </Text>
                <Text style={[styles.subText, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.duration} • {item.progressPercent}%
                </Text>
              </View>

              <View style={styles.lastWatchedTag}>
                <Text style={[styles.lastWatchedText, { color: colors.textSecondary }]}>
                  {item.lastWatchedAt}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleIcon: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  itemCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  thumbnailHousing: {
    width: '100%',
    height: 115,
    position: 'relative',
    backgroundColor: '#0F172A',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playCenter: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(229, 9, 20, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E50914',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  episodeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  episodeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  infoRow: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    marginRight: 6,
  },
  movieTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  subText: {
    fontSize: 11,
    marginTop: 2,
  },
  lastWatchedTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  lastWatchedText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
