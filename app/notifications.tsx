import React from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../src/components/common/ScreenHeader';
import { notificationService, type AppNotification } from '../src/services/notificationService';
import { MEMBER_NOTIFICATION_TABS, notificationIcon } from '../src/lib/notificationTabs';
import { dayKey } from '../src/lib/releaseDays';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme';
import { styles } from '../src/styles/screens/notifications.styles';

const PAGE_SIZE = 20;

/** "14:05" for today, "14:05, 12/10" for earlier days, the year only when it is not this one. */
function when(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (dayKey(d) === dayKey(now)) return time;
  const year = d.getFullYear() === now.getFullYear() ? '' : `/${d.getFullYear()}`;
  return `${time}, ${d.getDate()}/${d.getMonth() + 1}${year}`;
}

/** The Member's notifications in tabs: Coin in and out, the monthly plan, refunds and rewards. */
export default function NotificationsScreen() {
  const { colors } = useTheme();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [tab, setTab] = React.useState(MEMBER_NOTIFICATION_TABS[0]);
  const [items, setItems] = React.useState<AppNotification[]>([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(
    async (next: number) => {
      setLoading(true);
      const res = await notificationService.list(tab.types, next, PAGE_SIZE);
      const rows = res.success ? res.data?.data ?? [] : [];
      setItems((prev) => (next === 1 ? rows : [...prev, ...rows]));
      setTotalPages(res.success ? res.data?.meta?.totalPages ?? 1 : 1);
      setPage(next);
      setLoading(false);
    },
    [tab],
  );

  React.useEffect(() => {
    if (isAuthenticated) void load(1);
  }, [isAuthenticated, load]);

  const open = async (item: AppNotification) => {
    if (!item.readAt) {
      await notificationService.markRead(item.id);
      setItems((list) => list.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)));
    }
  };

  const readAll = async () => {
    await notificationService.markAllRead();
    setItems((list) => list.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  };

  const hasUnread = items.some((n) => !n.readAt);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Thông báo"
        right={
          hasUnread ? (
            <TouchableOpacity onPress={readAll} hitSlop={10} accessibilityLabel="Đánh dấu đã đọc hết">
              <Ionicons name="checkmark-done" size={22} color={colors.ruby} />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsBar} contentContainerStyle={styles.tabs}>
        {MEMBER_NOTIFICATION_TABS.map((t) => {
          const on = t.key === tab.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, on && { backgroundColor: colors.rubySoft }]}
              onPress={() => setTab(t)}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
            >
              <Text style={[on ? styles.tabOn : styles.tabOff, { color: on ? colors.ruby : colors.textMuted }]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {!isAuthenticated ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>Đăng nhập để xem thông báo về Coin và gói Tháng.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
          onEndReached={() => !loading && page < totalPages && void load(page + 1)}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={loading ? null : <Text style={[styles.empty, { color: colors.textMuted }]}>Mục này chưa có thông báo.</Text>}
          ListFooterComponent={loading ? <ActivityIndicator color={colors.ruby} style={styles.loading} /> : null}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.item} onPress={() => void open(item)} accessibilityState={{ selected: !item.readAt }}>
              <View style={[styles.icon, { backgroundColor: colors.card }]}>
                <Ionicons name={notificationIcon(item.type) as never} size={18} color={item.readAt ? colors.textMuted : colors.ruby} />
              </View>
              <View style={styles.itemBody}>
                <Text style={[item.readAt ? styles.itemTitle : styles.itemTitleUnread, { color: item.readAt ? colors.textSecondary : colors.text }]}>
                  {item.title}
                </Text>
                {item.body ? <Text style={[styles.itemText, { color: colors.textMuted }]}>{item.body}</Text> : null}
                <Text style={[styles.itemTime, { color: colors.textMuted }]}>{when(item.createdAt)}</Text>
              </View>
              {!item.readAt && <View style={[styles.unread, { backgroundColor: colors.ruby }]} />}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
