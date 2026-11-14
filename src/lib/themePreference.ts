import { storage, STORAGE_KEYS } from './storage';

export type ThemeMode = 'light' | 'dark';

const isThemeMode = (value: string): value is ThemeMode => value === 'light' || value === 'dark';

/** The look the viewer picked last time; `fallback` when nothing (or nothing readable) was saved. */
export async function loadThemeMode(fallback: ThemeMode): Promise<ThemeMode> {
  const saved = await storage.getString(STORAGE_KEYS.THEME_MODE, '');
  return isThemeMode(saved) ? saved : fallback;
}

export function saveThemeMode(mode: ThemeMode): Promise<void> {
  return storage.set(STORAGE_KEYS.THEME_MODE, mode);
}
