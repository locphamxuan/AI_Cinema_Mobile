// Palette follows the MultiShorts reference: near-black screens with a wine tint at the top,
// one pink accent (active tab, buttons), neutral grey cards, orange tag text, green "new" badge.
const sharedColors = {
  // `ruby` is the app-wide accent token; it is MultiShorts pink, not red.
  ruby: '#FF3D7F',
  rubyDark: '#E0245E',
  rubyLight: '#FF6B9A',
  rubySoft: 'rgba(255, 61, 127, 0.14)',
  /** Pink button gradient (Điểm danh, Đăng ký…). */
  accentGradient: ['#FF6B9A', '#FF2D6F'] as [string, string],
  /** Secondary accent: tag text such as "Ngược tâm No.2". */
  neon: '#FF7A45',
  neonDark: '#E8622E',
  neonLight: '#FF9A6B',
  neonSoft: 'rgba(255, 122, 69, 0.14)',
  coin: '#F5B90B',
  coinDark: '#D99A06',
  coinLight: '#FFD24A',
  coinSoft: 'rgba(245, 185, 11, 0.15)',
  /** Green "Mới" badge. */
  verified: '#19C37D',
  verifiedDark: '#0FA968',
  verifiedLight: '#3DDC97',
  verifiedSoft: 'rgba(25, 195, 125, 0.15)',
  /** Pink "Đang hot" badge. */
  hot: '#FF4D8D',
  /** VIP card gold gradient. */
  vipGradient: ['#F6DDA8', '#C98A2E', '#9A5A0C'] as [string, string, string],
  vipText: '#4A2A05',
  danger: '#FF4D4F',
  dangerSoft: 'rgba(255, 77, 79, 0.12)',
  white: '#FFFFFF',
  black: '#000000',
};

export const lightColors = {
  ...sharedColors,
  background: '#FFFFFF',
  /** Wine tint at the top of home/search, fading into `background`. */
  topTint: '#FFE4EE',
  card: '#F7F7F8',
  cardAlt: '#F0F0F2',
  surface: '#FFFFFF',
  surfaceVariant: '#F0F0F2',
  chip: '#EFEFF1',
  text: '#111111',
  textSecondary: '#4A4A4F',
  textMuted: '#8A8A90',
  border: '#E6E6EA',
  borderLight: '#F0F0F2',
  shadow: 'rgba(0, 0, 0, 0.06)',
  headerBg: 'rgba(255, 255, 255, 0.95)',
  tabBarBg: '#FFFFFF',
  tabBarActive: '#FF3D7F',
  tabBarInactive: '#6B6B70',
  overlay: 'rgba(0, 0, 0, 0.45)',
  isDark: false,
};

export const darkColors = {
  ...sharedColors,
  background: '#0F0F0F',
  topTint: '#2A0D1A',
  card: '#1C1C1C',
  cardAlt: '#232323',
  surface: '#1A1A1A',
  surfaceVariant: '#262626',
  chip: '#2B2B2B',
  text: '#FFFFFF',
  textSecondary: '#C7C7CC',
  textMuted: '#8E8E93',
  border: '#2A2A2A',
  borderLight: '#333333',
  shadow: 'rgba(0, 0, 0, 0.5)',
  headerBg: 'rgba(15, 15, 15, 0.95)',
  tabBarBg: '#1F1F1F',
  tabBarActive: '#FF3D7F',
  tabBarInactive: '#E5E5EA',
  overlay: 'rgba(0, 0, 0, 0.8)',
  isDark: true,
};

export type ThemeColors = typeof lightColors;
