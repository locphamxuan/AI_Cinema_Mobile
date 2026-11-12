import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { watchRoomService } from '../../src/services/watchRoomService';
import { useTheme } from '../../src/theme';
import { styles } from '../../src/styles/screens/watchParty.styles';

/** BR-69 — join a friend's watch room with the XXX-XXX code they shared. */
export default function JoinWatchPartyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = code.trim().length >= 4 && !busy;

  const join = async () => {
    setBusy(true);
    setError(null);
    const res = await watchRoomService.joinByCode(code);
    setBusy(false);
    if (res.success && res.data) router.replace(`/watch-party/${res.data.id}` as Href);
    else setError(res.message || 'Mã phòng không đúng hoặc phòng đã đóng.');
  };

  return (
    <View style={[styles.container, styles.body, { backgroundColor: colors.background, paddingTop: insets.top + 24 }]}>
      <Text style={[styles.title, { color: colors.text }]}>Tham gia phòng xem nhóm</Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>Nhập mã phòng bạn bè gửi (ví dụ AB2-CD9).</Text>
      <TextInput
        value={code}
        onChangeText={(value) => setCode(value.toUpperCase())}
        placeholder="XXX-XXX"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="characters"
        maxLength={16}
        style={[styles.input, { color: colors.text, borderColor: colors.ruby }]}
        accessibilityLabel="Mã phòng"
      />
      {error ? (
        <Text style={[styles.notice, { color: colors.text, backgroundColor: colors.rubySoft }]}>{error}</Text>
      ) : null}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.ruby, opacity: ready ? 1 : 0.6 }]}
        disabled={!ready}
        onPress={() => void join()}
      >
        <Text style={styles.buttonText}>{busy ? 'Đang vào phòng…' : 'Vào phòng'}</Text>
      </TouchableOpacity>
    </View>
  );
}
