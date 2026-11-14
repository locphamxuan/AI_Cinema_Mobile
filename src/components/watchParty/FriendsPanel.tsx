import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showDialog } from '../../lib/dialog';
import { watchRoomService } from '../../services/watchRoomService';
import { useTheme } from '../../theme';
import type { Friendship } from '../../types/watchRoom';
import { styles } from '../../styles/screens/watchParty.styles';

interface FriendsPanelProps {
  /** Invite a friend into the open room; without it the panel only manages friends. */
  onInvite?: (friendId: string) => void;
}

const nameOf = (row: Friendship) => row.friend?.fullName || 'Thành viên AI Cinema';
const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * BR-69 — friends next to the watch room: invite the ones already accepted, add a new friend by email and
 * answer the requests received, without leaving the room or its lobby.
 */
export const FriendsPanel: React.FC<FriendsPanelProps> = ({ onInvite }) => {
  const { colors } = useTheme();
  const [rows, setRows] = useState<Friendship[] | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [invited, setInvited] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const res = await watchRoomService.friends();
    setRows(res.success && Array.isArray(res.data) ? res.data : []);
  }, []);

  useEffect(() => {
    let active = true;
    void watchRoomService.friends().then((res) => {
      if (active) setRows(res.success && Array.isArray(res.data) ? res.data : []);
    });
    return () => {
      active = false;
    };
  }, []);

  const add = async () => {
    setBusy(true);
    const res = await watchRoomService.addFriendByEmail(email);
    setBusy(false);
    if (!res.success) return showDialog('Chưa gửi được', res.message || 'Không tìm thấy thành viên với email này.');
    setEmail('');
    showDialog('Đã gửi lời mời kết bạn', 'Khi bạn ấy chấp nhận, bạn có thể mời vào phòng.');
    void load();
  };

  const respond = async (row: Friendship, accept: boolean) => {
    const res = await watchRoomService.respond(row.id, accept);
    if (!res.success) showDialog('Chưa trả lời được', res.message);
    void load();
  };

  const invite = (row: Friendship) => {
    if (!row.friend || !onInvite) return;
    onInvite(row.friend.id);
    setInvited((current) => new Set(current).add(row.friend!.id));
  };

  const friends = (rows ?? []).filter((r) => r.status === 'ACCEPTED');
  const incoming = (rows ?? []).filter((r) => r.status === 'PENDING' && r.incoming);
  const outgoing = (rows ?? []).filter((r) => r.status === 'PENDING' && !r.incoming);
  const canAdd = looksLikeEmail(email) && !busy;

  const avatar = (row: Friendship) => (
    <View style={[styles.avatar, { backgroundColor: colors.ruby }]}>
      <Text style={styles.avatarText}>{nameOf(row).charAt(0).toUpperCase()}</Text>
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{onInvite ? 'Mời bạn bè' : 'Bạn bè'}</Text>
      {rows === null ? <ActivityIndicator color={colors.ruby} /> : null}
      {rows !== null && friends.length === 0 ? (
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          Chưa có bạn bè. Thêm bạn bằng email bên dưới, khi bạn ấy đồng ý là mời vào phòng được.
        </Text>
      ) : null}
      {friends.map((row) => {
        const done = row.friend ? invited.has(row.friend.id) : false;
        return (
          <View key={row.id} style={styles.friendRow}>
            {avatar(row)}
            <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>
              {nameOf(row)}
            </Text>
            {onInvite ? (
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: done ? colors.cardAlt : colors.ruby }]}
                onPress={() => invite(row)}
                accessibilityLabel={`Mời ${nameOf(row)}`}
              >
                <Text style={[styles.smallBtnText, done && { color: colors.text }]}>{done ? 'Đã mời' : 'Mời'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}

      {incoming.length ? <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Lời mời kết bạn</Text> : null}
      {incoming.map((row) => (
        <View key={row.id} style={styles.friendRow}>
          {avatar(row)}
          <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>
            {nameOf(row)}
          </Text>
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: colors.cardAlt }]}
            onPress={() => void respond(row, false)}
            accessibilityLabel={`Từ chối ${nameOf(row)}`}
          >
            <Text style={[styles.smallBtnText, { color: colors.text }]}>Từ chối</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: colors.ruby }]}
            onPress={() => void respond(row, true)}
            accessibilityLabel={`Đồng ý ${nameOf(row)}`}
          >
            <Text style={styles.smallBtnText}>Đồng ý</Text>
          </TouchableOpacity>
        </View>
      ))}
      {outgoing.length ? (
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          Đang chờ {outgoing.map(nameOf).join(', ')} đồng ý kết bạn.
        </Text>
      ) : null}

      <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Kết bạn bằng email</Text>
      <View style={styles.friendRow}>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="email@ban-be.com"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.inlineInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
          accessibilityLabel="Email của bạn bè"
        />
        <TouchableOpacity
          style={[styles.smallBtn, { backgroundColor: colors.ruby, opacity: canAdd ? 1 : 0.5 }]}
          disabled={!canAdd}
          onPress={() => void add()}
          accessibilityLabel="Gửi lời mời kết bạn"
        >
          <Text style={styles.smallBtnText}>{busy ? 'Đang gửi…' : 'Kết bạn'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
