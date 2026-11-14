import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useSessionStore } from '../../store';
import { useTheme } from '../../theme';
import { isGoogleSignInAvailable, pickGoogleIdToken } from '../../lib/googleSignIn';
import { Button } from '../common/Button';
import { styles } from '../../styles/components/auth/AuthModal.styles';

/**
 * "Continue with Google" under the sign-in sheet, for members only. One tap: after the account is
 * picked the member is signed in, and a new email opens a member account under the Google name.
 */
export const GoogleSignInSection: React.FC = () => {
  const { colors } = useTheme();
  const loginWithGoogle = useSessionStore((state) => state.loginWithGoogle);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isGoogleSignInAvailable()) return null;
  const send = async (token: string, extra?: { dateOfBirth?: string; password?: string }) => {
    setLoading(true);
    setError(null);
    const res = await loginWithGoogle(token, extra);
    setLoading(false);
    if (res.success) return;
    if (isGoogleStep(res.reason) && !extra) {
      setIdToken(token);
      setStep(res.reason);
      return;
    }
    setError(res.error || 'Chưa đăng nhập được bằng Google. Thử lại sau ít phút.');
  };

  const start = async () => {
    setError(null);
    if (!isGoogleSignInAvailable()) {
      setError('Đăng nhập Google yêu cầu bản development build hoặc Expo build (npx expo run:android).');
      return;
    }
    try {
      const token = await pickGoogleIdToken();
      if (!token) return;
      setLoading(true);
      const res = await loginWithGoogle(token);
      if (!res.success) setError(res.error || 'Chưa đăng nhập được bằng Google. Thử lại sau ít phút.');
    } catch {
      setError('Chưa mở được đăng nhập Google. Kiểm tra mạng và Google Play Services rồi thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.form}>
      <Text style={[styles.hint, { color: colors.textMuted, textAlign: 'center' }]}>hoặc</Text>
      <Button label="Tiếp tục với Google" icon="logo-google" variant="secondary" onPress={start} loading={loading} />
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
};
