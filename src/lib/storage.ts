import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  REMEMBERED_EMAIL: 'ai_cinema_remembered_email',
  REMEMBERED_PASSWORD: 'ai_cinema_remembered_password',
  REMEMBER_ME: 'ai_cinema_remember_me',
  AUTH_TOKEN: 'ai_cinema_auth_token',
  USER_DATA: 'ai_cinema_user_data',
  WALLET_DATA: 'ai_cinema_wallet_data',
} as const;

export const storage = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const item = await AsyncStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  async getString(key: string, defaultValue = ''): Promise<string> {
    try {
      return (await AsyncStorage.getItem(key)) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      if (typeof value === 'string') {
        await AsyncStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.error('Error saving to AsyncStorage key:', key, e);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Error removing AsyncStorage key:', key, e);
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Error clearing AsyncStorage:', e);
    }
  },
};
