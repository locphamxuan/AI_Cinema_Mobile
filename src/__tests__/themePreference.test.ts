import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadThemeMode, saveThemeMode } from '../lib/themePreference';
import { STORAGE_KEYS } from '../lib/storage';

afterEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe('theme preference', () => {
  it('brings back the look saved last time', async () => {
    await saveThemeMode('light');
    expect(await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE)).toBe('light');
    expect(await loadThemeMode('dark')).toBe('light');
  });

  it('keeps the default when nothing was saved or the value is unknown', async () => {
    expect(await loadThemeMode('dark')).toBe('dark');
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, 'sepia');
    expect(await loadThemeMode('dark')).toBe('dark');
  });

  it('keeps the default when the storage cannot be read', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValue(new Error('disk error'));
    expect(await loadThemeMode('dark')).toBe('dark');
  });
});
