import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PartyPlayer } from '../../src/components/watchParty/PartyPlayer';
import { useWatchRoomSocket } from '../../src/hooks/useWatchRoomSocket';
import { showDialog } from '../../src/lib/dialog';
import { playbackService } from '../../src/services/playbackService';
import { watchRoomService } from '../../src/services/watchRoomService';
import { useSessionStore } from '../../src/store';
import { useTheme } from '../../src/theme';
import type { StreamingSession } from '../../src/types/playback';
import type { Friendship, WatchRoom } from '../../src/types/watchRoom';
import { styles } from '../../src/styles/screens/watchParty.styles';

/** BR-69 — a watch room: the shared player, the room code to invite friends, who leads and what is happening. */
export default function WatchPartyScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const me = useSessionStore((s) => s.user?.id);
  const [room, setRoom] = useState<WatchRoom | null>(null);
  const [session, setSession] = useState<StreamingSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { live, sendPlayback, voteHost, leave, invite } = useWatchRoomSocket(roomId);
  const [friends, setFriends] = useState<Friendship[]>([]);

  useEffect(() => {
    void watchRoomService.friends().then((res) => {
      if (res.success && Array.isArray(res.data)) setFriends(res.data.filter((f) => f.status === 'ACCEPTED'));
    });
  }, []);

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

  const current = live.room ?? room;
  const hostId = live.hostUserId ?? current?.hostUserId ?? null;
  const isHost = !!me && hostId === me;
  const viewers = live.participantCount || current?.participantCount || 1;

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
        <Text style={[styles.error, { color: colors.text }]}>{error}</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.ruby }]} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {session && current ? (
        <PartyPlayer
          key={session.sessionId}
          session={session}
          isHost={isHost}
          sync={live.lastSync}
          onHostAction={sendPlayback}
          onEnded={() => {
            if (isHost) sendPlayback('ENDED', 0);
          }}
        />
      ) : (
        <View style={styles.playerPlaceholder}>
          <ActivityIndicator color={colors.ruby} />
        </View>
      )}
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.row}>
          <Text style={[styles.title, { color: colors.text }]}>Phòng xem nhóm</Text>
          <Text style={[styles.badge, { color: live.connected ? '#2ecc71' : colors.textMuted }]}>
            {live.connected ? 'Đã kết nối' : 'Đang kết nối lại…'}
          </Text>
        </View>
        {current ? (
          <TouchableOpacity style={[styles.code, { borderColor: colors.ruby }]} onPress={shareCode} accessibilityLabel="Chia sẻ mã phòng">
            <Text style={[styles.codeText, { color: colors.text }]}>{current.roomCode}</Text>
            <Ionicons name="share-social-outline" size={18} color={colors.ruby} />
          </TouchableOpacity>
        ) : null}
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {viewers} người đang xem · {isHost ? 'Bạn là chủ phòng' : 'Chủ phòng điều khiển phát'}
        </Text>
        {live.notice ? (
          <Text style={[styles.notice, { color: colors.text, backgroundColor: colors.rubySoft }]}>{live.notice}</Text>
        ) : null}
        {!live.closed ? (
          <View style={{ gap: 8 }}>
            <Text style={[styles.meta, { color: colors.text, fontWeight: '700' }]}>Mời bạn bè</Text>
            {friends.length === 0 ? (
              <TouchableOpacity onPress={() => router.push('/friends' as Href)}>
                <Text style={[styles.meta, { color: colors.ruby }]}>Chưa có bạn bè — thêm bạn bằng email</Text>
              </TouchableOpacity>
            ) : (
              friends.map((f) => (
                <View key={f.id} style={styles.row}>
                  <Text style={[styles.meta, { color: colors.text }]}>{f.friend?.fullName || 'Thành viên AI Cinema'}</Text>
                  <TouchableOpacity onPress={() => f.friend && invite(f.friend.id)} accessibilityLabel={`Mời ${f.friend?.fullName ?? ''}`}>
                    <Text style={{ color: colors.ruby, fontWeight: '700' }}>Mời</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : null}
        {live.voteOpen && !isHost ? (
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.ruby }]} onPress={voteHost}>
            <Text style={styles.buttonText}>Bỏ phiếu đổi chủ phòng</Text>
          </TouchableOpacity>
        ) : null}
        {isHost && !live.closed ? (
          <TouchableOpacity style={[styles.button, { backgroundColor: colors.ruby }]} onPress={() => void nextEpisode()}>
            <Text style={styles.buttonText}>Chuyển tập tiếp theo</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={[styles.button, styles.ghost, { borderColor: colors.textMuted }]} onPress={exit}>
          <Text style={[styles.buttonText, { color: colors.text }]}>{live.closed ? 'Đóng' : 'Rời phòng'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
