
import { View, Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { ScreenHeader } from '../src/components/common/ScreenHeader';
import { MenuCard, MenuRow } from '../src/components/common/MenuRow';
import { useTheme } from '../src/theme';
import { useAppStore } from '../src/store/useAppStore';
import { styles } from '../src/styles/screens/settings.styles';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAppStore();

  const signOut = () => {
    const leave = () => {
      logout();
      router.back();
    };
    // Alert buttons are not supported on web.
    if (Platform.OS === 'web') return leave();
    Alert.alert('Đăng xuất?', 'Ví Coin và gói Tháng vẫn giữ nguyên, bạn đăng nhập lại là thấy.', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: leave },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Cài đặt" />
      <View style={styles.body}>
        <MenuCard>
          <MenuRow icon="contrast-outline" label="Giao diện" value={isDark ? 'Tối' : 'Sáng'} onPress={toggleTheme} />
          <MenuRow icon="information-circle-outline" label="Phiên bản" value={Constants.expoConfig?.version ?? '1.0.0'} last />
        </MenuCard>
        {isAuthenticated && (
          <MenuCard>
            <MenuRow icon="log-out-outline" label="Đăng xuất" danger onPress={signOut} last />
          </MenuCard>
        )}
      </View>
    </View>
  );
}
