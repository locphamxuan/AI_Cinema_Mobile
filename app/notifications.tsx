import React from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notificationService, type AppNotification } from '../src/services/notificationService';
import { MEMBER_NOTIFICATION_TABS, notificationIcon } from '../src/lib/notificationTabs';
import { useAppStore } from '../src/store/useAppStore';

const PAGE_SIZE = 20;

function when(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

/** The Member's notifications in tabs: Coin in and out, the monthly plan, refunds and rewards. */
export default function NotificationsScreen() {
  const router = useRouter();
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Quay lại">
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Thông báo</Text>
        <TouchableOpacity onPress={readAll} accessibilityLabel="Đánh dấu đã đọc hết">
          <Ionicons name="checkmark-done" size={20} color="#FF3D7F" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsBar} contentContainerStyle={styles.tabs}>
        {MEMBER_NOTIFICATION_TABS.map((t) => (
          <TouchableOpacity key={t.key} style={[styles.tab, t.key === tab.key && styles.tabActive]} onPress={() => setTab(t)} accessibilityRole="tab" accessibilityState={{ selected: t.key === tab.key }}>
            <Text style={[styles.tabText, t.key === tab.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!isAuthenticated ? (
        <Text style={styles.empty}>Đăng nhập để xem thông báo của bạn.</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          onEndReached={() => !loading && page < totalPages && void load(page + 1)}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={loading ? null : <Text style={styles.empty}>Chưa có thông báo nào ở mục này.</Text>}
          ListFooterComponent={loading ? <ActivityIndicator color="#FF3D7F" style={{ marginVertical: 16 }} /> : null}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.item, !item.readAt && styles.itemUnread]} onPress={() => void open(item)}>
              <Ionicons name={notificationIcon(item.type) as never} size={20} color={item.readAt ? '#71717A' : '#FF3D7F'} />
              <View style={styles.itemBody}>
                <Text style={[styles.itemTitle, !item.readAt && styles.itemTitleUnread]}>{item.title}</Text>
                {item.body ? <Text style={styles.itemText}>{item.body}</Text> : null}
                <Text style={styles.itemTime}>{when(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  tabsBar: { flexGrow: 0 },
  tabs: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#18181B', borderWidth: 1, borderColor: '#27272A' },
  tabActive: { backgroundColor: '#FF3D7F', borderColor: '#FF3D7F' },
  tabText: { color: '#8E8E93', fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: '#FFFFFF' },
  list: { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  item: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, backgroundColor: '#111113' },
  itemUnread: { backgroundColor: '#132019' },
  itemBody: { flex: 1, gap: 2 },
  itemTitle: { color: '#D4D4D8', fontSize: 13 },
  itemTitleUnread: { color: '#FFFFFF', fontWeight: '800' },
  itemText: { color: '#8E8E93', fontSize: 12 },
  itemTime: { color: '#71717A', fontSize: 10, marginTop: 2 },
  empty: { color: '#8E8E93', fontSize: 13, textAlign: 'center', marginTop: 40 },
});