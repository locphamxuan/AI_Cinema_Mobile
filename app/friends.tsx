import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showDialog } from '../src/lib/dialog';
import { watchRoomService } from '../src/services/watchRoomService';
import { useTheme } from '../src/theme';
import type { Friendship } from '../src/types/watchRoom';
import { styles } from '../src/styles/screens/watchParty.styles';

/** BR-69 — friends to invite into a watch room: add one by email, answer requests, see the list. */
export default function FriendsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [rows, setRows] = useState<Friendship[]>([]);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await watchRoomService.friends();
    if (res.success && Array.isArray(res.data)) setRows(res.data);
  }, []);

  useEffect(() => {
    let active = true;
    void watchRoomService.friends().then((res) => {
      if (active && res.success && Array.isArray(res.data)) setRows(res.data);
    });
    return () => {
      active = false;
    };
  }, []);

  const add = async () => {
    setBusy(true);
    const res = await watchRoomService.addFriendByEmail(email);
    setBusy(false);
    if (res.success) {
      setEmail('');
      showDialog('Đã gửi lời mời kết bạn', 'Khi bạn ấy chấp nhận, bạn có thể mời vào phòng xem nhóm.');
      void load();
    } else {
      showDialog('Chưa gửi được', res.message || 'Không tìm thấy thành viên với email này.');
    }
  };

  const respond = async (row: Friendship, accept: boolean) => {
    const res = await watchRoomService.respond(row.id, accept);
    if (!res.success) showDialog('Chưa trả lời được', res.message);
    void load();
  };

  const incoming = rows.filter((r) => r.status === 'PENDING' && r.incoming);
  const outgoing = rows.filter((r) => r.status === 'PENDING' && !r.incoming);
  const friends = rows.filter((r) => r.status === 'ACCEPTED');
  const name = (r: Friendship) => r.friend?.fullName || 'Thành viên AI Cinema';

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.body, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Bạn bè</Text>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>Thêm bạn bằng email để mời vào phòng xem nhóm.</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="email@cua-ban.com"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        style={[styles.input, { color: colors.text, borderColor: colors.ruby, fontSize: 16, letterSpacing: 0, fontWeight: '400', textAlign: 'left' }]}
        accessibilityLabel="Email người bạn"
      />
      <TouchableOpacity
        style={[styles.button, { flex: 0, backgroundColor: colors.ruby, opacity: busy || !email.includes('@') ? 0.6 : 1 }]}
        disabled={busy || !email.includes('@')}
        onPress={() => void add()}
      >
        <Text style={styles.buttonText}>Gửi lời mời kết bạn</Text>
      </TouchableOpacity>

      {incoming.length ? <Text style={[styles.title, { color: colors.text, fontSize: 16 }]}>Lời mời kết bạn</Text> : null}
      {incoming.map((r) => (
        <View key={r.id} style={styles.row}>
          <Text style={[styles.meta, { color: colors.text, flex: 1 }]}>{name(r)}</Text>
          <TouchableOpacity onPress={() => void respond(r, true)} accessibilityLabel={`Chấp nhận ${name(r)}`}>
            <Text style={{ color: colors.ruby, fontWeight: '700', marginRight: 16 }}>Chấp nhận</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void respond(r, false)} accessibilityLabel={`Từ chối ${name(r)}`}>
            <Text style={{ color: colors.textMuted }}>Từ chối</Text>
          </TouchableOpacity>
        </View>
      ))}

      <Text style={[styles.title, { color: colors.text, fontSize: 16 }]}>Bạn bè ({friends.length})</Text>
      {friends.length === 0 ? (
        <Text style={[styles.meta, { color: colors.textMuted }]}>Chưa có bạn bè nào.</Text>
      ) : (
        friends.map((r) => (
          <Text key={r.id} style={[styles.meta, { color: colors.text }]}>
            • {name(r)}
          </Text>
        ))
      )}
      {outgoing.length ? (
        <Text style={[styles.meta, { color: colors.textMuted }]}>Đang chờ chấp nhận: {outgoing.map(name).join(', ')}</Text>
      ) : null}
    </ScrollView>
  );
}
