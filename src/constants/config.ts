import { Platform } from 'react-native';

/**
 * AI Cinema Mobile - Network & API Configuration
 * Supports Android Emulator (10.0.2.2), iOS Simulator / Web (localhost),
 * and custom LAN IP via EXPO_PUBLIC_API_URL environment variable.
 */
const getBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Android emulator maps 10.0.2.2 to the development host machine's 127.0.0.1
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api';
  }

  // iOS Simulator & Web run on localhost
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
