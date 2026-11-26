import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../common/Button';
import { useUiStore } from '../../store';
import { useTheme } from '../../theme';
import type { WatchPartyAccessStatus } from '../../hooks/useWatchPartyAccess';

interface WatchPartyAccessGateProps {
  status: WatchPartyAccessStatus;
  message: string | null;
  onRetry: () => void;
}

/** A clear permission gate with an upgrade path; it never grants access from cached account state. */
export function WatchPartyAccessGate({ status, message, onRetry }: WatchPartyAccessGateProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const openAuthModal = useUiStore((state) => state.openAuthModal);

  if (status === 'allowed') return null;

  const title =
    status === 'loading'
      ? 'Đang kiểm tra gói Tháng'
      : status === 'sign-in'
        ? 'Đăng nhập để xem cùng nhóm'
        : status === 'error'
          ? 'Chưa kiểm tra được quyền truy cập'
          : 'Cần gói Tháng còn hiệu lực';
  const description =
    status === 'loading'
      ? 'Đang kiểm tra trạng thái gói với máy chủ.'
      : status === 'sign-in'
        ? 'Đăng nhập bằng tài khoản thành viên để tiếp tục.'
        : status === 'error'
          ? message || 'Kiểm tra kết nối rồi thử lại.'
          : 'Chỉ thành viên có gói Tháng còn hiệu lực mới được tạo hoặc tham gia phòng. Gói Tháng được tặng cũng được tính.';

  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 28 }}
      accessibilityRole="alert"
    >
      <View
        style={{
          width: '100%',
          maxWidth: 420,
          alignItems: 'center',
          gap: 16,
          padding: 24,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        }}
      >
        {status === 'loading' ? (
          <ActivityIndicator color={colors.ruby} />
        ) : (
          <Ionicons
            name={status === 'error' ? 'cloud-offline-outline' : 'people-outline'}
            size={32}
            color={colors.ruby}
          />
        )}
        <Text style={{ color: colors.text, fontSize: 20, textAlign: 'center' }}>{title}</Text>
        <Text style={{ color: colors.textSecondary, lineHeight: 22, textAlign: 'center' }}>{description}</Text>
        {status === 'loading' ? null : status === 'error' ? (
          <Button label="Thử lại" onPress={onRetry} icon="refresh-outline" />
        ) : status === 'sign-in' ? (
          <Button label="Đăng nhập" onPress={() => openAuthModal('login')} icon="log-in-outline" />
        ) : (
          <Button label="Xem gói Tháng" onPress={() => router.push('/vip')} icon="ticket-outline" />
        )}
        {status !== 'loading' ? (
          <Button label="Quay lại" variant="quiet" onPress={() => router.back()} />
        ) : null}
      </View>
    </View>
  );
}
