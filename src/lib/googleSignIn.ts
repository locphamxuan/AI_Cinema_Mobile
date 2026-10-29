import { Platform } from 'react-native';
import type { GoogleSignin as GoogleSigninApi } from '@react-native-google-signin/google-signin';

// The ID token must be issued for the Web client ID: that is the audience the backend checks.
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

let google: typeof GoogleSigninApi | null | undefined;

/**
 * The native module exists only in a development or store build: Expo Go has no Google Sign-In,
 * and loading it there throws; the web build has no native picker either. The button is hidden
 * instead of crashing the sign-in sheet.
 */
function nativeGoogle(): typeof GoogleSigninApi | null {
  if (google !== undefined) return google;
  if (Platform.OS === 'web') return (google = null);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, iosClientId: IOS_CLIENT_ID });
    google = GoogleSignin as typeof GoogleSigninApi;
  } catch {
    google = null;
  }
  return google;
}

export const isGoogleSignInAvailable = (): boolean => Boolean(WEB_CLIENT_ID) && nativeGoogle() !== null;

/** Opens Google's account picker; null when the viewer closes it. */
export async function pickGoogleIdToken(): Promise<string | null> {
  const client = nativeGoogle();
  if (!client) return null;
  await client.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await client.signIn();
  if (response.type !== 'success') return null;
  // The app keeps its own session; forgetting the Google one lets the next sign-in pick an account again.
  void client.signOut().catch(() => undefined);
  return response.data.idToken;
}
