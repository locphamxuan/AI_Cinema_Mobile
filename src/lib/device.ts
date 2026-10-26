import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { uuidV4 } from './playback';
import { storage, STORAGE_KEYS } from './storage';

/** UUID v4 of this install (X-Device-Id); the BE registers it against the plan's device limit (MF-4). */
export async function deviceKey(): Promise<string> {
  const saved = await storage.getString(STORAGE_KEYS.DEVICE_ID);
  if (saved) return saved;
  const key = uuidV4();
  await storage.set(STORAGE_KEYS.DEVICE_ID, key);
  return key;
}

const PLATFORM_NAMES: Record<string, string> = { ios: 'iPhone / iPad', android: 'Điện thoại Android', web: 'Trình duyệt web' };

/** How the device list names this install: the name the owner gave the phone, else its kind. */
export function deviceIdentity(): { deviceName: string; devicePlatform: string } {
  const name = Constants.deviceName?.trim() || PLATFORM_NAMES[Platform.OS] || 'Thiết bị di động';
  return { deviceName: name.slice(0, 120), devicePlatform: Platform.OS.toUpperCase() };
}

const PLATFORM_ICONS: Record<string, string> = { IOS: 'phone-portrait-outline', ANDROID: 'phone-portrait-outline', WEB: 'laptop-outline' };

/** Ionicons name for a registered device's platform. */
export function deviceIcon(platform: string): string {
  return PLATFORM_ICONS[platform] ?? 'hardware-chip-outline';
}

/** "Vừa xong", "12 phút trước", "3 giờ trước", "5 ngày trước": when a device last played. */
export function lastSeenLabel(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.floor(hours / 24)} ngày trước`;
}
