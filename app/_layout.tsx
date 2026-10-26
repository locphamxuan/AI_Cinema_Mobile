import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
// One import per weight so only the six files in use are bundled, not the whole family.
import { BeVietnamPro_400Regular } from '@expo-google-fonts/be-vietnam-pro/400Regular';
import { BeVietnamPro_500Medium } from '@expo-google-fonts/be-vietnam-pro/500Medium';
import { BeVietnamPro_600SemiBold } from '@expo-google-fonts/be-vietnam-pro/600SemiBold';
import { BeVietnamPro_700Bold } from '@expo-google-fonts/be-vietnam-pro/700Bold';
import { Phudu_700Bold } from '@expo-google-fonts/phudu/700Bold';
import { Phudu_800ExtraBold } from '@expo-google-fonts/phudu/800ExtraBold';
import { ThemeProvider, useTheme } from '../src/theme';
import { lockPortrait } from '../src/lib/orientation';
import { AuthModal } from '../src/components/auth/AuthModal';
import { CheckInModal } from '../src/components/wallet/CheckInModal';
import { TopUpModal } from '../src/components/wallet/TopUpModal';
import { RewardSpinModal } from '../src/components/wallet/RewardSpinModal';
import { ChatModal } from '../src/components/chat/ChatModal';

// Text would flash in the system font otherwise.
void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootLayoutContent() {
  const { isDark, colors } = useTheme();

  // app.json allows every orientation so fullscreen video can rotate; everything else stays portrait.
  React.useEffect(() => {
    void lockPortrait();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="movie/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="search" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="wallet" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="watch/[id]" options={{ headerShown: false, animation: 'slide_from_right' }} />
      </Stack>

      <AuthModal />
      <CheckInModal />
      <TopUpModal />
      <RewardSpinModal />
      <ChatModal />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
    Phudu_700Bold,
    Phudu_800ExtraBold,
  });
  const ready = fontsLoaded || Boolean(fontError);

  React.useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  // A font that fails to load falls back to the system face rather than blocking the app.
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider initialTheme="dark">
        <RootLayoutContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
