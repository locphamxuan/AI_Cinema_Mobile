import { useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { watchRoomService } from '../../src/services/watchRoomService';
import { formatRoomCodeInput } from '../../src/lib/roomEvents';
import { useSessionStore, useUiStore } from '../../src/store';
import { useTheme } from '../../src/theme';
import { styles } from '../../src/styles/screens/watchParty.styles';

/** BR-69 — join a friend's watch room with the code they shared. */
export default function JoinWatchPartyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const openAuthModal = useUiStore((s) => s.openAuthModal);
  const sending = useRef(false);
  const ready = code.replace('-', '').length === 6 && !busy;

  const join = async () => {
    // A Guest has no account to join with; the BE would only answer 401.
    if (!isAuthenticated) return openAuthModal('login');
    // Each wrong code counts toward the 15-minute lock, so a double tap must send it once.
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    const res = await watchRoomService.joinByCode(code);
    sending.current = false;
    setBusy(false);
    if (res.success && res.data) router.replace(`/watch-party/${res.data.id}` as Href);
    else setError(res.message || 'Mã phòng không đúng hoặc phòng đã đóng.');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Quay lại" hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]}>Xem cùng nhóm</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: colors.rubySoft }]}>
            <Ionicons name="people" size={34} color={colors.ruby} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Vào phòng của bạn bè</Text>
          <Text style={[styles.meta, { color: colors.textSecondary, textAlign: 'center' }]}>
            {isAuthenticated
              ? 'Nhập mã 6 ký tự bạn bè gửi. Phim phát cùng lúc theo chủ phòng, mỗi người cần quyền xem tập đó.'
              : 'Đăng nhập để vào phòng xem cùng bạn bè.'}
          </Text>
        </View>
        <TextInput
          value={code}
          onChangeText={(value) => setCode(formatRoomCodeInput(value))}
          placeholder="AB2-CD9"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          style={[styles.input, { color: colors.text, borderColor: ready ? colors.ruby : colors.border, backgroundColor: colors.card }]}
          accessibilityLabel="Mã phòng"
        />
        {error ? (
          <Text style={[styles.notice, { color: colors.text, backgroundColor: colors.rubySoft }]}>{error}</Text>
        ) : null}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.ruby, opacity: ready ? 1 : 0.5 }]}
            disabled={!ready}
            onPress={() => void join()}
          >
            <Ionicons name="enter-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>{busy ? 'Đang vào phòng…' : 'Vào phòng'}</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.meta, { color: colors.textMuted, textAlign: 'center' }]}>
          Muốn mở phòng riêng? Vào một tập phim, bấm biểu tượng nhóm rồi chọn “Tạo phòng”.
        </Text>
      </View>
    </View>
  );
}
