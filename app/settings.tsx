
import { View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter, type Href } from 'expo-router';
import { ScreenHeader } from '../src/components/common/ScreenHeader';
import { MenuCard, MenuRow } from '../src/components/common/MenuRow';
import { useTheme } from '../src/theme';
import { useSessionStore } from '../src/store';
import { styles } from '../src/styles/screens/settings.styles';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  // Signing out lives on Hồ sơ, where the account is; Cài đặt only holds app preferences.
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

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
            <MenuRow icon="person-circle-outline" label="Tài khoản" onPress={() => router.push('/account' as Href)} last />
          </MenuCard>
        )}
      </View>
    </View>
  );
}
