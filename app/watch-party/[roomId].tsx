import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PartyPlayer } from '../../src/components/watchParty/PartyPlayer';
import { RoomChat } from '../../src/components/watchParty/RoomChat';
import { useWatchRoomSocket } from '../../src/hooks/useWatchRoomSocket';
import { useAfterWatching } from '../../src/hooks/useAfterWatching';
import { RecommendationRail } from '../../src/components/movie/RecommendationRail';
import { LoadError } from '../../src/components/common/LoadError';
import { showDialog } from '../../src/lib/dialog';
import { FriendsPanel } from '../../src/components/watchParty/FriendsPanel';
import { ParticipantsPanel } from '../../src/components/watchParty/ParticipantsPanel';
import { WatchPartyAccessGate } from '../../src/components/watchParty/WatchPartyAccessGate';
import { movieService } from '../../src/services';
import { playbackService } from '../../src/services/playbackService';
import { watchRoomService } from '../../src/services/watchRoomService';
import { useSessionStore } from '../../src/store';
import { useWatchPartyAccess } from '../../src/hooks/useWatchPartyAccess';
import { useTheme } from '../../src/theme';
import type { SubtitleTrack } from '../../src/types/movie';
import type { StreamingSession } from '../../src/types/playback';
import type { RoomPlaybackState, WatchRoom } from '../../src/types/watchRoom';
import { styles } from '../../src/styles/screens/watchParty.styles';

/** BR-69 — a watch room: the shared player, the room code, who leads, friends to invite and the room actions. */
export default function WatchPartyScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const access = useWatchPartyAccess();
  const me = useSessionStore((s) => s.user?.id);
  const [room, setRoom] = useState<WatchRoom | null>(null);
  const [session, setSession] = useState<StreamingSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  // The room's episode is the last one of the movie: once it ends, each member gets their own AI picks.
  const [isLastEpisode, setIsLastEpisode] = useState(false);
  const after = useAfterWatching(session?.movieId, session?.episodeId);
  const loadAfter = after.load;
  const { live, sendPlayback, voteHost, invite, sendChat, sendAd, sendQuality } = useWatchRoomSocket(roomId, {
    enabled: access.status === 'allowed',
  });

  // The BE checks this member's own right to the episode, age and device limit before any stream opens.
  useEffect(() => {
    if (!roomId || access.status !== 'allowed') return;
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
  }, [access.status, roomId]);

  // Subtitles of the room's episode, so every member picks their own language.
  useEffect(() => {
    if (!session) return;
    void movieService.getEpisodes(session.movieId).then((res) => {
      if (!res.success) return;
      const episode = res.data.find((e) => e.id === session.episodeId);
      setSubtitles(episode?.subtitles ?? []);
      const last = res.data.reduce((max, e) => Math.max(max, e.episodeNumber), 0);
      setIsLastEpisode(!!episode && episode.episodeNumber >= last);
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
    if (isLastEpisode) loadAfter();
  }, [isHost, sendPlayback, isLastEpisode, loadAfter]);

  const shareCode = () => {
    if (current) void Share.share({ message: `Vào xem phim cùng mình trên AI Cinema, mã phòng: ${current.roomCode}` });
  };

  // Leaving once: a double tap would send two leaves and go back twice, closing the screen under the room too.
  const leaving = useRef(false);
  const selectingSuccessor = useRef(false);
  const leaveRoom = async (action?: 'TRANSFER' | 'DISBAND', newHostUserId?: string) => {
    if (!roomId || leaving.current) return;
    leaving.current = true;
    const result = await watchRoomService.leave(roomId, action, newHostUserId);
    if (!result.success) {
      leaving.current = false;
      showDialog('Chưa rời được phòng', result.message || 'Vui lòng thử lại.');
      return;
    }
    router.back();
  };
  const chooseSuccessor = async () => {
    if (!roomId || selectingSuccessor.current) return;
    selectingSuccessor.current = true;
    const result = await watchRoomService.get(roomId);
    selectingSuccessor.current = false;
    if (!result.success || !result.data) {
      return showDialog('Chưa tải được thành viên', result.message || 'Vui lòng thử lại trước khi chuyển quyền chủ phòng.');
    }
    const candidates = (result.data.participants ?? []).filter((participant) => participant.userId !== me);
    if (!candidates.length) {
      return showDialog('Chưa có thành viên khác', 'Bạn có thể ở lại phòng hoặc rời để đóng phòng.', [
        { text: 'Ở lại', style: 'cancel' },
        { text: 'Rời phòng', style: 'destructive', onPress: () => void leaveRoom() },
      ]);
    }
    showDialog(
      'Chọn chủ phòng mới',
      'Chỉ thành viên đang ở trong phòng mới được chọn.',
      [
        { text: 'Huỷ', style: 'cancel' },
        ...candidates.map((participant) => ({
          text: participant.fullName || 'Thành viên',
          onPress: () => void leaveRoom('TRANSFER', participant.userId),
        })),
      ],
    );
  };
  const exit = () => {
    if (!roomId || leaving.current) return;
    if (!isHost || live.closed) return void leaveRoom();
    showDialog('Rời phòng', 'Bạn là chủ phòng. Chuyển quyền cho người khác hay giải tán phòng?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Chuyển quyền', onPress: () => void chooseSuccessor() },
      { text: 'Giải tán', style: 'destructive', onPress: () => void leaveRoom('DISBAND') },
    ]);
  };

  /** Opens this member's own session on the room's (new) episode; the BE re-checks their right to it. */
  const followEpisode = useCallback(async (next: WatchRoom) => {
    setRoom(next);
    setSession(null);
    const opened = await playbackService.openSession(next.episodeId);
    if (opened.success && opened.data) setSession(opened.data);
    else setError(opened.message || 'Bạn chưa có quyền xem tập tiếp theo của phòng.');
  }, []);

  // One move per tap burst: a double tap would skip the room two episodes ahead.
  const moving = useRef(false);
  const nextEpisode = async () => {
    if (!roomId || moving.current) return;
    moving.current = true;
    const res = await watchRoomService.nextEpisode(roomId);
    if (!res.success || !res.data) {
      moving.current = false;
      return showDialog('Chưa chuyển được tập', res.message);
    }
    await followEpisode(res.data);
    moving.current = false;
  };

  // Android back leaves the room the same way as "Rời phòng" (a Host chooses to hand over or disband);
  // the fullscreen player registers its own handler later, so back leaves fullscreen first.
  const exitRef = useRef(exit);
  useEffect(() => {
    exitRef.current = exit;
  });
  useEffect(() => {
    if (error) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      exitRef.current();
      return true;
    });
    return () => back.remove();
  }, [error]);

  // The BE tells members nothing when the Host moves on: once playback resumes after the episode ended, a member
  // reads the room again and follows the Host to the new episode.
  const lastState = useRef<RoomPlaybackState | null>(null);
  const syncState = live.lastSync?.state ?? null;
  const roomEpisode = room?.episodeId ?? null;
  // The Host's player reached the end of the last episode: the picks show for a member a few seconds behind too.
  useEffect(() => {
    if (syncState === 'ENDED' && isLastEpisode) loadAfter();
  }, [syncState, isLastEpisode, loadAfter]);
  useEffect(() => {
    const before = lastState.current;
    lastState.current = syncState;
    if (before !== 'ENDED' || !syncState || syncState === 'ENDED' || isHost || !roomId) return;
    void watchRoomService.get(roomId).then((res) => {
      if (res.success && res.data && res.data.episodeId !== roomEpisode) void followEpisode(res.data);
    });
  }, [syncState, isHost, roomId, roomEpisode, followEpisode]);

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

  if (access.status !== 'allowed') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Quay lại" hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.topTitle, { color: colors.text }]}>Phòng xem nhóm</Text>
        </View>
        <WatchPartyAccessGate status={access.status} message={access.message} onRetry={access.reload} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* A spacer, not padding: the fullscreen player covers the whole screen from its very top edge. */}
      <View style={{ height: insets.top }} />
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
            {live.connected ? 'Trực tiếp' : 'Đang kết nối lại…'}
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
            roomAd={live.ad}
            onAdChange={sendAd}
            quality={live.quality}
            onQualityChange={sendQuality}
          />
      ) : (
        <View style={styles.playerPlaceholder}>
          <ActivityIndicator color={colors.ruby} />
        </View>
      )}

      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        {isHost ? (
          <ParticipantsPanel participants={current?.participants ?? []} sync={live.lastSync} />
        ) : (
          <View style={styles.chips}>
            <View style={[styles.chip, { backgroundColor: colors.rubySoft }]}>
              <Ionicons name="people" size={13} color={colors.ruby} />
              <Text style={[styles.chipText, { color: colors.ruby }]}>{viewers} người đang xem</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: colors.card }]}>
              <Ionicons name="radio-outline" size={13} color={colors.textSecondary} />
              <Text style={[styles.chipText, { color: colors.textSecondary }]}>Chủ phòng điều khiển</Text>
            </View>
          </View>
        )}

        {live.notice ? (
          <Text style={[styles.notice, { color: colors.text, backgroundColor: colors.rubySoft }]}>{live.notice}</Text>
        ) : null}

        <RecommendationRail
          title="AI đề xuất cho bạn"
          caption="Theo những phim bạn hay xem, sau khi cả phòng xem hết phim này"
          movies={after.movies}
          onMoviePress={(m) => router.push({ pathname: '/movie/[id]', params: { id: m.id } })}
        />
        {after.error ? <LoadError message={after.error} onRetry={after.retry} /> : null}

        <RoomChat messages={live.chat} me={me} hostId={hostId} disabled={live.closed} onSend={sendChat} />

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

        {/* Invite friends, add new ones by email and answer requests without leaving the room. */}
        {!live.closed ? <FriendsPanel onInvite={invite} /> : null}

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
