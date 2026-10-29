import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extends app.json. Google Sign-In on iOS needs the reversed iOS client ID as a URL scheme, and its
 * config plugin refuses to build without one, so the plugin joins only when that ID is set.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const iosUrlScheme = iosClientId
    ? `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`
    : null;
  return {
    ...config,
    name: config.name ?? 'AI Cinema',
    slug: config.slug ?? 'ai-cinema-mobile',
    plugins: [
      ...(config.plugins ?? []),
      ...(iosUrlScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme }] as [string, unknown]] : []),
    ],
  };
};
