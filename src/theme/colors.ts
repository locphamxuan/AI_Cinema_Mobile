// MultiShorts' look, made our own: a plum-black screen (the wine tint at the top of MultiShorts
// carried through the whole page instead of a neutral #111), one pink accent for what is active
// or pressable, orange tag text, a green "Mới" badge and gold for Coin.
const sharedColors = {
  // `ruby` is the app-wide accent token; it is MultiShorts pink, not red.
  ruby: '#FF3D7F',
  rubyDark: '#E0245E',
  rubyLight: '#FF6B9A',
  rubySoft: 'rgba(255, 61, 127, 0.14)',
  /** Main call to action (Nạp Coin, Đăng ký gói). */
  accentGradient: ['#FF5A8E', '#F0266A'] as [string, string],
  /** Tag text, e.g. the first genre of a ranked film. */
  neon: '#FF7A45',
  neonSoft: 'rgba(255, 122, 69, 0.14)',
  coin: '#F5B90B',
  coinSoft: 'rgba(245, 185, 11, 0.14)',
  /** Green "Mới" badge, money received, a check-in done. */
  verified: '#19C37D',
  verifiedSoft: 'rgba(25, 195, 125, 0.14)',
  hot: '#FF4D8D',
  /** Monthly plan card: brass rather than yellow. */
  vipGradient: ['#F3D9A4', '#D1A055', '#A0682A'] as [string, string, string],
  vipText: '#3D2306',
  danger: '#FF5A5F',
  dangerSoft: 'rgba(255, 90, 95, 0.12)',
  white: '#FFFFFF',
  black: '#000000',
  /** Over pictures and video, whatever the theme. */
  scrim: 'rgba(12, 6, 9, 0.72)',
};

export const lightColors = {
  ...sharedColors,
  background: '#FFFAFB',
  /** Blush behind the search bar and home tabs, fading into `background`. */
  topTint: '#FFE3EC',
  card: '#F7EEF1',
  cardAlt: '#F0E4E8',
  surface: '#FFFFFF',
  surfaceVariant: '#F4EAEE',
  chip: '#F1E6EA',
  text: '#1D1216',
  textSecondary: '#5C4A51',
  textMuted: '#8F7C84',
  border: '#EADBE0',
  borderLight: '#F3E9EC',
  shadow: 'rgba(60, 20, 35, 0.08)',
  headerBg: 'rgba(255, 250, 251, 0.96)',
  tabBarBg: '#FFFFFF',
  tabBarActiveBg: '#FBE7EE',
  tabBarActive: '#FF3D7F',
  tabBarInactive: '#6F5C64',
  overlay: 'rgba(29, 18, 22, 0.45)',
  isDark: false,
};

export const darkColors = {
  ...sharedColors,
  background: '#140C11',
  topTint: '#3A1024',
  card: '#20161B',
  cardAlt: '#2A1E24',
  surface: '#1B1217',
  surfaceVariant: '#2A1E24',
  chip: '#2E2228',
  text: '#F7EEF1',
  textSecondary: '#CDBCC3',
  textMuted: '#93808A',
  border: '#33262C',
  borderLight: '#3D2F35',
  shadow: 'rgba(0, 0, 0, 0.5)',
  headerBg: 'rgba(20, 12, 17, 0.96)',
  tabBarBg: '#22181D',
  tabBarActiveBg: '#120A0E',
  tabBarActive: '#FF3D7F',
  tabBarInactive: '#D9CBD1',
  overlay: 'rgba(8, 4, 6, 0.78)',
  isDark: true,
};

export type ThemeColors = typeof lightColors;
