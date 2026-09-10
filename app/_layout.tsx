import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme';
import { AuthModal } from '../src/components/auth/AuthModal';
import { CheckInModal } from '../src/components/wallet/CheckInModal';
import { TopUpModal } from '../src/components/wallet/TopUpModal';
import { ChatModal } from '../src/components/chat/ChatModal';

function RootLayoutContent() {
  const { isDark, colors } = useTheme();

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
      <ChatModal />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider initialTheme="light">
        <RootLayoutContent />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
