import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useFriends } from '../../hooks/useFriends';
import { friendName } from '../../lib/friends';
import { useTheme } from '../../theme';
import type { Friendship } from '../../types/watchRoom';
import { styles } from '../../styles/screens/watchParty.styles';

interface FriendsPanelProps {
  /** Invite a friend into the open room; without it the panel only manages friends. */
  onInvite?: (friendId: string) => void;
}

/**
 * BR-69 — friends next to the watch room: invite the ones already accepted, add a new friend by email and
 * answer the requests received, without leaving the room or its lobby.
 */
export const FriendsPanel: React.FC<FriendsPanelProps> = ({ onInvite }) => {
  const { colors } = useTheme();
  const { loading, failed, groups, email, setEmail, emailMessage, sending, add, accept, decline, reload } = useFriends();
  const [invited, setInvited] = useState<Set<string>>(new Set());

  const invite = (row: Friendship) => {
    if (!row.friend || !onInvite) return;
    onInvite(row.friend.id);
    setInvited((current) => new Set(current).add(row.friend!.id));
  };

  const avatar = (row: Friendship) => (
    <View style={[styles.avatar, { backgroundColor: colors.ruby }]}>
      <Text style={styles.avatarText}>{friendName(row).charAt(0).toUpperCase()}</Text>
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.cardLabel, { color: colors.textMuted }]}>{onInvite ? 'Mời bạn bè' : 'Bạn bè'}</Text>
      {loading ? <ActivityIndicator color={colors.ruby} /> : null}
      {failed ? (
        <TouchableOpacity onPress={() => void reload()} accessibilityRole="button">
          <Text style={[styles.meta, { color: colors.danger }]}>Chưa tải được danh sách bạn bè. Chạm để thử lại.</Text>
        </TouchableOpacity>
      ) : null}
      {!loading && !failed && groups.friends.length === 0 ? (
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          Chưa có bạn bè. Thêm bạn bằng email bên dưới, khi bạn ấy đồng ý là mời vào phòng được.
        </Text>
      ) : null}
      {groups.friends.map((row) => {
        const done = row.friend ? invited.has(row.friend.id) : false;
        return (
          <View key={row.id} style={styles.friendRow}>
            {avatar(row)}
            <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>
              {friendName(row)}
            </Text>
            {onInvite ? (
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: done ? colors.cardAlt : colors.ruby }]}
                onPress={() => invite(row)}
                accessibilityLabel={`Mời ${friendName(row)}`}
              >
                <Text style={[styles.smallBtnText, done && { color: colors.text }]}>{done ? 'Đã mời' : 'Mời'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}

      {groups.incoming.length ? <Text style={[styles.cardLabel, { color: colors.textMuted }]}>Lời mời kết bạn</Text> : null}
      {groups.incoming.map((row) => (
        <View key={row.id} style={styles.friendRow}>
          {avatar(row)}
          <Text style={[styles.friendName, { color: colors.text }]} numberOfLines={1}>
            {friendName(row)}
          </Text>
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: colors.cardAlt }]}
            onPress={() => decline(row)}
            accessibilityLabel={`Từ chối ${friendName(row)}`}
          >
            <Text style={[styles.smallBtnText, { color: colors.text }]}>Từ chối</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallBtn, { backgroundColor: colors.ruby }]}
            onPress={() => void accept(row)}
            accessibilityLabel={`Đồng ý ${friendName(row)}`}
          >
            <Text style={styles.smallBtnText}>Đồng ý</Text>
          </TouchableOpacity>
        </View>
      ))}
      {groups.outgoing.length ? (
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          Đang chờ {groups.outgoing.map(friendName).join(', ')} đồng ý kết bạn.
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
          onSubmitEditing={() => void add()}
          style={[
            styles.inlineInput,
            { color: colors.text, borderColor: emailMessage ? colors.danger : colors.border, backgroundColor: colors.surface },
          ]}
          accessibilityLabel="Email của bạn bè"
        />
        <TouchableOpacity
          style={[styles.smallBtn, { backgroundColor: colors.ruby, opacity: sending ? 0.6 : 1 }]}
          disabled={sending}
          onPress={() => void add()}
          accessibilityLabel="Gửi lời mời kết bạn"
        >
          <Text style={styles.smallBtnText}>{sending ? 'Đang gửi…' : 'Kết bạn'}</Text>
        </TouchableOpacity>
      </View>
      {emailMessage ? <Text style={[styles.meta, { color: colors.danger }]}>{emailMessage}</Text> : null}
    </View>
  );
};
