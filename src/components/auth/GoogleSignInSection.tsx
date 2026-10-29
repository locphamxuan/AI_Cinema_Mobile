import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
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
  const loginWithGoogle = useAppStore((state) => state.loginWithGoogle);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isGoogleSignInAvailable()) return null;

  const start = async () => {
    setError(null);
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
