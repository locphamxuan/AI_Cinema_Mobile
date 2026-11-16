import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Share, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FriendsPanel } from '../../src/components/watchParty/FriendsPanel';
import { useWatchRoomSocket } from '../../src/hooks/useWatchRoomSocket';
import { playbackService } from '../../src/services/playbackService';
import { watchRoomService } from '../../src/services/watchRoomService';
import { useTheme } from '../../src/theme';
import type { WatchRoom } from '../../src/types/watchRoom';
import { styles } from '../../src/styles/screens/watchParty.styles';

interface PickedEpisode {
  id: string;
  label: string;
  thumbnailUrl?: string | null;
}

/** The room is open: share the code, invite friends (or make new ones), then go in together. */
function RoomLobby({ room, episode }: { room: WatchRoom; episode: PickedEpisode }) {
  const router = useRouter();
  const { colors } = useTheme();
  const { live, invite } = useWatchRoomSocket(room.id, { join: false });

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Mã phòng · {episode.label}</Text>
        <View style={styles.codeRow}>
          <Text style={[styles.codeText, { color: colors.text }]} selectable accessibilityLabel={`Mã phòng ${room.roomCode}`}>
            {room.roomCode}
          </Text>
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: colors.ruby }]}
            onPress={() => void Share.share({ message: `Vào xem phim cùng mình trên AI Cinema, mã phòng: ${room.roomCode}` })}
            accessibilityLabel="Chia sẻ mã phòng"
          >
            <Text style={styles.smallBtnText}>Chia sẻ</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          Bạn bè nhập mã này ở “Xem cùng nhóm → Nhập mã phòng”, hoặc bấm lời mời bạn gửi bên dưới.
        </Text>
      </View>

      {live.notice ? (
        <Text style={[styles.notice, { color: colors.text, backgroundColor: colors.rubySoft }]}>{live.notice}</Text>
      ) : null}

      <FriendsPanel onInvite={invite} />

      <TouchableOpacity
        style={[styles.button, { flex: 0, backgroundColor: colors.ruby }]}
        onPress={() => router.replace(`/watch-party/${room.id}` as Href)}
        accessibilityLabel="Vào phòng xem"
      >
        <Ionicons name="play" size={18} color="#fff" />
        <Text style={styles.buttonText}>Vào phòng xem</Text>
      </TouchableOpacity>
    </>
  );
}

/**
 * BR-69 — open a watch room: pick the episode (the one being watched, or one from the history), create the
 * room, then invite friends from the same screen before going in. The BE checks the Host may watch it.
 */
export default function CreateWatchPartyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ episodeId?: string; label?: string }>();
  const [episode, setEpisode] = useState<PickedEpisode | null>(
    params.episodeId ? { id: params.episodeId, label: params.label || 'Tập đang xem' } : null,
  );
  const [history, setHistory] = useState<PickedEpisode[] | null>(null);
  const [room, setRoom] = useState<WatchRoom | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.episodeId) return;
    let active = true;
    void playbackService.history().then((res) => {
      if (!active) return;
      const rows = res.success && Array.isArray(res.data) ? res.data.filter((row) => row.available) : [];
      setHistory(
        rows.map((row) => ({
          id: row.episodeId,
          label: `${row.movieTitle} · Tập ${row.episodeNumber}`,
          thumbnailUrl: row.thumbnailUrl,
        })),
      );
    });
    return () => {
      active = false;
    };
  }, [params.episodeId]);

  const create = async () => {
    if (!episode) return;
    setBusy(true);
    setError(null);
    const res = await watchRoomService.create(episode.id);
    setBusy(false);
    if (res.success && res.data) setRoom(res.data);
    else setError(res.message || 'Bạn cần có quyền xem tập này trước khi mở phòng.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Quay lại" hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>{room ? 'Phòng đã mở' : 'Tạo phòng xem nhóm'}</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24 }]}>
        {room && episode ? (
          <RoomLobby room={room} episode={episode} />
        ) : (
          <>
            <View style={styles.hero}>
              <View style={[styles.heroIcon, { backgroundColor: colors.rubySoft }]}>
                <Ionicons name="people" size={34} color={colors.ruby} />
              </View>
              <Text style={[styles.meta, { color: colors.textSecondary, textAlign: 'center' }]}>
                Bạn là chủ phòng: phim phát, tạm dừng, tua theo bạn. Mỗi người vào phòng cần quyền xem tập đó.
              </Text>
            </View>

            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Chọn tập để xem cùng</Text>
            {episode && params.episodeId ? (
              <View style={[styles.episodeRow, { borderColor: colors.ruby, backgroundColor: colors.card }]}>
                <Ionicons name="film-outline" size={22} color={colors.ruby} />
                <Text style={[styles.episodeTitle, { color: colors.text, flex: 1 }]}>{episode.label}</Text>
              </View>
            ) : null}
            {!params.episodeId && history === null ? <ActivityIndicator color={colors.ruby} /> : null}
            {!params.episodeId && history?.length === 0 ? (
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                Chưa có tập nào trong lịch sử xem. Mở một tập phim rồi bấm biểu tượng nhóm để tạo phòng cho tập đó.
              </Text>
            ) : null}
            {history?.map((row) => {
              const picked = episode?.id === row.id;
              return (
                <TouchableOpacity
                  key={row.id}
                  style={[styles.episodeRow, { borderColor: picked ? colors.ruby : colors.border, backgroundColor: colors.card }]}
                  onPress={() => setEpisode(row)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: picked }}
                  accessibilityLabel={row.label}
                >
                  {row.thumbnailUrl ? (
                    <Image source={{ uri: row.thumbnailUrl }} style={styles.episodeThumb} />
                  ) : (
                    <View style={[styles.episodeThumb, { backgroundColor: colors.cardAlt }]} />
                  )}
                  <View style={styles.episodeInfo}>
                    <Text style={[styles.episodeTitle, { color: colors.text }]} numberOfLines={2}>
                      {row.label}
                    </Text>
                  </View>
                  <Ionicons
                    name={picked ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={picked ? colors.ruby : colors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}

            {error ? (
              <Text style={[styles.notice, { color: colors.text, backgroundColor: colors.rubySoft }]}>{error}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.button, { flex: 0, backgroundColor: colors.ruby, opacity: episode && !busy ? 1 : 0.5 }]}
              disabled={!episode || busy}
              onPress={() => void create()}
              accessibilityLabel="Tạo phòng"
            >
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>{busy ? 'Đang tạo phòng…' : 'Tạo phòng'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/watch-party/join' as Href)} accessibilityLabel="Nhập mã phòng">
              <Text style={[styles.link, { color: colors.ruby }]}>Có mã phòng của bạn bè? Nhập mã ›</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}
