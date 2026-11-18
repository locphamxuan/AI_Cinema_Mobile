import { Platform } from 'react-native';

/**
 * How a bottom sheet with text fields moves out of the keyboard's way. Expo SDK 58 draws edge to edge on Android,
 * so the window no longer shrinks for the keyboard: the sheet has to be padded up on Android as on iOS.
 */
export const KEYBOARD_BEHAVIOR = Platform.OS === 'web' ? undefined : 'padding';

/** A modal that covers the status and navigation bars, so the keyboard offset is measured from the real screen edge. */
export const EDGE_TO_EDGE = { statusBarTranslucent: true, navigationBarTranslucent: true } as const;
