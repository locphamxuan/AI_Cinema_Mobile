import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { showDialog } from '../src/lib/dialog';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../src/components/common/ScreenHeader';
import { deviceService } from '../src/services/deviceService';
import { deviceIcon, lastSeenLabel } from '../src/lib/device';
import { clock } from '../src/lib/vtt';
import { useAppStore } from '../src/store/useAppStore';
import { useTheme } from '../src/theme';
import type { DeviceOverview, LiveStream, RegisteredDevice } from '../src/types/device';
import { styles } from '../src/styles/screens/devices.styles';

/**
 * MF-4: the devices the member registered and what plays on them right now, against the limits
 * of the current plan. Removing a device or ending a stream frees a slot for another device.
 */
export default function DevicesScreen() {
  const { colors } = useTheme();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [data, setData] = React.useState<DeviceOverview | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    const res = await deviceService.overview();
    if (res.success) setData(res.data);
    setLoading(false);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (isAuthenticated) void load();
    }, [isAuthenticated, load]),
  );

  const run = async (id: string, action: () => Promise<{ success: boolean; message?: string }>) => {
    setBusyId(id);
    const res = await action();
    setBusyId(null);
    if (!res.success) showDialog('Không thực hiện được', res.message || 'Vui lòng thử lại.');
    await load();
  };

  const removeDevice = (device: RegisteredDevice) =>
    showDialog(
      'Gỡ thiết bị?',
      device.current
        ? 'Đây là máy bạn đang dùng. Lần xem tới, máy này sẽ được đăng ký lại nếu gói còn chỗ.'
        : `"${device.name}" sẽ dừng phát ngay và phải đăng ký lại khi xem tiếp.`,
      [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Gỡ thiết bị', style: 'destructive', onPress: () => void run(device.id, () => deviceService.remove(device.id)) },
      ],
    );

  const endStream = (stream: LiveStream) =>
    showDialog('Dừng phát?', `"${stream.episode.movieTitle}" sẽ dừng trên thiết bị đó để bạn xem ở máy khác.`, [
      { text: 'Để sau', style: 'cancel' },
      { text: 'Dừng phát', style: 'destructive', onPress: () => void run(stream.id, () => deviceService.endStream(stream.id)) },
    ]);

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const nameOf = (deviceId: string | null) => data?.devices.find((d) => d.id === deviceId)?.name ?? 'Thiết bị đã gỡ';

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.ruby} />}
    >
      <ScreenHeader title="Thiết bị của tôi" />
      {!isAuthenticated ? (
        <Text style={[styles.empty, { color: colors.textMuted }]}>Đăng nhập để xem các thiết bị đang dùng tài khoản.</Text>
      ) : loading || !data ? (
        <ActivityIndicator color={colors.ruby} style={styles.loading} />
      ) : (
        <View style={styles.body}>
          <View style={[styles.summary, { backgroundColor: colors.card }]}>
            <Limit label="Thiết bị đã đăng ký" used={data.devices.length} max={data.limits.maxRegisteredDevices} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Limit label="Đang xem cùng lúc" used={data.activeSessions.length} max={data.limits.maxConcurrentStreams} />
          </View>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Giới hạn theo gói hiện tại. Gỡ thiết bị không còn dùng hoặc dừng phát ở máy khác để xem trên máy này.
          </Text>

          <Text style={[styles.section, { color: colors.text }]}>Đang phát</Text>
          {data.activeSessions.length === 0 ? (
            <Text style={[styles.none, { color: colors.textMuted }]}>Không có thiết bị nào đang phát.</Text>
          ) : (
            data.activeSessions.map((stream) => (
              <View key={stream.id} style={[styles.row, { backgroundColor: colors.card }]}>
                <View style={[styles.icon, { backgroundColor: colors.rubySoft }]}>
                  <Ionicons name="play" size={18} color={colors.ruby} />
                </View>
                <View style={styles.info}>
                  <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                    {stream.episode.movieTitle} · Tập {stream.episode.episodeNumber}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
                    {nameOf(stream.deviceId)} · đang ở {clock(stream.positionSeconds)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.action, { borderColor: colors.border }]}
                  onPress={() => endStream(stream)}
                  disabled={busyId === stream.id}
                  accessibilityLabel={`Dừng phát ${stream.episode.movieTitle}`}
                >
                  <Text style={[styles.actionText, { color: colors.danger }]}>Dừng</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          <Text style={[styles.section, { color: colors.text }]}>Thiết bị đã đăng ký</Text>
          {data.devices.length === 0 ? (
            <Text style={[styles.none, { color: colors.textMuted }]}>Thiết bị được đăng ký khi bạn bắt đầu xem phim.</Text>
          ) : (
            data.devices.map((device) => (
              <View key={device.id} style={[styles.row, { backgroundColor: colors.card }]}>
                <View style={[styles.icon, { backgroundColor: colors.cardAlt }]}>
                  <Ionicons name={deviceIcon(device.platform) as never} size={18} color={colors.textSecondary} />
                </View>
                <View style={styles.info}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                      {device.name}
                    </Text>
                    {device.current ? (
                      <Text style={[styles.badge, { color: colors.ruby, backgroundColor: colors.rubySoft }]}>Máy này</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.meta, { color: colors.textMuted }]}>Xem lần cuối: {lastSeenLabel(device.lastSeenAt)}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.action, { borderColor: colors.border }]}
                  onPress={() => removeDevice(device)}
                  disabled={busyId === device.id}
                  accessibilityLabel={`Gỡ ${device.name}`}
                >
                  <Text style={[styles.actionText, { color: colors.danger }]}>Gỡ</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

function Limit({ label, used, max }: { label: string; used: number; max: number }) {
  const { colors } = useTheme();
  return (
    <View style={styles.limit}>
      <Text style={[styles.limitValue, { color: used >= max ? colors.ruby : colors.text }]}>
        {used}/{max}
      </Text>
      <Text style={[styles.limitLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}
