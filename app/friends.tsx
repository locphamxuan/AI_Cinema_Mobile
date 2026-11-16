import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useState, type ReactNode } from 'react';
import { ScreenHeader } from '../src/components/common/ScreenHeader';
import { FormField } from '../src/components/common/FormField';
import { Button } from '../src/components/common/Button';
import { useFriends } from '../src/hooks/useFriends';
import { friendName } from '../src/lib/friends';
import { useSessionStore, useUiStore } from '../src/store';
import { useTheme } from '../src/theme';
import type { Friendship } from '../src/types/watchRoom';
import { styles } from '../src/styles/screens/friends.styles';

/** BR-69 — friends to invite into a watch room: add one by email, answer requests, block and unblock. */
export default function FriendsScreen() {
  const { colors } = useTheme();
  const { isAuthenticated } = useSessionStore();
  const { openAuthModal } = useUiStore();
  const f = useFriends();
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await f.reload();
    setRefreshing(false);
  };

  const row = (item: Friendship, actions: ReactNode, note?: string) => (
    <View key={item.id} style={[styles.row, { backgroundColor: colors.card }]}>
      <View style={[styles.avatar, { backgroundColor: colors.rubySoft }]}>
        <Text style={[styles.avatarText, { color: colors.ruby }]}>{friendName(item).charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {friendName(item)}
        </Text>
        {note ? <Text style={[styles.note, { color: colors.textMuted }]}>{note}</Text> : null}
      </View>
      {actions}
    </View>
  );

  const action = (label: string, onPress: () => void, strong?: boolean) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.action, { backgroundColor: strong ? colors.ruby : colors.cardAlt }]}
      accessibilityRole="button"
    >
      <Text style={[styles.actionText, { color: strong ? colors.white : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Bạn bè" />
        <View style={styles.body}>
          <Text style={[styles.empty, { color: colors.textMuted }]}>Đăng nhập để kết bạn và mời nhau xem cùng.</Text>
          <Button label="Đăng nhập" onPress={() => openAuthModal('login')} />
        </View>
      </View>
    );
  }

  const { friends, incoming, outgoing, blocked } = f.groups;
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ruby} />}
    >
      <ScreenHeader title="Bạn bè" />
      <View style={styles.body}>
        <View style={[styles.addCard, { backgroundColor: colors.card }]}>
          <FormField
            label="Thêm bạn bằng email"
            value={f.email}
            onChangeText={f.setEmail}
            placeholder="ten@gmail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={() => void f.add()}
            hint="Khi bạn ấy đồng ý, hai bạn mời nhau vào phòng xem nhóm được."
            error={f.emailMessage}
          />
          <Button label="Gửi lời mời kết bạn" onPress={() => void f.add()} loading={f.sending} />
        </View>

        {f.loading ? <ActivityIndicator color={colors.ruby} style={styles.loading} /> : null}
        {f.failed ? (
          <View style={styles.failed}>
            <Text style={[styles.empty, { color: colors.textMuted }]}>Chưa tải được danh sách bạn bè.</Text>
            <Button label="Thử lại" variant="secondary" onPress={() => void f.reload()} />
          </View>
        ) : null}

        {incoming.length ? <Text style={[styles.section, { color: colors.text }]}>Lời mời kết bạn</Text> : null}
        {incoming.map((item) =>
          row(
            item,
            <View style={styles.actions}>
              {action('Từ chối', () => f.decline(item))}
              {action('Đồng ý', () => void f.accept(item), true)}
            </View>,
          ),
        )}

        {!f.loading && !f.failed ? (
          <Text style={[styles.section, { color: colors.text }]}>Bạn bè ({friends.length})</Text>
        ) : null}
        {!f.loading && !f.failed && friends.length === 0 ? (
          <Text style={[styles.none, { color: colors.textMuted }]}>Chưa có bạn bè nào. Gửi lời mời bằng email ở trên.</Text>
        ) : null}
        {friends.map((item) => row(item, action('Chặn', () => f.block(item))))}

        {outgoing.length ? <Text style={[styles.section, { color: colors.text }]}>Đang chờ đồng ý</Text> : null}
        {outgoing.map((item) => row(item, null, 'Đã gửi lời mời'))}

        {blocked.length ? <Text style={[styles.section, { color: colors.text }]}>Đã chặn</Text> : null}
        {blocked.map((item) => row(item, action('Bỏ chặn', () => void f.unblock(item))))}
      </View>
    </ScrollView>
  );
}
