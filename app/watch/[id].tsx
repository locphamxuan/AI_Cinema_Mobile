import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { useAppStore } from '../../src/store/useAppStore';
import { allMockMovies } from '../../src/mocks/mockData';
import { Episode, EpisodeVersion } from '../../src/types/movie';
import { VersionSelectorModal } from '../../src/components/player/VersionSelectorModal';
import { AIComplianceModal } from '../../src/components/player/AIComplianceModal';
import { UnlockEpisodeModal } from '../../src/components/player/UnlockEpisodeModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { currentMovie, openAuthModal, isAuthenticated } = useAppStore();

  const movie = allMockMovies.find((m) => m.id === id) || currentMovie;

  const [activeEpisode, setActiveEpisode] = useState<Episode>(movie.episodes[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeVersionId, setActiveVersionId] = useState('v-ep1-3');
  const [activeVersionNumber, setActiveVersionNumber] = useState('v1.2.0');

  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [targetUnlockEp, setTargetUnlockEp] = useState<Episode | null>(null);

  const handleSelectEpisode = (ep: Episode) => {
    if (ep.isFree || ep.isUnlocked) {
      setActiveEpisode(ep);
      setIsPlaying(true);
    } else {
      if (!isAuthenticated) {
        openAuthModal('login');
        return;
      }
      setTargetUnlockEp(ep);
      setUnlockModalOpen(true);
    }
  };

  const handleSelectVersion = (ver: EpisodeVersion) => {
    setActiveVersionId(ver.id);
    setActiveVersionNumber(ver.versionNumber);
    setVersionModalOpen(false);
    Alert.alert('Chuyển phiên bản', `Đang phát "${ver.versionTitle}" (${ver.versionNumber})`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Video Player Area */}
      <View style={[styles.playerContainer, { paddingTop: insets.top }]}>
        <Image
          source={{ uri: activeEpisode.thumbnailUrl || movie.bannerUrl }}
          style={styles.videoPlaceholder}
        />

        {/* Player Overlay Controls */}
        <View style={styles.playerOverlay}>
          {/* Top Bar: Back button, Title & Quality */}
          <View style={styles.playerTopBar}>
            <TouchableOpacity
              style={styles.playerBtn}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.playerTitleBox}>
              <Text style={styles.playerMovieTitle} numberOfLines={1}>
                {movie.title}
              </Text>
              <Text style={styles.playerEpTitle} numberOfLines={1}>
                Tập {activeEpisode.episodeNumber}: {activeEpisode.title}
              </Text>
            </View>

            <View style={styles.qualityBadge}>
              <Text style={styles.qualityText}>4K HDR</Text>
            </View>
          </View>

          {/* Center Play/Pause button */}
          <TouchableOpacity
            style={styles.centerPlayBtn}
            onPress={() => setIsPlaying(!isPlaying)}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {/* Bottom Bar: Version pill, Scrubber, Fullscreen */}
          <View style={styles.playerBottomBar}>
            {/* Version Switcher Pill */}
            {activeEpisode.versions && activeEpisode.versions.length > 0 && (
              <TouchableOpacity
                style={styles.versionPill}
                onPress={() => setVersionModalOpen(true)}
              >
                <MaterialCommunityIcons name="history" size={13} color="#FFFFFF" />
                <Text style={styles.versionPillText}>Bản {activeVersionNumber}</Text>
                <Ionicons name="chevron-down" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Time progress bar */}
            <View style={styles.scrubberContainer}>
              <View style={styles.scrubberTrack}>
                <View style={styles.scrubberProgress} />
              </View>
              <Text style={styles.timeText}>14:20 / {activeEpisode.duration}</Text>
            </View>

            <TouchableOpacity style={styles.playerBtn}>
              <Ionicons name="expand" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Details & Episodes ScrollView */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsContent}>
        {/* Movie Meta Section */}
        <View style={styles.metaSection}>
          <Text style={[styles.title, { color: colors.text }]}>{movie.title}</Text>

          {/* Badges row */}
          <View style={styles.metaBadges}>
            {movie.matchScore && (
              <View style={[styles.badge, styles.matchBadge]}>
                <Text style={styles.matchText}>{movie.matchScore}% Phù hợp</Text>
              </View>
            )}
            <View style={[styles.badge, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>{movie.year}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>{movie.ageRating}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>6 Tập</Text>
            </View>
          </View>

          {/* AI Compliance Button */}
          <TouchableOpacity
            style={[
              styles.complianceBtn,
              {
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderColor: 'rgba(16, 185, 129, 0.4)',
              },
            ]}
            onPress={() => setComplianceModalOpen(true)}
          >
            <MaterialCommunityIcons name="shield-check" size={16} color="#10B981" />
            <Text style={styles.complianceBtnText}>
              Tuân thủ Điều 44 Luật AI • Điểm: {movie.aiCompliance.moderationScore}%
            </Text>
            <Ionicons name="chevron-forward" size={14} color="#10B981" />
          </TouchableOpacity>

          {/* Synopsis */}
          <Text style={[styles.synopsis, { color: colors.textSecondary }]}>
            {movie.description}
          </Text>

          {/* Active Episode Description */}
          <View
            style={[
              styles.currentEpBox,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.currentEpTitle, { color: colors.text }]}>
              Đang phát: Tập {activeEpisode.episodeNumber} - {activeEpisode.title}
            </Text>
            <Text style={[styles.currentEpSynopsis, { color: colors.textMuted }]}>
              {activeEpisode.synopsis}
            </Text>
          </View>
        </View>

        {/* Episodes List Section */}
        <View style={styles.episodesSection}>
          <Text style={[styles.episodesHeading, { color: colors.text }]}>
            Danh Sách Các Tập ({movie.episodes.length} tập)
          </Text>

          <View style={styles.episodesList}>
            {movie.episodes.map((ep) => {
              const isCurrent = ep.id === activeEpisode.id;
              const isLocked = !ep.isFree && !ep.isUnlocked;

              return (
                <TouchableOpacity
                  key={ep.id}
                  activeOpacity={0.85}
                  onPress={() => handleSelectEpisode(ep)}
                  style={[
                    styles.episodeItem,
                    {
                      backgroundColor: isCurrent
                        ? isDark
                          ? '#1E293B'
                          : '#EFF6FF'
                        : colors.surface,
                      borderColor: isCurrent ? colors.ruby : colors.border,
                      borderWidth: isCurrent ? 1.5 : 1,
                    },
                  ]}
                >
                  <View style={styles.thumbWrapper}>
                    <Image source={{ uri: ep.thumbnailUrl }} style={styles.epThumb} />
                    {isLocked ? (
                      <View style={styles.lockedOverlay}>
                        <FontAwesome5 name="lock" size={14} color="#F59E0B" />
                        <Text style={styles.lockedPrice}>{ep.price} Coin</Text>
                      </View>
                    ) : (
                      <View style={styles.playOverlay}>
                        <Ionicons name="play" size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </View>

                  <View style={styles.epItemInfo}>
                    <View style={styles.epItemTitleRow}>
                      <Text style={[styles.epItemTitle, { color: colors.text }]} numberOfLines={1}>
                        Tập {ep.episodeNumber}: {ep.title}
                      </Text>
                      {ep.isFree && (
                        <View style={styles.freeBadge}>
                          <Text style={styles.freeBadgeText}>Miễn phí</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.epItemDuration, { color: colors.textMuted }]}>
                      {ep.duration}
                    </Text>
                    <Text style={[styles.epItemDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                      {ep.synopsis}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Multi-version Modal */}
      {activeEpisode.versions && (
        <VersionSelectorModal
          visible={versionModalOpen}
          onClose={() => setVersionModalOpen(false)}
          versions={activeEpisode.versions}
          selectedVersionId={activeVersionId}
          onSelectVersion={handleSelectVersion}
        />
      )}

      {/* AI Compliance Modal */}
      <AIComplianceModal
        visible={complianceModalOpen}
        onClose={() => setComplianceModalOpen(false)}
        compliance={movie.aiCompliance}
      />

      {/* Unlock Episode Modal */}
      <UnlockEpisodeModal
        visible={unlockModalOpen}
        onClose={() => setUnlockModalOpen(false)}
        episode={targetUnlockEp}
        onUnlocked={() => {
          if (targetUnlockEp) {
            setActiveEpisode({ ...targetUnlockEp, isUnlocked: true });
            setIsPlaying(true);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playerContainer: {
    width: '100%',
    height: 240,
    backgroundColor: '#000000',
    position: 'relative',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
  },
  playerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: 12,
  },
  playerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerBtn: {
    padding: 6,
  },
  playerTitleBox: {
    flex: 1,
    marginHorizontal: 10,
  },
  playerMovieTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  playerEpTitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
  },
  qualityBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  qualityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  centerPlayBtn: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  versionPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  scrubberContainer: {
    flex: 1,
    gap: 2,
  },
  scrubberTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  scrubberProgress: {
    width: '32%',
    height: '100%',
    backgroundColor: '#E50914',
  },
  timeText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 9,
  },
  detailsContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  metaSection: {
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  metaBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
  },
  matchText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  complianceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  complianceBtnText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
    marginLeft: 6,
  },
  synopsis: {
    fontSize: 12,
    lineHeight: 17,
  },
  currentEpBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    marginTop: 2,
  },
  currentEpTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  currentEpSynopsis: {
    fontSize: 11,
    lineHeight: 15,
  },
  episodesSection: {
    gap: 12,
  },
  episodesHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  episodesList: {
    gap: 10,
  },
  episodeItem: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  thumbWrapper: {
    width: 100,
    height: 65,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
  },
  epThumb: {
    width: '100%',
    height: '100%',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  lockedPrice: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  epItemInfo: {
    flex: 1,
    gap: 3,
  },
  epItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  epItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  freeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  freeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  epItemDuration: {
    fontSize: 11,
  },
  epItemDesc: {
    fontSize: 11,
    lineHeight: 14,
  },
});
