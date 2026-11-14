import { Platform } from 'react-native';

/**
 * AI Cinema Mobile - Network & API Configuration
 * Supports Android Emulator (10.0.2.2), iOS Simulator (localhost), Web (same-origin /api proxy),
 * and custom LAN IP via EXPO_PUBLIC_API_URL environment variable (phones only).
 */
export const getBaseUrl = (os: string = Platform.OS, lanUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL): string => {
  // Web calls its own origin; the Metro dev server proxies /api to the backend (metro.config.js), so the
  // browser never makes a cross-origin request that the backend CORS list would block. EXPO_PUBLIC_API_URL
  // is the LAN IP a real phone uses; it changes with the Wi-Fi and is not in CORS, so the web ignores it.
  if (os === 'web') {
    return '/api';
  }

  if (lanUrl) {
    return lanUrl;
  }

  // Android emulator maps 10.0.2.2 to the development host machine's 127.0.0.1
  if (os === 'android') {
    return 'http://10.0.2.2:3001/api';
  }

  // iOS Simulator runs on localhost
  return 'http://localhost:3001/api';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT_MS: 15000,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;
