import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme';
import { lockPortrait } from '../src/lib/orientation';
import { AuthModal } from '../src/components/auth/AuthModal';
import { CheckInModal } from '../src/components/wallet/CheckInModal';
import { TopUpModal } from '../src/components/wallet/TopUpModal';
import { RewardSpinModal } from '../src/components/wallet/RewardSpinModal';
import { ChatModal } from '../src/components/chat/ChatModal';

function RootLayoutContent() {
  const { isDark, colors } = useTheme();

  // app.json allows every orientation so fullscreen video can rotate; everything else stays portrait.
  React.useEffect(() => {
    void lockPortrait();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.surface} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="movie/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen name="notifications" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="search" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen
          name="watch/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack>

      {/* Global Modals */}
      <AuthModal />
      <CheckInModal />
      <TopUpModal />
      <RewardSpinModal />
      <ChatModal />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialTheme="dark">
        <RootLayoutContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
