import { TextStyle } from 'react-native';

/**
 * Family names registered by `useFonts` in app/_layout.tsx. A custom font carries its weight in
 * the file, so styles pick a family instead of setting `fontWeight`.
 * Phudu (condensed, made for Vietnamese) is kept for titles and ranks; Be Vietnam Pro does the rest.
 */
export const fonts = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semibold: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  display: 'Phudu_700Bold',
  displayHeavy: 'Phudu_800ExtraBold',
} as const;

/** One scale for the whole app (12 · 13 · 15 · 17 · 20 · 24 · 30 · 40). */
export const textStyle = {
  /** Film title on its own page, rank numbers. */
  hero: { fontFamily: fonts.displayHeavy, fontSize: 30, lineHeight: 34 },
  /** Screen titles and the active home tab. */
  display: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28 },
  title: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24 },
  subtitle: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  labelStrong: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 18 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  captionStrong: { fontFamily: fonts.semibold, fontSize: 12, lineHeight: 16 },
  button: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
} satisfies Record<string, TextStyle>;

/** Kept for code that still reads `typography` from the theme context. */
export const typography: Record<string, TextStyle> = {
  h1: textStyle.hero,
  h2: textStyle.display,
  h3: textStyle.title,
  subtitle: textStyle.subtitle,
  body: textStyle.body,
  bodyBold: textStyle.bodyStrong,
  caption: textStyle.caption,
  captionSmall: textStyle.captionStrong,
};
