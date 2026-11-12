import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PartyPlayer } from '../../src/components/watchParty/PartyPlayer';
import { useWatchRoomSocket } from '../../src/hooks/useWatchRoomSocket';
import { showDialog } from '../../src/lib/dialog';
import { movieService } from '../../src/services';
import { playbackService } from '../../src/services/playbackService';
import { watchRoomService } from '../../src/services/watchRoomService';
import { useSessionStore } from '../../src/store';
import { useTheme } from '../../src/theme';
import type { SubtitleTrack } from '../../src/types/movie';
import type { StreamingSession } from '../../src/types/playback';
import type { Friendship, RoomPlaybackState, WatchRoom } from '../../src/types/watchRoom';
import { styles } from '../../src/styles/screens/watchParty.styles';

/** BR-69 — a watch room: the shared player, the room code, who leads, friends to invite and the room actions. */
export default function WatchPartyScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const me = useSessionStore((s) => s.user?.id);
  const [room, setRoom] = useState<WatchRoom | null>(null);
  const [session, setSession] = useState<StreamingSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const { live, sendPlayback, voteHost, leave, invite } = useWatchRoomSocket(roomId);

  // The BE checks this member's own right to the episode, age and device limit before any stream opens.
  useEffect(() => {
    if (!roomId) return;
    let active = true;
    void (async () => {
      const joined = await watchRoomService.join(roomId);
      if (!active) return;
      if (!joined.success || !joined.data) {
        setError(joined.message || 'Bạn chưa thể vào phòng này.');
        return;
      }
      setRoom(joined.data);
      const opened = await playbackService.openSession(joined.data.episodeId);
      if (!active) return;
      if (opened.success && opened.data) setSession(opened.data);
      else setError(opened.message || 'Không mở được tập phim của phòng.');
    })();
    return () => {
      active = false;
    };
  }, [roomId]);

  useEffect(() => {
    void watchRoomService.friends().then((res) => {
      if (res.success && Array.isArray(res.data)) setFriends(res.data.filter((f) => f.status === 'ACCEPTED'));
    });
  }, []);

  // Subtitles of the room's episode, so every member picks their own language.
  useEffect(() => {
    if (!session) return;
    void movieService.getEpisodes(session.movieId).then((res) => {
      if (res.success) setSubtitles(res.data.find((e) => e.id === session.episodeId)?.subtitles ?? []);
    });
  }, [session]);

  const current = live.room ?? room;
  const hostId = live.hostUserId ?? current?.hostUserId ?? null;
  const isHost = !!me && hostId === me;
  const viewers = live.participantCount || current?.participantCount || 1;
  const onHostAction = useCallback(
    (state: RoomPlaybackState, at: number) => {
      sendPlayback(state, at);
    },
    [sendPlayback],
  );
  const onEnded = useCallback(() => {
    if (isHost) sendPlayback('ENDED', 0);
  }, [isHost, sendPlayback]);

  const shareCode = () => {
    if (current) void Share.share({ message: `Vào xem phim cùng mình trên AI Cinema, mã phòng: ${current.roomCode}` });
  };

  const exit = () => {
    if (!roomId) return;
    const go = (action?: 'TRANSFER' | 'DISBAND') => {
      void watchRoomService.leave(roomId, action).finally(() => {
        leave();
        router.back();
      });
    };
    if (!isHost || live.closed) return go();
    showDialog('Rời phòng', 'Bạn là chủ phòng. Chuyển quyền cho người khác hay giải tán phòng?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Chuyển quyền', onPress: () => go('TRANSFER') },
      { text: 'Giải tán', style: 'destructive', onPress: () => go('DISBAND') },
    ]);
  };

  const nextEpisode = async () => {
    if (!roomId) return;
    const res = await watchRoomService.nextEpisode(roomId);
    if (!res.success || !res.data) return showDialog('Chưa chuyển được tập', res.message);
    setRoom(res.data);
    setSession(null);
    const opened = await playbackService.openSession(res.data.episodeId);
    if (opened.success && opened.data) setSession(opened.data);
  };

  if (error) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Ionicons name="lock-closed-outline" size={40} color={colors.ruby} />
        <Text style={[styles.error, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.button, { flex: 0, paddingHorizontal: 28, backgroundColor: colors.ruby }]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={exit} accessibilityLabel="Rời phòng" hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>Phòng xem nhóm</Text>
        <View style={[styles.chip, { backgroundColor: colors.card }]}>
          <View
            style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: live.connected ? '#2ecc71' : colors.textMuted }}
          />
          <Text style={[styles.chipText, { color: colors.textSecondary }]}>
            {live.connected ? 'Trực tiếp' : 'Đang nối lại…'}
          </Text>
        </View>
      </View>

      {session && current ? (
        <PartyPlayer
          key={session.sessionId}
          session={session}
          isHost={isHost}
          sync={live.lastSync}
          subtitles={subtitles}
          audioLabel="Âm thanh gốc của phim"
          onHostAction={onHostAction}
          onEnded={onEnded}
        />
      ) : (
        <View style={styles.playerPlaceholder}>
          <ActivityIndicator color={colors.ruby} />
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.chips}>
          <View style={[styles.chip, { backgroundColor: colors.rubySoft }]}>
            <Ionicons name="people" size={13} color={colors.ruby} />
            <Text style={[styles.chipText, { color: colors.ruby }]}>{viewers} người đang xem</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: colors.card }]}>
            <Ionicons name={isHost ? 'star' : 'radio-outline'} size={13} color={colors.textSecondary} />
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>
              {isHost ? 'Bạn là chủ phòng' : 'Chủ phòng điều khiển'}
            </Text>
          </View>
        </View>

        {live.notice ? (
          <Text style={[styles.notice, { color: colors.text, backgroundColor: colors.rubySoft }]}>{live.notice}</Text>
        ) : null}

        {current ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Mã phòng</Text>
            <View style={styles.codeRow}>
              <Text style={[styles.codeText, { color: colors.text }]}>{current.roomCode}</Text>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: colors.ruby }]}
                onPress={shareCode}
                accessibilityLabel="Chia sẻ mã phòng"
              >
                <Text style={styles.smallBtnText}>Chia sẻ</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {!live.closed ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Mời bạn bè</Text>
            {friends.length === 0 ? (
              <TouchableOpacity onPress={() => router.push('/friends' as Href)}>
                <Text style={[styles.meta, { color: colors.ruby }]}>Chưa có bạn bè — thêm bạn bằng email ›</Text>
              </TouchableOpacity>
            ) : (
              friends.map((f) => {
                const name = f.friend?.fullName || 'Thành viên AI Cinema';
                return (
                  <View key={f.id} style={styles.friendRow}>
                    <View style={[styles.avatar, { backgroundColor: colors.ruby }]}>
                      <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>
                      {name}
                    </Text>
                    <TouchableOpacity
                      style={[styles.smallBtn, { backgroundColor: colors.ruby }]}
                      onPress={() => f.friend && invite(f.friend.id)}
                      accessibilityLabel={`Mời ${name}`}
                    >
                      <Text style={styles.smallBtnText}>Mời</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </View>
        ) : null}

        {live.voteOpen && !isHost ? (
          <TouchableOpacity style={[styles.button, { flex: 0, backgroundColor: colors.ruby }]} onPress={voteHost}>
            <Ionicons name="hand-left-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Bỏ phiếu đổi chủ phòng</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.actionsRow}>
          {isHost && !live.closed ? (
            <TouchableOpacity style={[styles.button, { backgroundColor: colors.ruby }]} onPress={() => void nextEpisode()}>
              <Ionicons name="play-skip-forward" size={18} color="#fff" />
              <Text style={styles.buttonText}>Tập tiếp</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={[styles.button, styles.ghost, { borderColor: colors.border }]} onPress={exit}>
            <Ionicons name="exit-outline" size={18} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>{live.closed ? 'Đóng' : 'Rời phòng'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
