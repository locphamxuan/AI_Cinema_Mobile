import { Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

/** The app lives in portrait; only the fullscreen video turns the phone sideways. */
async function lock(lockType: ScreenOrientation.OrientationLock) {
  // Browsers cannot lock orientation from here; they rotate with the device on their own.
  if (Platform.OS === 'web') return;
  try {
    await ScreenOrientation.lockAsync(lockType);
  } catch {
    // A device that refuses the lock keeps whatever orientation it has; playback is unaffected.
  }
}

export const lockPortrait = () => lock(ScreenOrientation.OrientationLock.PORTRAIT_UP);

/** Landscape in either direction, so the viewer can hold the phone with the notch on either side. */
export const lockLandscape = () => lock(ScreenOrientation.OrientationLock.LANDSCAPE);
